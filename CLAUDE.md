# CLAUDE.md

This file provides context for AI assistants working on this codebase.

## Project Overview

**pmarket-cli** is a command-line interface for trading on Polymarket, a prediction market platform. It allows users to list markets, buy/sell tokens, manage USDC allowances, and view order books.

## Tech Stack

- **Runtime**: Node.js 22+ (ESM modules)
- **Language**: TypeScript 5.6+
- **Build**: Plain `tsc` (no bundler)
- **Testing**: Jest with ts-jest (ESM mode)
- **Key Dependencies**:
  - `@polymarket/clob-client` - Polymarket API client
  - `ethers` v5 - Ethereum interactions
  - `commander` - CLI argument parsing
  - `better-sqlite3` - Local market data caching

## Architecture

### Entry Point
- `src/main.ts` - Bootstrap, creates services, parses CLI args, executes strategy

### Services (`src/services/`)
| Service | Purpose |
|---------|---------|
| `config.service.ts` | Loads config from `~/.pmarket-cli/config.json`, manages credentials |
| `polymarket.service.ts` | Wraps `@polymarket/clob-client`, handles market/order operations |
| `contract.service.ts` | Ethereum contract interactions (USDC allowance) |
| `cache.service.ts` | SQLite caching for market data (1hr TTL) |

### Strategy Pattern (`src/strategy/`)
Each CLI command is implemented as a strategy:
- `init-strategy.ts` - `-i` flag, initialize config with private key (onboarding)
- `list-strategy.ts` - `-l` flag, lists markets (uses cache, fetches if expired)
- `refresh-strategy.ts` - `-r` flag, refreshes the local market cache
- `buy-strategy.ts` - `-b` flag, buy orders
- `sell-strategy.ts` - `-s` flag, sell orders
- `allowance-strategy.ts` - `-a` flag, set USDC allowance
- `order-book-strategy.ts` - `-o` flag, show order book
- `cancel-all-strategy.ts` - `-c` flag, cancel all orders
- `api-keys-strategy.ts` - `-k` flag, derive/show API keys

`context.ts` determines which strategy to use based on CLI options.

### Configuration Files (User's machine)
Located in `~/.pmarket-cli/`:
- `config.json` - Just `{ "privateKey": "0x..." }`
- `credentials.json` - Auto-generated API credentials
- `cache.db` - SQLite database for market cache

## Key Design Decisions

1. **Simplified Config**: User only needs to provide `privateKey`. RPC defaults to public Polygon RPC, funder address is derived from private key, API keys are auto-generated.

2. **ESM Modules**: Uses `"type": "module"` in package.json. All imports use `.js` extension (TypeScript requirement for Node16 module resolution).

3. **No NestJS**: Removed in v0.8.0 modernization. Services are plain classes with constructor injection.

4. **Lazy Initialization**: `PolymarketService` lazily initializes the CLOB client on first API call via `ensureInitialized()`.

5. **SQLite Caching**: Markets are cached locally for 1 hour. Use `-r` flag to force refresh.

## Common Tasks

### Adding a New CLI Command

1. Create `src/strategy/new-strategy.ts` implementing `Strategy` interface
2. Add option to `src/program.ts`
3. Add case in `src/strategy/context.ts` `determineStrategy()`
4. Add test in `src/strategy/context.spec.ts`

### Modifying Market Data

Market type is defined in `src/services/polymarket.service.ts` as `Market` interface. Cache schema is in `cache.service.ts`.

### Running Tests

```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- path/to/file   # Single file
```

Tests use `@jest/globals` imports for ESM compatibility.

## Build & Test Commands

```bash
npm run build    # Compile TypeScript to dist/
npm test         # Run Jest tests
npm start        # Run compiled CLI
```

## Important Files

| File | Description |
|------|-------------|
| `package.json` | Dependencies, scripts, `"type": "module"` |
| `tsconfig.json` | TypeScript config (ES2022, Node16 modules) |
| `jest.config.cjs` | Jest config for ESM |
| `src/main.ts` | Entry point |
| `src/program.ts` | CLI argument definitions |
| `scripts/create-config.js` | Postinstall script for config setup |

## Testing with Custom Config Directory

**IMPORTANT**: When manually testing CLI commands, always use a test directory to avoid overwriting the user's real config:

```bash
# Use a temp directory for testing
PMARKET_CONFIG_DIR=/tmp/pmarket-test node dist/main.js -i 0xTEST_KEY

# Or export for the session
export PMARKET_CONFIG_DIR=/tmp/pmarket-test
node dist/main.js -l "Bitcoin"
```

The `PMARKET_CONFIG_DIR` environment variable overrides the default `~/.pmarket-cli/` directory.

## Gotchas

1. **Import Extensions**: Always use `.js` in imports even for `.ts` files (Node16 module resolution)
2. **Jest ESM**: Tests must import from `@jest/globals` for `jest`, `describe`, `it`, `expect`
3. **better-sqlite3**: Native module, requires rebuild on Node version changes
4. **API Key Types**: `@polymarket/clob-client` returns `ApiKeyCreds` with `key`/`secret`/`passphrase` fields
5. **Testing**: ALWAYS use `PMARKET_CONFIG_DIR` env var when manually testing to avoid overwriting user's real config

## External APIs

- **Polymarket CLOB API**: `https://clob.polymarket.com/`
- **Polygon RPC** (default): `https://polygon-rpc.com`
- **USDC Contract** (Polygon): `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- **CTFExchange Contract**: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
