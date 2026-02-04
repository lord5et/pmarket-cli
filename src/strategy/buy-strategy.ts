import { Side } from "@polymarket/clob-client";
import { Strategy } from "./strategy.js";
import { PolymarketService } from "../services/polymarket.service.js";

export class BuyStrategy implements Strategy {
    constructor(private polymarketService: PolymarketService) { }

    async execute(options: { buy: string[] }): Promise<void> {
        const token_id = options.buy[0];
        const amountInDollars = +options.buy[1];
        const price = +options.buy[2];
        try {
            const order = await this.polymarketService.marketOrder(token_id, Side.BUY, amountInDollars, price);
            console.log(order);
        } catch (error) {
            console.error(error);
        }
    }
}
