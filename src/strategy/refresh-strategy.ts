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
        this.cacheService.clearCache();
        const totalCount = await this.polymarketService.fetchAllMarketsStreaming(this.cacheService);
        console.log(`Cache refreshed: ${totalCount} total markets.`);
    }
}
