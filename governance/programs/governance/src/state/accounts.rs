use anchor_lang::prelude::*;
use crate::state::*;
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
    #[max_len(15)]
    pub name: String,
}

#[account]
#[derive(InitSpace)]
pub struct Character {
    pub fandom: Pubkey,
    #[max_len(15)]
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
    #[max_len(15)]
    pub character: String,
    pub last_price_fp: u128,
    pub week_start_ts: i64,
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct PollSubject {
    #[max_len(15)]
    pub char_slug: String,     
    pub direction_if_yes: i8,  
}



#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: [u8; 32],
    pub fandom: Pubkey,

    // Multi-character subjects
    #[max_len(4)]
    pub subjects: Vec<PollSubject>,  

    pub start_ts: i64,
    pub end_ts: i64,
    pub challenge_end_ts:i64,
    // parameters
    pub lambda_fp: i32,          // conviction weight factor (1e6 fixed point)
    pub k_override: Option<i32>, // optional per-poll sensitivity override

    // Tallies (start at 0)
    pub total_stake: u64,
    pub stake_yes: u64,
    pub stake_no: u64,

    pub payout_pool:u64,
    pub w_yes: u64,
    pub w_no: u64,

    pub proposer_side:PollOutcome,
    pub locked_dispute_amount:u64,

    pub status: PollStatus,
    pub outcome: PollOutcome,
    pub dispute_pool:u64,
    pub dispute_yes: Option<Pubkey>,
    pub dispute_no: Option<Pubkey>,

    pub platform_fee: u64,
    pub econ_cut:u64,
    // escrow vault that holds all staked lamports
    pub escrow_vault: Pubkey,
    pub escrow_bump:u8,
}






#[account]
#[derive(InitSpace)]
pub struct VoteReceipt {
    pub poll: Pubkey,          
    pub voter: Pubkey,         
    pub side: PollChoice,      
    pub amount_staked: u64,    
    pub weight_fp: u128,       
    pub claimed: bool,         
}



#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub poll: Pubkey,
    pub side: PollOutcome,        
    pub total_stake: u64,         
    pub tot_participants:u64,
}

#[account]
#[derive(InitSpace)]
pub struct ProposalReceipt {
    pub poll: Pubkey,
    pub side: PollOutcome,
    pub staker: Pubkey,
    pub amount_staked: u64,
    pub claimed: bool,
}



#[account]
pub struct PollEscrow {}