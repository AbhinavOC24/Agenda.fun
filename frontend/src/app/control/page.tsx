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

import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, setProvider, BN } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import type { Governance } from "../../../../governance/target/types/governance";
import idl from "../../../../governance/target/idl/governance.json";

const PROGRAM_ID = new PublicKey(
  "HCAdk3qPeYYYG1uYyrcG9fjTCSvmewJ8KdqWTvk7HSxR"
);

const stringToBytes32 = (str: string): number[] => {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.slice(0, 32));
  return Array.from(bytes);
};

export default function Control() {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();

  const [loading, setLoading] = useState<string | null>(null);

  const [globalConfig, setGlobalConfig] = useState({
    feeBps: "",
    rGlobal: "",
    rBurn: "",
    usdcMint: "",
    platformWallet: "",
  });

  const [fandomData, setFandomData] = useState({ fandomId: "", name: "" });

  const [pollData, setPollData] = useState({
    pollId: "",
    fandomId: "",
    startTs: "",
    endTs: "",
    challengeEndTs: "",
    metadataHash: "",
    lambdaFp: "",
    kOverride: "",
  });

  const handle = async (fn: string) => {
    if (!wallet) {
      alert("❌ Wallet not connected");
      return;
    }

    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
    });
    setProvider(provider);
    const program = new Program(idl as Governance, provider);

    const admin = wallet.publicKey;

    try {
      setLoading(fn);

      switch (fn) {
        // ------------------------------------
        case "init_global": {
          // 👂 Set up event listener BEFORE sending transaction
          const listenerPromise = new Promise((resolve) => {
            const listenerId = program.addEventListener(
              "globalConfigCreated",
              (event, slot) => {
                console.log("🎉 Event received:", event);
                console.log("Slot:", slot);
                console.log("Admin:", event.admin.toString());
                console.log("Fee BPS:", event.feeBps);
                console.log("R Global:", event.rGlobal);
                console.log("R Burn:", event.rBurn);
                console.log("USDC Mint:", event.usdcMint.toString());
                console.log(
                  "Platform Wallet:",
                  event.platformWallet.toString()
                );
                console.log(
                  "Global Treasury:",
                  event.globalTreasury.toString()
                );
                console.log("Timestamp:", event.ts.toString());

                // Resolve promise and remove listener
                program.removeEventListener(listenerId);
                resolve(event);
              }
            );
          });

          // derive PDAs
          const [globalConfigPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("global_config")],
            PROGRAM_ID
          );
          const [globalTreasuryPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("global_treasury")],
            PROGRAM_ID
          );

          // Build the instruction
          const ix = await program.methods
            .initGlobal(
              parseInt(globalConfig.feeBps),
              parseInt(globalConfig.rGlobal),
              parseInt(globalConfig.rBurn),
              new PublicKey(globalConfig.usdcMint),
              new PublicKey(globalConfig.platformWallet)
            )
            .accountsStrict({
              globalConfig: globalConfigPda,
              globalTreasury: globalTreasuryPda,
              admin,
              systemProgram: SystemProgram.programId,
            })
            .instruction();

          // Get recent blockhash
          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash("confirmed");

          // Create versioned transaction
          const messageV0 = new TransactionMessage({
            payerKey: admin,
            recentBlockhash: blockhash,
            instructions: [ix],
          }).compileToV0Message();

          const transaction = new VersionedTransaction(messageV0);

          // Send transaction
          const signature = await sendTransaction(transaction, connection);
          console.log("📝 Transaction signature:", signature);

          // Confirm transaction
          const confirmation = await connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            "confirmed"
          );

          // Wait for event (with timeout)
          const eventTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Event timeout")), 10000)
          );

          try {
            const event = await Promise.race([listenerPromise, eventTimeout]);
            console.log("Event captured:", event);
          } catch (err) {
            console.warn("Event may not have been captured:", err);
          }

          alert(`✅ init_global executed! Signature: ${signature}`);
          break;
        }
        // ------------------------------------
        case "create_fandom": {
          // 👂 Set up event listener BEFORE sending transaction
          const fandomListenerPromise = new Promise((resolve) => {
            const listenerId = program.addEventListener(
              "fandomCreated",
              (event, slot) => {
                console.log("🎉 Fandom Created Event:", event);
                console.log("Slot:", slot);
                console.log("Admin:", event.admin.toString());
                console.log("Fandom ID:", event.fandomId);
                console.log("Name:", event.name);
                console.log("Timestamp:", event.ts.toString());

                program.removeEventListener(listenerId);
                resolve(event);
              }
            );
          });

          const fandomIx = await program.methods
            .createFandom(stringToBytes32(fandomData.fandomId), fandomData.name)
            .accounts({
              fandom: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("fandom"),
                  Uint8Array.from(stringToBytes32(fandomData.fandomId)),
                ],
                PROGRAM_ID
              )[0],
              globalConfig: PublicKey.findProgramAddressSync(
                [Buffer.from("global_config")],
                PROGRAM_ID
              )[0],
              admin,
              systemProgram: SystemProgram.programId,
            })
            .instruction();
          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash("confirmed");

          const fandommessageV0 = new TransactionMessage({
            payerKey: admin,
            recentBlockhash: blockhash,
            instructions: [fandomIx],
          }).compileToV0Message();
          const transaction = new VersionedTransaction(fandommessageV0);
          const signature = await sendTransaction(transaction, connection);
          console.log("📝 Transaction signature:", signature);
          // Confirm transaction
          const confirmation = await connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            "confirmed"
          );

          // Wait for event
          const fandomEventTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Event timeout")), 10000)
          );

          try {
            const event = await Promise.race([
              fandomListenerPromise,
              fandomEventTimeout,
            ]);
            console.log("Fandom event captured:", event);
          } catch (err) {
            console.warn("Fandom event may not have been captured:", err);
          }

          break;
        }

        // ------------------------------------
        case "create_poll": {
          // 👂 Set up event listener BEFORE sending transaction
          const pollListenerPromise = new Promise((resolve) => {
            const listenerId = program.addEventListener(
              "pollCreated",
              (event, slot) => {
                console.log("🎉 Poll Created Event:", event);
                console.log("Slot:", slot);
                console.log("Poll ID:", event.pollId);
                console.log("Fandom ID:", event.fandomId);
                console.log("Creator:", event.creator.toString());
                console.log("Start TS:", event.startTs.toString());
                console.log("End TS:", event.endTs.toString());
                console.log(
                  "Challenge End TS:",
                  event.challengeEndTs.toString()
                );
                console.log("Status:", event.status);

                program.removeEventListener(listenerId);
                resolve(event);
              }
            );
          });

          const pollIx = await program.methods
            .createPoll(
              stringToBytes32(pollData.pollId),
              stringToBytes32(pollData.fandomId),
              new BN(parseInt(pollData.startTs)),
              new BN(parseInt(pollData.endTs)),
              new BN(parseInt(pollData.challengeEndTs)),
              stringToBytes32(pollData.metadataHash),
              parseInt(pollData.lambdaFp),
              pollData.kOverride ? parseInt(pollData.kOverride) : null
            )
            .accounts({
              admin,
              globalConfig: PublicKey.findProgramAddressSync(
                [Buffer.from("global_config")],
                PROGRAM_ID
              )[0],
              fandom: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("fandom"),
                  Uint8Array.from(stringToBytes32(pollData.fandomId)),
                ],
                PROGRAM_ID
              )[0],
              poll: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("poll"),
                  Uint8Array.from(stringToBytes32(pollData.fandomId)),
                  Uint8Array.from(stringToBytes32(pollData.pollId)),
                ],
                PROGRAM_ID
              )[0],
              pollEscrow: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("poll_escrow"),
                  Uint8Array.from(stringToBytes32(pollData.pollId)),
                ],
                PROGRAM_ID
              )[0],
              systemProgram: SystemProgram.programId,
            })
            .instruction();
          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash("confirmed");

          const pollmessageV0 = new TransactionMessage({
            payerKey: admin,
            recentBlockhash: blockhash,
            instructions: [pollIx],
          }).compileToV0Message();
          const transaction = new VersionedTransaction(pollmessageV0);
          const signature = await sendTransaction(transaction, connection);
          console.log("📝 Transaction signature:", signature);
          // Confirm transaction
          const confirmation = await connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            "confirmed"
          );

          // Wait for event
          const pollEventTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Event timeout")), 10000)
          );

          try {
            const event = await Promise.race([
              pollListenerPromise,
              pollEventTimeout,
            ]);
            console.log("Poll event captured:", event);
          } catch (err) {
            console.warn("Poll event may not have been captured:", err);
          }

          break;
        }

        default:
          alert("Unknown function call");
      }

      console.log("✅ Transaction completed");
      // Alert is now handled inside each case with signature info
    } catch (err) {
      console.error("Error:", err);
      alert("❌ " + (err as Error));
    } finally {
      setLoading(null);
    }
  };

  if (!wallet)
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-8">Governance Control Panel</h1>
        <p className="text-lg text-muted-foreground">
          Please connect your wallet.
        </p>
      </div>
    );

  // --- UI ---
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Governance Control Panel
      </h1>

      {/* GLOBAL CONFIG */}
      <Card>
        <CardHeader>
          <CardTitle>Global Configuration</CardTitle>
          <CardDescription>
            Initialize platform-wide parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["feeBps", "rGlobal", "rBurn", "usdcMint", "platformWallet"].map(
            (key) => (
              <div key={key}>
                <Label>{key}</Label>
                <Input
                  value={globalConfig[key as keyof typeof globalConfig]}
                  onChange={(e) =>
                    setGlobalConfig({
                      ...globalConfig,
                      [key]: e.target.value,
                    })
                  }
                />
              </div>
            )
          )}
          <Button
            onClick={() => handle("init_global")}
            disabled={loading === "init_global"}
            className="col-span-2"
          >
            {loading === "init_global"
              ? "Initializing..."
              : "Initialize Global"}
          </Button>
        </CardContent>
      </Card>

      {/* FANDOM */}
      <Card>
        <CardHeader>
          <CardTitle>Create Fandom</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Fandom ID (string)"
            value={fandomData.fandomId}
            onChange={(e) =>
              setFandomData({ ...fandomData, fandomId: e.target.value })
            }
          />
          <Input
            placeholder="Fandom Name"
            value={fandomData.name}
            onChange={(e) =>
              setFandomData({ ...fandomData, name: e.target.value })
            }
          />
          <Button
            onClick={() => handle("create_fandom")}
            disabled={loading === "create_fandom"}
          >
            {loading === "create_fandom" ? "Creating..." : "Create Fandom"}
          </Button>
        </CardContent>
      </Card>

      {/* POLL */}
      <Card>
        <CardHeader>
          <CardTitle>Create Poll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.keys(pollData).map((key) => (
            <Input
              key={key}
              placeholder={key}
              value={pollData[key as keyof typeof pollData]}
              onChange={(e) =>
                setPollData({ ...pollData, [key]: e.target.value })
              }
            />
          ))}
          <Button
            onClick={() => handle("create_poll")}
            disabled={loading === "create_poll"}
            className="w-full"
          >
            {loading === "create_poll" ? "Creating..." : "Create Poll"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
