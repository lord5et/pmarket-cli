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

    async setAllowance(amountOfAllowedUSDC: number): Promise<ethers.ContractTransaction> {
        if (!this.wallet) {
            throw new Error("Wallet not initialized");
        }
        const usdcContractAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
        const usdcContract = new ethers.Contract(usdcContractAddress, usdcContractABI, this.wallet);
        const spenderAddress = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';
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
        const approveResponse = await usdcContract.approve(spenderAddress, allowanceValue, {
            gasLimit,
            maxPriorityFeePerGas,
            maxFeePerGas
        });
        return approveResponse;
    }
}
