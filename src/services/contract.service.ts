import { ethers } from "ethers";
import { usdcContractABI } from "../abi/usdc.js";
import { ConfigService } from "./config.service.js";

export class ContractService {
    polygonProvider: ethers.providers.JsonRpcProvider;
    wallet: ethers.Wallet | undefined;

    constructor(private configService: ConfigService) {
        this.polygonProvider = new ethers.providers.JsonRpcProvider(
            this.configService.getRpcProvider()
        );
        try {
            this.wallet = new ethers.Wallet(
                this.configService.getPrivateKey(),
                this.polygonProvider
            );
        } catch (error) {
            console.log("Please provide valid private key in config.json file");
        }
    }

    async setAllowance(amountOfAllowedUSDC: number): Promise<{ ctf: ethers.ContractTransaction; negRisk: ethers.ContractTransaction; negRiskAdapter: ethers.ContractTransaction }> {
        if (!this.wallet) {
            throw new Error("Wallet not initialized");
        }
        const usdcContractAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
        const usdcContract = new ethers.Contract(usdcContractAddress, usdcContractABI, this.wallet);

        // CTFExchange for regular markets
        const ctfExchangeAddress = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';
        // NegRiskExchange for neg_risk markets
        const negRiskExchangeAddress = '0xC5d563A36AE78145C45a50134d48A1215220f80a';
        // NegRiskAdapter for neg_risk markets
        const negRiskAdapterAddress = '0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296';

        const allowanceValue = ethers.utils.parseUnits(amountOfAllowedUSDC.toString(), '6');

        // Get current gas prices from the network
        const feeData = await this.polygonProvider.getFeeData();

        // Polygon requires minimum 25 gwei priority fee, use 30 gwei to be safe
        const minPriorityFee = ethers.utils.parseUnits('30', 'gwei');
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas.gt(minPriorityFee)
            ? feeData.maxPriorityFeePerGas
            : minPriorityFee;

        // Max fee = base fee * 2 + priority fee (to handle base fee fluctuations)
        const baseFee = feeData.lastBaseFeePerGas || ethers.utils.parseUnits('30', 'gwei');
        const maxFeePerGas = baseFee.mul(2).add(maxPriorityFeePerGas);

        const gasLimit = 100000;
        const txOptions = { gasLimit, maxPriorityFeePerGas, maxFeePerGas };

        const delay = (seconds: number) => {
            console.log(`Waiting ${seconds} seconds to avoid RPC rate limits...`);
            return new Promise(resolve => setTimeout(resolve, seconds * 1000));
        };

        console.log('Setting allowance for CTFExchange...');
        const ctfTx = await usdcContract.approve(ctfExchangeAddress, allowanceValue, txOptions);
        console.log(`CTFExchange tx submitted: ${ctfTx.hash}`);
        console.log('Waiting for confirmation...');
        await delay(15);
        await ctfTx.wait();
        console.log('CTFExchange allowance confirmed!');
        console.log('');

        await delay(30);

        console.log('Setting allowance for NegRiskExchange...');
        const negRiskTx = await usdcContract.approve(negRiskExchangeAddress, allowanceValue, txOptions);
        console.log(`NegRiskExchange tx submitted: ${negRiskTx.hash}`);
        console.log('Waiting for confirmation...');
        await delay(15);
        await negRiskTx.wait();
        console.log('NegRiskExchange allowance confirmed!');
        console.log('');

        await delay(30);

        console.log('Setting allowance for NegRiskAdapter...');
        const negRiskAdapterTx = await usdcContract.approve(negRiskAdapterAddress, allowanceValue, txOptions);

        return { ctf: ctfTx, negRisk: negRiskTx, negRiskAdapter: negRiskAdapterTx };
    }
}
