import type { Hono } from "hono";

// Chain configs
const CHAINS: Record<string, { coingeckoId: string; rpcUrl: string; quoterV2: string; dexes: string[] }> = {
  base: {
    coingeckoId: "base",
    rpcUrl: "https://mainnet.base.org",
    quoterV2: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
    dexes: ["Uniswap V3", "SushiSwap", "Aerodrome"],
  },
  ethereum: {
    coingeckoId: "ethereum",
    rpcUrl: "https://eth.llamarpc.com",
    quoterV2: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
    dexes: ["Uniswap V3", "SushiSwap", "Curve"],
  },
};

// Well-known token decimals on Base
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { symbol: "USDC", decimals: 6 },
  "0x4200000000000000000000000000000000000006": { symbol: "WETH", decimals: 18 },
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": { symbol: "DAI", decimals: 18 },
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": { symbol: "USDbC", decimals: 6 },
  "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22": { symbol: "cbETH", decimals: 18 },
  // Ethereum
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { symbol: "USDC", decimals: 6 },
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { symbol: "WETH", decimals: 18 },
  "0x6b175474e89094c44da98b954eedeac495271d0f": { symbol: "DAI", decimals: 18 },
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { symbol: "USDT", decimals: 6 },
};

// Fee tiers for Uniswap V3
const FEE_TIERS = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

// ABI-encode quoteExactInputSingle call
function encodeQuoteExactInputSingle(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  fee: number
): string {
  // QuoterV2.quoteExactInputSingle((address,address,uint256,uint24,uint160))
  // selector: 0xc6a5026a
  const selector = "c6a5026a";
  const padAddr = (a: string) => a.replace("0x", "").toLowerCase().padStart(64, "0");
  const padUint = (v: string | number) => BigInt(v).toString(16).padStart(64, "0");

  return (
    "0x" +
    selector +
    padAddr(tokenIn) +
    padAddr(tokenOut) +
    padUint(amountIn) +
    padUint(fee) +
    padUint("0") // sqrtPriceLimitX96 = 0
  );
}

// Decode uint256 from hex response
function decodeUint256(hex: string): bigint {
  // Response has: amountOut (32 bytes), sqrtPriceX96After (32), initializedTicksCrossed (32), gasEstimate (32)
  const clean = hex.replace("0x", "");
  if (clean.length < 64) return 0n;
  return BigInt("0x" + clean.slice(0, 64));
}

function decodeGasEstimate(hex: string): bigint {
  const clean = hex.replace("0x", "");
  if (clean.length < 256) return 150000n;
  return BigInt("0x" + clean.slice(192, 256));
}

async function getOnChainQuote(
  rpcUrl: string,
  quoterAddress: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  fee: number
): Promise<{ amountOut: bigint; gasEstimate: bigint } | null> {
  try {
    const data = encodeQuoteExactInputSingle(tokenIn, tokenOut, amountIn, fee);
    const resp = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: quoterAddress, data }, "latest"],
      }),
    });
    const json = (await resp.json()) as any;
    if (json.error || !json.result || json.result === "0x") return null;
    return {
      amountOut: decodeUint256(json.result),
      gasEstimate: decodeGasEstimate(json.result),
    };
  } catch {
    return null;
  }
}

async function getTokenPrices(
  chain: string,
  addresses: string[]
): Promise<Record<string, number>> {
  const chainConfig = CHAINS[chain];
  if (!chainConfig) return {};
  try {
    const url = `https://api.coingecko.com/api/v3/simple/token_price/${chainConfig.coingeckoId}?contract_addresses=${addresses.join(",")}&vs_currencies=usd`;
    const resp = await fetch(url);
    const data = (await resp.json()) as Record<string, { usd?: number }>;
    const result: Record<string, number> = {};
    for (const [addr, val] of Object.entries(data)) {
      if (val.usd) result[addr.toLowerCase()] = val.usd;
    }
    return result;
  } catch {
    return {};
  }
}

function getDecimals(address: string): number {
  const info = KNOWN_TOKENS[address.toLowerCase()];
  return info?.decimals ?? 18;
}

function getSymbol(address: string): string {
  const info = KNOWN_TOKENS[address.toLowerCase()];
  return info?.symbol ?? address.slice(0, 10) + "...";
}

function formatAmount(raw: bigint, decimals: number): string {
  const str = raw.toString().padStart(decimals + 1, "0");
  const intPart = str.slice(0, str.length - decimals) || "0";
  const decPart = str.slice(str.length - decimals);
  return `${intPart}.${decPart}`;
}

function feeTierToLabel(fee: number): string {
  if (fee === 500) return "0.05%";
  if (fee === 3000) return "0.3%";
  if (fee === 10000) return "1%";
  return `${fee / 10000}%`;
}

