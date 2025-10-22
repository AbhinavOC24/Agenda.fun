"use client";

import React from "react";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import DarkThemeSwitch from "./DarkThemeSwitch";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);
const WalletDisconnectButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletDisconnectButton,
  { ssr: false }
);

function Navbar() {
  const { connected } = useWallet();

  return (
    <div className="mt-5 pb-5 border-b-2 ">
      {/* Logo / Title */}

      <div className="flex mx-10 justify-between items-center sm:mx-36">
        <div className="text-xl font-semibold tracking-wide">Agenda.fun</div>

        {/* Wallet Actions */}
        <div className="flex gap-4 items-center w-fit">
          <DarkThemeSwitch />
          <WalletMultiButtonDynamic />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
