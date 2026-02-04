import { PolymarketService } from "../services/polymarket.service.js";
import { Strategy } from "./strategy.js";
import { Side } from "@polymarket/clob-client";

export class SellStrategy implements Strategy {
    constructor(private polymarketService: PolymarketService) { }

    async execute(options: { sell: string[] }): Promise<void> {
        const token_id = options.sell[0];
        const amountOfTokens = +options.sell[1];
        const price = +options.sell[2];
        try {
            const order = await this.polymarketService.marketOrder(token_id, Side.SELL, amountOfTokens, price);
            console.log(order);
        } catch (e) {
            console.error(e);
        }
    }
}
