import { PolymarketService } from "../services/polymarket.service.js";
import { Strategy } from "./strategy.js";

export class CancelAllStrategy implements Strategy {
    constructor(private polymarketService: PolymarketService) { }

    async execute(): Promise<void> {
        try {
            await this.polymarketService.cancelAll();
        } catch (e) {
            console.error(e);
        }
    }
}
