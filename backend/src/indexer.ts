import { Connection, PublicKey, Logs, Context } from "@solana/web3.js";
import { BorshCoder, EventParser, Idl } from "@coral-xyz/anchor";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./prismaClient.js";
import {
  normalizeBytes32,
  normalizeBytes32ToString,
} from "./lib/convertors.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROGRAM_ID = new PublicKey(
  "HCAdk3qPeYYYG1uYyrcG9fjTCSvmewJ8KdqWTvk7HSxR"
);

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";

// --- Load IDL for event parsing ---
const idlPath = path.resolve(
  __dirname,
  "../../governance/target/idl/governance.json"
);
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8")) as Idl;

const coder = new BorshCoder(idl);
const parser = new EventParser(PROGRAM_ID, coder);

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  console.log(`🛰 Listening to events from program ${PROGRAM_ID.toBase58()}`);

  connection.onLogs(PROGRAM_ID, async (log: Logs, context: Context) => {
    try {
      const slot = BigInt(context.slot);
      const signature = log.signature;
      const blockTime = new Date();

      const events = parser.parseLogs(log.logs);
      for (const ev of events) {
        console.log("📦 Parsed Event:", ev.name, ev.data);
        await handleEvent(
          { event: ev.name, data: ev.data },
          signature,
          slot,
          blockTime
        );
      }
    } catch (err) {
      console.error("❌ Error processing log:", err);
    }
  });
}

