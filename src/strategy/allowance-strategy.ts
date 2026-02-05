import { ContractService } from "../services/contract.service.js";
import { Strategy } from "./strategy.js";

export class AllowanceStrategy implements Strategy {
    constructor(private contractService: ContractService) { }

    async execute(options: { allowance: string }): Promise<void> {
        try {
            const amount = +options.allowance;
            console.log(`Setting USDC allowance to ${amount} for all exchanges...`);
            console.log('');

            const { ctf, negRisk, negRiskAdapter } = await this.contractService.setAllowance(amount);

            // CTFExchange and NegRiskExchange already confirmed in service
            console.log(`CTFExchange tx: https://polygonscan.com/tx/${ctf.hash}`);
            console.log(`NegRiskExchange tx: https://polygonscan.com/tx/${negRisk.hash}`);

            // Wait for NegRiskAdapter approval
            console.log(`NegRiskAdapter tx: https://polygonscan.com/tx/${negRiskAdapter.hash}`);
            console.log('Waiting for NegRiskAdapter confirmation...');
            const adapterReceipt = await negRiskAdapter.wait();
            console.log(`NegRiskAdapter allowance confirmed! Block: ${adapterReceipt.blockNumber}`);
            console.log('');

            console.log(`Allowance set successfully for all exchanges!`);
            console.log(`  Amount: ${amount} USDC`);
            console.log(`  Contracts:`);
            console.log(`    - CTFExchange: 0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`);
            console.log(`    - NegRiskExchange: 0xC5d563A36AE78145C45a50134d48A1215220f80a`);
            console.log(`    - NegRiskAdapter: 0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296`);
        } catch (e) {
            console.error('Failed to set allowance:', e instanceof Error ? e.message : e);
        }
    }
}
