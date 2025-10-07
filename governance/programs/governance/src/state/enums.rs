use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum PollChoice {
    Yes,
    No,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum PollStatus {
    Open,
    ChallengeWindow,
    Pending,
    Disputed,
    Settling,
    Closed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum PollOutcome {
    Unset,
    Yes,
    No,
    Refunded,
}
