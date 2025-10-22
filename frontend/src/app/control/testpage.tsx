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

import idl from "../../../../governance/target/idl/governance.json";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Idl, Program, BN } from "@project-serum/anchor";

import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// ---------------------------------------------
// Config
// ---------------------------------------------
const RPC_ENDPOINT = "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  "6iMHRA5osY1Yb2Gi9t4WSBxBxsaU51fgD1JPiRinNDWD"
);
const connection = new Connection(RPC_ENDPOINT, "confirmed");

// ---------------------------------------------
// Helpers
// ---------------------------------------------
const toBytes32 = (s: string) => {
  const enc = new TextEncoder();
  const buf = enc.encode(s);
  const out = new Uint8Array(32);
  out.set(buf.slice(0, 32));
  return Array.from(out);
};

const pda = (seeds: (Buffer | Uint8Array)[]) =>
  PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];

const buf = (x: string) => Buffer.from(x);
const arr = (x: number[]) => Uint8Array.from(x);

// ---------------------------------------------
// Anchor client
// ---------------------------------------------
function getProgram(wallet: any) {
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  return new Program(idl as unknown as Idl, PROGRAM_ID, provider);
}

// ---------------------------------------------
// Page
// ---------------------------------------------
export default function Control() {
  const wallet = useAnchorWallet();

  // ---------------- Global Config State
  const [globalConfig, setGlobalConfig] = useState({
    feeBps: "",
    rBurn: "",
    rGlobal: "",
    rChar: "",
    k: "",
    usdcMint: "",
    platformWallet: "",
  });

  // ---------------- Fandom State
  const [fandomData, setFandomData] = useState({
    fandomId: "",
    name: "",
  });

  // ---------------- Character State
  const [characterData, setCharacterData] = useState({
    fandomId: "",
    charSlug: "",
    supply: "",
  });

  // ---------------- Stock Trading State
  const [stockData, setStockData] = useState({
    fandomId: "",
    charSlug: "",
    lamportsIn: "",
    minSharesOut: "",
    sharesIn: "",
  });

  // ---------------- Poll / Dispute State
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
    side: "Yes", // "Yes" | "No" depending on your IDL enum strings
    stakeLamports: "",
  });

  const [loading, setLoading] = useState<string | null>(null);

  // ---------------------------------------------
  // PDA derivations (consistent with your contexts)
  // ---------------------------------------------
  const PDA = {
    globalConfig: () => pda([buf("global_config")]),
    globalTreasury: () => pda([buf("global_treasury")]),
    fandom: (fandomId32: number[]) => pda([buf("fandom"), arr(fandomId32)]),
    character: (fandomId32: number[], slug: string) =>
      pda([buf("character"), arr(fandomId32), buf(slug)]),
    charTreasury: (fandomId32: number[], slug: string) =>
      pda([buf("char_treasury"), arr(fandomId32), buf(slug)]),
    charPriceState: (fandomId32: number[], slug: string) =>
      pda([buf("char_price_state"), arr(fandomId32), buf(slug)]),
    stockMint: (fandomId32: number[], slug: string) =>
      pda([buf("stock_mint"), arr(fandomId32), buf(slug)]),
    poll: (fandomId32: number[], pollId32: number[]) =>
      pda([buf("poll"), arr(fandomId32), arr(pollId32)]),
    pollEscrow: (pollId32: number[]) =>
      pda([buf("poll_escrow"), arr(pollId32)]),
    disputeYes: (pollId32: number[]) =>
      pda([buf("dispute_yes"), arr(pollId32)]),
    disputeNo: (pollId32: number[]) => pda([buf("dispute_no"), arr(pollId32)]),
    proposalReceipt: (pollId32: number[], user: PublicKey) =>
      pda([buf("proposal_receipt"), arr(pollId32), user.toBuffer()]),
    voteReceipt: (pollId32: number[], voter: PublicKey) =>
      pda([buf("vote"), arr(pollId32), voter.toBuffer()]),
  };

  // ---------------------------------------------
  // ACTIONS (real on-chain calls)
  // ---------------------------------------------

  const handleGlobalConfig = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("global");
    try {
      const program = getProgram(wallet);
      const admin = wallet.publicKey;

      const feeBps = parseInt(globalConfig.feeBps);
      const rBurn = parseInt(globalConfig.rBurn);
      const rGlobal = parseInt(globalConfig.rGlobal);
      const rChar = parseInt(globalConfig.rChar);
      const k = parseInt(globalConfig.k);

      const usdcMint = new PublicKey(globalConfig.usdcMint);
      const platformWallet = new PublicKey(globalConfig.platformWallet);

      const tx = await program.methods
        .initGlobal(feeBps, rBurn, rGlobal, rChar, k, usdcMint, platformWallet)
        .accounts({
          globalConfig: PDA.globalConfig(),
          globalTreasury: PDA.globalTreasury(),
          admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Global config init tx: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleCreateFandom = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("fandom");
    try {
      const program = getProgram(wallet);
      const admin = wallet.publicKey;

      const fandomId32 = toBytes32(fandomData.fandomId);
      const tx = await program.methods
        .createFandom(fandomId32, fandomData.name)
        .accounts({
          fandom: PDA.fandom(fandomId32),
          globalConfig: PDA.globalConfig(),
          admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Fandom created: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleCreateCharacter = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("character");
    try {
      const program = getProgram(wallet);
      const admin = wallet.publicKey;

      const fandomId32 = toBytes32(characterData.fandomId);
      const slug = characterData.charSlug;
      const supply = new BN(characterData.supply || "0");

      const tx = await program.methods
        .createCharacter(fandomId32, slug, supply)
        .accounts({
          fandom: PDA.fandom(fandomId32),
          character: PDA.character(fandomId32, slug),
          characterTreasury: PDA.charTreasury(fandomId32, slug),
          characterPriceState: PDA.charPriceState(fandomId32, slug),
          stockMint: PDA.stockMint(fandomId32, slug),
          admin,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Character created: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleBuyStock = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("buyStock");
    try {
      const program = getProgram(wallet);
      const buyer = wallet.publicKey;

      const fandomId32 = toBytes32(stockData.fandomId);
      const slug = stockData.charSlug;

      const lamportsIn = new BN(stockData.lamportsIn || "0");
      const minSharesOut = new BN(stockData.minSharesOut || "0");

      const stockMint = PDA.stockMint(fandomId32, slug);
      const buyerAta = getAssociatedTokenAddressSync(
        stockMint,
        buyer,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const tx = await program.methods
        .buyStock(fandomId32, slug, lamportsIn, minSharesOut)
        .accounts({
          buyer,
          fandom: PDA.fandom(fandomId32),
          character: PDA.character(fandomId32, slug),
          characterTreasury: PDA.charTreasury(fandomId32, slug),
          characterPriceState: PDA.charPriceState(fandomId32, slug),
          stockMint,
          buyerAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Bought stock: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleSellStock = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("sellStock");
    try {
      const program = getProgram(wallet);
      const seller = wallet.publicKey;

      const fandomId32 = toBytes32(stockData.fandomId);
      const slug = stockData.charSlug;

      const sharesIn = new BN(stockData.sharesIn || "0");

      const stockMint = PDA.stockMint(fandomId32, slug);
      const sellerAta = getAssociatedTokenAddressSync(
        stockMint,
        seller,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const tx = await program.methods
        .sellStock(sharesIn, fandomId32, slug)
        .accounts({
          seller,
          character: PDA.character(fandomId32, slug),
          characterTreasury: PDA.charTreasury(fandomId32, slug),
          priceState: PDA.charPriceState(fandomId32, slug),
          stockMint,
          sellerAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Sold stock: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleCreatePoll = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("createPoll");
    try {
      const program = getProgram(wallet);
      const admin = wallet.publicKey;

      const pollId32 = toBytes32(pollData.pollId);
      const fandomId32 = toBytes32(pollData.fandomId);
      const metadataHash32 = toBytes32(pollData.metadataHash);

      const subjects = pollData.subjects ? JSON.parse(pollData.subjects) : [];
      const startTs = new BN(pollData.startTs || "0");
      const endTs = new BN(pollData.endTs || "0");
      const challengeEndTs = new BN(pollData.challengeEndTs || "0");
      const lambdaFp = parseInt(pollData.lambdaFp || "0");
      const kOverride = pollData.kOverride
        ? parseInt(pollData.kOverride)
        : null;

      const tx = await program.methods
        .createPoll(
          pollId32,
          fandomId32,
          subjects,
          startTs,
          endTs,
          challengeEndTs,
          metadataHash32,
          lambdaFp,
          kOverride
        )
        .accounts({
          admin,
          globalConfig: PDA.globalConfig(),
          fandom: PDA.fandom(fandomId32),
          poll: PDA.poll(fandomId32, pollId32),
          pollEscrow: PDA.pollEscrow(pollId32),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Poll created: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleResolvePoll = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("resolvePoll");
    try {
      const program = getProgram(wallet);
      const anyone = wallet.publicKey;

      const pollId32 = toBytes32(pollData.pollId);
      const fandomId32 = toBytes32(pollData.fandomId);

      const tx = await program.methods
        .resolvePollAuto(pollId32, fandomId32)
        .accounts({
          anyone,
          poll: PDA.poll(fandomId32, pollId32),
        })
        .rpc();

      alert(`Poll resolved: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleChallengePoll = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("challengePoll");
    try {
      const program = getProgram(wallet);
      const challenger = wallet.publicKey;

      const pollId32 = toBytes32(disputeData.pollId);
      const fandomId32 = toBytes32(disputeData.fandomId);

      // Map UI "Yes"/"No" to your enum as IDL expects (string or number). If enum is an anchor enum with variants "Yes" | "No", passing string works.
      const side = disputeData.side as any;
      const stakeLamports = new BN(disputeData.stakeLamports || "0");

      const tx = await program.methods
        .challengePoll(pollId32, fandomId32, side, stakeLamports)
        .accounts({
          poll: PDA.poll(fandomId32, pollId32),
          challenger,
          disputeYes: PDA.disputeYes(pollId32),
          disputeNo: PDA.disputeNo(pollId32),
          proposalReceipt: PDA.proposalReceipt(pollId32, challenger),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Poll challenged: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleJoinDispute = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("joinDispute");
    try {
      const program = getProgram(wallet);
      const participant = wallet.publicKey;

      const pollId32 = toBytes32(disputeData.pollId);
      const fandomId32 = toBytes32(disputeData.fandomId);

      const side = disputeData.side as any;
      const stakeLamports = new BN(disputeData.stakeLamports || "0");

      const tx = await program.methods
        .joinDispute(side, stakeLamports)
        .accounts({
          poll: PDA.poll(fandomId32, pollId32),
          fandom: PDA.fandom(fandomId32),
          disputeYes: PDA.disputeYes(pollId32),
          disputeNo: PDA.disputeNo(pollId32),
          proposalReceipt: PDA.proposalReceipt(pollId32, participant),
          participant,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Joined dispute: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleSettlePoll = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("settlePoll");
    try {
      const program = getProgram(wallet);

      const pollId32 = toBytes32(pollData.pollId);
      const fandomId32 = toBytes32(pollData.fandomId);

      // NOTE:
      // platform_wallet must equal GlobalConfig.platform_wallet; we pass it by address constraint.
      const platformWallet = new PublicKey(globalConfig.platformWallet);
      const burnSink = SystemProgram.programId; // replace with your desired burn sink if needed

      // We don’t know subjects[0].char_slug here until program reads Poll,
      // but the account addresses must be correct.
      // If your settle requires the *first* subject slug, keep your poll scheme consistent.
      // For UX, you could add a dedicated "subject slug" input. For now, we’ll derive it from the poll on-chain.
      // However, Anchor requires explicit account addresses now, so we ask the user to *ensure* the first subject is the one they nudge.
      // Expose a quick field? If you want zero UI change, provide the slug in metadata and keep it consistent.

      // Minimal approach: ask for the same char slug as used in the poll’s first subject via `pollData.subjects`.
      let firstCharSlug = "";
      try {
        const subs = pollData.subjects ? JSON.parse(pollData.subjects) : [];
        // accept keys "char_slug" or "character"
        firstCharSlug = subs?.[0]?.char_slug ?? subs?.[0]?.character ?? "";
      } catch (_) {}

      if (!firstCharSlug) {
        return alert(
          'Settle requires the first subject\'s slug. Add it to Subjects JSON as `{ "char_slug": "..." }` (or `character`), first element.'
        );
      }

      const tx = await program.methods
        .settlePoll(pollId32, fandomId32)
        .accounts({
          poll: PDA.poll(fandomId32, pollId32),
          disputeYes: PDA.disputeYes(pollId32),
          disputeNo: PDA.disputeNo(pollId32),
          globalConfig: PDA.globalConfig(),
          globalTreasury: PDA.globalTreasury(),
          character: PDA.character(fandomId32, firstCharSlug),
          characterTreasury: PDA.charTreasury(fandomId32, firstCharSlug),
          characterPriceState: PDA.charPriceState(fandomId32, firstCharSlug),
          pollEscrow: PDA.pollEscrow(pollId32),
          platformWallet,
          burn: burnSink,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Poll settled: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleClaimReward = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("claimReward");
    try {
      const program = getProgram(wallet);
      const voter = wallet.publicKey;

      const pollId32 = toBytes32(pollData.pollId);
      const fandomId32 = toBytes32(pollData.fandomId);

      const tx = await program.methods
        .claimReward(pollId32, fandomId32)
        .accounts({
          voter,
          poll: PDA.poll(fandomId32, pollId32),
          pollEscrow: PDA.pollEscrow(pollId32),
          voteReceipt: PDA.voteReceipt(pollId32, voter),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Reward claimed: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  const handleClaimChallengeReward = async () => {
    if (!wallet) return alert("Connect wallet first");
    setLoading("claimChallenge");
    try {
      const program = getProgram(wallet);
      const staker = wallet.publicKey;

      const pollId32 = toBytes32(pollData.pollId);
      const fandomId32 = toBytes32(pollData.fandomId);

      const tx = await program.methods
        .claimChallengeReward(pollId32, fandomId32)
        .accounts({
          staker,
          poll: PDA.poll(fandomId32, pollId32),
          disputeYes: PDA.disputeYes(pollId32),
          disputeNo: PDA.disputeNo(pollId32),
          proposalReceipt: PDA.proposalReceipt(pollId32, staker),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Challenge reward claimed: ${tx}`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(null);
    }
  };

  // ---------------------------------------------
  // UI (your original, wired to real calls)
  // ---------------------------------------------
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Governance Control Panel
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
            disabled={loading === "global" || !wallet}
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
            disabled={loading === "fandom" || !wallet}
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
            disabled={loading === "character" || !wallet}
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
              disabled={loading === "buyStock" || !wallet}
              className="flex-1"
            >
              {loading === "buyStock" ? "Buying..." : "Buy Stock"}
            </Button>
            <Button
              onClick={handleSellStock}
              disabled={loading === "sellStock" || !wallet}
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
                placeholder='[{"char_slug":"character-1","direction_if_yes":1}]'
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
                placeholder="e.g., 1700000000"
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
                placeholder="e.g., 1700003600"
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
                placeholder="e.g., 1700007200"
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
              disabled={loading === "createPoll" || !wallet}
            >
              {loading === "createPoll" ? "Creating..." : "Create Poll"}
            </Button>
            <Button
              onClick={handleResolvePoll}
              disabled={loading === "resolvePoll" || !wallet}
              variant="outline"
            >
              {loading === "resolvePoll" ? "Resolving..." : "Resolve Poll"}
            </Button>
            <Button
              onClick={handleSettlePoll}
              disabled={loading === "settlePoll" || !wallet}
              variant="outline"
            >
              {loading === "settlePoll" ? "Settling..." : "Settle Poll"}
            </Button>
            <Button
              onClick={handleClaimReward}
              disabled={loading === "claimReward" || !wallet}
              variant="outline"
            >
              {loading === "claimReward" ? "Claiming..." : "Claim Voter Reward"}
            </Button>
            <Button
              onClick={handleClaimChallengeReward}
              disabled={loading === "claimChallenge" || !wallet}
              variant="outline"
            >
              {loading === "claimChallenge"
                ? "Claiming..."
                : "Claim Challenger Reward"}
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
              disabled={loading === "challengePoll" || !wallet}
              className="flex-1"
            >
              {loading === "challengePoll"
                ? "Challenging..."
                : "Challenge Poll"}
            </Button>
            <Button
              onClick={handleJoinDispute}
              disabled={loading === "joinDispute" || !wallet}
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
