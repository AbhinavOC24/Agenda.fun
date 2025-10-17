use anchor_lang::prelude::*;
use crate::state::*;
use anchor_lang::system_program::{Transfer,transfer};
use crate::utils::*;

pub fn create_poll(
    ctx: Context<CreatePoll>,
    poll_id: [u8; 32],
    subjects: Vec<PollSubject>,
    start_ts: i64,
    challenge_end_ts:i64,
    end_ts: i64,
    metadata_hash:[u8;32],
    lambda_fp: i32,
    k_override: Option<i32>,
) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    let fandom = &ctx.accounts.fandom;
    try_transition(poll)?;

    poll.poll_id = poll_id;
    poll.fandom = fandom.key();
    poll.subjects = subjects;
    poll.start_ts = start_ts;
    poll.end_ts = end_ts;
    poll.lambda_fp = lambda_fp;
    poll.k_override = k_override;
    poll.challenge_end_ts = challenge_end_ts; 
    poll.metadata_hash=metadata_hash;

    poll.total_stake = 0;
    poll.stake_yes = 0;
    poll.stake_no = 0;
    poll.w_yes = 0;
    poll.w_no = 0;

    poll.status = PollStatus::Open;
    poll.outcome = PollOutcome::Unset;
    poll.proposer_side=PollOutcome::Unset;


    poll.escrow_vault = ctx.accounts.poll_escrow.key();
    poll.escrow_bump=ctx.bumps.poll_escrow;
    Ok(())
}


pub fn vote(ctx:Context<Vote>,poll_id:[u8;32],fandom_id:[u8;32],side:PollChoice,stake_lamports:u64)
->Result<()>
{


    let poll=&mut ctx.accounts.poll;
    let voter= &ctx.accounts.voter;
    try_transition(poll)?;
    let now = Clock::get()?.unix_timestamp;
    //TODO
    require!(now >= poll.start_ts && now <= poll.end_ts, CustomError::PollClosed);
    require!(poll.status== PollStatus::Open,CustomError::PollClosed);  
    require!(stake_lamports>0,CustomError::InvalidInput);


    let cpi_accounts=Transfer{
        from:voter.to_account_info(),
        to:ctx.accounts.poll_escrow.to_account_info(),
    };

    let cpi_ctx=CpiContext::new(ctx.accounts.system_program.to_account_info(),cpi_accounts);
    transfer(cpi_ctx,stake_lamports)?;

    let receipt = &mut ctx.accounts.vote_receipt;

    receipt.poll = poll.key();
    receipt.voter = voter.key();
    receipt.side = side.clone();
    receipt.amount_staked = stake_lamports;
    receipt.claimed = false;

    let weight_fp = calc_weight_fp(receipt.amount_staked);
    receipt.weight_fp=weight_fp;


    poll.total_stake=poll.total_stake.checked_add(stake_lamports).unwrap();

    match side {
        PollChoice::Yes => {
            poll.stake_yes += stake_lamports;
            poll.w_yes = poll.w_yes.checked_add(weight_fp as u64).unwrap();
        }
        PollChoice::No => {
            poll.stake_no += stake_lamports;
            poll.w_no = poll.w_no.checked_add(weight_fp as u64).unwrap();
        }
    }

        Ok(())
}


pub fn resolve_poll_auto(ctx: Context<ResolvePoll>, poll_id: [u8; 32],fandom_id:[u8;32]) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    require!(poll.status == PollStatus::Open, CustomError::InvalidState);
    //Todo
    require!(Clock::get()?.unix_timestamp > poll.end_ts, CustomError::PollNotEnded);

    poll.proposer_side = if poll.w_yes >= poll.w_no {
        PollOutcome::Yes
    } else {
        PollOutcome::No
    };

    poll.status = PollStatus::ChallengeWindow;


    Ok(())
}


