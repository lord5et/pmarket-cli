import { PolymarketService } from "../services/polymarket.service.js";
import { CacheService } from "../services/cache.service.js";
import { Strategy } from "./strategy.js";

export class ListStrategy implements Strategy {
    constructor(
        private polymarketService: PolymarketService,
        private cacheService: CacheService
    ) { }

    async execute(options: Record<string, unknown>): Promise<void> {
        const filter = options.list as string;

        if (this.cacheService.isCacheValid()) {
            console.log('Using cached market data...');
            const cachedMarkets = this.cacheService.getCachedMarkets(filter);

            if (cachedMarkets.length === 0) {
                console.log('No markets found matching filter:', filter);
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
            console.log(`\nFound ${cachedMarkets.length} market(s). Use 'pmarket-cli -r' to refresh cache.`);
            return;
        }

        console.log('Cache expired or empty. Fetching market data...');
        const allMarkets = await this.polymarketService.fetchAllMarkets();

        this.cacheService.cacheMarkets(allMarkets);
        console.log(`Cached ${allMarkets.length} markets.`);

        const activeMarkets = allMarkets
            .filter(market => !market.closed && market.active)
            .filter(market => market.question.toLowerCase().includes(filter.toLowerCase()))
            .map(market => ({
                yes: market.tokens[0],
                no: market.tokens[1],
                question: market.question
            }));

        if (activeMarkets.length === 0) {
            console.log('No markets found matching filter:', filter);
            return;
        }

        console.log(activeMarkets);
        console.log(`\nFound ${activeMarkets.length} market(s).`);
    }
}
