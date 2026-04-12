import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "dex-quotes",
  slug: "dex-quotes",
  description: "Get best swap quotes across DEXes before trading tokens on-chain.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/quote",
      price: "$0.005",
      description: "Get the best swap quote across multiple DEXes",
      toolName: "dex_get_swap_quote",
      toolDescription: "Use this when you need a swap quote before trading tokens on-chain. Returns best price across DEXes (Uniswap, SushiSwap, Aerodrome on Base), price impact, minimum received, route path. Supports Base and Ethereum. Ideal for price comparison, trade sizing, slippage estimation. Do NOT use for gas estimation — use gas_get_current_price. Do NOT use for yield opportunities — use defi_find_best_yields. Do NOT use for wallet balance — use wallet_get_portfolio.",
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
    },
  ],
};
