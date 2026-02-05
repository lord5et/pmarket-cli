# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2026-02-05

### ⚠️ BREAKING CHANGES

- **Buy/Sell interface changed**: Commands now use `<token_id> <size> <price>` instead of `<token_id> <amount_in_USDC> <price>`
  - **Before**: `pmarket-cli -b <token_id> <amount_in_USDC> <price>` (e.g., `-b TOKEN 30 0.5` bought $30 worth)
  - **After**: `pmarket-cli -b <token_id> <size> <price>` (e.g., `-b TOKEN 60 0.5` buys 60 shares at $0.50)
  - This change aligns the CLI with the underlying clob-client API and provides a cleaner, more predictable interface

### Added

- **Positions command** (`-p, --positions`): View your current token positions with P&L in a formatted table
  - Shows market title, outcome (Yes/No), size, current price, value, and profit/loss
  - Displays total portfolio value and P&L
  - Uses Polymarket Data API (`https://data-api.polymarket.com`)

### Changed

- Buy command now takes number of shares directly instead of USDC amount
- Sell command interface unchanged (already used shares) but documentation clarified
- Upgraded `@polymarket/clob-client` to v5.2.1 for latest API compatibility
- Cleaned up debug output in order creation flow
- Updated README with clearer examples and positions documentation

## [0.8.0] - 2025-01-XX

### ⚠️ BREAKING CHANGES

- **Requires Node.js 22.0.0 or higher**
- **Fresh config required**: Previous configurations are not compatible; run `pmarket-cli -i <private_key>` to set up
- **Removed NestJS**: Complete rewrite using plain TypeScript for simpler, faster execution

### Added

- **Simplified setup**: Only private key required in config; RPC and API keys are auto-derived
- **SQLite caching**: Market data is cached locally for faster listing (`-l` flag)
- **Refresh command** (`-r`): Manually refresh the market cache
- **Init command** (`-i`): Easy onboarding with private key initialization
- **Environment variable support**: `PMARKET_CONFIG_DIR` to override config directory
- **Multi-contract allowance**: `-a` command now sets allowance for all three Polymarket contracts:
  - CTFExchange (regular markets)
  - NegRiskExchange (neg_risk markets)
  - NegRiskAdapter (neg_risk markets)
- **Auto-derived API credentials**: Credentials are automatically derived on first use
- **Rate limit handling**: Delays between transactions to avoid public RPC rate limits

### Changed

- Upgraded `@polymarket/clob-client` to v5.2.1
- Switched to ESM modules (`"type": "module"`)
- Config location: `~/.pmarket-cli/` (previously varied)
- Default RPC: `https://polygon-rpc.com`

### Removed

- NestJS framework and all related dependencies
- Webpack bundling
- graphql-request, figlet, and other unused dependencies

### Fixed

- Signature type for EOA wallets (uses `0` instead of `2`)
- Gas pricing for Polygon (minimum 25 gwei priority fee)
- Support for neg_risk markets

### Important Notes

- **USDC.e Required**: Polymarket uses bridged USDC (USDC.e at `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`), NOT native USDC
- **Allowance for all contracts**: Make sure to run `-a` to set allowance for all exchange contracts

## [0.7.x and earlier]

See [GitHub releases](https://github.com/arekgotfryd/pmarket-cli/releases) for previous versions.
