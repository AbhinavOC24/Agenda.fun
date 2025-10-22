"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@project-serum/anchor";

import idl from "../../../../governance/target/idl/governance.json";

const PROGRAM_ID = new PublicKey(
  "6iMHRA5osY1Yb2Gi9t4WSBxBxsaU51fgD1JPiRinNDWD"
);
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Helper function to convert string to 32-byte array
const stringToBytes32 = (str: string): number[] => {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.slice(0, 32));
  return Array.from(bytes);
};

async function anchorCall(fn: string, params: any, wallet: any) {
  if (!wallet) throw new Error("Wallet not connected");

  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  const program = new Program(idl as any, PROGRAM_ID, provider);

  console.log("▶️ Executing:", fn, params);

  const admin = wallet.publicKey;
  const fandomId = params.fandom_id ? Buffer.from(params.fandom_id) : null;
  const charSlug = params.char_slug;
  const pollId = params.poll_id ? Buffer.from(params.poll_id) : null;

  let tx;

  switch (fn) {
    // ---------------- Global ----------------
    case "init_global":
      tx = await program.methods
        .initGlobal(
          params.fee_bps,
          params.r_burn,
          params.r_global,
          params.r_char,
          params.k,
          new PublicKey(params.usdc_mint),
          new PublicKey(params.platform_wallet)
        )
        .accounts({
          globalConfig: PublicKey.findProgramAddressSync(
            [Buffer.from("global_config")],
            PROGRAM_ID
          )[0],
          globalTreasury: PublicKey.findProgramAddressSync(
            [Buffer.from("global_treasury")],
            PROGRAM_ID
          )[0],
          admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      break;

    // ---------------- Fandom ----------------
    case "create_fandom":
      tx = await program.methods
        .createFandom(params.fandom_id, params.name)
        .accounts({
          fandom: PublicKey.findProgramAddressSync(
            [Buffer.from("fandom"), Uint8Array.from(params.fandom_id)],
            PROGRAM_ID
          )[0],
          globalConfig: PublicKey.findProgramAddressSync(
            [Buffer.from("global_config")],
            PROGRAM_ID
          )[0],
          admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      break;

    // ---------------- Character ----------------
    case "create_character":
      tx = await program.methods
        .createCharacter(params.fandom_id, params.char_slug, params.supply)
        .accounts({
          fandom: PublicKey.findProgramAddressSync(
            [Buffer.from("fandom"), Uint8Array.from(params.fandom_id)],
            PROGRAM_ID
          )[0],
          character: PublicKey.findProgramAddressSync(
            [
              Buffer.from("character"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          characterTreasury: PublicKey.findProgramAddressSync(
            [
              Buffer.from("char_treasury"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          characterPriceState: PublicKey.findProgramAddressSync(
            [
              Buffer.from("char_price_state"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          stockMint: PublicKey.findProgramAddressSync(
            [
              Buffer.from("stock_mint"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          admin,
          tokenProgram: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      break;

    // ---------------- Buy Stock ----------------
    case "buy_stock":
      const buyerAta = PublicKey.findProgramAddressSync(
        [
          admin.toBuffer(),
          new PublicKey(
            "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
          ).toBuffer(),
          PublicKey.findProgramAddressSync(
            [
              Buffer.from("stock_mint"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0].toBuffer(),
        ],
        new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
      )[0];

      tx = await program.methods
        .buyStock(
          params.fandom_id,
          params.char_slug,
          params.lamports_in,
          params.min_shares_out
        )
        .accounts({
          buyer: admin,
          fandom: PublicKey.findProgramAddressSync(
            [Buffer.from("fandom"), Uint8Array.from(params.fandom_id)],
            PROGRAM_ID
          )[0],
          character: PublicKey.findProgramAddressSync(
            [
              Buffer.from("character"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          characterTreasury: PublicKey.findProgramAddressSync(
            [
              Buffer.from("char_treasury"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          characterPriceState: PublicKey.findProgramAddressSync(
            [
              Buffer.from("char_price_state"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          stockMint: PublicKey.findProgramAddressSync(
            [
              Buffer.from("stock_mint"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          buyerAta,
          associatedTokenProgram: new PublicKey(
            "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
          ),
          rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
          tokenProgram: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      break;

    // ---------------- Sell Stock ----------------
    case "sell_stock":
      const sellerAta = PublicKey.findProgramAddressSync(
        [
          admin.toBuffer(),
          new PublicKey(
            "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
          ).toBuffer(),
          PublicKey.findProgramAddressSync(
            [
              Buffer.from("stock_mint"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0].toBuffer(),
        ],
        new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
      )[0];

      tx = await program.methods
        .sellStock(params.shares_in, params.fandom_id, params.char_slug)
        .accounts({
          seller: admin,
          character: PublicKey.findProgramAddressSync(
            [
              Buffer.from("character"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          characterTreasury: PublicKey.findProgramAddressSync(
            [
              Buffer.from("char_treasury"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          priceState: PublicKey.findProgramAddressSync(
            [
              Buffer.from("char_price_state"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          stockMint: PublicKey.findProgramAddressSync(
            [
              Buffer.from("stock_mint"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.char_slug),
            ],
            PROGRAM_ID
          )[0],
          sellerAta,
          tokenProgram: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      break;

    // ---------------- Poll ----------------
    case "create_poll":
      tx = await program.methods
        .createPoll(
          params.poll_id,
          params.fandom_id,
          params.subjects,
          params.start_ts,
          params.end_ts,
          params.challenge_end_ts,
          params.metadata_hash,
          params.lambda_fp,
          params.k_override
        )
        .accounts({
          admin,
          globalConfig: PublicKey.findProgramAddressSync(
            [Buffer.from("global_config")],
            PROGRAM_ID
          )[0],
          fandom: PublicKey.findProgramAddressSync(
            [Buffer.from("fandom"), Uint8Array.from(params.fandom_id)],
            PROGRAM_ID
          )[0],
          poll: PublicKey.findProgramAddressSync(
            [
              Buffer.from("poll"),
              Uint8Array.from(params.fandom_id),
              Uint8Array.from(params.poll_id),
            ],
            PROGRAM_ID
          )[0],
          pollEscrow: PublicKey.findProgramAddressSync(
            [Buffer.from("poll_escrow"), Uint8Array.from(params.poll_id)],
            PROGRAM_ID
          )[0],
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      break;

    case "resolve_poll_auto":
      tx = await program.methods
        .resolvePollAuto(params.poll_id, params.fandom_id)
        .accounts({
          anyone: admin,
          poll: PublicKey.findProgramAddressSync(
            [
              Buffer.from("poll"),
              Uint8Array.from(params.fandom_id),
              Uint8Array.from(params.poll_id),
            ],
            PROGRAM_ID
          )[0],
        })
        .rpc();
      break;

    case "challenge_poll":
      tx = await program.methods
        .challengePoll(
          params.poll_id,
          params.fandom_id,
          params.side,
          params.stake_lamports
        )
        .accounts({
          poll: PublicKey.findProgramAddressSync(
            [
              Buffer.from("poll"),
              Uint8Array.from(params.fandom_id),
              Uint8Array.from(params.poll_id),
            ],
            PROGRAM_ID
          )[0],
          challenger: admin,
          disputeYes: PublicKey.findProgramAddressSync(
            [Buffer.from("dispute_yes"), Uint8Array.from(params.poll_id)],
            PROGRAM_ID
          )[0],
          disputeNo: PublicKey.findProgramAddressSync(
            [Buffer.from("dispute_no"), Uint8Array.from(params.poll_id)],
            PROGRAM_ID
          )[0],
          proposalReceipt: PublicKey.findProgramAddressSync(
            [
              Buffer.from("proposal_receipt"),
              Uint8Array.from(params.poll_id),
              admin.toBuffer(),
            ],
            PROGRAM_ID
          )[0],
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      break;

    case "join_dispute":
      tx = await program.methods
        .joinDispute(params.side, params.stake_lamports)
        .accounts({
          poll: new PublicKey(params.poll),
          fandom: new PublicKey(params.fandom),
          disputeYes: new PublicKey(params.dispute_yes),
          disputeNo: new PublicKey(params.dispute_no),
          proposalReceipt: PublicKey.findProgramAddressSync(
            [
              Buffer.from("proposal_receipt"),
              Uint8Array.from(params.poll_id),
              admin.toBuffer(),
            ],
            PROGRAM_ID
          )[0],
          participant: admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      break;

    case "settle_poll":
      tx = await program.methods
        .settlePoll(params.poll_id, params.fandom_id)
        .accounts({
          poll: PublicKey.findProgramAddressSync(
            [
              Buffer.from("poll"),
              Uint8Array.from(params.fandom_id),
              Uint8Array.from(params.poll_id),
            ],
            PROGRAM_ID
          )[0],
          disputeYes: PublicKey.findProgramAddressSync(
            [Buffer.from("dispute_yes"), Uint8Array.from(params.poll_id)],
            PROGRAM_ID
          )[0],
          disputeNo: PublicKey.findProgramAddressSync(
            [Buffer.from("dispute_no"), Uint8Array.from(params.poll_id)],
            PROGRAM_ID
          )[0],
          globalConfig: PublicKey.findProgramAddressSync(
            [Buffer.from("global_config")],
            PROGRAM_ID
          )[0],
          globalTreasury: PublicKey.findProgramAddressSync(
            [Buffer.from("global_treasury")],
            PROGRAM_ID
          )[0],
          character: PublicKey.findProgramAddressSync(
            [
              Buffer.from("character"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.subjects[0].char_slug),
            ],
            PROGRAM_ID
          )[0],
          characterTreasury: PublicKey.findProgramAddressSync(
            [
              Buffer.from("char_treasury"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.subjects[0].char_slug),
            ],
            PROGRAM_ID
          )[0],
          characterPriceState: PublicKey.findProgramAddressSync(
            [
              Buffer.from("char_price_state"),
              Uint8Array.from(params.fandom_id),
              Buffer.from(params.subjects[0].char_slug),
            ],
            PROGRAM_ID
          )[0],
          pollEscrow: PublicKey.findProgramAddressSync(
            [Buffer.from("poll_escrow"), Uint8Array.from(params.poll_id)],
            PROGRAM_ID
          )[0],
          platformWallet: new PublicKey(params.platform_wallet),
          burn: SystemProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      break;

    default:
      throw new Error("Unknown function: " + fn);
  }

  console.log("✅ Tx:", tx);
  return { success: true, txHash: tx };
}

export default function Control() {
  const { wallet, connected } = useWallet();
  const [loading, setLoading] = useState<string | null>(null);

  // Global Config State
  const [globalConfig, setGlobalConfig] = useState({
    feeBps: "",
    rBurn: "",
    rGlobal: "",
    rChar: "",
    k: "",
    usdcMint: "",
    platformWallet: "",
  });

  // Fandom State
  const [fandomData, setFandomData] = useState({
    fandomId: "",
    name: "",
  });

  // Character State
  const [characterData, setCharacterData] = useState({
    fandomId: "",
    charSlug: "",
    supply: "",
  });

  // Stock Trading State
  const [stockData, setStockData] = useState({
    fandomId: "",
    charSlug: "",
    lamportsIn: "",
    minSharesOut: "",
    sharesIn: "",
  });

  // Poll State
  const [pollData, setPollData] = useState({
    pollId: "",
    fandomId: "",
    subjects: "",
    startTs: "",
    endTs: "",
    challengeEndTs: "",
    metadataHash: "",
    lambdaFp: "",
    kOverride: "",
  });

  const [disputeData, setDisputeData] = useState({
    pollId: "",
    fandomId: "",
    side: "Yes",
    stakeLamports: "",
  });

  const handleGlobalConfig = async () => {
    setLoading("global");
    try {
      const params = {
        fee_bps: parseInt(globalConfig.feeBps),
        r_burn: parseInt(globalConfig.rBurn),
        r_global: parseInt(globalConfig.rGlobal),
        r_char: parseInt(globalConfig.rChar),
        k: parseInt(globalConfig.k),
        usdc_mint: globalConfig.usdcMint,
        platform_wallet: globalConfig.platformWallet,
      };
      await anchorCall("init_global", params, wallet);
      alert("✅ Global config initialized successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Error initializing global config: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleCreateFandom = async () => {
    setLoading("fandom");
    try {
      const fandomIdBytes = stringToBytes32(fandomData.fandomId);

      const params = {
        fandom_id: fandomIdBytes,
        name: fandomData.name,
      };
      await anchorCall("create_fandom", params, wallet);
      alert("✅ Fandom created successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Error creating fandom: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleCreateCharacter = async () => {
    setLoading("character");
    try {
      const fandomIdBytes = stringToBytes32(characterData.fandomId);

      const params = {
        fandom_id: fandomIdBytes,
        char_slug: characterData.charSlug,
        supply: parseInt(characterData.supply),
      };
      await anchorCall("create_character", params, wallet);
      alert("✅ Character created successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Error creating character: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleBuyStock = async () => {
    setLoading("buyStock");
    try {
      const fandomIdBytes = stringToBytes32(stockData.fandomId);

      const params = {
        fandom_id: fandomIdBytes,
        char_slug: stockData.charSlug,
        lamports_in: parseInt(stockData.lamportsIn),
        min_shares_out: parseInt(stockData.minSharesOut),
      };
      await anchorCall("buy_stock", params, wallet);
      alert("✅ Stock bought successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Error buying stock: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleSellStock = async () => {
    setLoading("sellStock");
    try {
      const fandomIdBytes = stringToBytes32(stockData.fandomId);

      const params = {
        shares_in: parseInt(stockData.sharesIn),
        fandom_id: fandomIdBytes,
        char_slug: stockData.charSlug,
      };
      await anchorCall("sell_stock", params, wallet);
      alert("✅ Stock sold successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Error selling stock: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleCreatePoll = async () => {
    setLoading("createPoll");
    try {
      const pollIdBytes = stringToBytes32(pollData.pollId);
      const fandomIdBytes = stringToBytes32(pollData.fandomId);
      const metadataHashBytes = stringToBytes32(pollData.metadataHash);

      const params = {
        poll_id: pollIdBytes,
        fandom_id: fandomIdBytes,
        subjects: JSON.parse(pollData.subjects || "[]"),
        start_ts: parseInt(pollData.startTs),
        end_ts: parseInt(pollData.endTs),
        challenge_end_ts: parseInt(pollData.challengeEndTs),
        metadata_hash: metadataHashBytes,
        lambda_fp: parseInt(pollData.lambdaFp),
        k_override: pollData.kOverride ? parseInt(pollData.kOverride) : null,
      };
      await anchorCall("create_poll", params, wallet);
      alert("✅ Poll created successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Error creating poll: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleResolvePoll = async () => {
    setLoading("resolvePoll");
    try {
      const pollIdBytes = stringToBytes32(pollData.pollId);
      const fandomIdBytes = stringToBytes32(pollData.fandomId);

      const params = {
        poll_id: pollIdBytes,
        fandom_id: fandomIdBytes,
      };
      await anchorCall("resolve_poll_auto", params, wallet);
      alert("✅ Poll resolved successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Error resolving poll: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleChallengePoll = async () => {
    setLoading("challengePoll");
    try {
      const pollIdBytes = stringToBytes32(disputeData.pollId);
      const fandomIdBytes = stringToBytes32(disputeData.fandomId);

      const params = {
        poll_id: pollIdBytes,
        fandom_id: fandomIdBytes,
        side: disputeData.side,
        stake_lamports: parseInt(disputeData.stakeLamports),
      };
      await anchorCall("challenge_poll", params, wallet);
      alert("✅ Poll challenged successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Error challenging poll: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleJoinDispute = async () => {
    setLoading("joinDispute");
    try {
      const pollIdBytes = stringToBytes32(disputeData.pollId);
      const fandomIdBytes = stringToBytes32(disputeData.fandomId);

      // Get poll and dispute addresses
      const pollAddress = PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll"),
          Buffer.from(fandomIdBytes),
          Buffer.from(pollIdBytes),
        ],
        PROGRAM_ID
      )[0];

      const disputeYesAddress = PublicKey.findProgramAddressSync(
        [Buffer.from("dispute_yes"), Buffer.from(pollIdBytes)],
        PROGRAM_ID
      )[0];

      const disputeNoAddress = PublicKey.findProgramAddressSync(
        [Buffer.from("dispute_no"), Buffer.from(pollIdBytes)],
        PROGRAM_ID
      )[0];

      const params = {
        side: disputeData.side,
        stake_lamports: parseInt(disputeData.stakeLamports),
        poll: pollAddress.toString(),
        fandom: PublicKey.findProgramAddressSync(
          [Buffer.from("fandom"), Buffer.from(fandomIdBytes)],
          PROGRAM_ID
        )[0].toString(),
        dispute_yes: disputeYesAddress.toString(),
        dispute_no: disputeNoAddress.toString(),
        poll_id: pollIdBytes,
      };
      await anchorCall("join_dispute", params, wallet);
      alert("✅ Joined dispute successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Error joining dispute: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleSettlePoll = async () => {
    setLoading("settlePoll");
    try {
      const pollIdBytes = stringToBytes32(pollData.pollId);
      const fandomIdBytes = stringToBytes32(pollData.fandomId);

      const params = {
        poll_id: pollIdBytes,
        fandom_id: fandomIdBytes,
        subjects: JSON.parse(pollData.subjects || "[]"),
        platform_wallet: globalConfig.platformWallet,
      };
      await anchorCall("settle_poll", params, wallet);
      alert("✅ Poll settled successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Error settling poll: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-8">Governance Control Panel</h1>
        <p className="text-lg text-muted-foreground">
          Please connect your wallet to access the control panel.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Governance Control Panel (On-Chain)
      </h1>

      {/* Global Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Global Configuration</CardTitle>
          <CardDescription>
            Initialize global settings for the governance system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="feeBps">Fee BPS</Label>
              <Input
                id="feeBps"
                value={globalConfig.feeBps}
                onChange={(e) =>
                  setGlobalConfig({ ...globalConfig, feeBps: e.target.value })
                }
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <Label htmlFor="rBurn">R Burn</Label>
              <Input
                id="rBurn"
                value={globalConfig.rBurn}
                onChange={(e) =>
                  setGlobalConfig({ ...globalConfig, rBurn: e.target.value })
                }
                placeholder="e.g., 2000"
              />
            </div>
            <div>
              <Label htmlFor="rGlobal">R Global</Label>
              <Input
                id="rGlobal"
                value={globalConfig.rGlobal}
                onChange={(e) =>
                  setGlobalConfig({ ...globalConfig, rGlobal: e.target.value })
                }
                placeholder="e.g., 3000"
              />
            </div>
            <div>
              <Label htmlFor="rChar">R Char</Label>
              <Input
                id="rChar"
                value={globalConfig.rChar}
                onChange={(e) =>
                  setGlobalConfig({ ...globalConfig, rChar: e.target.value })
                }
                placeholder="e.g., 5000"
              />
            </div>
            <div>
              <Label htmlFor="k">K Value</Label>
              <Input
                id="k"
                value={globalConfig.k}
                onChange={(e) =>
                  setGlobalConfig({ ...globalConfig, k: e.target.value })
                }
                placeholder="e.g., 1000000"
              />
            </div>
            <div>
              <Label htmlFor="usdcMint">USDC Mint Address</Label>
              <Input
                id="usdcMint"
                value={globalConfig.usdcMint}
                onChange={(e) =>
                  setGlobalConfig({ ...globalConfig, usdcMint: e.target.value })
                }
                placeholder="USDC mint address"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="platformWallet">Platform Wallet Address</Label>
              <Input
                id="platformWallet"
                value={globalConfig.platformWallet}
                onChange={(e) =>
                  setGlobalConfig({
                    ...globalConfig,
                    platformWallet: e.target.value,
                  })
                }
                placeholder="Platform wallet address"
              />
            </div>
          </div>
          <Button
            onClick={handleGlobalConfig}
            disabled={loading === "global"}
            className="w-full"
          >
            {loading === "global"
              ? "Initializing..."
              : "Initialize Global Config"}
          </Button>
        </CardContent>
      </Card>

      {/* Fandom Management */}
      <Card>
        <CardHeader>
          <CardTitle>Fandom Management</CardTitle>
          <CardDescription>Create and manage fandoms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fandomId">Fandom ID</Label>
              <Input
                id="fandomId"
                value={fandomData.fandomId}
                onChange={(e) =>
                  setFandomData({ ...fandomData, fandomId: e.target.value })
                }
                placeholder="e.g., my-fandom-123"
              />
            </div>
            <div>
              <Label htmlFor="fandomName">Fandom Name</Label>
              <Input
                id="fandomName"
                value={fandomData.name}
                onChange={(e) =>
                  setFandomData({ ...fandomData, name: e.target.value })
                }
                placeholder="e.g., My Awesome Fandom"
              />
            </div>
          </div>
          <Button
            onClick={handleCreateFandom}
            disabled={loading === "fandom"}
            className="w-full"
          >
            {loading === "fandom" ? "Creating..." : "Create Fandom"}
          </Button>
        </CardContent>
      </Card>

      {/* Character Management */}
      <Card>
        <CardHeader>
          <CardTitle>Character Management</CardTitle>
          <CardDescription>Create characters within fandoms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="charFandomId">Fandom ID</Label>
              <Input
                id="charFandomId"
                value={characterData.fandomId}
                onChange={(e) =>
                  setCharacterData({
                    ...characterData,
                    fandomId: e.target.value,
                  })
                }
                placeholder="e.g., my-fandom-123"
              />
            </div>
            <div>
              <Label htmlFor="charSlug">Character Slug</Label>
              <Input
                id="charSlug"
                value={characterData.charSlug}
                onChange={(e) =>
                  setCharacterData({
                    ...characterData,
                    charSlug: e.target.value,
                  })
                }
                placeholder="e.g., character-1"
              />
            </div>
            <div>
              <Label htmlFor="supply">Supply</Label>
              <Input
                id="supply"
                value={characterData.supply}
                onChange={(e) =>
                  setCharacterData({ ...characterData, supply: e.target.value })
                }
                placeholder="e.g., 1000000"
              />
            </div>
          </div>
          <Button
            onClick={handleCreateCharacter}
            disabled={loading === "character"}
            className="w-full"
          >
            {loading === "character" ? "Creating..." : "Create Character"}
          </Button>
        </CardContent>
      </Card>

      {/* Stock Trading */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Trading</CardTitle>
          <CardDescription>Buy and sell character stocks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stockFandomId">Fandom ID</Label>
              <Input
                id="stockFandomId"
                value={stockData.fandomId}
                onChange={(e) =>
                  setStockData({ ...stockData, fandomId: e.target.value })
                }
                placeholder="e.g., my-fandom-123"
              />
            </div>
            <div>
              <Label htmlFor="stockCharSlug">Character Slug</Label>
              <Input
                id="stockCharSlug"
                value={stockData.charSlug}
                onChange={(e) =>
                  setStockData({ ...stockData, charSlug: e.target.value })
                }
                placeholder="e.g., character-1"
              />
            </div>
            <div>
              <Label htmlFor="lamportsIn">Lamports In (Buy)</Label>
              <Input
                id="lamportsIn"
                value={stockData.lamportsIn}
                onChange={(e) =>
                  setStockData({ ...stockData, lamportsIn: e.target.value })
                }
                placeholder="e.g., 1000000"
              />
            </div>
            <div>
              <Label htmlFor="minSharesOut">Min Shares Out (Buy)</Label>
              <Input
                id="minSharesOut"
                value={stockData.minSharesOut}
                onChange={(e) =>
                  setStockData({ ...stockData, minSharesOut: e.target.value })
                }
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <Label htmlFor="sharesIn">Shares In (Sell)</Label>
              <Input
                id="sharesIn"
                value={stockData.sharesIn}
                onChange={(e) =>
                  setStockData({ ...stockData, sharesIn: e.target.value })
                }
                placeholder="e.g., 50"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={handleBuyStock}
              disabled={loading === "buyStock"}
              className="flex-1"
            >
              {loading === "buyStock" ? "Buying..." : "Buy Stock"}
            </Button>
            <Button
              onClick={handleSellStock}
              disabled={loading === "sellStock"}
              className="flex-1"
            >
              {loading === "sellStock" ? "Selling..." : "Sell Stock"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Poll Management */}
      <Card>
        <CardHeader>
          <CardTitle>Poll Management</CardTitle>
          <CardDescription>Create and manage governance polls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pollId">Poll ID</Label>
              <Input
                id="pollId"
                value={pollData.pollId}
                onChange={(e) =>
                  setPollData({ ...pollData, pollId: e.target.value })
                }
                placeholder="e.g., poll-123"
              />
            </div>
            <div>
              <Label htmlFor="pollFandomId">Fandom ID</Label>
              <Input
                id="pollFandomId"
                value={pollData.fandomId}
                onChange={(e) =>
                  setPollData({ ...pollData, fandomId: e.target.value })
                }
                placeholder="e.g., my-fandom-123"
              />
            </div>
            <div>
              <Label htmlFor="subjects">Subjects (JSON)</Label>
              <Textarea
                id="subjects"
                value={pollData.subjects}
                onChange={(e) =>
                  setPollData({ ...pollData, subjects: e.target.value })
                }
                placeholder='[{"char_slug": "character-1", "direction_if_yes": 1}]'
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="metadataHash">Metadata Hash</Label>
              <Input
                id="metadataHash"
                value={pollData.metadataHash}
                onChange={(e) =>
                  setPollData({ ...pollData, metadataHash: e.target.value })
                }
                placeholder="e.g., metadata-hash-123"
              />
            </div>
            <div>
              <Label htmlFor="startTs">Start Timestamp</Label>
              <Input
                id="startTs"
                value={pollData.startTs}
                onChange={(e) =>
                  setPollData({ ...pollData, startTs: e.target.value })
                }
                placeholder="e.g., 1640995200"
              />
            </div>
            <div>
              <Label htmlFor="endTs">End Timestamp</Label>
              <Input
                id="endTs"
                value={pollData.endTs}
                onChange={(e) =>
                  setPollData({ ...pollData, endTs: e.target.value })
                }
                placeholder="e.g., 1641081600"
              />
            </div>
            <div>
              <Label htmlFor="challengeEndTs">Challenge End Timestamp</Label>
              <Input
                id="challengeEndTs"
                value={pollData.challengeEndTs}
                onChange={(e) =>
                  setPollData({ ...pollData, challengeEndTs: e.target.value })
                }
                placeholder="e.g., 1641168000"
              />
            </div>
            <div>
              <Label htmlFor="lambdaFp">Lambda FP</Label>
              <Input
                id="lambdaFp"
                value={pollData.lambdaFp}
                onChange={(e) =>
                  setPollData({ ...pollData, lambdaFp: e.target.value })
                }
                placeholder="e.g., 1000000"
              />
            </div>
            <div>
              <Label htmlFor="kOverride">K Override (Optional)</Label>
              <Input
                id="kOverride"
                value={pollData.kOverride}
                onChange={(e) =>
                  setPollData({ ...pollData, kOverride: e.target.value })
                }
                placeholder="e.g., 2000000"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleCreatePoll}
              disabled={loading === "createPoll"}
            >
              {loading === "createPoll" ? "Creating..." : "Create Poll"}
            </Button>
            <Button
              onClick={handleResolvePoll}
              disabled={loading === "resolvePoll"}
              variant="outline"
            >
              {loading === "resolvePoll" ? "Resolving..." : "Resolve Poll"}
            </Button>
            <Button
              onClick={handleSettlePoll}
              disabled={loading === "settlePoll"}
              variant="outline"
            >
              {loading === "settlePoll" ? "Settling..." : "Settle Poll"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dispute Management */}
      <Card>
        <CardHeader>
          <CardTitle>Dispute Management</CardTitle>
          <CardDescription>Challenge polls and join disputes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="disputePollId">Poll ID</Label>
              <Input
                id="disputePollId"
                value={disputeData.pollId}
                onChange={(e) =>
                  setDisputeData({ ...disputeData, pollId: e.target.value })
                }
                placeholder="e.g., poll-123"
              />
            </div>
            <div>
              <Label htmlFor="disputeFandomId">Fandom ID</Label>
              <Input
                id="disputeFandomId"
                value={disputeData.fandomId}
                onChange={(e) =>
                  setDisputeData({ ...disputeData, fandomId: e.target.value })
                }
                placeholder="e.g., my-fandom-123"
              />
            </div>
            <div>
              <Label htmlFor="side">Side</Label>
              <select
                id="side"
                value={disputeData.side}
                onChange={(e) =>
                  setDisputeData({ ...disputeData, side: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <Label htmlFor="stakeLamports">Stake Lamports</Label>
              <Input
                id="stakeLamports"
                value={disputeData.stakeLamports}
                onChange={(e) =>
                  setDisputeData({
                    ...disputeData,
                    stakeLamports: e.target.value,
                  })
                }
                placeholder="e.g., 1000000"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={handleChallengePoll}
              disabled={loading === "challengePoll"}
              className="flex-1"
            >
              {loading === "challengePoll"
                ? "Challenging..."
                : "Challenge Poll"}
            </Button>
            <Button
              onClick={handleJoinDispute}
              disabled={loading === "joinDispute"}
              className="flex-1"
              variant="outline"
            >
              {loading === "joinDispute" ? "Joining..." : "Join Dispute"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
