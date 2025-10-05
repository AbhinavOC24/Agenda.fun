use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;

// ========== Init Global ==========

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
    pub global_treasury: Account<'info, GlobalTreasury>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ========== Create Fandom ==========

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
        seeds = [b"global_config"],
        bump,
        has_one = admin
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ========== Create Character ==========

#[derive(Accounts)]
#[instruction(char_slug: String, fandom_id: [u8; 32])]
pub struct CreateCharacter<'info> {
    #[account(
        mut,
        seeds = [b"fandom", fandom_id.as_ref()],
        bump,
        has_one = admin
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
    pub character_treasury: Account<'info, CharacterTreasury>,

    #[account(
        init,
        payer = admin,
        space = 8 + PriceState::INIT_SPACE,
        seeds = [b"char_price_state", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub character_price_state: Account<'info, PriceState>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 6,
        mint::authority = character,
        mint::freeze_authority = character,
        seeds = [b"stock_mint", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub stock_mint: Account<'info, Mint>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ========== Buy Stock ==========

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
        mut,
        seeds = [b"stock_mint", fandom_id.as_ref(), char_slug.as_ref()],
        bump
    )]
    pub stock_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
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

// ========== Sell Stock ==========

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


// ========== Create Poll ==========

#[derive(Accounts)]
#[instruction(poll_id: [u8; 32], fandom_id: [u8; 32])]
pub struct CreatePoll<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"global_config"],
        bump,
        has_one = admin
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [b"fandom", fandom_id.as_ref()],
        bump
    )]
    pub fandom: Account<'info, Fandom>,

    #[account(
        init,
        payer = admin,
        space = 8 + Poll::INIT_SPACE,
        seeds = [b"poll", fandom_id.as_ref(), poll_id.as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        init,
        payer = admin,
        space = 8,
        seeds = [b"poll_escrow", poll_id.as_ref()],
        bump
    )]
    pub poll_escrow: Account<'info, PollEscrow>,

    pub system_program: Program<'info, System>,
}



#[derive(Accounts)]
#[instruction(poll_id: [u8; 32])]
pub struct Vote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"poll", poll_id.as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        seeds = [b"poll_escrow", poll_id.as_ref()],
        bump
    )]
    pub poll_escrow: Account<'info, PollEscrow>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteReceipt::INIT_SPACE,
        seeds = [b"vote", poll_id.as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,

    pub system_program: Program<'info, System>,
}
