import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { ApiKeyCreds } from "@polymarket/clob-client";
import { ethers } from "ethers";

const PMARKET_CLI_DIR = '.pmarket-cli';
const CONFIG_FILE = 'config.json';
const CREDENTIALS_FILE = 'credentials.json';
const DEFAULT_RPC_PROVIDER = 'https://polygon-rpc.com';

interface Config {
    privateKey: string;
}

interface Credentials {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
    derivedAt: string;
}

export class ConfigService {
    private config: Config;
    private credentials: Credentials | null = null;
    private configDir: string;
    private configPath: string;
    private credentialsPath: string;

    constructor() {
        // Allow override via environment variable for testing
        this.configDir = process.env.PMARKET_CONFIG_DIR || join(homedir(), PMARKET_CLI_DIR);
        this.configPath = join(this.configDir, CONFIG_FILE);
        this.credentialsPath = join(this.configDir, CREDENTIALS_FILE);

        this.ensureConfigDir();
        this.config = this.loadOrCreateConfig();
        this.loadCredentials();
    }

    private ensureConfigDir(): void {
        if (!existsSync(this.configDir)) {
            mkdirSync(this.configDir, { recursive: true });
        }
    }

    private loadOrCreateConfig(): Config {
        if (existsSync(this.configPath)) {
            const raw = readFileSync(this.configPath, 'utf8');
            return JSON.parse(raw) as Config;
        }

        const defaultConfig: Config = {
            privateKey: ''
        };
        writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 4));
        return defaultConfig;
    }

    private loadCredentials(): void {
        if (existsSync(this.credentialsPath)) {
            const raw = readFileSync(this.credentialsPath, 'utf8');
            this.credentials = JSON.parse(raw) as Credentials;
        }
    }

    isConfigAvailable(): boolean {
        return existsSync(this.configPath);
    }

    getPrivateKey(): string {
        return this.config.privateKey;
    }

    getRpcProvider(): string {
        return DEFAULT_RPC_PROVIDER;
    }

    getFunderAddress(): string {
        if (!this.config.privateKey) {
            return '';
        }
        try {
            const wallet = new ethers.Wallet(this.config.privateKey);
            return wallet.address;
        } catch {
            return '';
        }
    }

    hasCredentials(): boolean {
        return this.credentials !== null &&
            Boolean(this.credentials.apiKey) &&
            Boolean(this.credentials.apiSecret) &&
            Boolean(this.credentials.passphrase);
    }

    getCreds(): ApiKeyCreds | null {
        if (!this.credentials) {
            return null;
        }
        return {
            key: this.credentials.apiKey,
            secret: this.credentials.apiSecret,
            passphrase: this.credentials.passphrase
        };
    }

    saveCredentials(apiKey: string, apiSecret: string, passphrase: string): void {
        this.credentials = {
            apiKey,
            apiSecret,
            passphrase,
            derivedAt: new Date().toISOString()
        };
        writeFileSync(this.credentialsPath, JSON.stringify(this.credentials, null, 4));
        console.log('API credentials saved to', this.credentialsPath);
    }

    savePrivateKey(privateKey: string): { success: boolean; address?: string; error?: string } {
        // Validate the private key by trying to create a wallet
        try {
            const wallet = new ethers.Wallet(privateKey);
            this.config.privateKey = privateKey;
            writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));
            return { success: true, address: wallet.address };
        } catch {
            return { success: false, error: 'Invalid private key format' };
        }
    }

    getConfigDir(): string {
        return this.configDir;
    }

    getConfigPath(): string {
        return this.configPath;
    }
}
