import { Connection, PublicKey } from "@solana/web3.js";
import { prisma } from "./prismaClient.js";
import dotenv from "dotenv";
dotenv.config();
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);
const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
async function main() {
    const connection = new Connection(RPC_URL, "confirmed");
    console.log(`🛰 Listening to ${PROGRAM_ID.toBase58()}`);
    connection.onLogs(PROGRAM_ID, async (log, context) => {
        try {
            const slot = BigInt(context.slot);
            const signature = log.signature;
            const blockTime = new Date();
            for (const line of log.logs) {
                if (!line.startsWith("Program log:"))
                    continue;
                const content = line.replace("Program log: ", "").trim();
                if (!content.startsWith("{"))
                    continue;
                const event = JSON.parse(content);
                if (!event.event)
                    continue;
                console.log("📦", event.event);
                await routeEvent(event, signature, slot, blockTime);
            }
        }
        catch (e) {
            console.error("❌ parse error:", e);
        }
    });
}
async function routeEvent(e, signature, slot, blockTime) {
    const base = { signature, slot, blockTime };
    switch (e.event) {
        // ---------------------------
        // Global Config
        // ---------------------------
        case "GlobalConfigCreated":
            await prisma.globalConfigCreated.create({
                data: {
                    ...base,
                    admin: e.admin,
                    feeBps: e.fee_bps,
                    rBurn: e.r_burn,
                    rGlobal: e.r_global,
                    rChar: e.r_char,
                    k: e.k,
                    usdcMint: e.usdc_mint,
                    platformWallet: e.platform_wallet,
                    globalTreasury: e.global_treasury,
                    ts: BigInt(e.ts),
                },
            });
            break;
        // ---------------------------
        // Fandom
        // ---------------------------
        case "FandomCreated":
            await prisma.fandomCreated.create({
                data: {
                    ...base,
                    admin: e.admin,
                    fandomId: Buffer.from(e.fandom_id),
                    name: e.name,
                    ts: BigInt(e.ts),
                },
            });
            break;
        // ---------------------------
        // Character
        // ---------------------------
        case "CharacterCreated":
            await prisma.characterCreated.create({
                data: {
                    ...base,
                    fandomId: Buffer.from(e.fandom), // link to FandomCreated.fandomId
                    charSlug: e.char_slug,
                    stockMint: e.stock_mint,
                    supply: BigInt(e.supply),
                    treasuryVault: e.treasury_vault,
                    priceState: e.price_state,
                    lastPriceFp: BigInt(e.last_price_fp),
                    weekStartTs: BigInt(e.week_start_ts),
                    ts: BigInt(e.ts),
                },
            });
            break;
        // ---------------------------
        // Price Update
        // ---------------------------
        case "PriceUpdate":
            await prisma.priceUpdate.create({
                data: {
                    ...base,
                    character: e.character, // references CharacterCreated.charSlug
                    priceFp: BigInt(e.price_fp),
                    ts: BigInt(e.ts),
                },
            });
            break;
        // ---------------------------
        // Poll Created
        // ---------------------------
        case "PollCreated":
            await prisma.pollCreated.create({
                data: {
                    ...base,
                    pollId: Buffer.from(e.poll_id),
                    fandomId: Buffer.from(e.fandom_id), // link to FandomCreated
                    creator: e.creator,
                    startTs: BigInt(e.start_ts),
                    endTs: BigInt(e.end_ts),
                    challengeEndTs: BigInt(e.challenge_end_ts),
                    status: e.status,
                },
            });
            break;
        // ---------------------------
        // Vote Cast
        // ---------------------------
        case "VoteCast":
            await prisma.voteCast.create({
                data: {
                    ...base,
                    pollId: Buffer.from(e.poll_id), // link to PollCreated.pollId
                    voter: e.voter,
                    side: e.side,
                    stake: BigInt(e.stake),
                },
            });
            break;
        // ---------------------------
        // Poll Resolved
        // ---------------------------
        case "PollResolved":
            await prisma.pollResolved.create({
                data: {
                    ...base,
                    pollId: Buffer.from(e.poll_id),
                    outcome: e.outcome,
                },
            });
            break;
        // ---------------------------
        // Dispute Opened
        // ---------------------------
        case "DisputeOpened":
            await prisma.disputeOpened.create({
                data: {
                    ...base,
                    pollId: Buffer.from(e.poll_id),
                    side: e.side,
                    challenger: e.challenger,
                    stake: BigInt(e.stake),
                },
            });
            break;
        // ---------------------------
        // Poll Settled
        // ---------------------------
        case "PollSettled":
            await prisma.pollSettled.create({
                data: {
                    ...base,
                    pollId: Buffer.from(e.poll_id),
                    finalOutcome: e.final_outcome,
                    totalStake: BigInt(e.total_stake),
                    payoutPool: BigInt(e.payout_pool),
                },
            });
            break;
        // ---------------------------
        // Reward Claimed
        // ---------------------------
        case "RewardClaimed":
            await prisma.rewardClaimed.create({
                data: {
                    ...base,
                    pollId: Buffer.from(e.poll_id),
                    user: e.user,
                    amount: BigInt(e.amount),
                    challenge: e.challenge,
                },
            });
            break;
        // ---------------------------
        // Stock Bought
        // ---------------------------
        case "StockBought":
            await prisma.stockBought.create({
                data: {
                    ...base,
                    fandomId: Buffer.from(e.fandom_id),
                    character: e.character,
                    buyer: e.buyer,
                    lamportsIn: BigInt(e.lamports_in),
                    sharesOut: BigInt(e.shares_out),
                    priceFp: BigInt(e.price_fp),
                    newSupply: BigInt(e.new_supply),
                    ts: BigInt(e.ts),
                },
            });
            break;
        // ---------------------------
        // Stock Sold
        // ---------------------------
        case "StockSold":
            await prisma.stockSold.create({
                data: {
                    ...base,
                    fandomId: Buffer.from(e.fandom_id),
                    character: e.character,
                    seller: e.seller,
                    sharesIn: BigInt(e.shares_in),
                    lamportsOut: BigInt(e.lamports_out),
                    priceFp: BigInt(e.price_fp),
                    newSupply: BigInt(e.new_supply),
                    ts: BigInt(e.ts),
                },
            });
            break;
        // ---------------------------
        // Default
        // ---------------------------
        default:
            console.log("⚠️ Unhandled event:", e.event);
    }
}
main().catch(console.error);
//# sourceMappingURL=indexer.js.map