pub fn challenge_poll(
    ctx: Context<ChallengePoll>,
    poll_id: [u8; 32],
    fandom_id: [u8; 32],
    side: PollOutcome,          
    stake_lamports: u64,
) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    require!(poll.status == PollStatus::ChallengeWindow, CustomError::InvalidState);
    require!(Clock::get()?.unix_timestamp <= poll.challenge_end_ts, CustomError::ChallengeWindowClosed);
    require!(stake_lamports > 0, CustomError::InvalidInput);


    require!(
        side != poll.proposer_side && poll.proposer_side != PollOutcome::Unset,
        CustomError::InvalidInput
    );


    poll.locked_dispute_amount = stake_lamports;

    let challenger = &ctx.accounts.challenger;


    let cpi_accounts = Transfer {
        from: challenger.to_account_info(),
        to: match side {
            PollOutcome::Yes => ctx.accounts.dispute_yes.to_account_info(),
            PollOutcome::No  => ctx.accounts.dispute_no.to_account_info(),
            _ => return Err(CustomError::InvalidInput.into()),
        },
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
    transfer(cpi_ctx, stake_lamports)?;


    let receipt = &mut ctx.accounts.proposal_receipt;
    receipt.poll = poll.key();
    receipt.side = side.clone();
    receipt.staker = challenger.key();
    receipt.amount_staked = stake_lamports;
    receipt.claimed = false;


    match side {
        PollOutcome::Yes => {
            ctx.accounts.dispute_yes.total_stake += stake_lamports;
            ctx.accounts.dispute_yes.tot_participants += 1;

        }
        PollOutcome::No => {
            ctx.accounts.dispute_no.total_stake += stake_lamports;
            ctx.accounts.dispute_no.tot_participants += 1;
            
        }
        _ => {}
    }


    poll.status = PollStatus::Disputed;
    poll.dispute_yes = Some(ctx.accounts.dispute_yes.key());
    poll.dispute_no = Some(ctx.accounts.dispute_no.key());

    Ok(())
}




pub fn join_dispute(
    ctx: Context<JoinDispute>,
    side: PollOutcome,
    stake_lamports: u64,
) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    require!(poll.status == PollStatus::Disputed, CustomError::InvalidState);
    require!(stake_lamports == poll.locked_dispute_amount, CustomError::InvalidInput);

    let challenger = &ctx.accounts.participant;


    let target_vault = match side {
        PollOutcome::Yes => ctx.accounts.dispute_yes.to_account_info(),
        PollOutcome::No  => ctx.accounts.dispute_no.to_account_info(),
        _ => return Err(CustomError::InvalidInput.into()),
    };
    let cpi_accounts = Transfer {
        from: challenger.to_account_info(),
        to: target_vault,
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
    transfer(cpi_ctx, stake_lamports)?;


    match side {
        PollOutcome::Yes => {
            ctx.accounts.dispute_yes.total_stake += stake_lamports;
            ctx.accounts.dispute_yes.tot_participants += 1;
        }
        PollOutcome::No => {
            ctx.accounts.dispute_no.total_stake += stake_lamports;
            ctx.accounts.dispute_no.tot_participants += 1;
        }
        _ => {}
    }


    let receipt = &mut ctx.accounts.proposal_receipt;
    receipt.poll = poll.key();
    receipt.side = side.clone();
    receipt.staker = challenger.key();
    receipt.amount_staked = stake_lamports;
    receipt.claimed = false;

    Ok(())
}


