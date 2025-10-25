/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/governance.json`.
 */
export type Governance = {
  address: "HCAdk3qPeYYYG1uYyrcG9fjTCSvmewJ8KdqWTvk7HSxR";
  metadata: {
    name: "governance";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "challengePoll";
      discriminator: [56, 200, 165, 107, 6, 40, 45, 233];
      accounts: [
        {
          name: "poll";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108];
              },
              {
                kind: "arg";
                path: "fandomId";
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "challenger";
          writable: true;
          signer: true;
        },
        {
          name: "disputeYes";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [100, 105, 115, 112, 117, 116, 101, 95, 121, 101, 115];
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "disputeNo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [100, 105, 115, 112, 117, 116, 101, 95, 110, 111];
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "proposalReceipt";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108,
                  95,
                  114,
                  101,
                  99,
                  101,
                  105,
                  112,
                  116
                ];
              },
              {
                kind: "arg";
                path: "pollId";
              },
              {
                kind: "account";
                path: "challenger";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "pollId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "fandomId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "side";
          type: {
            defined: {
              name: "pollOutcome";
            };
          };
        },
        {
          name: "stakeLamports";
          type: "u64";
        }
      ];
    },
    {
      name: "claimChallengeReward";
      discriminator: [78, 11, 211, 227, 27, 91, 119, 225];
      accounts: [
        {
          name: "staker";
          writable: true;
          signer: true;
        },
        {
          name: "poll";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108];
              },
              {
                kind: "arg";
                path: "fandomId";
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "disputeYes";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [100, 105, 115, 112, 117, 116, 101, 95, 121, 101, 115];
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "disputeNo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [100, 105, 115, 112, 117, 116, 101, 95, 110, 111];
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "proposalReceipt";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108,
                  95,
                  114,
                  101,
                  99,
                  101,
                  105,
                  112,
                  116
                ];
              },
              {
                kind: "arg";
                path: "pollId";
              },
              {
                kind: "account";
                path: "staker";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "pollId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "fandomId";
          type: {
            array: ["u8", 32];
          };
        }
      ];
    },
    {
      name: "claimReward";
      discriminator: [149, 95, 181, 242, 94, 90, 158, 162];
      accounts: [
        {
          name: "voter";
          writable: true;
          signer: true;
        },
        {
          name: "poll";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108];
              },
              {
                kind: "arg";
                path: "fandomId";
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "pollEscrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108, 95, 101, 115, 99, 114, 111, 119];
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "voteReceipt";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 111, 116, 101];
              },
              {
                kind: "arg";
                path: "pollId";
              },
              {
                kind: "account";
                path: "voter";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "pollId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "fandomId";
          type: {
            array: ["u8", 32];
          };
        }
      ];
    },
    {
      name: "createFandom";
      discriminator: [55, 179, 160, 128, 138, 248, 76, 141];
      accounts: [
        {
          name: "fandom";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 97, 110, 100, 111, 109];
              },
              {
                kind: "arg";
                path: "fandomId";
              }
            ];
          };
        },
        {
          name: "globalConfig";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "admin";
          writable: true;
          signer: true;
          relations: ["globalConfig"];
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "fandomId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "name";
          type: "string";
        }
      ];
    },
    {
      name: "createPoll";
      discriminator: [182, 171, 112, 238, 6, 219, 14, 110];
      accounts: [
        {
          name: "admin";
          writable: true;
          signer: true;
          relations: ["globalConfig"];
        },
        {
          name: "globalConfig";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "fandom";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 97, 110, 100, 111, 109];
              },
              {
                kind: "arg";
                path: "fandomId";
              }
            ];
          };
        },
        {
          name: "poll";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108];
              },
              {
                kind: "arg";
                path: "fandomId";
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "pollEscrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108, 95, 101, 115, 99, 114, 111, 119];
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "pollId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "fandomId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "startTs";
          type: "i64";
        },
        {
          name: "endTs";
          type: "i64";
        },
        {
          name: "challengeEndTs";
          type: "i64";
        },
        {
          name: "metadataHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "lambdaFp";
          type: "i32";
        },
        {
          name: "kOverride";
          type: {
            option: "i32";
          };
        }
      ];
    },
    {
      name: "initGlobal";
      discriminator: [44, 238, 77, 253, 76, 182, 192, 162];
      accounts: [
        {
          name: "globalConfig";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "globalTreasury";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "admin";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "feeBps";
          type: "u16";
        },
        {
          name: "rGlobal";
          type: "u16";
        },
        {
          name: "rBurn";
          type: "u16";
        },
        {
          name: "usdcMint";
          type: "pubkey";
        },
        {
          name: "platformWallet";
          type: "pubkey";
        }
      ];
    },
    {
      name: "joinDispute";
      discriminator: [147, 120, 95, 90, 161, 231, 176, 183];
      accounts: [
        {
          name: "poll";
          writable: true;
        },
        {
          name: "fandom";
          relations: ["poll"];
        },
        {
          name: "disputeYes";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [100, 105, 115, 112, 117, 116, 101, 95, 121, 101, 115];
              },
              {
                kind: "account";
                path: "poll.poll_id";
                account: "poll";
              }
            ];
          };
        },
        {
          name: "disputeNo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [100, 105, 115, 112, 117, 116, 101, 95, 110, 111];
              },
              {
                kind: "account";
                path: "poll.poll_id";
                account: "poll";
              }
            ];
          };
        },
        {
          name: "proposalReceipt";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108,
                  95,
                  114,
                  101,
                  99,
                  101,
                  105,
                  112,
                  116
                ];
              },
              {
                kind: "account";
                path: "poll.poll_id";
                account: "poll";
              },
              {
                kind: "account";
                path: "participant";
              }
            ];
          };
        },
        {
          name: "participant";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "side";
          type: {
            defined: {
              name: "pollOutcome";
            };
          };
        },
        {
          name: "stakeLamports";
          type: "u64";
        }
      ];
    },
    {
      name: "resolvePollAuto";
      discriminator: [8, 106, 28, 252, 157, 51, 173, 159];
      accounts: [
        {
          name: "anyone";
          signer: true;
        },
        {
          name: "poll";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108];
              },
              {
                kind: "arg";
                path: "fandomId";
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        }
      ];
      args: [
        {
          name: "pollId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "fandomId";
          type: {
            array: ["u8", 32];
          };
        }
      ];
    },
    {
      name: "settlePoll";
      discriminator: [12, 197, 155, 46, 229, 145, 89, 48];
      accounts: [
        {
          name: "poll";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108];
              },
              {
                kind: "arg";
                path: "fandomId";
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "disputeYes";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [100, 105, 115, 112, 117, 116, 101, 95, 121, 101, 115];
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "disputeNo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [100, 105, 115, 112, 117, 116, 101, 95, 110, 111];
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "globalConfig";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ];
              }
            ];
          };
        },
        {
          name: "globalTreasury";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "pollEscrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108, 95, 101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "poll.poll_id";
                account: "poll";
              }
            ];
          };
        },
        {
          name: "platformWallet";
          docs: [
            "This is the platform wallet specified in GlobalConfig.",
            "Its address is validated via the `address = global_config.platform_wallet` constraint.",
            "No other runtime checks are necessary."
          ];
          writable: true;
        },
        {
          name: "burn";
          docs: [
            "This is a burn sink account (e.g., SystemProgram::id() or a known dead address).",
            "It only receives lamports; no data is read or written."
          ];
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "pollId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "fandomId";
          type: {
            array: ["u8", 32];
          };
        }
      ];
    },
    {
      name: "vote";
      discriminator: [227, 110, 155, 23, 136, 126, 172, 25];
      accounts: [
        {
          name: "voter";
          writable: true;
          signer: true;
        },
        {
          name: "poll";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108];
              },
              {
                kind: "arg";
                path: "fandomId";
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "pollEscrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 108, 108, 95, 101, 115, 99, 114, 111, 119];
              },
              {
                kind: "arg";
                path: "pollId";
              }
            ];
          };
        },
        {
          name: "voteReceipt";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 111, 116, 101];
              },
              {
                kind: "arg";
                path: "pollId";
              },
              {
                kind: "account";
                path: "voter";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "pollId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "fandomId";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "side";
          type: {
            defined: {
              name: "pollChoice";
            };
          };
        },
        {
          name: "stakeLamports";
          type: "u64";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "fandom";
      discriminator: [7, 185, 153, 101, 157, 74, 162, 87];
    },
    {
      name: "globalConfig";
      discriminator: [149, 8, 156, 202, 160, 252, 176, 217];
    },
    {
      name: "globalTreasury";
      discriminator: [56, 53, 29, 200, 89, 0, 198, 144];
    },
    {
      name: "poll";
      discriminator: [110, 234, 167, 188, 231, 136, 153, 111];
    },
    {
      name: "pollEscrow";
      discriminator: [214, 241, 84, 143, 231, 187, 132, 90];
    },
    {
      name: "proposal";
      discriminator: [26, 94, 189, 187, 116, 136, 53, 33];
    },
    {
      name: "proposalReceipt";
      discriminator: [184, 20, 249, 243, 181, 81, 15, 11];
    },
    {
      name: "voteReceipt";
      discriminator: [104, 20, 204, 252, 45, 84, 37, 195];
    }
  ];
  events: [
    {
      name: "characterCreated";
      discriminator: [83, 204, 181, 96, 17, 147, 235, 145];
    },
    {
      name: "disputeOpened";
      discriminator: [239, 222, 102, 235, 193, 85, 1, 214];
    },
    {
      name: "fandomCreated";
      discriminator: [119, 92, 188, 138, 173, 247, 254, 95];
    },
    {
      name: "globalConfigCreated";
      discriminator: [108, 180, 240, 231, 42, 224, 158, 194];
    },
    {
      name: "pollCreated";
      discriminator: [137, 85, 250, 148, 2, 9, 178, 39];
    },
    {
      name: "pollResolved";
      discriminator: [137, 178, 161, 141, 239, 105, 64, 156];
    },
    {
      name: "pollSettled";
      discriminator: [213, 246, 189, 228, 238, 237, 45, 250];
    },
    {
      name: "rewardClaimed";
      discriminator: [49, 28, 87, 84, 158, 48, 229, 175];
    },
    {
      name: "voteCast";
      discriminator: [39, 53, 195, 104, 188, 17, 225, 213];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "unauthorized";
      msg: "unauthorized";
    },
    {
      code: 6001;
      name: "mathOverflow";
      msg: "Math overflow/underflow";
    },
    {
      code: 6002;
      name: "slippageTooHigh";
      msg: "Slippage too high or zero output";
    },
    {
      code: 6003;
      name: "invalidInput";
      msg: "Invalid input/state";
    },
    {
      code: 6004;
      name: "insufficientTreasury";
      msg: "Insufficient treasury balance";
    },
    {
      code: 6005;
      name: "insufficientBalance";
      msg: "Insufficient balance";
    },
    {
      code: 6006;
      name: "invalidState";
      msg: "Invalid state";
    },
    {
      code: 6007;
      name: "pollClosed";
      msg: "Poll is closed";
    },
    {
      code: 6008;
      name: "pollNotEnded";
      msg: "Poll not ended";
    },
    {
      code: 6009;
      name: "alreadyClaimed";
      msg: "Already claimed";
    },
    {
      code: 6010;
      name: "wrongSide";
      msg: "Wrong side for claim";
    },
    {
      code: 6011;
      name: "challengeWindowClosed";
      msg: "Challenge Window is closed";
    },
    {
      code: 6012;
      name: "challengeWindowStillOpen";
      msg: "Challenge Window is still open";
    },
    {
      code: 6013;
      name: "notDisputed";
      msg: "Poll is not disputed";
    },
    {
      code: 6014;
      name: "invalidVault";
      msg: "No such dispute vault found";
    },
    {
      code: 6015;
      name: "invalidReceipt";
      msg: "Poll in the receipt doesn't match";
    },
    {
      code: 6016;
      name: "notWinner";
      msg: "You are not eligible to claim this reward.";
    },
    {
      code: 6017;
      name: "noReward";
      msg: "No reward available for this claim.";
    }
  ];
  types: [
    {
      name: "characterCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "fandom";
            type: "pubkey";
          },
          {
            name: "charSlug";
            type: "string";
          },
          {
            name: "stockMint";
            type: "pubkey";
          },
          {
            name: "supply";
            type: "u64";
          },
          {
            name: "treasuryVault";
            type: "pubkey";
          },
          {
            name: "priceState";
            type: "pubkey";
          },
          {
            name: "lastPriceFp";
            type: "u128";
          },
          {
            name: "weekStartTs";
            type: "i64";
          },
          {
            name: "ts";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "disputeOpened";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "pubkey";
          },
          {
            name: "side";
            type: "string";
          },
          {
            name: "challenger";
            type: "pubkey";
          },
          {
            name: "stake";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "fandom";
      type: {
        kind: "struct";
        fields: [
          {
            name: "fandomId";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "admin";
            type: "pubkey";
          },
          {
            name: "name";
            type: "string";
          }
        ];
      };
    },
    {
      name: "fandomCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            type: "pubkey";
          },
          {
            name: "fandomId";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "name";
            type: "string";
          },
          {
            name: "ts";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "globalConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            type: "pubkey";
          },
          {
            name: "feeBps";
            type: "u16";
          },
          {
            name: "rBurn";
            type: "u16";
          },
          {
            name: "rGlobal";
            type: "u16";
          },
          {
            name: "usdcMint";
            type: "pubkey";
          },
          {
            name: "flags";
            type: "u64";
          },
          {
            name: "platformWallet";
            type: "pubkey";
          },
          {
            name: "globalTreasury";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "globalConfigCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            type: "pubkey";
          },
          {
            name: "feeBps";
            type: "u16";
          },
          {
            name: "rBurn";
            type: "u16";
          },
          {
            name: "rGlobal";
            type: "u16";
          },
          {
            name: "usdcMint";
            type: "pubkey";
          },
          {
            name: "platformWallet";
            type: "pubkey";
          },
          {
            name: "globalTreasury";
            type: "pubkey";
          },
          {
            name: "ts";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "globalTreasury";
      type: {
        kind: "struct";
        fields: [];
      };
    },
    {
      name: "poll";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pollId";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "fandom";
            type: "pubkey";
          },
          {
            name: "metadataHash";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "startTs";
            type: "i64";
          },
          {
            name: "endTs";
            type: "i64";
          },
          {
            name: "challengeEndTs";
            type: "i64";
          },
          {
            name: "lambdaFp";
            type: "i32";
          },
          {
            name: "kOverride";
            type: {
              option: "i32";
            };
          },
          {
            name: "totalStake";
            type: "u64";
          },
          {
            name: "stakeYes";
            type: "u64";
          },
          {
            name: "stakeNo";
            type: "u64";
          },
          {
            name: "payoutPool";
            type: "u64";
          },
          {
            name: "wYes";
            type: "u64";
          },
          {
            name: "wNo";
            type: "u64";
          },
          {
            name: "proposerSide";
            type: {
              defined: {
                name: "pollOutcome";
              };
            };
          },
          {
            name: "lockedDisputeAmount";
            type: "u64";
          },
          {
            name: "status";
            type: {
              defined: {
                name: "pollStatus";
              };
            };
          },
          {
            name: "outcome";
            type: {
              defined: {
                name: "pollOutcome";
              };
            };
          },
          {
            name: "disputePool";
            type: "u64";
          },
          {
            name: "disputeYes";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "disputeNo";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "platformFee";
            type: "u64";
          },
          {
            name: "econCut";
            type: "u64";
          },
          {
            name: "escrowVault";
            type: "pubkey";
          },
          {
            name: "escrowBump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "pollChoice";
      type: {
        kind: "enum";
        variants: [
          {
            name: "yes";
          },
          {
            name: "no";
          }
        ];
      };
    },
    {
      name: "pollCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pollId";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "fandomId";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "startTs";
            type: "i64";
          },
          {
            name: "endTs";
            type: "i64";
          },
          {
            name: "challengeEndTs";
            type: "i64";
          },
          {
            name: "status";
            type: "string";
          }
        ];
      };
    },
    {
      name: "pollEscrow";
      type: {
        kind: "struct";
        fields: [];
      };
    },
    {
      name: "pollOutcome";
      type: {
        kind: "enum";
        variants: [
          {
            name: "unset";
          },
          {
            name: "yes";
          },
          {
            name: "no";
          },
          {
            name: "refunded";
          }
        ];
      };
    },
    {
      name: "pollResolved";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "pubkey";
          },
          {
            name: "outcome";
            type: "string";
          }
        ];
      };
    },
    {
      name: "pollSettled";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "pubkey";
          },
          {
            name: "finalOutcome";
            type: "string";
          },
          {
            name: "totalStake";
            type: "u64";
          },
          {
            name: "payoutPool";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "pollStatus";
      type: {
        kind: "enum";
        variants: [
          {
            name: "open";
          },
          {
            name: "challengeWindow";
          },
          {
            name: "pending";
          },
          {
            name: "disputed";
          },
          {
            name: "settling";
          },
          {
            name: "closed";
          }
        ];
      };
    },
    {
      name: "proposal";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "pubkey";
          },
          {
            name: "side";
            type: {
              defined: {
                name: "pollOutcome";
              };
            };
          },
          {
            name: "totalStake";
            type: "u64";
          },
          {
            name: "totParticipants";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "proposalReceipt";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "pubkey";
          },
          {
            name: "side";
            type: {
              defined: {
                name: "pollOutcome";
              };
            };
          },
          {
            name: "staker";
            type: "pubkey";
          },
          {
            name: "amountStaked";
            type: "u64";
          },
          {
            name: "claimed";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "rewardClaimed";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "pubkey";
          },
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "challenge";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "voteCast";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "pubkey";
          },
          {
            name: "voter";
            type: "pubkey";
          },
          {
            name: "side";
            type: "string";
          },
          {
            name: "stake";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "voteReceipt";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "pubkey";
          },
          {
            name: "voter";
            type: "pubkey";
          },
          {
            name: "side";
            type: {
              defined: {
                name: "pollChoice";
              };
            };
          },
          {
            name: "amountStaked";
            type: "u64";
          },
          {
            name: "weightFp";
            type: "u128";
          },
          {
            name: "claimed";
            type: "bool";
          }
        ];
      };
    }
  ];
};
