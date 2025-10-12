//@ts-ignore
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Governance } from "../target/types/governance";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import assert from "assert";
import { getAccount, getMint } from "@solana/spl-token";

describe("governance", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Governance as Program<Governance>;

  const name = "One Piece";
  const charSlug = "zoro";
  const supply = new anchor.BN(1000);

  const pollId = new Uint8Array(32).fill(2);

  const usdcMint = anchor.web3.Keypair.generate().publicKey;

  const platformWallet = provider.wallet.publicKey;

  const fandomId = new Uint8Array(32).fill(1);

  const [globalConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("global_config")],
    program.programId
  );

  const [globalTreasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("global_treasury")],
    program.programId
  );

  const [fandomPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("fandom"), Buffer.from(fandomId)],
    program.programId
  );

  const [characterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("character"), Buffer.from(fandomId), Buffer.from(charSlug)],
    program.programId
  );

  const [characterTreasuryPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("char_treasury"),
      Buffer.from(fandomId),
      Buffer.from(charSlug),
    ],
    program.programId
  );
  const [characterPriceStatePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("char_price_state"),
      Buffer.from(fandomId),
      Buffer.from(charSlug),
    ],
    program.programId
  );
  const [stockMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("stock_mint"), Buffer.from(fandomId), Buffer.from(charSlug)],
    program.programId
  );
  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), Buffer.from(fandomId), Buffer.from(pollId)],
    program.programId
  );

  const [pollEscrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll_escrow"), Buffer.from(pollId)],
    program.programId
  );

  const [disputeYesPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("dispute_yes"), Buffer.from(pollId)],
    program.programId
  );

  const [disputeNoPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("dispute_no"), Buffer.from(pollId)],
    program.programId
  );

  it("init global_config PDA", async () => {
    // Derive both PDAs — must match the seeds used in your Rust program

    await program.methods
      .initGlobal(
        100, // fee_bps
        1000, // r_burn
        2000, // r_global
        7000, // r_char
        1_000_000, // k
        usdcMint,
        platformWallet
      )
      .accountsPartial({
        globalConfig: globalConfigPda,
        globalTreasury: globalTreasuryPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const cfg = await program.account.globalConfig.fetch(globalConfigPda);
    assert.strictEqual(
      cfg.admin.toBase58(),
      provider.wallet.publicKey.toBase58()
    );
    assert.strictEqual(cfg.feeBps, 100);
    assert.strictEqual(cfg.rBurn, 1000);
    assert.strictEqual(cfg.rGlobal, 2000);
    assert.strictEqual(cfg.rChar, 7000);
    assert.strictEqual(cfg.k, 1_000_000);
    assert.strictEqual(cfg.usdcMint.toBase58(), usdcMint.toBase58());
    assert.strictEqual(
      cfg.platformWallet.toBase58(),
      platformWallet.toBase58()
    );
    assert.strictEqual(
      cfg.globalTreasury.toBase58(),
      globalTreasuryPda.toBase58()
    );
  });

  it("create fandom PDA", async () => {
    await program.methods
      .createFandom([...fandomId], name)
      .accounts({
        fandom: fandomPda,
        globalConfig: globalConfigPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const fandom = await program.account.fandom.fetch(fandomPda);
    assert.strictEqual(
      fandom.admin.toBase58(),
      provider.wallet.publicKey.toBase58()
    );
    assert.deepStrictEqual([...fandom.fandomId], [...fandomId]);
    assert.strictEqual(fandom.name, name);
  });

  it("creates a character PDA under the fandom", async () => {
    await program.methods
      .createCharacter([...fandomId], charSlug, supply)
      .accounts({
        fandom: fandomPda,
        character: characterPda,
        characterTreasury: characterTreasuryPda,
        characterPriceState: characterPriceStatePda,
        stockMint: stockMintPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const char = await program.account.character.fetch(characterPda);

    assert.strictEqual(char.fandom.toBase58(), fandomPda.toBase58());
    assert.strictEqual(char.charSlug, charSlug);
    assert.strictEqual(char.supply.toString(), supply.toString());
  });

  it("buys and sells character stock successfully", async () => {
    const lamportsIn = new anchor.BN(1_000_000_000);
    const minSharesOut = new anchor.BN(1);

    const beforeTreasuryLamports = await provider.connection.getBalance(
      characterTreasuryPda
    );
    const buySig = await program.methods
      .buyStock([...fandomId], charSlug, lamportsIn, minSharesOut)
      .accounts({
        buyer: provider.wallet.publicKey,
        // @ts-ignore
        fandom: fandomPda,
        character: characterPda,
        characterTreasury: characterTreasuryPda,
        characterPriceState: characterPriceStatePda,
        stockMint: stockMintPda,
        buyerAta: await anchor.utils.token.associatedAddress({
          mint: stockMintPda,
          owner: provider.wallet.publicKey,
        }),
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const afterTreasuryLamports = await provider.connection.getBalance(
      characterTreasuryPda
    );
    const buyerAtaAcc = await getAccount(
      provider.connection,
      await anchor.utils.token.associatedAddress({
        mint: stockMintPda,
        owner: provider.wallet.publicKey,
      })
    );

    assert.ok(
      afterTreasuryLamports > beforeTreasuryLamports,
      "treasury should increase after buy"
    );
    assert.ok(
      Number(buyerAtaAcc.amount) > 0,
      "buyer should receive minted shares"
    );

    const sharesToSell = new anchor.BN(Number(buyerAtaAcc.amount));

    const sellSig = await program.methods
      .sellStock(sharesToSell, [...fandomId], charSlug)
      .accounts({
        seller: provider.wallet.publicKey,
        // @ts-ignore
        character: characterPda,
        characterTreasury: characterTreasuryPda,
        priceState: characterPriceStatePda,
        stockMint: stockMintPda,
        sellerAta: await anchor.utils.token.associatedAddress({
          mint: stockMintPda,
          owner: provider.wallet.publicKey,
        }),
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const treasuryAfterSell = await provider.connection.getBalance(
      characterTreasuryPda
    );
    const sellerAtaAfter = await getAccount(
      provider.connection,
      await anchor.utils.token.associatedAddress({
        mint: stockMintPda,
        owner: provider.wallet.publicKey,
      })
    );

    assert.ok(
      treasuryAfterSell < afterTreasuryLamports,
      "treasury should decrease after sell"
    );
    assert.strictEqual(
      Number(sellerAtaAfter.amount),
      0,
      "seller ATA should be burned to 0"
    );
  });

  it("creates a poll", async () => {
    const metadata = {
      title: "Will Zoro defeat King in the next arc?",
      rules: "Resolves YES if Zoro defeats King before chapter 1100.",
      category: "One Piece - Wano",
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(metadata));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const metadataHash = new Uint8Array(hashBuffer);

    const subjects = [
      {
        charSlug: charSlug,
        directionIfYes: 1,
      },
    ];

    const now = Math.floor(Date.now() / 1000);

    await program.methods
      .createPoll(
        [...pollId],
        [...fandomId],
        subjects,
        new anchor.BN(now),
        new anchor.BN(now + 4),
        new anchor.BN(now + 5),
        [...metadataHash],
        1_000_000,
        null
      )
      .accounts({
        admin: provider.wallet.publicKey,
        globalConfig: globalConfigPda,
        fandom: fandomPda,
        poll: pollPda,
        pollEscrow: pollEscrowPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const poll = await program.account.poll.fetch(pollPda);

    assert.strictEqual(poll.fandom.toBase58(), fandomPda.toBase58());
    assert.ok(poll.status.open);
    assert.deepStrictEqual(
      poll.metadataHash,
      [...metadataHash],
      "metadata hash should match off-chain JSON"
    );
  });

  it("vote on an open poll", async () => {
    const voter = provider.wallet.publicKey;
    const stakeLamports = new anchor.BN(1_000_000_000);
    const side = { no: {} };

    const [voteReceiptPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), Buffer.from(pollId), voter.toBuffer()],
      program.programId
    );

    const beforeVoterLamports = await provider.connection.getBalance(voter);

    const beforeEscrowLamports = await provider.connection.getBalance(
      pollEscrowPda
    );

    const sig = await program.methods
      .vote([...pollId], [...fandomId], side, stakeLamports)
      .accounts({
        voter,
        // @ts-ignore

        poll: pollPda,
        pollEscrow: pollEscrowPda,
        voteReceipt: voteReceiptPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const poll = await program.account.poll.fetch(pollPda);

    const receipt = await program.account.voteReceipt.fetch(voteReceiptPda);

    const afterVoterLamports = await provider.connection.getBalance(voter);

    const afterEscrowLamports = await provider.connection.getBalance(
      pollEscrowPda
    );

    assert.ok(
      afterEscrowLamports > beforeEscrowLamports,
      "escrow should increase"
    );
    assert.ok(
      afterVoterLamports < beforeVoterLamports,
      "voter should pay stake"
    );
    assert.strictEqual(receipt.voter.toBase58(), voter.toBase58());
    assert.strictEqual(receipt.poll.toBase58(), pollPda.toBase58());
    assert.strictEqual(receipt.claimed, false);
    assert.strictEqual(
      receipt.amountStaked.toString(),
      stakeLamports.toString()
    );
    assert.ok(
      poll.totalStake.gt(new anchor.BN(0)),
      "poll total stake should increase"
    );
  });

  it("resolves the poll automatically", async () => {
    await program.methods
      .resolvePollAuto([...pollId], [...fandomId])
      .accounts({
        anyone: provider.wallet.publicKey,
        // @ts-ignore

        poll: pollPda,
      })
      .rpc();

    const poll = await program.account.poll.fetch(pollPda);

    assert.ok(
      poll.status.challengeWindow,
      "poll should enter challenge window"
    );
  });

  it("challenges the poll ", async () => {
    const challenger = provider.wallet.publicKey;
    const stakeLamports = new anchor.BN(1_000_000_000);
    const side = { yes: {} };

    const [proposalReceiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal_receipt"),
        Buffer.from(pollId),
        challenger.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .challengePoll([...pollId], [...fandomId], side, stakeLamports)
      .accounts({
        // @ts-ignore

        poll: pollPda,
        challenger,
        disputeYes: disputeYesPda,
        disputeNo: disputeNoPda,
        proposalReceipt: proposalReceiptPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const poll = await program.account.poll.fetch(pollPda);
    assert.ok(poll.status.disputed, "poll should now be Disputed");
    assert.strictEqual(
      poll.lockedDisputeAmount.toNumber(),
      stakeLamports.toNumber()
    );
  });

  it("allows another user to join the dispute", async () => {
    const participant = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        participant.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    const stakeLamports = new anchor.BN(1_000_000_000);
    const side = { yes: {} };

    const [proposalReceiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal_receipt"),
        Buffer.from(pollId),
        participant.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .joinDispute(side, stakeLamports)
      .accounts({
        poll: pollPda,
        // @ts-ignore

        fandom: fandomPda,
        disputeYes: disputeYesPda,
        disputeNo: disputeNoPda,
        proposalReceipt: proposalReceiptPda,
        participant: participant.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    const proposal = await program.account.proposal.fetch(disputeYesPda);
    // @ts-ignore

    assert.ok(proposal.totalStake > 0, "dispute vault should hold stake");
  });

  it("settles the poll after challenge window passes", async () => {
    const [burnSink] = PublicKey.findProgramAddressSync(
      [Buffer.from("burn")],
      program.programId
    );

    await program.methods
      .settlePoll([...pollId], [...fandomId])
      .accounts({
        // @ts-ignore

        poll: pollPda,
        disputeYes: disputeYesPda,
        disputeNo: disputeNoPda,
        globalConfig: globalConfigPda,
        globalTreasury: globalTreasuryPda,
        character: characterPda,
        characterTreasury: characterTreasuryPda,
        characterPriceState: characterPriceStatePda,
        pollEscrow: pollEscrowPda,
        platformWallet: platformWallet,
        burn: burnSink,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const poll = await program.account.poll.fetch(pollPda);
    assert.ok(poll.status.closed, "poll should be closed after settlement");
    console.log("Final outcome:", poll.outcome);
  });

  it("lets the original voter claim their reward", async () => {
    const voter = provider.wallet.publicKey;
    const [voteReceiptPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), Buffer.from(pollId), voter.toBuffer()],
      program.programId
    );

    await program.methods
      .claimReward([...pollId], [...fandomId])
      .accounts({
        voter,
        // @ts-ignore

        poll: pollPda,
        pollEscrow: pollEscrowPda,
        voteReceipt: voteReceiptPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const receipt = await program.account.voteReceipt.fetch(voteReceiptPda);
    assert.strictEqual(receipt.claimed, true, "voter reward should be claimed");
  });

  it("lets challenger claim dispute reward", async () => {
    const staker = provider.wallet.publicKey;
    const [proposalReceiptPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal_receipt"), Buffer.from(pollId), staker.toBuffer()],
      program.programId
    );

    await program.methods
      .claimChallengeReward([...pollId], [...fandomId])
      .accounts({
        staker,
        // @ts-ignore

        poll: pollPda,
        disputeYes: disputeYesPda,
        disputeNo: disputeNoPda,
        proposalReceipt: proposalReceiptPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const receipt = await program.account.proposalReceipt.fetch(
      proposalReceiptPda
    );
    assert.strictEqual(
      receipt.claimed,
      true,
      "challenge reward should be claimed"
    );
  });
});
