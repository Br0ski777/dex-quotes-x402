# DEX Swap Quotes API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://dex-quotes.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Best swap quotes across Uniswap, SushiSwap, Aerodrome -- price impact, route, slippage. Pre-trade essential. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "dex-quotes": {
      "url": "https://dex-quotes.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl "https://dex-quotes.api.klymax402.com/api/quote?tokenIn=...&tokenOut=...&amount=..."
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `dex_get_swap_quote` | GET | `/api/quote` | $0.012 | Get the best swap quote across multiple DEXes |
| `dex_get_swap_quote` | POST | `/api/quote` | $0.012 | Get the best swap quote across multiple DEXes (POST variant) |

### `dex_get_swap_quote`

Use this when you need a swap quote before trading tokens on-chain. Returns the best price across multiple DEXes in JSON.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `tokenIn` | string | yes | Contract address of input token (e.g. 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 for USDC on Base) |
| `tokenOut` | string | yes | Contract address of output token (e.g. 0x4200000000000000000000000000000000000006 for WETH on Base) |
| `amount` | string | yes | Amount of input token in raw units (wei/smallest unit, e.g. 1000000 for 1 USDC) |
| `chain` | string | no | Blockchain network: base or ethereum (default: base) |

**Returns**

- `bestDex` -- which DEX offers the best rate (Uniswap, SushiSwap, Aerodrome)
- `amountOut` -- expected output token amount
- `priceImpact` -- percentage price impact of the trade
- `minimumReceived` -- minimum output after slippage tolerance
- `route` -- swap path (e.g. USDC -> WETH -> TOKEN)
- `gasEstimateUsd` -- estimated gas cost in USD

Example response:

```json
{"bestDex":"Uniswap V3","amountOut":"0.3215","priceImpact":"0.12%","minimumReceived":"0.3183","route":["USDC","WETH"],"gasEstimateUsd":0.04}
```

**When to use**: executing any token swap to find the best rate and estimate slippage. Essential for trade sizing and DEX comparison.

**Not for**: gas estimation only (use `gas_get_current_price`), yield opportunities (use `defi_find_best_yields`), wallet balance (use `wallet_get_portfolio`).

### `dex_get_swap_quote`

Use this when you need a swap quote before trading tokens on-chain. Returns the best price across multiple DEXes in JSON. POST variant of dex_get_swap_quote -- same params passed as JSON body instead of query string.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `tokenIn` | string | yes | Contract address of input token (e.g. 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 for USDC on Base) |
| `tokenOut` | string | yes | Contract address of output token (e.g. 0x4200000000000000000000000000000000000006 for WETH on Base) |
| `amount` | string | yes | Amount of input token in raw units (wei/smallest unit, e.g. 1000000 for 1 USDC) |
| `chain` | string | no | Blockchain network: base or ethereum (default: base) |

**Returns**

- `bestDex` -- which DEX offers the best rate (Uniswap, SushiSwap, Aerodrome)
- `amountOut` -- expected output token amount
- `priceImpact` -- percentage price impact of the trade
- `minimumReceived` -- minimum output after slippage tolerance
- `route` -- swap path (e.g. USDC -> WETH -> TOKEN)
- `gasEstimateUsd` -- estimated gas cost in USD

Example response:

```json
{"bestDex":"Uniswap V3","amountOut":"0.3215","priceImpact":"0.12%","minimumReceived":"0.3183","route":["USDC","WETH"],"gasEstimateUsd":0.04}
```

**When to use**: executing any token swap to find the best rate and estimate slippage. Essential for trade sizing and DEX comparison.

**Not for**: gas estimation only (use `gas_get_current_price`), yield opportunities (use `defi_find_best_yields`), wallet balance (use `wallet_get_portfolio`).

## Example agent prompts

- "A swap quote before trading tokens on-chain"
- "A swap quote before trading tokens on-chain"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
