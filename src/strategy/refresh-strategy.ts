import { PolymarketService } from "../services/polymarket.service.js";
import { CacheService } from "../services/cache.service.js";
import { Strategy } from "./strategy.js";

export class RefreshStrategy implements Strategy {
    constructor(
        private polymarketService: PolymarketService,
        private cacheService: CacheService
    ) { }

    async execute(): Promise<void> {
        console.log('Fetching market data from Polymarket...');
        const allMarkets = await this.polymarketService.fetchAllMarkets();

        this.cacheService.cacheMarkets(allMarkets);

        const activeCount = allMarkets.filter(m => m.active && !m.closed).length;
        console.log(`Cache refreshed: ${allMarkets.length} total markets, ${activeCount} active.`);
    }
}
