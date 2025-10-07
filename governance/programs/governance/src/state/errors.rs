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
    #[msg("Poll is closed")]
    PollClosed,
    #[msg("Poll not ended")]
    PollNotEnded,
     #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Wrong side for claim")]
    WrongSide,
    #[msg("Challenge Window is closed")]
    ChallengeWindowClosed,
    #[msg("Challenge Window is still open")]
    ChallengeWindowStillOpen,
    #[msg("Poll is not disputed")]
    NotDisputed,
    #[msg("No such dispute vault found")]
    InvalidVault,
    #[msg("Poll in the receipt doesn't match")]
    InvalidReceipt,
}
