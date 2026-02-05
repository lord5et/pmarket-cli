import { PolymarketService, Position } from "../services/polymarket.service.js";
import { Strategy } from "./strategy.js";

export class PositionsStrategy implements Strategy {
    constructor(private polymarketService: PolymarketService) { }

    async execute(): Promise<void> {
        try {
            const address = this.polymarketService.getWalletAddress();
            console.log(`Fetching positions for ${address}...`);
            console.log('');

            const positions = await this.polymarketService.getPositions();

            if (positions.length === 0) {
                console.log('No open positions found.');
                return;
            }

            // Calculate totals
            const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
            const totalPnl = positions.reduce((sum, p) => sum + p.cashPnl, 0);

            // Print table header
            console.log('┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐');
            console.log('│ CURRENT POSITIONS                                                                                       │');
            console.log('├──────────────────────────────────────────────────────┬────────┬──────────┬──────────┬──────────┬────────┤');
            console.log('│ Market                                               │ Side   │ Size     │ Price    │ Value    │ P&L    │');
            console.log('├──────────────────────────────────────────────────────┼────────┼──────────┼──────────┼──────────┼────────┤');

            for (const position of positions) {
                const title = this.truncate(position.title, 50);
                const outcome = position.outcome.padEnd(6);
                const size = position.size.toFixed(2).padStart(8);
                const price = `$${position.curPrice.toFixed(2)}`.padStart(8);
                const value = `$${position.currentValue.toFixed(2)}`.padStart(8);
                const pnl = this.formatPnl(position.cashPnl);

                console.log(`│ ${title} │ ${outcome} │ ${size} │ ${price} │ ${value} │ ${pnl} │`);
            }

            console.log('├──────────────────────────────────────────────────────┴────────┴──────────┴──────────┼──────────┼────────┤');
            console.log(`│ TOTAL                                                                               │ $${totalValue.toFixed(2).padStart(7)} │ ${this.formatPnl(totalPnl)} │`);
            console.log('└─────────────────────────────────────────────────────────────────────────────────────┴──────────┴────────┘');
            console.log('');
            console.log(`${positions.length} position(s) found.`);
        } catch (error) {
            if (error instanceof Error) {
                console.error('Failed to fetch positions:', error.message);
            } else {
                console.error('Failed to fetch positions:', error);
            }
        }
    }

    private truncate(str: string, maxLength: number): string {
        if (str.length <= maxLength) {
            return str.padEnd(maxLength);
        }
        return str.slice(0, maxLength - 3) + '...';
    }

    private formatPnl(pnl: number): string {
        const sign = pnl >= 0 ? '+' : '';
        return `${sign}$${pnl.toFixed(2)}`.padStart(6);
    }
}
