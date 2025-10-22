import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@project-serum/anchor";
import { useMemo } from "react";

export const useAnchorProvider = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (
      !wallet.publicKey ||
      !wallet.signTransaction ||
      !wallet.signAllTransactions
    ) {
      return null;
    }

    return new AnchorProvider(connection, wallet as any, {
      preflightCommitment: "processed",
      commitment: "processed",
    });
  }, [connection, wallet]);

  return provider;
};
