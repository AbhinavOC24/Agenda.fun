use anchor_lang::prelude::*;
use crate::state::*;

pub fn create_fandom(ctx: Context<CreateFandom>, fandom_id: [u8; 32], name: String) -> Result<()> {
    let fandom = &mut ctx.accounts.fandom;
    fandom.fandom_id = fandom_id;
    fandom.admin = ctx.accounts.admin.key();
    fandom.name = name.clone();

    emit!(FandomCreated {
        fandom_id,
        name,
        admin: fandom.admin,
        ts: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
