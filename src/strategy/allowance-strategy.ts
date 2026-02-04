import { ContractService } from "../services/contract.service.js";
import { Strategy } from "./strategy.js";

export class AllowanceStrategy implements Strategy {
    constructor(private contractService: ContractService) { }

    async execute(options: { allowance: string }): Promise<void> {
        try {
            const amount = +options.allowance;
            console.log(`Setting USDC allowance to ${amount}...`);

            const tx = await this.contractService.setAllowance(amount);
            console.log(`Transaction submitted: ${tx.hash}`);
            console.log(`View on PolygonScan: https://polygonscan.com/tx/${tx.hash}`);
            console.log('Waiting for confirmation...');

            const receipt = await tx.wait();
            console.log('');
            console.log(`Allowance set successfully!`);
            console.log(`  Amount: ${amount} USDC`);
            console.log(`  Block: ${receipt.blockNumber}`);
            console.log(`  Gas used: ${receipt.gasUsed.toString()}`);
        } catch (e) {
            console.error('Failed to set allowance:', e instanceof Error ? e.message : e);
        }
    }
}
