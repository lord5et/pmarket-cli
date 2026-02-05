import { jest } from '@jest/globals';
import { ContractService } from '../services/contract.service.js';
import { PolymarketService } from '../services/polymarket.service.js';
import { CacheService } from '../services/cache.service.js';
import { ConfigService } from '../services/config.service.js';
import { Context } from './context.js';
import { ethers } from 'ethers';

describe('Context', () => {
    let polymarketService: PolymarketService;
    let contractService: ContractService;
    let cacheService: CacheService;
    let mockConfigService: ConfigService;
    let context: Context;

    beforeAll(() => {
        const wallet = ethers.Wallet.createRandom();
        mockConfigService = {
            getPrivateKey: () => wallet.privateKey,
            getRpcProvider: () => 'https://polygon-rpc.com',
            getFunderAddress: () => wallet.address,
            getCreds: () => ({
                key: 'something',
                secret: 'secret',
                passphrase: 'passphrase'
            }),
            hasCredentials: () => true,
            isConfigAvailable: () => true,
            saveCredentials: jest.fn(),
            savePrivateKey: jest.fn().mockReturnValue({ success: true, address: wallet.address }),
            getConfigDir: () => '/tmp',
            getConfigPath: () => '/tmp/config.json'
        } as unknown as ConfigService;

        polymarketService = new PolymarketService(mockConfigService);
        contractService = new ContractService(mockConfigService);
        cacheService = {
            isCacheValid: () => false,
            hasCache: jest.fn().mockReturnValue(true),
            getCacheAge: jest.fn().mockReturnValue('5 minutes ago'),
            getCachedMarkets: jest.fn().mockReturnValue([]),
            cacheMarkets: jest.fn(),
            clearCache: jest.fn(),
            getMarketCount: jest.fn().mockReturnValue(0),
            close: jest.fn()
        } as unknown as CacheService;

        context = new Context(polymarketService, contractService, cacheService, mockConfigService);

        jest.spyOn(polymarketService, 'getMarketsAcceptingOrders').mockImplementation(() => Promise.resolve([]));
        jest.spyOn(polymarketService, 'fetchAllMarkets').mockImplementation(() => Promise.resolve([]));
        jest.spyOn(polymarketService, 'marketOrder').mockImplementation(() => Promise.resolve({}));
        jest.spyOn(polymarketService, 'getOrderBook').mockImplementation(() => Promise.resolve({}));
        jest.spyOn(polymarketService, 'cancelAll').mockImplementation(() => Promise.resolve({}));
        jest.spyOn(polymarketService, 'getApiKeys').mockImplementation(() => Promise.resolve({} as never));
        jest.spyOn(polymarketService, 'getPositions').mockImplementation(() => Promise.resolve([]));
        jest.spyOn(polymarketService, 'getWalletAddress').mockImplementation(() => '0x1234567890abcdef');
        jest.spyOn(contractService, 'setAllowance').mockImplementation(() => Promise.resolve({} as never));
    });

    it('should use ListStrategy', async () => {
        const options = { list: 'test' };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeDefined();
        context.setStrategy(strategy!);
        await context.executeStrategy(options);
        expect(cacheService.getCachedMarkets).toHaveBeenCalled();
    });

    it('should use BuyStrategy', async () => {
        const options = { buy: ['tokenId', '30', '0.6'] };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeDefined();
        context.setStrategy(strategy!);
        await context.executeStrategy(options);
        expect(polymarketService.marketOrder).toHaveBeenCalled();
    });

    it('should use SellStrategy', async () => {
        const options = { sell: ['tokenId', '100', '0.99'] };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeDefined();
        context.setStrategy(strategy!);
        await context.executeStrategy(options);
        expect(polymarketService.marketOrder).toHaveBeenCalled();
    });

    it('should use AllowanceStrategy', async () => {
        const options = { allowance: '100' };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeDefined();
        context.setStrategy(strategy!);
        await context.executeStrategy(options);
        expect(contractService.setAllowance).toHaveBeenCalled();
    });

    it('should use OrderBookStrategy', async () => {
        const options = { orderBook: 'tokenId' };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeDefined();
        context.setStrategy(strategy!);
        await context.executeStrategy(options);
        expect(polymarketService.getOrderBook).toHaveBeenCalled();
    });

    it('should use CancelAllStrategy', async () => {
        const options = { cancelAll: true };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeDefined();
        context.setStrategy(strategy!);
        await context.executeStrategy(options);
        expect(polymarketService.cancelAll).toHaveBeenCalled();
    });

    it('should use ApiKeysStrategy', async () => {
        const options = { keys: true };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeDefined();
        context.setStrategy(strategy!);
        await context.executeStrategy(options);
        expect(polymarketService.getApiKeys).toHaveBeenCalled();
    });

    it('should use RefreshStrategy', async () => {
        const options = { refresh: true };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeDefined();
        context.setStrategy(strategy!);
        await context.executeStrategy(options);
        expect(polymarketService.fetchAllMarkets).toHaveBeenCalled();
        expect(cacheService.cacheMarkets).toHaveBeenCalled();
    });

    it('should use InitStrategy', async () => {
        const options = { init: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeDefined();
        context.setStrategy(strategy!);
        await context.executeStrategy(options);
        expect(mockConfigService.savePrivateKey).toHaveBeenCalled();
    });

    it('should use PositionsStrategy', async () => {
        const options = { positions: true };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeDefined();
        context.setStrategy(strategy!);
        await context.executeStrategy(options);
        expect(polymarketService.getPositions).toHaveBeenCalled();
    });

    it('should return undefined for unknown options', () => {
        const options = { unknown: true };
        const strategy = context.determineStrategy(options);
        expect(strategy).toBeUndefined();
    });
});
