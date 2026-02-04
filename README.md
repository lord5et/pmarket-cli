# pmarket-cli
[![npm version](https://img.shields.io/npm/v/pmarket-cli)](https://www.npmjs.com/package/pmarket-cli)
Command line interface for Polymarket.

---

## Features

- List available markets with question filter (with SQLite caching)
- Buy tokens/shares
- Sell tokens/shares
- Set USDC allowance for CTFExchange contract
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

## Setup

### Quick Start (2 steps)

1. **Initialize with your private key:**

```shell
pmarket-cli -i YOUR_PRIVATE_KEY
```

[How to export your MetaMask private key](https://support.metamask.io/managing-my-wallet/secret-recovery-phrase-and-private-keys/how-to-export-an-accounts-private-key)

2. **Set USDC allowance** for the CTFExchange contract:

```shell
pmarket-cli -a 500
```

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
pmarket-cli -b <token_id> <amount_in_USDC> <price>
```

Example: Buy $30 worth at price 0.5:
```shell
pmarket-cli -b 12110463059584809904811790486163860991533989713640269122405796144537637099628 30 0.5
```

### Sell Tokens

```shell
pmarket-cli -s <token_id> <amount_of_tokens> <price>
```

Example: Sell 30 tokens at price 0.5:
```shell
pmarket-cli -s 12110463059584809904811790486163860991533989713640269122405796144537637099628 30 0.5
```

### Set USDC Allowance

Allow the CTFExchange contract to spend your USDC:

```shell
pmarket-cli -a 500
```

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
pmarket-cli -b 12110463059584809904811790486163860991533989713640269122405796144537637099628 30 0.5
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
pmarket-cli -s 12110463059584809904811790486163860991533989713640269122405796144537637099628 30 0.5
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
