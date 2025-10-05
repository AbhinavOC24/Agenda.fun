use anchor_lang::prelude::*;
use crate::state::*;
use anchor_lang::system_program::{Transfer,transfer};
use crate::math::calc_weight_fp;
pub fn create_poll(
    ctx: Context<CreatePoll>,
    poll_id: [u8; 32],
    subjects: Vec<PollSubject>,
    start_ts: i64,
    end_ts: i64,
    lambda_fp: i32,
    k_override: Option<i32>,
) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    let fandom = &ctx.accounts.fandom;

    poll.poll_id = poll_id;
    poll.fandom = fandom.key();
    poll.subjects = subjects;
    poll.start_ts = start_ts;
    poll.end_ts = end_ts;
    poll.lambda_fp = lambda_fp;
    poll.k_override = k_override;

    // initialize counters
    poll.total_stake = 0;
    poll.stake_yes = 0;
    poll.stake_no = 0;
    poll.w_yes = 0;
    poll.w_no = 0;

    poll.status = PollStatus::Open;
    poll.outcome = PollOutcome::Unset;

    poll.platform_fee = 0;
    poll.econ_cut = 0;
    poll.payout_pool = 0;

    poll.escrow_vault = ctx.accounts.poll_escrow.key();

    Ok(())
}


pub fn vote(ctx:Context<Vote>,side:PollChoice,amount:u64)
->Result<()>
{
    let poll=&mut ctx.accounts.poll;
    let voter= &ctx.accounts.voter;
    
    require!(poll.status== PollStatus::Open,CustomError::PollClosed);  
    require!(amount>0,CustomError::InvalidInput);

    let cpi_accounts=Transfer{
        from:voter.to_account_info(),
        to:ctx.accounts.poll_escrow.to_account_info(),
    };

    let cpi_ctx=CpiContext::new(ctx.accounts.system_program.to_account_info(),cpi_accounts);
    transfer(cpi_ctx,amount)?;

    let receipt = &mut ctx.accounts.vote_receipt;

    receipt.poll = poll.key();
    receipt.voter = voter.key();
    receipt.side = side.clone();
    receipt.amount_staked = amount;
    receipt.claimed = false;

    let weight_fp = calc_weight_fp(receipt.amount_staked);
    receipt.weight_fp=weight_fp;


    poll.total_stake=poll.total_stake.checked_add(amount).unwrap();

    match side {
        PollChoice::Yes => {
            poll.stake_yes += amount;
            poll.w_yes = poll.w_yes.checked_add(weight_fp as u64).unwrap();
        }
        PollChoice::No => {
            poll.stake_no += amount;
            poll.w_no = poll.w_no.checked_add(weight_fp as u64).unwrap();
        }
    }

        Ok(())
}