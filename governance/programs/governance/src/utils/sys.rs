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
    _system_program: AccountInfo<'info>,
    signer_seeds: Option<&[&[u8]]>,
) -> Result<()> {
    if let Some(seeds) = signer_seeds {
        let from_key = from.key();
        let to_key = to.key();
        **from.try_borrow_mut_lamports()? -= amount;
        **to.try_borrow_mut_lamports()? += amount;

        
        msg!("Transferred {} lamports from {:?} to {:?}", amount, from_key, to_key);
        Ok(())
    } else {
        // Fallback for normal system-owned transfers (if needed)
        let ix = system_instruction::transfer(&from.key(), &to.key(), amount);
        invoke(
            &ix,
            &[
                from.clone(),
                to.clone(),
                _system_program.clone(),
            ],
        )?;
        Ok(())
    }
}
