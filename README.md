# pmarket-cli
[![npm version](https://img.shields.io/npm/v/pmarket-cli)](https://www.npmjs.com/package/pmarket-cli)
Command line interface for Polymarket.

---

## Features

- List available markets with question filter (with SQLite caching)
- Buy tokens/shares
- Sell tokens/shares
- Set USDC allowance for all Polymarket exchange contracts
- Show order book for specific token
- Cancel all open orders
- Auto-generate API keys for Polymarket

---

## Installation

**Requires Node.js 22.0.0 or higher**

```shell
npm i pmarket-cli -g
```

---

## Prerequisites

### ⚠️ You MUST have USDC.e (Bridged USDC) in your wallet

**This is the most common issue!** Polymarket uses **USDC.e** (bridged USDC), NOT native USDC.

| Token | Contract Address | Works with Polymarket? |
|-------|------------------|------------------------|
| **USDC.e (Bridged)** | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` | ✅ **YES** |
| USDC (Native) | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | ❌ NO |

If you have native USDC, you need to swap it for USDC.e on a DEX like [Uniswap](https://app.uniswap.org/) or [QuickSwap](https://quickswap.exchange/).

You also need a small amount of **MATIC** for gas fees on Polygon.

---

## Setup

### Quick Start (3 steps)

1. **Ensure you have USDC.e in your wallet** (see Prerequisites above)

2. **Initialize with your private key:**

```shell
pmarket-cli -i YOUR_PRIVATE_KEY
```

[How to export your MetaMask private key](https://support.metamask.io/managing-my-wallet/secret-recovery-phrase-and-private-keys/how-to-export-an-accounts-private-key)

3. **Set USDC allowance** for the exchange contracts:

```shell
pmarket-cli -a 500
```

This sets allowance for all three Polymarket contracts:
- CTFExchange (regular markets)
- NegRiskExchange (neg_risk markets)
- NegRiskAdapter (neg_risk markets)

That's it! The tool will:
- Validate your private key and show your wallet address
- Use a public Polygon RPC (`https://polygon-rpc.com`) by default
- Auto-generate and cache API credentials on first use

### Optional: Generate API Keys Manually

If you want to see or regenerate your API keys:

```shell
pmarket-cli -k
```

The credentials are automatically saved to `~/.pmarket-cli/credentials.json`.

---

## Usage

### Refresh Cache

Fetch fresh market data and update the local cache:

```shell
pmarket-cli -r
```

### List Markets

Search for markets matching a filter. Uses cached data (refreshes automatically if cache is expired).

```shell
pmarket-cli -l "Bitcoin"
```

### Buy Tokens

```shell
pmarket-cli -b <token_id> <size> <price>
```

Example: Buy 60 shares at price $0.50:
```shell
pmarket-cli -b 12110463059584809904811790486163860991533989713640269122405796144537637099628 60 0.5
```

### Sell Tokens

```shell
pmarket-cli -s <token_id> <size> <price>
```

Example: Sell 60 shares at price $0.50:
```shell
pmarket-cli -s 12110463059584809904811790486163860991533989713640269122405796144537637099628 60 0.5
```

### Show Positions

Display your current token positions with P&L:

```shell
pmarket-cli -p
```

### Set USDC Allowance

Allow Polymarket's exchange contracts to spend your USDC.e:

```shell
pmarket-cli -a 500
```

This sets allowance for three contracts (required for all market types):
- **CTFExchange**: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E` (regular markets)
- **NegRiskExchange**: `0xC5d563A36AE78145C45a50134d48A1215220f80a` (neg_risk markets)
- **NegRiskAdapter**: `0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296` (neg_risk markets)

**Note**: The command includes delays between transactions to avoid public RPC rate limits.

### Show Order Book

```shell
pmarket-cli -o <token_id>
```

### Cancel All Orders

```shell
pmarket-cli -c
```

### Get/Generate API Keys

```shell
pmarket-cli -k
```

---

## Usage Examples

<details>
<summary>List available markets with question filter</summary>
Command

```shell
pmarket-cli -l "Oscar"
```

Response

```shell
[
  {
    yes: {
      token_id: '32690616433410387308307813339600971589831744601462134742731346664328487681674',
      outcome: 'Yes',
      price: 0.645,
      winner: false
    },
    no: {
      token_id: '93520364131545158991271066783085167796254018656458248205265557269588037162187',
      outcome: 'No',
      price: 0.355,
      winner: false
    },
    question: "Will 'Sing Sing' be nominated for Oscar for Best Picture?"
  },
  ...
]

Found 14 market(s). Use -r flag to refresh cache.
```

</details>

<details>
<summary>Buy token order</summary>
Command

```shell
pmarket-cli -b 12110463059584809904811790486163860991533989713640269122405796144537637099628 60 0.5
```

Response

```shell
{
  errorMsg: '',
  orderID: '0x6f89228a046c2cda1beb604599bda10c6acab735e2d8fdd7208754575f88dae0',
  status: 'live',
  success: true
}
```

</details>

<details>
<summary>Sell token order</summary>
Command

```shell
pmarket-cli -s 12110463059584809904811790486163860991533989713640269122405796144537637099628 60 0.5
```

Response

```shell
{
  "success": true,
  "errorMsg": "",
  "orderID": "0x556d3864c64d851462b2f378f5e6dcec7d31ba1632dfe44bfdcaa3cc685b45cc",
  "status": "matched"
}
```

</details>

<details>
<summary>Show positions</summary>
Command

```shell
pmarket-cli -p
```

Response

```shell
Fetching positions for 0x1234...

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CURRENT POSITIONS                                                                                       │
├──────────────────────────────────────────────────────────────┬────────┬──────────┬──────────┬──────────┬────────┤
│ Market                                                       │ Side   │ Size     │ Price    │ Value    │ P&L    │
├──────────────────────────────────────────────────────────────┼────────┼──────────┼──────────┼──────────┼────────┤
│ Will Bitcoin reach $100k by end of 2024?                     │ Yes    │   100.00 │    $0.65 │   $65.00 │ +$5.00 │
│ Will ETH flip BTC?                                           │ No     │    50.00 │    $0.80 │   $40.00 │ -$2.00 │
├──────────────────────────────────────────────────────────────┴────────┴──────────┴──────────┼──────────┼────────┤
│ TOTAL                                                                                       │  $105.00 │ +$3.00 │
└─────────────────────────────────────────────────────────────────────────────────────────────┴──────────┴────────┘

2 position(s) found.
```

</details>

<details>
<summary>Show order book for specific tokenId</summary>
Command

```shell
pmarket-cli -o 12110463059584809904811790486163860991533989713640269122405796144537637099628
```

Response

```shell
{
  market: '0x6f662d9d965d0b01d08ee284a58e1dd866296729801c0cdc6867459760bd33ab',
  asset_id: '12110463059584809904811790486163860991533989713640269122405796144537637099628',
  bids: [
    { price: '0.03', size: '100' },
    { price: '0.45', size: '200' },
    ...
  ],
  asks: [
    { price: '0.99', size: '1000' },
    { price: '0.97', size: '100' },
    ...
  ]
}
```

</details>

---

## Configuration Files

All configuration is stored in `~/.pmarket-cli/`:

| File | Purpose |
|------|---------|
| `config.json` | Your private key |
| `credentials.json` | Auto-generated API credentials |
| `cache.db` | SQLite cache for market data |

**Note:** Ensure you have at least 1GB of free disk space for the market cache.

### Custom Config Directory

You can override the config directory using the `PMARKET_CONFIG_DIR` environment variable:

```shell
PMARKET_CONFIG_DIR=/path/to/custom/dir pmarket-cli -l "Bitcoin"
```

---

## Development

```shell
npm install
npm run build
npm test
node dist/main.js -l "Bitcoin"
```

### Project Structure

```
src/
├── main.ts              # Entry point
├── program.ts           # CLI argument parsing
├── services/
│   ├── config.service.ts     # Configuration management
│   ├── polymarket.service.ts # Polymarket API interactions
│   ├── contract.service.ts   # Ethereum contract interactions
│   └── cache.service.ts      # SQLite caching
└── strategy/
    ├── context.ts            # Strategy pattern context
    ├── list-strategy.ts      # List markets command
    ├── buy-strategy.ts       # Buy command
    ├── sell-strategy.ts      # Sell command
    └── ...
```

---

## Issues

Please use the [Issue Tracker](https://github.com/arekgotfryd/pmarket-cli/issues) to report any issues or bugs.

---

## License

This project is licensed under the [MIT License](https://github.com/arekgotfryd/pmarket-cli/blob/master/LICENSE).
