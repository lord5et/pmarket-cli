import { ClobClient, ApiKeyCreds, Chain, OrderType, Side } from "@polymarket/clob-client";
import { ethers } from "ethers";
import axios from "axios";
import { ConfigService } from "./config.service.js";

const CLOB_API_ENDPOINT = "https://clob.polymarket.com/";
const DATA_API_ENDPOINT = "https://data-api.polymarket.com";

interface Token {
  token_id: string;
  outcome: string;
  price: number;
  winner: boolean;
}

interface Rewards {
  incentiveProgram: string;
  totalRewardPool: string;
}

export interface Market {
  condition_id: string;
  question_id: string;
  tokens: [Token, Token];
  rewards: Rewards;
  minimum_order_size: string;
  minimum_tick_size: string;
  description: string;
  category: string;
  end_date_iso: string;
  game_start_time: string | null;
  question: string;
  market_slug: string;
  min_incentive_size: string;
  max_incentive_spread: string;
  active: boolean;
  closed: boolean;
  seconds_delay: number;
  icon: string;
  fpmm: string;
}

interface MarketsResponse {
  limit: number;
  count: number;
  next_cursor: string;
  data: Market[];
}

export class PolymarketService {
  clobClient: ClobClient | undefined;
  signer: ethers.Wallet | undefined;
  private configService: ConfigService;
  private initialized = false;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.initializeWallet();
  }

  private initializeWallet(): void {
    const privateKey = this.configService.getPrivateKey();
    if (!privateKey) {
      console.log("Please provide a valid private key in ~/.pmarket-cli/config.json");
      return;
    }

    const provider = new ethers.providers.JsonRpcProvider(
      this.configService.getRpcProvider()
    );

    try {
      this.signer = new ethers.Wallet(privateKey, provider);
    } catch {
      console.log("Please provide a valid private key in ~/.pmarket-cli/config.json");
      return;
    }
  }

  private async ensureInitialized(requireCreds = false): Promise<void> {
    if (this.initialized && this.clobClient) {
      // If we need creds but don't have them, re-initialize with creds
      if (requireCreds && !this.configService.hasCredentials()) {
        this.initialized = false;
      } else {
        return;
      }
    }

    if (!this.signer) {
      throw new Error("Wallet not initialized. Please check your private key.");
    }

    const funderAddress = this.configService.getFunderAddress();
    let creds = this.configService.getCreds();

    // Auto-derive credentials if needed and not available
    if (requireCreds && !creds) {
      console.log("API credentials required. Deriving credentials...");

      // Create a temporary client to derive credentials
      const tempClient = new ClobClient(
        CLOB_API_ENDPOINT,
        Chain.POLYGON,
        this.signer,
        undefined,
        0, // SignatureType.EOA for regular wallets
        funderAddress
      );

      try {
        const derivedCreds = await tempClient.deriveApiKey() as ApiKeyCreds & { error?: string };

        if (!derivedCreds.error && derivedCreds.key && derivedCreds.secret && derivedCreds.passphrase) {
          this.configService.saveCredentials(derivedCreds.key, derivedCreds.secret, derivedCreds.passphrase);
          creds = { key: derivedCreds.key, secret: derivedCreds.secret, passphrase: derivedCreds.passphrase };
        } else {
          throw new Error("Derive failed, creating new key");
        }
      } catch {
        console.log("Creating new API key...");
        const newCreds = await tempClient.createApiKey();

        // The response should have key, secret, passphrase fields
        if (!newCreds.key || !newCreds.secret || !newCreds.passphrase) {
          console.error("Failed to get valid API credentials");
          throw new Error("Failed to create API credentials - missing required fields");
        }

        this.configService.saveCredentials(newCreds.key, newCreds.secret, newCreds.passphrase);
        creds = { key: newCreds.key, secret: newCreds.secret, passphrase: newCreds.passphrase };
      }
    }

    if (creds) {
      this.clobClient = new ClobClient(
        CLOB_API_ENDPOINT,
        Chain.POLYGON,
        this.signer,
        creds,
        0, // SignatureType.EOA for regular wallets
        funderAddress
      );
    } else {
      this.clobClient = new ClobClient(
        CLOB_API_ENDPOINT,
        Chain.POLYGON,
        this.signer,
        undefined,
        0, // SignatureType.EOA for regular wallets
        funderAddress
      );
    }

    this.initialized = true;
  }

  async fetchAllMarkets(): Promise<Market[]> {
    await this.ensureInitialized();
    if (!this.clobClient) {
      throw new Error("CLOB client not initialized");
    }

    const allMarkets: Market[] = [];
    let nextCursor = "";

    while (true) {
      const response: MarketsResponse = await this.clobClient.getMarkets(nextCursor);
      allMarkets.push(...response.data);

      if (response.next_cursor === "LTE=" || !response.next_cursor) {
        break;
      }

      nextCursor = response.next_cursor;
    }

    return allMarkets;
  }

  async getMarketsAcceptingOrders(): Promise<Array<{ yes: Token; no: Token; question: string }>> {
    const markets = await this.fetchAllMarkets();
    return markets
      .filter((market) => !market.closed && market.active)
      .map((market) => {
        return {
          yes: market.tokens[0],
          no: market.tokens[1],
          question: market.question,
        };
      });
  }

  async marketOrder(
    tokenID: string,
    side: Side,
    size: number,
    price: number
  ): Promise<unknown> {
    await this.ensureInitialized(true); // Requires credentials
    if (!this.clobClient) {
      throw new Error("CLOB client not initialized");
    }

    const orderBook = await this.clobClient.getOrderBook(tokenID) as { neg_risk?: boolean };
    const isNegRisk = orderBook.neg_risk === true;

    console.log(`Creating ${side} order: ${size} shares at $${price}${isNegRisk ? ' (neg_risk market)' : ''}`);

    const marketOrder = await this.clobClient.createOrder({
      tokenID: tokenID,
      price: price,
      side: side,
      size: size,
      feeRateBps: 0,
      nonce: 0,
      expiration: 0,
    }, { negRisk: isNegRisk });

    const resp = await this.clobClient.postOrder(marketOrder, OrderType.GTC);
    return resp;
  }

  async getOrderBook(tokenId: string): Promise<unknown> {
    await this.ensureInitialized();
    if (!this.clobClient) {
      throw new Error("CLOB client not initialized");
    }
    return this.clobClient.getOrderBook(tokenId);
  }

  async cancelAll(): Promise<unknown> {
    await this.ensureInitialized(true); // Requires credentials
    if (!this.clobClient) {
      throw new Error("CLOB client not initialized");
    }
    return this.clobClient.cancelAll();
  }

  async getApiKeys(): Promise<ApiKeyCreds> {
    // This will auto-derive credentials if needed
    await this.ensureInitialized(true);
    if (!this.clobClient) {
      throw new Error("CLOB client not initialized");
    }

    const creds = this.configService.getCreds();
    if (creds) {
      console.log("API credentials ready.");
      return creds;
    }

    throw new Error("Failed to derive API credentials");
  }

  async getPositions(): Promise<Position[]> {
    if (!this.signer) {
      throw new Error("Wallet not initialized. Please check your private key.");
    }

    const address = await this.signer.getAddress();
    const response = await axios.get<Position[]>(`${DATA_API_ENDPOINT}/positions`, {
      params: {
        user: address,
        sizeThreshold: 0.01,
        sortBy: "CURRENT",
        sortDirection: "DESC",
      },
    });

    return response.data;
  }

  getWalletAddress(): string | undefined {
    return this.signer?.address;
  }
}

export interface Position {
  asset: string;
  conditionId: string;
  curPrice: number;
  currentValue: number;
  initialValue: number;
  outcome: string;
  percentPnl: number;
  cashPnl: number;
  price: number;
  pricePerShare: number;
  proxyWallet: string | null;
  redeemable: boolean;
  size: number;
  title: string;
}
