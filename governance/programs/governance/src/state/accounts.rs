use anchor_lang::prelude::*;

#[account]
pub struct GlobalTreasury {}

#[account]
pub struct CharacterTreasury {}

#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub fee_bps: u16,
    pub r_burn: u16,
    pub r_global: u16,
    pub r_char: u16,
    pub k: i32,
    pub usdc_mint: Pubkey,
    pub flags: u64,
    pub platform_wallet: Pubkey,
    pub global_treasury: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct Fandom {
    pub fandom_id: [u8; 32],
    pub admin: Pubkey,
    #[max_len(50)]
    pub name: String,
}

#[account]
#[derive(InitSpace)]
pub struct Character {
    pub fandom: Pubkey,
    #[max_len(50)]
    pub char_slug: String,
    pub treasury_vault: Pubkey,
    pub stock_mint: Pubkey,
    pub supply: u64,
    pub price_state: Pubkey,
    pub base_price_fp: u128,
}

#[account]
#[derive(InitSpace)]
pub struct PriceState {
    #[max_len(50)]
    pub character: String,
    pub last_price_fp: u128,
    pub week_start_ts: i64,
}
