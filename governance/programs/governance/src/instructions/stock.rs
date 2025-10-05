use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::{mint_to, burn, MintTo, Burn, Token, TokenAccount, Mint};
use crate::state::*;
use crate::utils::math::FP_SCALE;

pub fn buy_stock(
            ctx:Context<BuyStock>,
            fandom_id: [u8; 32],
            char_slug:String,
            lamports_in:u64,
            min_shares_out:u64)->
        Result<()>{
            require!(lamports_in > 0, CustomError::InvalidInput);
             // --------- 1- Compute current price (1e6 fp) ----------
            let character=&mut ctx.accounts.character;
            let ps=&mut ctx.accounts.character_price_state;
    
                // Current treasury balance (lamports)
    
                let treas_before=**ctx.accounts.character_treasury.to_account_info().lamports.borrow();
                let supply_before: u64 = character.supply;
    
            // If supply==0, we bootstrap price. Otherwise price = treasury/supply.
            let price_fp:u128= if supply_before ==0 {
                character.base_price_fp
            } else
            {
                // price_fp = (treasury * 1e6) / supply
                ((treas_before as u128) * 1_000_000u128) / (supply_before as u128)
            };
             require!(price_fp > 0, CustomError::MathOverflow);
            
            // --------- 2-Compute shares_out  ----------
    
            let shares_out_u128 = ((lamports_in as u128) * 1_000_000u128) / price_fp;
    
            let shares_out: u64 = shares_out_u128.try_into().map_err(|_| CustomError::MathOverflow)?;
         require!(shares_out > 0, CustomError::SlippageTooHigh);
           require!(shares_out >= min_shares_out, CustomError::SlippageTooHigh);
    
    
             // --------- 3- payments (lamports -> character treasury) ----------
    
            {
            let cpi_accounts=Transfer{
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.character_treasury.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
            transfer(cpi_ctx, lamports_in)?;
    
        }
            // --------- 4) Mint shares to buyer ATA ----------
              // Use character PDA as mint authority with signer seeds
        let seeds: &[&[u8]] = &[
            b"character",
            fandom_id.as_ref(),
            char_slug.as_bytes(),
            &[ctx.bumps.character],
        ];
        let signer: &[&[&[u8]]] = &[&seeds];
    
        let cpi_accounts=MintTo{
            mint:ctx.accounts.stock_mint.to_account_info(),
            to:ctx.accounts.buyer_ata.to_account_info(),
            authority:character.to_account_info(),
        };
        let cpi_ctx= CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        mint_to(cpi_ctx, shares_out)?;
    
            // --------- 5- Update supply and price state ----------
    
            character.supply = character.supply.checked_add(shares_out).ok_or(CustomError::MathOverflow)?;
    
                // Recompute price after the buy:
                let treas_after: u64 = **ctx.accounts.character_treasury.to_account_info().lamports.borrow();
                let supply_after: u64 = character.supply;
    
    
                let new_price_fp: u128 = ((treas_after as u128) * 1_000_000u128) / (supply_after as u128);
                ps.last_price_fp = new_price_fp;
                ps.week_start_ts = Clock::get()?.unix_timestamp;
    
    
                emit!(PriceUpdate {
                    character: char_slug,
                    price_fp: ps.last_price_fp,
                    ts: ps.week_start_ts,
                });
        
            Ok(())
    
        }


pub fn sell_stock(
            ctx: Context<SellStock>,
            shares_in: u64,
            fandom_id: [u8; 32],
            char_slug: String,
        ) -> Result<()> {
            // --- 1. Basic checks ---
            require!(shares_in > 0, CustomError::InvalidInput);
        
            let seller_ata = &ctx.accounts.seller_ata;
            let character = &mut ctx.accounts.character;
            let ps = &mut ctx.accounts.price_state;
        
            let old_treasury_balance =
                **ctx.accounts.character_treasury.to_account_info().lamports.borrow();
        
            require!(
                seller_ata.amount >= shares_in,
                CustomError::InsufficientBalance
            );
        
            // --- 2. Compute payout ---
            let lamports_out_u128 =
                (ps.last_price_fp as u128 * shares_in as u128) / 1_000_000u128;
            let lamports_out: u64 = lamports_out_u128
                .try_into()
                .map_err(|_| CustomError::MathOverflow)?;
        
            require!(
                old_treasury_balance >= lamports_out,
                CustomError::InsufficientTreasury
            );
        
            // --- 3. Burn the sold tokens from user ATA ---
            let cpi_accounts = Burn {
                mint: ctx.accounts.stock_mint.to_account_info(),
                from: seller_ata.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
            burn(cpi_ctx, shares_in)?;
        
            // --- 4. Transfer lamports from treasury PDA → seller ---
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
        
            // --- 5. Update supply + price ---
            character.supply = character
                .supply
                .checked_sub(shares_in)
                .ok_or(CustomError::MathOverflow)?;
        
            let new_treasury_balance =
                **ctx.accounts.character_treasury.to_account_info().lamports.borrow();
            ps.last_price_fp =
                ((new_treasury_balance as u128) * 1_000_000u128) / (character.supply as u128);
        
            emit!(PriceUpdate {
                character: char_slug,
                price_fp: ps.last_price_fp,
                ts: Clock::get()?.unix_timestamp,
            });
        
            Ok(())
        }
        