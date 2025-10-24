


use anchor_lang::prelude::*;

declare_id!("FkWGiBMPiL8Weq3LWjcRydmafUBmGhHK9dkNaGuRzmeP");


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
        r_global:u16,
        r_burn: u16,
        usdc_mint: Pubkey,
        platform_wallet: Pubkey,
    ) -> Result<()> {
        instructions::global::init_global(ctx, fee_bps, r_burn, r_global, usdc_mint, platform_wallet)
    }

    pub fn create_fandom(ctx: Context<CreateFandom>, fandom_id: [u8; 32], name: String) -> Result<()> {
        instructions::fandom::create_fandom(ctx, fandom_id, name)
    }


    pub fn create_poll(
        ctx: Context<CreatePoll>,
        poll_id: [u8;32],
        fandom_id:[u8;32],
        start_ts: i64,
        end_ts: i64,
        challenge_end_ts:i64,
        metadata_hash:[u8;32],
        lambda_fp: i32,
        k_override: Option<i32>,
    ) -> Result<()> {
        instructions::poll::create_poll(ctx, poll_id, start_ts,challenge_end_ts, end_ts,metadata_hash, lambda_fp, k_override)
    }

    pub fn vote(
        ctx: Context<Vote>,
        poll_id: [u8;32],
        fandom_id: [u8;32],
        side: PollChoice,
        stake_lamports: u64,
    ) -> Result<()> {
        instructions::poll::vote(ctx, poll_id, fandom_id, side, stake_lamports)
    }
    pub fn resolve_poll_auto(
        ctx: Context<ResolvePoll>,
        poll_id: [u8; 32],
        fandom_id:[u8;32],
    ) -> Result<()> {
        instructions::poll::resolve_poll_auto(ctx, poll_id,fandom_id)
    }

    pub fn challenge_poll(
        ctx: Context<ChallengePoll>,
        poll_id: [u8; 32],
        fandom_id: [u8; 32],
        side: PollOutcome,
        stake_lamports: u64,
    ) -> Result<()> {
        instructions::poll::challenge_poll(ctx, poll_id, fandom_id, side, stake_lamports)
    }

    pub fn join_dispute(
        ctx: Context<JoinDispute>,
        side: PollOutcome,
        stake_lamports: u64,
    ) -> Result<()> {
        instructions::poll::join_dispute(ctx, side, stake_lamports)
    }
    pub fn settle_poll(ctx: Context<SettlePoll>, poll_id: [u8; 32],fandom_id:[u8;32]) -> Result<()> {
        instructions::poll::settle_poll(ctx, poll_id,fandom_id)
    }


    pub fn claim_reward(
        ctx: Context<ClaimReward>
        , poll_id: [u8; 32],fandom_id:[u8;32]
    ) -> Result<()> {
        instructions::poll::claim_reward(ctx,poll_id,fandom_id)
    }

    pub fn claim_challenge_reward(
        ctx: Context<ClaimChallengeReward>
        , poll_id: [u8; 32],
        fandom_id:[u8;32])
     -> Result<()> {
        instructions::poll::claim_challenge_reward(ctx,poll_id,fandom_id)
    }

   

}