pub fn settle_poll(ctx: Context<SettlePoll>, poll_id: [u8; 32],fandom_id:[u8;32]) -> Result<()> {
    let poll = &mut ctx.accounts.poll;

    require!(
        poll.status == PollStatus::ChallengeWindow || poll.status == PollStatus::Disputed,
        CustomError::InvalidState
    );
    require!(
        Clock::get()?.unix_timestamp > poll.challenge_end_ts,
        CustomError::ChallengeWindowStillOpen
    );


    let final_outcome = if poll.status == PollStatus::Disputed {

        if ctx.accounts.dispute_yes.tot_participants >= ctx.accounts.dispute_no.tot_participants {
            PollOutcome::Yes
        } else {
            PollOutcome::No
        }
    } else {

        
        poll.proposer_side.clone()
    };
    poll.outcome = final_outcome;
    poll.status = PollStatus::Closed;


    let global_config = &ctx.accounts.global_config;
    let total_stake = poll.total_stake as u128;

    let platform_fee = total_stake
        .checked_mul(global_config.fee_bps as u128)
        .unwrap()
        / 10_000u128;
    let after_fee = total_stake.checked_sub(platform_fee).unwrap();

    let lambda_fp: u128 = poll.lambda_fp as u128;
    let econ_cut = after_fee.checked_mul(lambda_fp).unwrap() / 1_000_000u128;

    let to_char = econ_cut.checked_mul(global_config.r_char as u128).unwrap() / 10_000u128;
    let to_global = econ_cut.checked_mul(global_config.r_global as u128).unwrap() / 10_000u128;
    let to_burn = econ_cut.checked_mul(global_config.r_burn as u128).unwrap() / 10_000u128;

    let payout_pool = after_fee.checked_sub(econ_cut).unwrap();

    poll.platform_fee = platform_fee as u64;
    poll.econ_cut = econ_cut as u64;
    poll.payout_pool = payout_pool as u64;


    let seeds = &[b"poll_escrow", poll.poll_id.as_ref(), &[poll.escrow_bump]];

    transfer_lamports(
        ctx.accounts.poll_escrow.to_account_info(),
        ctx.accounts.platform_wallet.to_account_info(),
        platform_fee as u64,
        ctx.accounts.system_program.to_account_info(),
        Some(seeds),
    )?;
    transfer_lamports(
        ctx.accounts.poll_escrow.to_account_info(),
        ctx.accounts.character_treasury.to_account_info(),
        to_char as u64,
        ctx.accounts.system_program.to_account_info(),
        Some(seeds),
    )?;
    transfer_lamports(
        ctx.accounts.poll_escrow.to_account_info(),
        ctx.accounts.global_treasury.to_account_info(),
        to_global as u64,
        ctx.accounts.system_program.to_account_info(),
        Some(seeds),
    )?;
    transfer_lamports(
        ctx.accounts.poll_escrow.to_account_info(),
        ctx.accounts.burn.to_account_info(),
        to_burn as u64,
        ctx.accounts.system_program.to_account_info(),
        Some(seeds),
    )?;


    let subject = poll.subjects.first().ok_or(CustomError::InvalidState)?;
    apply_character_nudge(
        &mut ctx.accounts.character_price_state,
        &ctx.accounts.character,
        &ctx.accounts.character_treasury.to_account_info(),
        &poll,
        to_char as u64,
        subject.direction_if_yes,
    )?;

    Ok(())
}


pub fn claim_reward(ctx: Context<ClaimReward>
    , poll_id: [u8; 32],fandom_id:[u8;32]) -> Result<()> {
    let poll = &ctx.accounts.poll;
    let receipt = &mut ctx.accounts.vote_receipt;

    require!(poll.status == PollStatus::Closed, CustomError::InvalidState);
    require!(!receipt.claimed, CustomError::AlreadyClaimed);


    let is_winner = match (poll.outcome.clone(), receipt.side.clone()) {
        (PollOutcome::Yes, PollChoice::Yes) => true,
        (PollOutcome::No, PollChoice::No) => true,
        _ => false,
    };

    if is_winner {

        let total_winner_stake = match poll.outcome {
            PollOutcome::Yes => poll.stake_yes,
            PollOutcome::No => poll.stake_no,
            _ => 1,
        } as u128;

        let share_fp = (receipt.amount_staked as u128)
            .checked_mul(1_000_000u128)
            .unwrap()
            .checked_div(total_winner_stake)
            .unwrap();

        let reward_u128 = (poll.payout_pool as u128)
            .checked_mul(share_fp)
            .unwrap()
            .checked_div(1_000_000u128)
            .unwrap();

        let reward = reward_u128 as u64;


        let seeds = &[b"poll_escrow", poll.poll_id.as_ref(), &[poll.escrow_bump]];
        transfer_lamports(
            ctx.accounts.poll_escrow.to_account_info(),
            ctx.accounts.voter.to_account_info(),
            reward,
            ctx.accounts.system_program.to_account_info(),
            Some(seeds),
        )?;
    }

    receipt.claimed = true;
    Ok(())
}



