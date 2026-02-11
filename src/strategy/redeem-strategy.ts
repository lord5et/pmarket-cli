import { ethers } from "ethers";
import { PolymarketService } from "../services/polymarket.service.js";
import { ContractService } from "../services/contract.service.js";
import { Strategy } from "./strategy.js";

interface GroupedPosition {
    title: string;
    yesSize: number;
    noSize: number;
}

export class RedeemStrategy implements Strategy {
    constructor(
        private polymarketService: PolymarketService,
        private contractService: ContractService
    ) { }

    async execute(): Promise<void> {
        try {
            const address = this.polymarketService.getWalletAddress();
            console.log(`Fetching redeemable positions for ${address}...`);
            console.log('');

            const positions = await this.polymarketService.getPositions();
            const redeemable = positions.filter(p => p.redeemable);

            if (redeemable.length === 0) {
                console.log('No redeemable positions found.');
                return;
            }

            // Group by conditionId
            const grouped = new Map<string, GroupedPosition>();
            for (const pos of redeemable) {
                const current = grouped.get(pos.conditionId) || { title: pos.title, yesSize: 0, noSize: 0 };
                if (pos.outcome === 'Yes') {
                    current.yesSize = pos.size;
                } else {
                    current.noSize = pos.size;
                }
                grouped.set(pos.conditionId, current);
            }

            console.log(`Found ${grouped.size} resolved market(s) with redeemable positions:`);
            console.log('');

            for (const [conditionId, data] of grouped) {
                const sizes = [];
                if (data.yesSize > 0) sizes.push(`Yes: ${data.yesSize.toFixed(2)}`);
                if (data.noSize > 0) sizes.push(`No: ${data.noSize.toFixed(2)}`);
                console.log(`  ${data.title}`);
                console.log(`  Condition: ${conditionId}`);
                console.log(`  Shares: ${sizes.join(', ')}`);
                console.log('');
            }

            console.log('Redeeming positions...');
            console.log('');

            let redeemed = 0;
            const delay = (seconds: number) => {
                console.log(`  Waiting ${seconds}s to avoid RPC rate limits...`);
                return new Promise(resolve => setTimeout(resolve, seconds * 1000));
            };

            for (const [conditionId, data] of grouped) {
                console.log(`Redeeming: ${data.title}`);

                try {
                    // Check if user holds USDC.e-backed tokens (standard) or wrapped collateral tokens (neg_risk)
                    const isStandard = await this.contractService.isStandardRedemption(conditionId);
                    await delay(5);

                    if (isStandard) {
                        console.log('  Detected: standard market');
                        const tx = await this.contractService.redeemPositions(conditionId);
                        console.log(`  tx submitted: ${tx.hash}`);
                        await tx.wait();
                        console.log('  Confirmed (standard market)');
                    } else {
                        console.log('  Detected: neg_risk market');
                        const amounts = [
                            ethers.utils.parseUnits(data.yesSize.toFixed(6), 6),
                            ethers.utils.parseUnits(data.noSize.toFixed(6), 6)
                        ];
                        const tx = await this.contractService.redeemNegRiskPositions(conditionId, amounts);
                        console.log(`  tx submitted: ${tx.hash}`);
                        await tx.wait();
                        console.log('  Confirmed (neg_risk market)');
                    }
                    redeemed++;
                } catch (error) {
                    const msg = error instanceof Error ? error.message : String(error);
                    console.error(`  Failed to redeem: ${msg}`);
                }

                console.log('');

                // Delay between redemptions to avoid RPC rate limits
                if (grouped.size > 1) {
                    await delay(15);
                }
            }

            console.log(`Redeemed ${redeemed}/${grouped.size} market(s). USDC.e has been returned to your wallet.`);
        } catch (error) {
            if (error instanceof Error) {
                console.error('Failed to redeem positions:', error.message);
            } else {
                console.error('Failed to redeem positions:', error);
            }
        }
    }
}
