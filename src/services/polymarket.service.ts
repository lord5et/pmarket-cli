import { ClobClient, ApiKeyCreds, Chain, OrderType, Side } from "@polymarket/clob-client";
import { ethers } from "ethers";
import { ConfigService } from "./config.service.js";

const CLOB_API_ENDPOINT = "https://clob.polymarket.com/";

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
    } catch (error) {
      console.log("Please provide a valid private key in ~/.pmarket-cli/config.json");
      return;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized && this.clobClient) {
      return;
    }

    if (!this.signer) {
      throw new Error("Wallet not initialized. Please check your private key.");
    }

    const creds = this.configService.getCreds();
    const funderAddress = this.configService.getFunderAddress();

    if (creds) {
      this.clobClient = new ClobClient(
        CLOB_API_ENDPOINT,
        Chain.POLYGON,
        this.signer,
        creds,
        2,
        funderAddress
      );
    } else {
      this.clobClient = new ClobClient(
        CLOB_API_ENDPOINT,
        Chain.POLYGON,
        this.signer,
        undefined,
        2,
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
    amount: number,
    price: number
  ): Promise<unknown> {
    await this.ensureInitialized();
    if (!this.clobClient) {
      throw new Error("CLOB client not initialized");
    }

    if (side === Side.BUY) {
      amount = Math.floor(amount / price);
    }

    const orderBook = await this.clobClient.getOrderBook(tokenID);
    console.log(orderBook);
    console.log(side);
    console.log("Amount of shares/tokens: " + amount);
    console.log("Price" + price);

    const marketOrder = await this.clobClient.createOrder({
      tokenID: tokenID,
      price: price,
      side: side,
      size: amount,
      feeRateBps: 0,
      nonce: 0,
      expiration: 0,
    });
    console.log(marketOrder);

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
    await this.ensureInitialized();
    if (!this.clobClient) {
      throw new Error("CLOB client not initialized");
    }
    const resp = await this.clobClient.cancelAll();
    console.log(resp);
    return resp;
  }

  async getApiKeys(): Promise<ApiKeyCreds> {
    await this.ensureInitialized();
    if (!this.clobClient) {
      throw new Error("CLOB client not initialized");
    }

    const existingCreds = this.configService.getCreds();
    if (existingCreds) {
      console.log("Using existing API credentials from credentials.json");
      return existingCreds;
    }

    console.log("Deriving new API credentials...");
    const apiKeys = await this.clobClient.deriveApiKey() as ApiKeyCreds & { error?: string };

    if (!apiKeys.error) {
      this.configService.saveCredentials(
        apiKeys.key,
        apiKeys.secret,
        apiKeys.passphrase
      );
      return apiKeys;
    } else {
      console.log("Creating new API key...");
      const newKeys = await this.clobClient.createApiKey();
      this.configService.saveCredentials(
        newKeys.key,
        newKeys.secret,
        newKeys.passphrase
      );
      return newKeys;
    }
  }
}
