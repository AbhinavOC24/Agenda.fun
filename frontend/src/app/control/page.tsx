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

// Mock function to simulate smart contract calls
const mockContractCall = async (functionName: string, params: any) => {
  console.log(`Calling ${functionName} with params:`, params);
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { success: true, txHash: `mock_tx_${Date.now()}` };
};

export default function Control() {
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

  const [loading, setLoading] = useState<string | null>(null);

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
      await mockContractCall("init_global", params);
      alert("Global config initialized successfully!");
    } catch (error) {
      alert("Error initializing global config");
    } finally {
      setLoading(null);
    }
  };

  const handleCreateFandom = async () => {
    setLoading("fandom");
    try {
      const fandomIdBytes = new Uint8Array(32);
      fandomIdBytes.set(
        new TextEncoder().encode(fandomData.fandomId.padEnd(32, "\0"))
      );

      const params = {
        fandom_id: Array.from(fandomIdBytes),
        name: fandomData.name,
      };
      await mockContractCall("create_fandom", params);
      alert("Fandom created successfully!");
    } catch (error) {
      alert("Error creating fandom");
    } finally {
      setLoading(null);
    }
  };

  const handleCreateCharacter = async () => {
    setLoading("character");
    try {
      const fandomIdBytes = new Uint8Array(32);
      fandomIdBytes.set(
        new TextEncoder().encode(characterData.fandomId.padEnd(32, "\0"))
      );

      const params = {
        fandom_id: Array.from(fandomIdBytes),
        char_slug: characterData.charSlug,
        supply: parseInt(characterData.supply),
      };
      await mockContractCall("create_character", params);
      alert("Character created successfully!");
    } catch (error) {
      alert("Error creating character");
    } finally {
      setLoading(null);
    }
  };

  const handleBuyStock = async () => {
    setLoading("buyStock");
    try {
      const fandomIdBytes = new Uint8Array(32);
      fandomIdBytes.set(
        new TextEncoder().encode(stockData.fandomId.padEnd(32, "\0"))
      );

      const params = {
        fandom_id: Array.from(fandomIdBytes),
        char_slug: stockData.charSlug,
        lamports_in: parseInt(stockData.lamportsIn),
        min_shares_out: parseInt(stockData.minSharesOut),
      };
      await mockContractCall("buy_stock", params);
      alert("Stock bought successfully!");
    } catch (error) {
      alert("Error buying stock");
    } finally {
      setLoading(null);
    }
  };

  const handleSellStock = async () => {
    setLoading("sellStock");
    try {
      const fandomIdBytes = new Uint8Array(32);
      fandomIdBytes.set(
        new TextEncoder().encode(stockData.fandomId.padEnd(32, "\0"))
      );

      const params = {
        shares_in: parseInt(stockData.sharesIn),
        fandom_id: Array.from(fandomIdBytes),
        char_slug: stockData.charSlug,
      };
      await mockContractCall("sell_stock", params);
      alert("Stock sold successfully!");
    } catch (error) {
      alert("Error selling stock");
    } finally {
      setLoading(null);
    }
  };

  const handleCreatePoll = async () => {
    setLoading("createPoll");
    try {
      const pollIdBytes = new Uint8Array(32);
      pollIdBytes.set(
        new TextEncoder().encode(pollData.pollId.padEnd(32, "\0"))
      );

      const fandomIdBytes = new Uint8Array(32);
      fandomIdBytes.set(
        new TextEncoder().encode(pollData.fandomId.padEnd(32, "\0"))
      );

      const metadataHashBytes = new Uint8Array(32);
      metadataHashBytes.set(
        new TextEncoder().encode(pollData.metadataHash.padEnd(32, "\0"))
      );

      const params = {
        poll_id: Array.from(pollIdBytes),
        fandom_id: Array.from(fandomIdBytes),
        subjects: JSON.parse(pollData.subjects || "[]"),
        start_ts: parseInt(pollData.startTs),
        end_ts: parseInt(pollData.endTs),
        challenge_end_ts: parseInt(pollData.challengeEndTs),
        metadata_hash: Array.from(metadataHashBytes),
        lambda_fp: parseInt(pollData.lambdaFp),
        k_override: pollData.kOverride ? parseInt(pollData.kOverride) : null,
      };
      await mockContractCall("create_poll", params);
      alert("Poll created successfully!");
    } catch (error) {
      alert("Error creating poll");
    } finally {
      setLoading(null);
    }
  };

  const handleResolvePoll = async () => {
    setLoading("resolvePoll");
    try {
      const pollIdBytes = new Uint8Array(32);
      pollIdBytes.set(
        new TextEncoder().encode(pollData.pollId.padEnd(32, "\0"))
      );

      const fandomIdBytes = new Uint8Array(32);
      fandomIdBytes.set(
        new TextEncoder().encode(pollData.fandomId.padEnd(32, "\0"))
      );

      const params = {
        poll_id: Array.from(pollIdBytes),
        fandom_id: Array.from(fandomIdBytes),
      };
      await mockContractCall("resolve_poll_auto", params);
      alert("Poll resolved successfully!");
    } catch (error) {
      alert("Error resolving poll");
    } finally {
      setLoading(null);
    }
  };

  const handleChallengePoll = async () => {
    setLoading("challengePoll");
    try {
      const pollIdBytes = new Uint8Array(32);
      pollIdBytes.set(
        new TextEncoder().encode(disputeData.pollId.padEnd(32, "\0"))
      );

      const fandomIdBytes = new Uint8Array(32);
      fandomIdBytes.set(
        new TextEncoder().encode(disputeData.fandomId.padEnd(32, "\0"))
      );

      const params = {
        poll_id: Array.from(pollIdBytes),
        fandom_id: Array.from(fandomIdBytes),
        side: disputeData.side,
        stake_lamports: parseInt(disputeData.stakeLamports),
      };
      await mockContractCall("challenge_poll", params);
      alert("Poll challenged successfully!");
    } catch (error) {
      alert("Error challenging poll");
    } finally {
      setLoading(null);
    }
  };

  const handleJoinDispute = async () => {
    setLoading("joinDispute");
    try {
      const params = {
        side: disputeData.side,
        stake_lamports: parseInt(disputeData.stakeLamports),
      };
      await mockContractCall("join_dispute", params);
      alert("Joined dispute successfully!");
    } catch (error) {
      alert("Error joining dispute");
    } finally {
      setLoading(null);
    }
  };

  const handleSettlePoll = async () => {
    setLoading("settlePoll");
    try {
      const pollIdBytes = new Uint8Array(32);
      pollIdBytes.set(
        new TextEncoder().encode(pollData.pollId.padEnd(32, "\0"))
      );

      const fandomIdBytes = new Uint8Array(32);
      fandomIdBytes.set(
        new TextEncoder().encode(pollData.fandomId.padEnd(32, "\0"))
      );

      const params = {
        poll_id: Array.from(pollIdBytes),
        fandom_id: Array.from(fandomIdBytes),
      };
      await mockContractCall("settle_poll", params);
      alert("Poll settled successfully!");
    } catch (error) {
      alert("Error settling poll");
    } finally {
      setLoading(null);
    }
  };

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
                placeholder='[{"direction_if_yes": 1, "character": "character-1"}]'
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
