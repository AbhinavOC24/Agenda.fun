// # ------------------ EVENTS ------------------
#[event]
pub struct CharacterCreated {
    // Character metadata
    pub fandom: Pubkey,
    pub char_slug: String,
    pub stock_mint: Pubkey,
    pub supply: u64,
    pub treasury_vault: Pubkey,
    pub price_state: Pubkey,

    // Initial price state
    pub last_price_fp: u128,
    pub week_start_ts: i64,

    pub ts: i64,
}

#[event]
pub struct FandomCreated{
    pub admin:Pubkey,
    pub fandom_id:[u8;32],
    pub name:String,
    pub ts:i64
}

#[event]
pub struct GlobalConfigCreated {
    pub admin: Pubkey,
    pub fee_bps: u16,
    pub r_burn: u16,
    pub r_global: u16,
    pub r_char: u16,
    pub k: i32,
    pub usdc_mint: Pubkey,
    pub platform_wallet: Pubkey,
    pub global_treasury: Pubkey,
    pub ts: i64,
}
#[event]
pub struct PriceUpdate {
    character: String,
    price_fp: u128,
    ts: i64,
}