#!/usr/bin/env node
import 'dotenv/config';
import { getProgram } from './program.js';
import { ConfigService } from './services/config.service.js';
import { PolymarketService } from './services/polymarket.service.js';
import { ContractService } from './services/contract.service.js';
import { CacheService } from './services/cache.service.js';
import { Context } from './strategy/context.js';
import { InitStrategy } from './strategy/init-strategy.js';
async function main() {
    const program = getProgram();
    if (!process.argv.slice(2).length) {
        program.outputHelp();
        return;
    }
    const options = program.parse(process.argv).opts();
    // Handle init command separately - it only needs ConfigService
    // and should not trigger warnings from other services
    if (options.init) {
        const config = new ConfigService();
        const initStrategy = new InitStrategy(config);
        await initStrategy.execute(options);
        return;
    }
    const config = new ConfigService();
    const cache = new CacheService(config);
    const polymarket = new PolymarketService(config);
    const contract = new ContractService(config);
    const context = new Context(polymarket, contract, cache, config);
    const strategy = context.determineStrategy(options);
    if (strategy) {
        context.setStrategy(strategy);
        await context.executeStrategy(options);
    }
}
main().catch(console.error);
//# sourceMappingURL=main.js.map