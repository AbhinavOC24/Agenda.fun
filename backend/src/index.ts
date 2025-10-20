import express from "express";
import cors from "cors";
import { prisma } from "./prismaClient.js";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ health route
app.get("/", (_, res) =>
  res.json({ status: "ok", service: "Agenda.fun Indexer API" })
);

// ✅ latest global config
app.get("/global", async (_, res) => {
  const config = await prisma.globalConfigCreated.findFirst({
    orderBy: { createdAt: "desc" },
  });
  res.json(config ?? {});
});

// ✅ list all fandoms
app.get("/fandoms", async (_, res) => {
  const fandoms = await prisma.fandomCreated.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      characters: true,
      polls: true,
    },
  });
  res.json(fandoms);
});

// ✅ characters by fandomId (hex)
app.get("/fandoms/:fandomId/characters", async (req, res) => {
  try {
    const { fandomId } = req.params;
    const chars = await prisma.characterCreated.findMany({
      where: { fandomId: Buffer.from(fandomId, "hex") },
      orderBy: { createdAt: "desc" },
    });
    res.json(chars);
  } catch (err) {
    res.status(400).json({ error: "Invalid fandomId format" });
  }
});

// ✅ all polls (optionally include related data)
app.get("/polls", async (_, res) => {
  const polls = await prisma.pollCreated.findMany({
    orderBy: { createdAt: "desc" },
    include: { fandom: true },
  });
  res.json(polls);
});

// ✅ single poll with its sub-events
app.get("/polls/:pollId", async (req, res) => {
  try {
    const { pollId } = req.params;
    const pollBuffer = Buffer.from(pollId, "hex");

    const poll = await prisma.pollCreated.findFirst({
      where: { pollId: pollBuffer },
      include: { fandom: true },
    });

    if (!poll) return res.status(404).json({ error: "Poll not found" });

    const [votes, resolved, settled, disputes, rewards] = await Promise.all([
      prisma.voteCast.findMany({ where: { pollId: pollBuffer } }),
      prisma.pollResolved.findMany({ where: { pollId: pollBuffer } }),
      prisma.pollSettled.findMany({ where: { pollId: pollBuffer } }),
      prisma.disputeOpened.findMany({ where: { pollId: pollBuffer } }),
      prisma.rewardClaimed.findMany({ where: { pollId: pollBuffer } }),
    ]);

    res.json({ poll, votes, resolved, settled, disputes, rewards });
  } catch (err) {
    res.status(400).json({ error: "Invalid pollId format" });
  }
});

// ✅ recent trades (stocks bought/sold)
app.get("/stocks", async (_, res) => {
  const [buys, sells] = await Promise.all([
    prisma.stockBought.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.stockSold.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  res.json({ buys, sells });
});

// ✅ price history by character slug
app.get("/price/:charSlug", async (req, res) => {
  const { charSlug } = req.params;
  const updates = await prisma.priceUpdate.findMany({
    where: { character: charSlug },
    orderBy: { createdAt: "desc" },
  });
  res.json(updates);
});

// ✅ fallback
app.use((_, res) => res.status(404).json({ error: "not found" }));

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () =>
  console.log(`🚀 API running on http://localhost:${PORT}`)
);
