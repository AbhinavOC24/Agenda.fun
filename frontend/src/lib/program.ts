import { Program, AnchorProvider } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
// @ts-ignore
import idl from "../../governance/target/idl/governance.json";

// Program ID from the IDL
export const PROGRAM_ID = new PublicKey(
  "6iMHRA5osY1Yb2Gi9t4WSBxBxsaU51fgD1JPiRinNDWD"
);

// Create program instance
export const getProgram = (provider: AnchorProvider) => {
  return new Program(idl as any, PROGRAM_ID, provider);
};

// Helper function to convert string to 32-byte array
export const stringToBytes32 = (str: string): number[] => {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.slice(0, 32));
  return Array.from(bytes);
};

// Helper function to get PDA addresses
export const getPDA = (
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(seeds, programId);
};

// Global config PDA
export const getGlobalConfigPDA = () => {
  return getPDA([Buffer.from("global_config")], PROGRAM_ID);
};

// Global treasury PDA
export const getGlobalTreasuryPDA = () => {
  return getPDA([Buffer.from("global_treasury")], PROGRAM_ID);
};

// Fandom PDA
export const getFandomPDA = (fandomId: number[]) => {
  return getPDA([Buffer.from("fandom"), Buffer.from(fandomId)], PROGRAM_ID);
};

// Character PDA
export const getCharacterPDA = (fandomId: number[], charSlug: string) => {
  return getPDA(
    [Buffer.from("character"), Buffer.from(fandomId), Buffer.from(charSlug)],
    PROGRAM_ID
  );
};

// Character treasury PDA
export const getCharacterTreasuryPDA = (
  fandomId: number[],
  charSlug: string
) => {
  return getPDA(
    [
      Buffer.from("char_treasury"),
      Buffer.from(fandomId),
      Buffer.from(charSlug),
    ],
    PROGRAM_ID
  );
};

// Character price state PDA
export const getCharacterPriceStatePDA = (
  fandomId: number[],
  charSlug: string
) => {
  return getPDA(
    [
      Buffer.from("char_price_state"),
      Buffer.from(fandomId),
      Buffer.from(charSlug),
    ],
    PROGRAM_ID
  );
};

// Stock mint PDA
export const getStockMintPDA = (fandomId: number[], charSlug: string) => {
  return getPDA(
    [Buffer.from("stock_mint"), Buffer.from(fandomId), Buffer.from(charSlug)],
    PROGRAM_ID
  );
};

// Poll PDA
export const getPollPDA = (fandomId: number[], pollId: number[]) => {
  return getPDA(
    [Buffer.from("poll"), Buffer.from(fandomId), Buffer.from(pollId)],
    PROGRAM_ID
  );
};

// Poll escrow PDA
export const getPollEscrowPDA = (pollId: number[]) => {
  return getPDA([Buffer.from("poll_escrow"), Buffer.from(pollId)], PROGRAM_ID);
};

// Vote receipt PDA
export const getVoteReceiptPDA = (pollId: number[], voter: PublicKey) => {
  return getPDA(
    [Buffer.from("vote"), Buffer.from(pollId), voter.toBuffer()],
    PROGRAM_ID
  );
};

// Dispute PDAs
export const getDisputeYesPDA = (pollId: number[]) => {
  return getPDA([Buffer.from("dispute_yes"), Buffer.from(pollId)], PROGRAM_ID);
};

export const getDisputeNoPDA = (pollId: number[]) => {
  return getPDA([Buffer.from("dispute_no"), Buffer.from(pollId)], PROGRAM_ID);
};

// Proposal receipt PDA
export const getProposalReceiptPDA = (
  pollId: number[],
  participant: PublicKey
) => {
  return getPDA(
    [
      Buffer.from("proposal_receipt"),
      Buffer.from(pollId),
      participant.toBuffer(),
    ],
    PROGRAM_ID
  );
};

// Associated token account PDA
export const getAssociatedTokenAddress = (
  wallet: PublicKey,
  mint: PublicKey
) => {
  const TOKEN_PROGRAM_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  );
  const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
  );

  return PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
};
