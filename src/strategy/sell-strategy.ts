import { PolymarketService } from "../services/polymarket.service.js";
import { Strategy } from "./strategy.js";
import { Side } from "@polymarket/clob-client";

export class SellStrategy implements Strategy {
    constructor(private polymarketService: PolymarketService) { }

    async execute(options: { sell: string[] }): Promise<void> {
        const tokenId = options.sell[0];
        const size = +options.sell[1];
        const price = +options.sell[2];
        try {
            const order = await this.polymarketService.marketOrder(tokenId, Side.SELL, size, price);
            console.log(order);
        } catch (error) {
            console.error(error);
        }
    }
}
