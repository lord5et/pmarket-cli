import { PolymarketService } from "../services/polymarket.service.js";
import { Strategy } from "./strategy.js";
import { ContractService } from "../services/contract.service.js";
import { CacheService } from "../services/cache.service.js";
import { ConfigService } from "../services/config.service.js";
import { ListStrategy } from "./list-strategy.js";
import { BuyStrategy } from "./buy-strategy.js";
import { SellStrategy } from "./sell-strategy.js";
import { AllowanceStrategy } from "./allowance-strategy.js";
import { OrderBookStrategy } from "./order-book-strategy.js";
import { CancelAllStrategy } from "./cancel-all-strategy.js";
import { ApiKeysStrategy } from "./api-keys-strategy.js";
import { RefreshStrategy } from "./refresh-strategy.js";
import { InitStrategy } from "./init-strategy.js";
import { PositionsStrategy } from "./positions-strategy.js";
import { RedeemStrategy } from "./redeem-strategy.js";

export class Context {
    private strategy: Strategy | undefined;

    constructor(
        private polymarketService: PolymarketService,
        private contractService: ContractService,
        private cacheService: CacheService,
        private configService: ConfigService
    ) { }

    setStrategy = (strategy: Strategy): void => {
        this.strategy = strategy;
    }

    executeStrategy = async (options: Record<string, unknown>): Promise<void> => {
        if (this.strategy) {
            await this.strategy.execute(options);
        }
    }

    determineStrategy = (options: Record<string, unknown>): Strategy | undefined => {
        // Init should be checked first - it works without a valid private key
        if (options.init) {
            return new InitStrategy(this.configService);
        }
        if (options.list) {
            return new ListStrategy(this.cacheService);
        }
        if (options.refresh) {
            return new RefreshStrategy(this.polymarketService, this.cacheService);
        }
        if (options.buy && Array.isArray(options.buy) && options.buy.length === 3) {
            return new BuyStrategy(this.polymarketService);
        }
        if (options.sell && Array.isArray(options.sell) && options.sell.length === 3) {
            return new SellStrategy(this.polymarketService);
        }
        if (options.positions) {
            return new PositionsStrategy(this.polymarketService);
        }
        if (options.allowance) {
            return new AllowanceStrategy(this.contractService);
        }
        if (options.orderBook) {
            return new OrderBookStrategy(this.polymarketService);
        }
        if (options.cancelAll) {
            return new CancelAllStrategy(this.polymarketService);
        }
        if (options.keys) {
            return new ApiKeysStrategy(this.polymarketService);
        }
        if (options.redeem) {
            return new RedeemStrategy(this.polymarketService, this.contractService);
        }
        return undefined;
    }
}
