import { ethers } from "ethers";
import { usdcContractABI } from "../abi/usdc.js";
import { conditionalTokensABI } from "../abi/conditional-tokens.js";
import { negRiskAdapterABI } from "../abi/neg-risk-adapter.js";
import { ConfigService } from "./config.service.js";

const CONDITIONAL_TOKENS_ADDRESS = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';
const NEG_RISK_ADAPTER_ADDRESS = '0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296';
const USDC_E_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

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
        } catch {
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

    async redeemPositions(conditionId: string): Promise<ethers.ContractTransaction> {
        if (!this.wallet) {
            throw new Error("Wallet not initialized");
        }

        const ctf = new ethers.Contract(CONDITIONAL_TOKENS_ADDRESS, conditionalTokensABI, this.wallet);
        const parentCollectionId = ethers.constants.HashZero;
        const indexSets = [1, 2]; // YES and NO outcomes

        const feeData = await this.polygonProvider.getFeeData();
        const minPriorityFee = ethers.utils.parseUnits('30', 'gwei');
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas.gt(minPriorityFee)
            ? feeData.maxPriorityFeePerGas
            : minPriorityFee;
        const baseFee = feeData.lastBaseFeePerGas || ethers.utils.parseUnits('30', 'gwei');
        const maxFeePerGas = baseFee.mul(2).add(maxPriorityFeePerGas);
        const txOptions = { gasLimit: 200000, maxPriorityFeePerGas, maxFeePerGas };

        const tx = await ctf.redeemPositions(
            USDC_E_ADDRESS,
            parentCollectionId,
            conditionId,
            indexSets,
            txOptions
        );
        return tx;
    }

    async redeemNegRiskPositions(conditionId: string, amounts: ethers.BigNumber[]): Promise<ethers.ContractTransaction> {
        if (!this.wallet) {
            throw new Error("Wallet not initialized");
        }

        const ctf = new ethers.Contract(CONDITIONAL_TOKENS_ADDRESS, conditionalTokensABI, this.wallet);
        const negRiskAdapter = new ethers.Contract(NEG_RISK_ADAPTER_ADDRESS, negRiskAdapterABI, this.wallet);

        // Check if NegRiskAdapter is approved to transfer ERC-1155 tokens
        const walletAddress = await this.wallet.getAddress();
        const isApproved = await ctf.isApprovedForAll(walletAddress, NEG_RISK_ADAPTER_ADDRESS);

        const feeData = await this.polygonProvider.getFeeData();
        const minPriorityFee = ethers.utils.parseUnits('30', 'gwei');
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas.gt(minPriorityFee)
            ? feeData.maxPriorityFeePerGas
            : minPriorityFee;
        const baseFee = feeData.lastBaseFeePerGas || ethers.utils.parseUnits('30', 'gwei');
        const maxFeePerGas = baseFee.mul(2).add(maxPriorityFeePerGas);
        const txOptions = { gasLimit: 300000, maxPriorityFeePerGas, maxFeePerGas };

        if (!isApproved) {
            console.log('Approving NegRiskAdapter to transfer conditional tokens...');
            const approvalTx = await ctf.setApprovalForAll(NEG_RISK_ADAPTER_ADDRESS, true, txOptions);
            console.log(`Approval tx submitted: ${approvalTx.hash}`);
            await approvalTx.wait();
            console.log('Approval confirmed.');
            console.log('');
        }

        const tx = await negRiskAdapter.redeemPositions(conditionId, amounts, txOptions);
        return tx;
    }
}
