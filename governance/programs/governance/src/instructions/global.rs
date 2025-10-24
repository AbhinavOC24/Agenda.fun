use anchor_lang::prelude::*;
use crate::state::*;

pub fn init_global(
    ctx: Context<InitGlobal>,
    fee_bps: u16,
    r_burn: u16,
    r_global: u16,
    usdc_mint: Pubkey,
    platform_wallet: Pubkey,
) -> Result<()> {
    let cfg = &mut ctx.accounts.global_config;

    cfg.admin = ctx.accounts.admin.key();
    cfg.fee_bps = fee_bps;
    cfg.r_burn = r_burn;
    cfg.r_global = r_global;

    cfg.usdc_mint = usdc_mint;
    cfg.flags = 0;
    cfg.platform_wallet = platform_wallet;
    cfg.global_treasury = ctx.accounts.global_treasury.key();

    emit!(GlobalConfigCreated {
        admin: cfg.admin,
        fee_bps,
        r_burn,
        r_global,
        usdc_mint,
        platform_wallet,
        global_treasury: cfg.global_treasury,
        ts: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
