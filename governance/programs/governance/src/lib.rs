use anchor_lang::prelude::*;

declare_id!("6iMHRA5osY1Yb2Gi9t4WSBxBxsaU51fgD1JPiRinNDWD");

// Register submodules
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;
use state::*;
use utils::*;

#[program]
pub mod governance {
    use super::*;

    pub fn init_global(
        ctx: Context<InitGlobal>,
        fee_bps: u16,
        r_burn: u16,
        r_global: u16,
        r_char: u16,
        k: i32,
        usdc_mint: Pubkey,
        platform_wallet: Pubkey,
    ) -> Result<()> {
        instructions::global::init_global(ctx, fee_bps, r_burn, r_global, r_char, k, usdc_mint, platform_wallet)
    }

    pub fn create_fandom(ctx: Context<CreateFandom>, fandom_id: [u8; 32], name: String) -> Result<()> {
        instructions::fandom::create_fandom(ctx, fandom_id, name)
    }

    pub fn create_character(ctx: Context<CreateCharacter>, fandom_id: [u8; 32], char_slug: String, supply: u64) -> Result<()> {
        instructions::character::create_character(ctx, fandom_id, char_slug, supply)
    }

    pub fn buy_stock(
        ctx: Context<BuyStock>,
        fandom_id: [u8; 32],
        char_slug: String,
        lamports_in: u64,
        min_shares_out: u64,
    ) -> Result<()> {
        instructions::stock::buy_stock(ctx, fandom_id, char_slug, lamports_in, min_shares_out)
    }

    pub fn sell_stock(
        ctx: Context<SellStock>,
        shares_in: u64,
        fandom_id: [u8; 32],
        char_slug: String,
    ) -> Result<()> {
        instructions::stock::sell_stock(ctx, shares_in, fandom_id, char_slug)
    }
}
