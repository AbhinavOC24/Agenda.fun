use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_lang::system_program::{transfer,Transfer};

use anchor_lang::solana_program::program::invoke_signed;

use anchor_spl::token::{ Mint, Token, TokenAccount, MintTo, InitializeMint, mint_to,burn,Burn};
use anchor_spl::associated_token::AssociatedToken;
declare_id!("6iMHRA5osY1Yb2Gi9t4WSBxBxsaU51fgD1JPiRinNDWD");

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
        let cfg = &mut ctx.accounts.global_config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.fee_bps = fee_bps;
        cfg.r_burn = r_burn;
        cfg.r_global = r_global;
        cfg.r_char = r_char;
        cfg.k = k;

        cfg.usdc_mint = usdc_mint;
        cfg.flags = 0;
        cfg.platform_wallet = platform_wallet;
        cfg.global_treasury = ctx.accounts.global_treasury.key(); 


            emit!(GlobalConfigCreated {
                admin: cfg.admin,
                fee_bps,
                r_burn,
                r_global,
                r_char,
                k,
                usdc_mint,
                platform_wallet,
                global_treasury: cfg.global_treasury,
                ts: Clock::get()?.unix_timestamp,
            });

        Ok(())
    }

      pub fn create_fandom(
        ctx: Context<CreateFandom>,
        fandom_id: [u8; 32],
        name: String,
    ) -> Result<()> {

        

        let fandom = &mut ctx.accounts.fandom;
        fandom.fandom_id = fandom_id;
        fandom.admin = ctx.accounts.admin.key();
        fandom.name = name.clone();

        emit!(FandomCreated {
            fandom_id: fandom.fandom_id,
            name,
            admin: fandom.admin,
            ts: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn create_character(
        ctx: Context<CreateCharacter>,
        fandom_id: [u8;32],
        char_slug: String,
        supply: u64,    
    ) -> Result<()> {


        let character = &mut ctx.accounts.character;
        character.fandom = ctx.accounts.fandom.key();
        character.char_slug = char_slug.clone();
        character.treasury_vault = ctx.accounts.character_treasury.key(); 
        character.supply = supply;
        character.price_state = ctx.accounts.character_price_state.key();
        character.stock_mint=ctx.accounts.stock_mint.key();

        let ps = &mut ctx.accounts.character_price_state;
        ps.character = char_slug;
        ps.week_start_ts = Clock::get()?.unix_timestamp;
    
        character.base_price_fp = 10_u128 * 1_000_000;
        ps.last_price_fp = character.base_price_fp;

        ps.last_price_fp=1_000_000;

        emit!(CharacterCreated {
            fandom: character.fandom,
            char_slug: character.char_slug.clone(),
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
    

}
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

// # ------------------ ACCOUNTS ------------------

#[account]
pub struct GlobalTreasury{
}

#[account]
pub struct CharacterTreasury{
}

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

    // ✅ new fields
    pub platform_wallet: Pubkey,   // where platform fee is sent
    pub global_treasury: Pubkey,   // PDA that accumulates global share
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
    pub treasury_vault: Pubkey, // PDA created per character
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




// # ------------------ CONTEXTS ------------------

#[derive(Accounts)]
pub struct InitGlobal<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + GlobalConfig::INIT_SPACE,
        seeds = [b"global_config"],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,


    #[account(
        init,
        payer = admin,
        space = 8, 
        seeds = [b"global_treasury"],
        bump
    )]
    pub global_treasury: Account<'info,GlobalTreasury>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(fandom_id: [u8; 32])]
pub struct CreateFandom<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Fandom::INIT_SPACE,
        seeds = [b"fandom", fandom_id.as_ref()],
        bump
    )]
    pub fandom: Account<'info, Fandom>,

    #[account(
    seeds=[b"global_config"],
    bump,
    has_one=admin
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(char_slug: String,fandom_id:[u8;32])]
pub struct CreateCharacter<'info> {
    #[account(
        mut,
        seeds = [b"fandom", fandom_id.as_ref()],
        bump,
        has_one=admin
    )]
    pub fandom: Account<'info, Fandom>,

    #[account(
        init,
        payer = admin,
        space = 8 + Character::INIT_SPACE,
        seeds = [b"character", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub character: Account<'info, Character>,


    #[account(
        init,
        payer = admin,
        space = 8,
        seeds = [b"char_treasury", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub character_treasury: Account<'info,CharacterTreasury>,

    #[account(
        init,
        payer = admin,
        space = 8 + PriceState::INIT_SPACE,
        seeds = [b"char_price_state", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub character_price_state: Account<'info,PriceState>,
    

    #[account(init,
    payer=admin,
    mint::decimals=6,
    mint::authority=character,
    mint::freeze_authority=character,
    seeds= [b"stock_mint",fandom_id.as_ref(),char_slug.as_ref()],
    bump
    )]
    pub stock_mint:Account<'info,Mint>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(fandom_id: [u8; 32], char_slug: String)]
pub struct BuyStock<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"fandom", fandom_id.as_ref()],
        bump
    )]
    pub fandom: Account<'info, Fandom>,

    #[account(
        mut,
        seeds = [b"character", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub character: Account<'info, Character>,

    #[account(
        mut,
        seeds = [b"char_treasury", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub character_treasury: Account<'info, CharacterTreasury>,

    #[account(
        mut,
        seeds = [b"char_price_state", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub character_price_state: Account<'info, PriceState>,

    #[account(
        mut,seeds=[b"stock_mint",
        fandom_id.as_ref(),char_slug.as_ref()],
        bump
     )]
    pub stock_mint:Account<'info,Mint>,
     

    #[account(
        init,
        payer = buyer,
        associated_token::mint = stock_mint,
        associated_token::authority = buyer
    )]
    pub buyer_ata: Account<'info, TokenAccount>,


    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
#[instruction(fandom_id: [u8; 32], char_slug: String)]
pub struct SellStock<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"character", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub character: Account<'info, Character>,

    #[account(
        mut,
        seeds = [b"char_treasury", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub character_treasury: Account<'info, CharacterTreasury>,

    #[account(
        mut,
        seeds = [b"char_price_state", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub price_state: Account<'info, PriceState>,

    #[account(
        mut,
        seeds = [b"stock_mint", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub stock_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = stock_mint,
        associated_token::authority = seller
    )]
    pub seller_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}



// # ------------------ ERRORS ------------------

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Math overflow/underflow")]
    MathOverflow,
    #[msg("Slippage too high or zero output")]
    SlippageTooHigh,
    #[msg("Invalid input/state")]
    InvalidInput,
    #[msg("Insufficient treasury balance")]
    InsufficientTreasury,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Invalid state")]
    InvalidState,
}
