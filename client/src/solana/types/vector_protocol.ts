export type VectorProtocol = {
  version: "0.1.0";
  name: "vector_protocol";
  instructions: [
    {
      name: "initializeExchange";
      accounts: [
        {
          name: "exchange";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "exchangeAuthorityBump";
          type: "u8";
        },
        {
          name: "insuranceFundBump";
          type: "u8";
        },
        {
          name: "feeStructure";
          type: {
            defined: "FeeStructure";
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "exchange";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "exchangeAuthorityBump";
            type: "u8";
          },
          {
            name: "insuranceFundBump";
            type: "u8";
          },
          {
            name: "totalCollateral";
            type: "u64";
          },
          {
            name: "totalMarkets";
            type: "u16";
          },
          {
            name: "isInitialized";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "commodityMarket";
      type: {
        kind: "struct";
        fields: [
          {
            name: "marketIndex";
            type: "u16";
          },
          {
            name: "commodityType";
            type: {
              defined: "CommodityType";
            };
          },
          {
            name: "oracleSource";
            type: "publicKey";
          },
          {
            name: "baseAssetReserve";
            type: "u64";
          },
          {
            name: "quoteAssetReserve";
            type: "u64";
          },
          {
            name: "markPrice";
            type: "u64";
          },
          {
            name: "lastFundingRate";
            type: "i64";
          },
          {
            name: "isActive";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "user";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "userId";
            type: "u32";
          },
          {
            name: "collateral";
            type: "u64";
          },
          {
            name: "totalFeePaid";
            type: "u64";
          },
          {
            name: "nextOrderId";
            type: "u32";
          },
          {
            name: "isMarginTradingEnabled";
            type: "bool";
          },
          {
            name: "isLiquidationCandidate";
            type: "bool";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "FeeStructure";
      type: {
        kind: "struct";
        fields: [
          {
            name: "feeNumerator";
            type: "u64";
          },
          {
            name: "feeDenominator";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "CommodityType";
      type: {
        kind: "enum";
        variants: [
          { name: "gold" },
          { name: "silver" },
          { name: "platinum" },
          { name: "palladium" }
        ];
      };
    }
  ];
  events: [];
  errors: [];
};