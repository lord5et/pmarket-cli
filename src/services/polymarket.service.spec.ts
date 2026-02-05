import { jest } from '@jest/globals';
import {
  ClobClient,
  OrderBookSummary,
  OrderType,
} from "@polymarket/clob-client";
import { ConfigService } from "./config.service.js";
import { Market, PolymarketService } from "./polymarket.service.js";
import { ethers } from "ethers";
import { Side, SignatureType, SignedOrder } from "@polymarket/order-utils";
import { Side as ClobClientSide } from "@polymarket/clob-client";

const markets: Market[] = [
  {
    condition_id:
      "0xa00a22b16d602abf9ed695404df68a71ddd4ef05573bf9590de4f0fccf096c93",
    question_id:
      "0xaf090077f0db7aa7f97051e04fcd764d86970004a37b3150ae7a681b5b3e495c",
    tokens: [
      {
        token_id:
          "9629446620718684243744463725282080039675086062123106562256171337393905586388",
        outcome: "No",
        price: 0.56,
        winner: false,
      },
      {
        token_id:
          "43232097181918994738032241755006123258571385315939394755006203919277954135565",
        outcome: "Yes",
        price: 0.56,
        winner: false,
      },
    ],
    rewards: { incentiveProgram: "aadas", totalRewardPool: "sadasdas" },
    description:
      'This market will resolve to "Yes" if the Boston Celtics become the 2022-23 NBA Champion.',
    question: "Will the Celtics be the 2022-23 NBA Champion?",
    active: true,
    closed: true,
    end_date_iso: "2023-06-17",
    game_start_time: null,
    seconds_delay: 0,
    minimum_order_size: "15",
    minimum_tick_size: "0.01",
    market_slug: "will-the-celtics-be-the-2022-23-nba-champion",
    icon: "https://polymarket-upload.s3.us-east-2.amazonaws.com/celtics.png",
    fpmm: "0x34EC3128703f4aC2D990A04776Bd5A0E451f6088",
    min_incentive_size: "0",
    max_incentive_spread: "0.2",
    category: "adsadsa",
  },
  {
    condition_id:
      "0x757fe19cced3f2136ef1dc0e0163b9996a68a330a8d2338835e3b81a31fcac91",
    question_id:
      "0x8c7336ccc387ba779bfa886a638e6d81ecfb315c4ebdd7b099f505a16ce5f860",
    tokens: [
      {
        token_id:
          "14811968980410449224099097755442778591369245152075435522945362809904270343154",
        outcome: "Yes",
        price: 0.56,
        winner: false,
      },
      {
        token_id:
          "57430235197990449398919000106517296481235279294973890917683113058548298509870",
        outcome: "No",
        price: 0.56,
        winner: false,
      },
    ],
    rewards: { incentiveProgram: "aadas", totalRewardPool: "sadasdas" },
    description:
      "This market will resolve to \"Yes\" if Vivek Ramaswamy wins the 2024 nomination.",
    question:
      "Will Vivek Ramaswamy win the U.S. 2024 Republican presidential nomination?",
    active: true,
    closed: false,
    end_date_iso: "2024-09-10",
    game_start_time: null,
    seconds_delay: 0,
    minimum_order_size: "15",
    minimum_tick_size: "0.01",
    market_slug:
      "will-vivek-ramaswamy-win-the-us-2024-republican-presidential-nomination",
    icon: "https://polymarket-upload.s3.us-east-2.amazonaws.com/vivek+ramaswamy.png",
    fpmm: "0x055e0D264A2f865c7D5c0A58A2229F66135530FD",
    min_incentive_size: "0",
    max_incentive_spread: "0.2",
    category: "adsadsa",
  },
];

const orderBook: OrderBookSummary = {
  bids: [
    { price: "0.5", size: "100" },
    { price: "0.4", size: "100" },
  ],
  asks: [
    { price: "0.6", size: "100" },
    { price: "0.7", size: "100" },
  ],
  market: "marketID",
  asset_id: "asset_id",
  hash: "hash",
  timestamp: "timestamp",
  min_order_size: "15",
  tick_size: "0.01",
  neg_risk: false,
  last_trade_price: "0.5",
};

