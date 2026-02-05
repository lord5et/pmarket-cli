import { ConfigService } from "../services/config.service.js";
import { Strategy } from "./strategy.js";

export class InitStrategy implements Strategy {
    constructor(private configService: ConfigService) { }

    async execute(options: Record<string, unknown>): Promise<void> {
        const privateKey = options.init as string;

        if (!privateKey) {
            console.log('Please provide a private key: pmarket-cli -i <your-private-key>');
            return;
        }

        // Normalize the private key (add 0x prefix if missing)
        const normalizedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

        const result = this.configService.savePrivateKey(normalizedKey);

        if (result.success) {
            console.log('Configuration saved successfully!');
            console.log('');
            console.log('Wallet address:', result.address);
            console.log('Config file:', this.configService.getConfigPath());
            console.log('');
            console.log('Next steps:');
            console.log('  1. Fund your wallet with MATIC (for gas) and USDC.e (for trading)');
            console.log('     IMPORTANT: Use USDC.e (bridged USDC at 0x2791...), NOT native USDC!');
            console.log('  2. Set USDC allowance: pmarket-cli -a 500');
            console.log('  3. Refresh market cache: pmarket-cli -r');
            console.log('  4. List markets: pmarket-cli -l "Bitcoin"');
        } else {
            console.error('Error:', result.error);
            console.log('');
            console.log('Make sure you provide a valid Ethereum private key.');
            console.log('Example: pmarket-cli -i 0x1234567890abcdef...');
        }
    }
}
