use anchor_lang::prelude::*;

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
