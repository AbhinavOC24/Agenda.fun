use anchor_lang::prelude::*;

#[event]
pub struct CharacterCreated {
    pub fandom: Pubkey,
    pub char_slug: String,
    pub stock_mint: Pubkey,
    pub supply: u64,
    pub treasury_vault: Pubkey,
    pub price_state: Pubkey,
    pub last_price_fp: u128,
    pub week_start_ts: i64,
    pub ts: i64,
}

#[event]
pub struct FandomCreated {
    pub admin: Pubkey,
    pub fandom_id: [u8; 32],
    pub name: String,
    pub ts: i64,
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
    pub character: String,
    pub price_fp: u128,
    pub ts: i64,
}



#[event]
pub struct PollCreated {
    pub poll_id: [u8; 32],
    pub fandom_id: [u8; 32],
    pub creator: Pubkey,
    pub start_ts: i64,
    pub end_ts: i64,
    pub challenge_end_ts: i64,
    pub status: String,
}

#[event]
pub struct VoteCast {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub side: String,
    pub stake: u64,
}

#[event]
pub struct PollResolved {
    pub poll: Pubkey,
    pub outcome: String,
}

#[event]
pub struct DisputeOpened {
    pub poll: Pubkey,
    pub side: String,
    pub challenger: Pubkey,
    pub stake: u64,
}

#[event]
pub struct PollSettled {
    pub poll: Pubkey,
    pub final_outcome: String,
    pub total_stake: u64,
    pub payout_pool: u64,
}

#[event]
pub struct RewardClaimed {
    pub poll: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub challenge: bool,
}

#[event]
pub struct StockBought {
    pub fandom_id: [u8; 32],
    pub character: String,
    pub buyer: Pubkey,
    pub lamports_in: u64,
    pub shares_out: u64,
    pub price_fp: u128,
    pub new_supply: u64,
    pub ts: i64,
}

#[event]
pub struct StockSold {
    pub fandom_id: [u8; 32],
    pub character: String,
    pub seller: Pubkey,
    pub shares_in: u64,
    pub lamports_out: u64,
    pub price_fp: u128,
    pub new_supply: u64,
    pub ts: i64,
}
