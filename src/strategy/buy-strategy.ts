import { Side } from "@polymarket/clob-client";
import { Strategy } from "./strategy.js";
import { PolymarketService } from "../services/polymarket.service.js";

export class BuyStrategy implements Strategy {
    constructor(private polymarketService: PolymarketService) { }

    async execute(options: { buy: string[] }): Promise<void> {
        const tokenId = options.buy[0];
        const size = +options.buy[1];
        const price = +options.buy[2];
        try {
            const order = await this.polymarketService.marketOrder(tokenId, Side.BUY, size, price);
            console.log(order);
        } catch (error) {
            console.error(error);
        }
    }
}