describe("PolymarketService", () => {
  let polymarketService: PolymarketService;

  beforeAll(() => {
    const wallet = ethers.Wallet.createRandom();
    const mockConfigService = {
      getPrivateKey: () => wallet.privateKey,
      getRpcProvider: () => "https://polygon-rpc.com",
      getFunderAddress: () => wallet.address,
      getCreds: () => ({
        key: "something",
        secret: "secret",
        passphrase: "passphrase",
      }),
      hasCredentials: () => true,
      isConfigAvailable: () => true,
      saveCredentials: jest.fn(),
      getConfigDir: () => "/tmp",
    } as unknown as ConfigService;

    polymarketService = new PolymarketService(mockConfigService);
    jest
      .spyOn(polymarketService, "fetchAllMarkets")
      .mockImplementation(() => Promise.resolve(markets));
  });

  it("should only return markets accepting orders", async () => {
    const marketsAcceptingOrders =
      await polymarketService.getMarketsAcceptingOrders();
    expect(marketsAcceptingOrders.length).toBe(1);
    expect(marketsAcceptingOrders[0].yes.token_id).toBe(
      "14811968980410449224099097755442778591369245152075435522945362809904270343154"
    );
  });

  it("should call postOrder with BUY OrderType.GTC", async () => {
    const signedOrder: SignedOrder = {
      signature: "",
      salt: "",
      maker: "",
      signer: "",
      taker: "",
      tokenId: "",
      makerAmount: "",
      takerAmount: "",
      expiration: "",
      nonce: "",
      feeRateBps: "",
      side: Side.BUY,
      signatureType: SignatureType.EOA,
    };

    const getOrderBookSpy = jest.spyOn(ClobClient.prototype, "getOrderBook");
    getOrderBookSpy.mockImplementation((): Promise<OrderBookSummary> => {
      return Promise.resolve(orderBook);
    });

    const createOrderBookSpy = jest.spyOn(ClobClient.prototype, "createOrder");
    createOrderBookSpy.mockImplementation((): Promise<SignedOrder> => {
      return Promise.resolve(signedOrder);
    });

    const postOrderSpy = jest.spyOn(ClobClient.prototype, "postOrder");
    postOrderSpy.mockImplementation((): Promise<unknown> => {
      return Promise.resolve({});
    });

    await polymarketService.marketOrder(
      "tokenID",
      ClobClientSide.BUY,
      20,
      0.5
    );
    expect(postOrderSpy).toHaveBeenCalledWith(signedOrder, OrderType.GTC);
    postOrderSpy.mockRestore();
    createOrderBookSpy.mockRestore();
    getOrderBookSpy.mockRestore();
  });

  it("should call postOrder with SELL OrderType.GTC", async () => {
    const signedOrder: SignedOrder = {
      signature: "",
      salt: "",
      maker: "",
      signer: "",
      taker: "",
      tokenId: "",
      makerAmount: "",
      takerAmount: "",
      expiration: "",
      nonce: "",
      feeRateBps: "",
      side: Side.SELL,
      signatureType: SignatureType.EOA,
    };

    const getOrderBookSpy = jest.spyOn(ClobClient.prototype, "getOrderBook");
    getOrderBookSpy.mockImplementation((): Promise<OrderBookSummary> => {
      return Promise.resolve(orderBook);
    });

    const createOrderBookSpy = jest.spyOn(ClobClient.prototype, "createOrder");
    createOrderBookSpy.mockImplementation((): Promise<SignedOrder> => {
      return Promise.resolve(signedOrder);
    });

    const postOrderSpy = jest.spyOn(ClobClient.prototype, "postOrder");
    postOrderSpy.mockImplementation((): Promise<unknown> => {
      return Promise.resolve({});
    });

    await polymarketService.marketOrder(
      "tokenID",
      ClobClientSide.SELL,
      20,
      0.5
    );
    expect(postOrderSpy).toHaveBeenCalledWith(signedOrder, OrderType.GTC);
    postOrderSpy.mockRestore();
    createOrderBookSpy.mockRestore();
    getOrderBookSpy.mockRestore();
  });
});