export function registerRoutes(app: Hono) {
  app.get("/api/quote", async (c) => {
    const tokenIn = c.req.query("tokenIn");
    const tokenOut = c.req.query("tokenOut");
    const amount = c.req.query("amount");
    const chain = (c.req.query("chain") || "base").toLowerCase();

    if (!tokenIn || !tokenOut || !amount) {
      return c.json({ error: "Missing required parameters: tokenIn, tokenOut, amount" }, 400);
    }

    if (!CHAINS[chain]) {
      return c.json({ error: `Unsupported chain: ${chain}. Supported: base, ethereum` }, 400);
    }

    const chainConfig = CHAINS[chain];
    const decimalsIn = getDecimals(tokenIn);
    const decimalsOut = getDecimals(tokenOut);

    // Query all fee tiers in parallel
    const quotePromises = FEE_TIERS.map((fee) =>
      getOnChainQuote(chainConfig.rpcUrl, chainConfig.quoterV2, tokenIn, tokenOut, amount, fee).then(
        (result) => (result ? { fee, ...result } : null)
      )
    );

    const results = await Promise.all(quotePromises);
    const validQuotes = results.filter((r): r is NonNullable<typeof r> => r !== null && r.amountOut > 0n);

    if (validQuotes.length === 0) {
      // Fallback: try CoinGecko price-based estimate
      const prices = await getTokenPrices(chain, [tokenIn, tokenOut]);
      const priceIn = prices[tokenIn.toLowerCase()];
      const priceOut = prices[tokenOut.toLowerCase()];

      if (priceIn && priceOut) {
        const amountInFloat = parseFloat(formatAmount(BigInt(amount), decimalsIn));
        const valueUsd = amountInFloat * priceIn;
        const estimatedOut = valueUsd / priceOut;

        return c.json({
          tokenIn: { address: tokenIn, symbol: getSymbol(tokenIn), decimals: decimalsIn },
          tokenOut: { address: tokenOut, symbol: getSymbol(tokenOut), decimals: decimalsOut },
          amountIn: amount,
          amountInFormatted: formatAmount(BigInt(amount), decimalsIn),
          amountOut: null,
          amountOutEstimated: estimatedOut.toFixed(decimalsOut > 8 ? 8 : decimalsOut),
          price: (priceIn / priceOut).toFixed(8),
          priceImpact: "unknown — no on-chain liquidity data",
          route: `${getSymbol(tokenIn)} → ${getSymbol(tokenOut)}`,
          dex: "price-estimate (CoinGecko)",
          chain,
          estimatedGas: null,
          source: "coingecko-price-estimate",
          warning: "No on-chain quote available. This is a price estimate only — actual swap output may differ.",
        });
      }

      return c.json({ error: "No quote available. Pair may not have liquidity on supported DEXes." }, 404);
    }

    // Pick best quote (highest amountOut)
    validQuotes.sort((a, b) => (b.amountOut > a.amountOut ? 1 : b.amountOut < a.amountOut ? -1 : 0));
    const best = validQuotes[0];

    // Calculate price impact using CoinGecko spot
    let priceImpact: string | null = null;
    const prices = await getTokenPrices(chain, [tokenIn, tokenOut]);
    const priceIn = prices[tokenIn.toLowerCase()];
    const priceOut = prices[tokenOut.toLowerCase()];

    if (priceIn && priceOut) {
      const amountInFloat = parseFloat(formatAmount(BigInt(amount), decimalsIn));
      const amountOutFloat = parseFloat(formatAmount(best.amountOut, decimalsOut));
      const expectedOut = (amountInFloat * priceIn) / priceOut;
      if (expectedOut > 0) {
        const impact = ((expectedOut - amountOutFloat) / expectedOut) * 100;
        priceImpact = impact.toFixed(4) + "%";
      }
    }

    const dexName = best.fee === 500 ? "Uniswap V3 (0.05%)" : best.fee === 3000 ? "Uniswap V3 (0.3%)" : "Uniswap V3 (1%)";

    // Minimum received with 0.5% slippage
    const minReceived = (best.amountOut * 995n) / 1000n;

    return c.json({
      tokenIn: { address: tokenIn, symbol: getSymbol(tokenIn), decimals: decimalsIn },
      tokenOut: { address: tokenOut, symbol: getSymbol(tokenOut), decimals: decimalsOut },
      amountIn: amount,
      amountInFormatted: formatAmount(BigInt(amount), decimalsIn),
      amountOut: best.amountOut.toString(),
      amountOutFormatted: formatAmount(best.amountOut, decimalsOut),
      minimumReceived: formatAmount(minReceived, decimalsOut),
      price: priceIn && priceOut ? (priceIn / priceOut).toFixed(8) : null,
      priceImpact,
      route: `${getSymbol(tokenIn)} → ${getSymbol(tokenOut)} (fee: ${feeTierToLabel(best.fee)})`,
      dex: dexName,
      feeTier: best.fee,
      chain,
      estimatedGas: best.gasEstimate.toString(),
      slippageTolerance: "0.5%",
      allQuotes: validQuotes.map((q) => ({
        feeTier: q.fee,
        feeTierLabel: feeTierToLabel(q.fee),
        amountOut: q.amountOut.toString(),
        amountOutFormatted: formatAmount(q.amountOut, decimalsOut),
        estimatedGas: q.gasEstimate.toString(),
      })),
    });
  });
}
