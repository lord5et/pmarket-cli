import { Command } from 'commander';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

export const getProgram = (): Command => {
  const program = new Command();
  program
    .version(version)
    .description("Command line interface for Polymarket")
    .option("-l, --list <question filter>", "List available markets with question filter. Usage: pmarket-cli -l <question filter>")
    .option("-r, --refresh", "Refresh locally cached market data. Usage: pmarket-cli -r")
    .option("-b, --buy <args...>", "Buy token order. Usage: pmarket-cli -b <token id> <size> <price>")
    .option("-s, --sell <args...>", "Sell token order. Usage: pmarket-cli -s <token id> <size> <price>")
    .option("-p, --positions", "Show current token positions. Usage: pmarket-cli -p")
    .option("-a, --allowance <amount in USDC>", "Set USDC allowance for exchange contracts. Usage: pmarket-cli -a <amount in USDC>")
    .option("-o, --orderBook <tokenId>", "Show order book for specific tokenId. Usage: pmarket-cli -o <token id>")
    .option("-c, --cancelAll", "Cancel all open orders. Usage: pmarket-cli -c")
    .option("-k, --keys", "Get or generate api keys. Usage: pmarket-cli -k")
    .option("-i, --init <privateKey>", "Initialize config with your private key. Usage: pmarket-cli -i <your-private-key>")
  return program;
}
