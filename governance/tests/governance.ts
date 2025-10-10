import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Governance } from "../target/types/governance";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import assert from "assert";
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
});