pub fn claim_challenge_reward(ctx: Context<ClaimChallengeReward>
    , poll_id: [u8; 32],fandom_id:[u8;32]) -> Result<()> {
    let poll = &ctx.accounts.poll;
    let receipt = &mut ctx.accounts.proposal_receipt;

    require!(poll.status == PollStatus::Closed, CustomError::InvalidState);
    require!(!receipt.claimed, CustomError::AlreadyClaimed);


    let (winner_vault, loser_vault, winner_side, winner_participants, loser_total) = match poll.outcome {
        PollOutcome::Yes => (
            ctx.accounts.dispute_yes.to_account_info(),
            ctx.accounts.dispute_no.to_account_info(),
            PollOutcome::Yes,
            ctx.accounts.dispute_yes.tot_participants,
            ctx.accounts.dispute_no.total_stake,
        ),
        PollOutcome::No => (
            ctx.accounts.dispute_no.to_account_info(),
            ctx.accounts.dispute_yes.to_account_info(),
            PollOutcome::No,
            ctx.accounts.dispute_no.tot_participants,
            ctx.accounts.dispute_yes.total_stake,
        ),
        _ => return Err(error!(CustomError::InvalidState)),
    };


    require!(receipt.side == winner_side, CustomError::InvalidReceipt);
    require!(winner_participants > 0, CustomError::InvalidState);

    
    let total_winner_stake = match poll.outcome {
        PollOutcome::Yes => ctx.accounts.dispute_yes.total_stake,
        PollOutcome::No  => ctx.accounts.dispute_no.total_stake,
        _ => 1,
    } as u128;

    let share_fp = (receipt.amount_staked as u128)
    .checked_mul(1_000_000u128)
    .unwrap()
    .checked_div(total_winner_stake)
    .unwrap();

    let reward_u128 = (loser_total as u128)
    .checked_mul(share_fp)
    .unwrap()
    .checked_div(1_000_000u128)
    .unwrap();

    let total_reward = (receipt.amount_staked as u128).checked_add(reward_u128 as u128).unwrap() as u64;



    let seeds = match poll.outcome {
        PollOutcome::Yes => &[b"dispute_yes", poll.poll_id.as_ref()],
        PollOutcome::No => &[b"dispute_no", poll.poll_id.as_ref()],
        _ => return Err(error!(CustomError::InvalidState)),
    };
    transfer_lamports(
        winner_vault,
        ctx.accounts.staker.to_account_info(),
        total_reward,
        ctx.accounts.system_program.to_account_info(),
        Some(seeds),
    )?;

    receipt.claimed = true;
    Ok(())
}

pub fn apply_character_nudge<'info>(
    price_state: &mut Account<'info, PriceState>,
    character: &Account<'info, Character>,
    treasury: &AccountInfo<'info>,
    poll: &Poll,
    to_character: u64,
    direction_if_yes: i8, 
) -> Result<()> {
    let t_old = treasury.lamports();
    let t_new = t_old.checked_add(to_character).unwrap();


    let w_yes = poll.w_yes as i128;
    let w_no = poll.w_no as i128;
    let w_total = (w_yes + w_no).max(1);



    let dir_effect = match poll.outcome {
        PollOutcome::Yes => direction_if_yes as i128,
        PollOutcome::No => -(direction_if_yes as i128),
        _ => 0,
    };

    let s_fp = ((w_yes - w_no) * dir_effect * 1_000_000) / w_total;


    let total_stake = poll.total_stake as i128;
    let alpha_fp = 200_000; // 0.2
    let stake_ref = (alpha_fp * (t_old as i128)) / 1_000_000;
    let sqrt_ratio = fixed_sqrt_fp((total_stake * 1_000_000) / stake_ref);
    let f_fp = sqrt_ratio.min(1_000_000);


    let k_fp = poll.k_override.unwrap_or(poll.lambda_fp) as i128;
    let m_fp = 1_000_000 + ((k_fp * s_fp * f_fp) / (1_000_000i128.pow(2)));


    let base_price_fp = ((t_new as i128) * 1_000_000) / (character.supply as i128);
    let new_price_fp = (base_price_fp * m_fp) / 1_000_000;

    price_state.last_price_fp = new_price_fp.max(0) as u128;
    price_state.week_start_ts = Clock::get()?.unix_timestamp;
    Ok(())
}



fn fixed_sqrt_fp(x_fp: i128) -> i128 {
    if x_fp <= 0 { return 0; }
    let mut z = x_fp;
    let mut res = x_fp;
    while z * z > x_fp {
        res = (z + x_fp / z) / 2;
        z = res;
    }
    res
}
