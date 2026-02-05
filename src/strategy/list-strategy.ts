import { CacheService } from "../services/cache.service.js";
import { Strategy } from "./strategy.js";

export class ListStrategy implements Strategy {
    constructor(
        private cacheService: CacheService
    ) { }

    async execute(options: Record<string, unknown>): Promise<void> {
        const filter = options.list as string;

        if (!this.cacheService.hasCache()) {
            console.log('No cached market data found.');
            console.log('Run "pmarket-cli -r" to fetch market data first.');
            return;
        }

        const cacheAge = this.cacheService.getCacheAge();
        const cachedMarkets = this.cacheService.getCachedMarkets(filter);

        if (cachedMarkets.length === 0) {
            console.log(`No markets found matching filter: ${filter}`);
            console.log(`\nCache last updated: ${cacheAge}. Run "pmarket-cli -r" to refresh.`);
            return;
        }

        const formattedMarkets = cachedMarkets.map(market => ({
            yes: {
                token_id: market.yes_token_id,
                outcome: market.yes_outcome
            },
            no: {
                token_id: market.no_token_id,
                outcome: market.no_outcome
            },
            question: market.question
        }));

        console.log(formattedMarkets);
        console.log(`\nFound ${cachedMarkets.length} market(s). Cache last updated: ${cacheAge}.`);
        console.log('Run "pmarket-cli -r" to refresh cache.');
    }
}
