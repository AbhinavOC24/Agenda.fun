use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    system_instruction,
    program::{invoke, invoke_signed},
};

use crate::state::*;



pub fn try_transition(poll: &mut Account<Poll>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    match poll.status {
        PollStatus::Open if now > poll.end_ts && now < poll.challenge_end_ts => {
            poll.status = PollStatus::ChallengeWindow;
        }
        PollStatus::ChallengeWindow if now > poll.challenge_end_ts && poll.status != PollStatus::Pending => {
            poll.status = PollStatus::Closed;
        }
        _ => {}
    }
    Ok(())
}




pub fn transfer_lamports<'info>(
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    amount: u64,
    system_program: AccountInfo<'info>,
    signer_seeds: Option<&[&[u8]]>,
) -> Result<()> {
    require!(amount > 0, CustomError::InvalidInput);

    let ix = system_instruction::transfer(&from.key(), &to.key(), amount);


    if let Some(seeds) = signer_seeds {
        invoke_signed(
            &ix,
            &[
                from.clone(),
                to.clone(),
                system_program.clone(),
            ],
            &[seeds],
        )?;
    } else {

        invoke(
            &ix,
            &[
                from.clone(),
                to.clone(),
                system_program.clone(),
            ],
        )?;
    }

    Ok(())
}


