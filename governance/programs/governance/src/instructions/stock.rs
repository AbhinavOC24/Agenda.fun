use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::{mint_to, burn, MintTo, Burn, Token, TokenAccount, Mint};
use crate::state::*;
use crate::utils::math::FP_SCALE;

pub fn buy_stock(
    ctx: Context<BuyStock>,
    fandom_id: [u8; 32],
    char_slug: String,
    lamports_in: u64,
    min_shares_out: u64,
) -> Result<()> {
    let character = &mut ctx.accounts.character;
    let ps = &mut ctx.accounts.character_price_state;

    let treas_before = **ctx.accounts.character_treasury.to_account_info().lamports.borrow();
    let supply_before = character.supply;

    let price_fp = if supply_before == 0 {
        character.base_price_fp
    } else {
        (treas_before as u128 * FP_SCALE) / (supply_before as u128)
    };

    let shares_out_u128 = (lamports_in as u128 * FP_SCALE) / price_fp;
    let shares_out: u64 = shares_out_u128.try_into().map_err(|_| CustomError::MathOverflow)?;

    // Transfer SOL
    let cpi_accounts = Transfer {
        from: ctx.accounts.buyer.to_account_info(),
        to: ctx.accounts.character_treasury.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
    transfer(cpi_ctx, lamports_in)?;

    // Mint stock tokens
    let seeds = &[
        b"character",
        fandom_id.as_ref(),
        char_slug.as_bytes(),
        &[ctx.bumps.character],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.stock_mint.to_account_info(),
        to: ctx.accounts.buyer_ata.to_account_info(),
        authority: character.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer);
    mint_to(cpi_ctx, shares_out)?;

    Ok(())
}

pub fn sell_stock(
    ctx: Context<SellStock>,
    shares_in: u64,
    fandom_id: [u8; 32],
    char_slug: String,
) -> Result<()> {
    let seller_ata = &ctx.accounts.seller_ata;
    let character = &mut ctx.accounts.character;
    let ps = &mut ctx.accounts.price_state;

    let old_treasury_balance = **ctx.accounts.character_treasury.to_account_info().lamports.borrow();

    require!(seller_ata.amount >= shares_in, CustomError::InsufficientBalance);

    let lamports_out_u128 = (ps.last_price_fp as u128 * shares_in as u128) / FP_SCALE;
    let lamports_out: u64 = lamports_out_u128.try_into().map_err(|_| CustomError::MathOverflow)?;
    require!(old_treasury_balance >= lamports_out, CustomError::InsufficientTreasury);

    // Burn stock tokens
    let cpi_accounts = Burn {
        mint: ctx.accounts.stock_mint.to_account_info(),
        from: seller_ata.to_account_info(),
        authority: ctx.accounts.seller.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    burn(cpi_ctx, shares_in)?;

    // Send SOL back
    let seeds = &[
        b"char_treasury",
        fandom_id.as_ref(),
        char_slug.as_bytes(),
        &[ctx.bumps.character_treasury],
    ];
    let signer = &[&seeds[..]];
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.character_treasury.key(),
        &ctx.accounts.seller.key(),
        lamports_out,
    );
    invoke_signed(
        &ix,
        &[
            ctx.accounts.character_treasury.to_account_info(),
            ctx.accounts.seller.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        signer,
    )?;

    Ok(())
}
