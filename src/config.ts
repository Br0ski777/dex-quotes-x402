import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "dex-quotes",
  slug: "dex-quotes",
  description: "Best swap quotes across Uniswap, SushiSwap, Aerodrome -- price impact, route, slippage. Pre-trade essential.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/quote",
      price: "$0.005",
      description: "Get the best swap quote across multiple DEXes",
      toolName: "dex_get_swap_quote",
      toolDescription: `Use this when you need a swap quote before trading tokens on-chain. Returns the best price across multiple DEXes in JSON.

1. bestDex: which DEX offers the best rate (Uniswap, SushiSwap, Aerodrome)
2. amountOut: expected output token amount
3. priceImpact: percentage price impact of the trade
4. minimumReceived: minimum output after slippage tolerance
5. route: swap path (e.g. USDC -> WETH -> TOKEN)
6. gasEstimateUsd: estimated gas cost in USD

Example output: {"bestDex":"Uniswap V3","amountOut":"0.3215","priceImpact":"0.12%","minimumReceived":"0.3183","route":["USDC","WETH"],"gasEstimateUsd":0.04}

Use this BEFORE executing any token swap to find the best rate and estimate slippage. Essential for trade sizing and DEX comparison.

Do NOT use for gas estimation only -- use gas_get_current_price instead. Do NOT use for yield opportunities -- use defi_find_best_yields instead. Do NOT use for wallet balance -- use wallet_get_portfolio instead. Do NOT use for cross-chain bridging -- use bridge_find_best_route instead.`,
      inputSchema: {
        type: "object",
        properties: {
          tokenIn: { type: "string", description: "Contract address of input token (e.g. 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 for USDC on Base)" },
          tokenOut: { type: "string", description: "Contract address of output token (e.g. 0x4200000000000000000000000000000000000006 for WETH on Base)" },
          amount: { type: "string", description: "Amount of input token in raw units (wei/smallest unit, e.g. 1000000 for 1 USDC)" },
          chain: {
            type: "string",
            enum: ["base", "ethereum"],
            description: "Blockchain network: base or ethereum (default: base)",
          },
        },
        required: ["tokenIn", "tokenOut", "amount"],
      },
      outputSchema: {
          "type": "object",
          "properties": {
            "tokenIn": {
              "type": "object",
              "properties": {
                "address": {
                  "type": "string"
                },
                "symbol": {
                  "type": "string"
                },
                "decimals": {
                  "type": "number"
                }
              }
            },
            "tokenOut": {
              "type": "object",
              "properties": {
                "address": {
                  "type": "string"
                },
                "symbol": {
                  "type": "string"
                },
                "decimals": {
                  "type": "number"
                }
              }
            },
            "amountIn": {
              "type": "string",
              "description": "Input amount in raw units"
            },
            "amountInFormatted": {
              "type": "string",
              "description": "Input amount formatted"
            },
            "amountOut": {
              "type": "string",
              "description": "Output amount in raw units"
            },
            "amountOutFormatted": {
              "type": "string",
              "description": "Output amount formatted"
            },
            "price": {
              "type": "string",
              "description": "Effective price"
            },
            "priceImpact": {
              "type": "string",
              "description": "Price impact percentage"
            },
            "route": {
              "type": "string",
              "description": "Swap route description"
            },
            "dex": {
              "type": "string",
              "description": "DEX used"
            },
            "chain": {
              "type": "string",
              "description": "Chain"
            },
            "estimatedGas": {
              "type": "string",
              "description": "Estimated gas cost"
            }
          },
          "required": [
            "tokenIn",
            "tokenOut",
            "amountIn"
          ]
        },
    },
  ],
};