// ---------------------------
// 🧠 Event Router
// ---------------------------
async function handleEvent(
  event: { event: string; data: any },
  signature: string,
  slot: bigint,
  blockTime: Date
) {
  switch (event.event) {
    // 🧭 GlobalConfigCreated
    case "GlobalConfigCreated":
      await prisma.globalConfigCreated.upsert({
        where: { signature },
        update: {},
        create: {
          signature,
          slot,
          blockTime,
          admin: event.data.admin.toString(),
          feeBps: event.data.fee_bps,
          rBurn: event.data.r_burn,
          rGlobal: event.data.r_global,
          usdcMint: event.data.usdc_mint.toString(),
          platformWallet: event.data.platform_wallet.toString(),
          globalTreasury: event.data.global_treasury.toString(),
          ts: BigInt(event.data.ts),
        },
      });
      break;

    //   await prisma.pollCreated.upsert({
    //     where: { signature },
    //     update: {},
    //     create: {
    //       signature,
    //       slot,
    //       blockTime,
    //       pollId: Buffer.from(event.data.poll_id),
    //       creator: event.data.creator.toString(),
    //       startTs: BigInt(event.data.start_ts),
    //       endTs: BigInt(event.data.end_ts),
    //       challengeEndTs: BigInt(event.data.challenge_end_ts),
    //       status: event.data.status,
    //       fandomId: normalizeBytes32ToString(event.data.fandom_id),
    //     },
    //   });
    //   break;
    // 1️⃣ FandomCreated
    case "FandomCreated": {
      const fandomIdStr = normalizeBytes32ToString(event.data.fandom_id);
      console.log("=== FANDOM CREATED ===");
      console.log("Raw fandom_id:", event.data.fandom_id);
      console.log("Converted fandomId:", fandomIdStr);
      console.log("fandomId length:", fandomIdStr.length);
      console.log("fandomId hex:", Buffer.from(fandomIdStr).toString("hex"));

      await prisma.fandomCreated.upsert({
        where: { signature },
        update: {},
        create: {
          signature,
          slot,
          blockTime,
          admin: event.data.admin.toString(),
          fandomId: fandomIdStr,
          name: event.data.name,
          ts: BigInt(event.data.ts),
        },
      });

      // Verify it was saved
      const saved = await prisma.fandomCreated.findUnique({
        where: { fandomId: fandomIdStr },
      });
      console.log("Saved fandom:", saved?.fandomId);
      console.log("=====================\n");
      break;
    }

    // 2️⃣ PollCreated
    case "PollCreated": {
      const pollFandomIdStr = normalizeBytes32ToString(event.data.fandom_id);
      console.log("=== POLL CREATED ===");
      console.log("Raw fandom_id:", event.data.fandom_id);
      console.log("Converted fandomId:", pollFandomIdStr);
      console.log("fandomId length:", pollFandomIdStr.length);
      console.log(
        "fandomId hex:",
        Buffer.from(pollFandomIdStr).toString("hex")
      );

      // Check if fandom exists
      const fandomExists = await prisma.fandomCreated.findUnique({
        where: { fandomId: pollFandomIdStr },
      });
      console.log("Fandom exists?", fandomExists ? "YES" : "NO");

      if (!fandomExists) {
        console.error("❌ FANDOM NOT FOUND!");
        console.log("Looking for fandomId:", pollFandomIdStr);

        // List all fandoms
        const allFandoms = await prisma.fandomCreated.findMany();
        console.log(
          "All fandoms in DB:",
          allFandoms.map((f) => ({
            id: f.fandomId,
            hex: Buffer.from(f.fandomId).toString("hex"),
          }))
        );
      }

      await prisma.pollCreated.upsert({
        where: { signature },
        update: {},
        create: {
          signature,
          slot,
          blockTime,
          pollId: Buffer.from(event.data.poll_id),
          creator: event.data.creator.toString(),
          startTs: BigInt(event.data.start_ts),
          endTs: BigInt(event.data.end_ts),
          challengeEndTs: BigInt(event.data.challenge_end_ts),
          status: event.data.status,
          fandomId: pollFandomIdStr,
        },
      });
      console.log("==================\n");
      break;
    }
    // 3️⃣ VoteCast
    case "VoteCast": {
      const pollIdBuf = Buffer.from(event.data.poll);
      const side = event.data.side;
      const stake = BigInt(event.data.stake);

      // Upsert VoteCast record
      await prisma.voteCast.upsert({
        where: { signature },
        update: {},
        create: {
          signature,
          slot,
          blockTime,
          voter: event.data.voter.toString(),
          side,
          stake,
          pollId: pollIdBuf,
        },
      });

      // Update poll stake totals
      const poll = await prisma.pollCreated.findUnique({
        where: { pollId: pollIdBuf },
      });

      if (poll) {
        const newStakeYes =
          side === "Yes" ? (poll.stakeYes ?? 0n) + stake : poll.stakeYes ?? 0n;
        const newStakeNo =
          side === "No" ? (poll.stakeNo ?? 0n) + stake : poll.stakeNo ?? 0n;
        const newTotal = newStakeYes + newStakeNo;

        await prisma.pollCreated.update({
          where: { pollId: pollIdBuf },
          data: {
            stakeYes: newStakeYes,
            stakeNo: newStakeNo,
            totalStake: newTotal,
          },
        });
      }
      break;
    }

    // 4️⃣ PollResolved
    case "PollResolved":
      await prisma.pollResolved.upsert({
        where: { signature },
        update: {},
        create: {
          signature,
          slot,
          blockTime,
          outcome: event.data.outcome,
          pollId: Buffer.from(event.data.poll),
        },
      });
      break;

    // 5️⃣ PollSettled
    case "PollSettled":
      await prisma.pollSettled.upsert({
        where: { signature },
        update: {},
        create: {
          signature,
          slot,
          blockTime,
          finalOutcome: event.data.finalOutcome,
          totalStake: BigInt(event.data.totalStake),
          payoutPool: BigInt(event.data.payoutPool),
          pollId: Buffer.from(event.data.poll),
        },
      });
      break;

    // 6️⃣ RewardClaimed
    case "RewardClaimed":
      await prisma.rewardClaimed.upsert({
        where: { signature },
        update: {},
        create: {
          signature,
          slot,
          blockTime,
          user: event.data.user.toString(),
          amount: BigInt(event.data.amount),
          challenge: event.data.challenge,
          pollId: Buffer.from(event.data.poll),
        },
      });
      break;

    // 7️⃣ DisputeOpened
    case "DisputeOpened":
      await prisma.disputeOpened.upsert({
        where: { signature },
        update: {},
        create: {
          signature,
          slot,
          blockTime,
          pollId: Buffer.from(event.data.poll),
          side: event.data.side,
          challenger: event.data.challenger.toString(),
          stake: BigInt(event.data.stake),
        },
      });
      break;

    // 8️⃣ ProposalCreated
    case "Proposal":
      await prisma.proposal.upsert({
        where: { signature },
        update: {},
        create: {
          signature,
          slot,
          blockTime,
          pollId: Buffer.from(event.data.poll),
          side: event.data.side,
          totalStake: BigInt(event.data.totalStake),
          totalParticipants: BigInt(event.data.totalParticipants),
        },
      });
      break;

    // 9️⃣ ProposalReceipt
    case "ProposalReceipt":
      await prisma.proposalReceipt.upsert({
        where: {
          signature:
            signature || `${event.data.staker.toString()}-${event.data.poll}`,
        },
        update: {},
        create: {
          signature,
          slot,
          blockTime,
          pollId: Buffer.from(event.data.poll),
          side: event.data.side,
          staker: event.data.staker.toString(),
          amountStaked: BigInt(event.data.amountStaked),
          claimed: event.data.claimed,
        },
      });
      break;

    default:
      console.log("⚠️ Unhandled event type:", event.event);
  }
}

main().catch((err) => {
  console.error("Fatal indexer error:", err);
});
