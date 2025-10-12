use anchor_lang::prelude::*;
use crate::state::*;

pub fn create_character(
    ctx: Context<CreateCharacter>,
    fandom_id: [u8; 32],
    char_slug: String,
    supply: u64,
) -> Result<()> {
    let character = &mut ctx.accounts.character;
    character.fandom = ctx.accounts.fandom.key();
    character.char_slug = char_slug.clone();
    character.treasury_vault = ctx.accounts.character_treasury.key();
    character.supply = supply;
    character.price_state = ctx.accounts.character_price_state.key();
    character.stock_mint = ctx.accounts.stock_mint.key();

    let ps = &mut ctx.accounts.character_price_state;
    ps.character = character.char_slug.clone();
    ps.week_start_ts = Clock::get()?.unix_timestamp;
    character.base_price_fp = 10_u128 * 1_000_000;
    ps.last_price_fp = character.base_price_fp;

    emit!(CharacterCreated {
        fandom: character.fandom,
        char_slug,
        stock_mint: character.stock_mint,
        supply: character.supply,
        treasury_vault: character.treasury_vault,
        price_state: character.price_state,
        last_price_fp: ps.last_price_fp,
        week_start_ts: ps.week_start_ts,
        ts: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
