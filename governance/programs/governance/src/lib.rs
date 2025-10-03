use anchor_lang::prelude::*;
use anchor_lang::system_program;

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
        fandom.name = name;

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
        stock_mint: Pubkey,
        supply: u64,
      
    ) -> Result<()> {



        let character = &mut ctx.accounts.character;
        character.fandom = ctx.accounts.fandom.key();
        character.char_slug = char_slug.clone();
        character.treasury_vault = ctx.accounts.character_treasury.key(); 
        character.stock_mint = stock_mint;
        character.supply = supply;
        character.price_state = ctx.accounts.character_price_state.key();


        let ps = &mut ctx.accounts.character_price_state;
        ps.character = char_slug;
        ps.week_start_ts = Clock::get()?.unix_timestamp;
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

    pub fn buy_stock(ctx:Context<BuyStock>,fandom_id: [u8; 32],char_slug:String,lamports:u64,amount:i32)->Result<()>{
        
        let character=&mut ctx.accounts.character;
        character.supply = character.supply.checked_add(amount).unwrap();


        let cpi_accounts=Transfer(
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.character_treasury.to_account_info(),
        )
        let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
        transfer(cpi_ctx, lamports)?;

        let ps = &mut ctx.accounts.character_price_state;

        let treasury_balance = **ctx.accounts.character_treasury.to_account_info().lamports.borrow();
        let base_price_fp = (treasury_balance as u128 * 1_000_000) / (character.supply as u128);
        ps.last_price_fp = base_price_fp;
        
        ps.week_start_ts = Clock::get()?.unix_timestamp;
    
        emit!(PriceUpdate {
            character: char_slug,
            price_fp: ps.last_price_fp,
            ts: ps.week_start_ts,
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
    pub admin:Pubkey
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



    // ✅ Treasury PDA for this character (SOL holder for now)
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
    
    #[account(mut)]
    pub admin: Signer<'info>,

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

    pub system_program: Program<'info, System>,
}


// # ------------------ ERRORS ------------------

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized")]
    Unauthorized,
}
