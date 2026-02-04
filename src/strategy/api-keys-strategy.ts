import { PolymarketService } from "../services/polymarket.service.js";
import { Strategy } from "./strategy.js";

export class ApiKeysStrategy implements Strategy {
    constructor(private polymarketService: PolymarketService) { }

    async execute(): Promise<void> {
        const apiKeys = await this.polymarketService.getApiKeys();
        console.log(apiKeys);
    }
}
