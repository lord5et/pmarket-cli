import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ethers } from 'ethers';
import { ConfigService } from './config.service.js';
import { ContractService } from './contract.service.js';

describe('ContractService', () => {
    it('should console.log that private key is incorrect when invalid', () => {
        const consoleLogSpy = jest.spyOn(console, 'log');

        const mockConfigService = {
            getPrivateKey: () => 'invalid-key',
            getRpcProvider: () => 'https://polygon-rpc.com',
            getFunderAddress: () => '',
            getCreds: () => null,
            hasCredentials: () => false,
            isConfigAvailable: () => true,
            saveCredentials: jest.fn(),
            getConfigDir: () => '/tmp'
        } as unknown as ConfigService;

        new ContractService(mockConfigService);
        expect(consoleLogSpy).toHaveBeenCalledWith('Please provide valid private key in config.json file');
        consoleLogSpy.mockRestore();
    });

    it('should create wallet with valid private key', () => {
        const mockConfigService = {
            getPrivateKey: () => '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            getRpcProvider: () => 'https://polygon-rpc.com',
            getFunderAddress: () => '0x1234567890123456789012345678901234567890',
            getCreds: () => null,
            hasCredentials: () => false,
            isConfigAvailable: () => true,
            saveCredentials: jest.fn(),
            getConfigDir: () => '/tmp'
        } as unknown as ConfigService;

        const contractService = new ContractService(mockConfigService);
        expect(contractService.wallet).toBeDefined();
    });

    describe('isStandardRedemption', () => {
        it('should throw when wallet not initialized', async () => {
            const mockConfigService = {
                getPrivateKey: () => 'invalid-key',
                getRpcProvider: () => 'https://polygon-rpc.com',
                getConfigDir: () => '/tmp',
            } as unknown as ConfigService;

            const service = new ContractService(mockConfigService);
            await expect(service.isStandardRedemption('0xcondition')).rejects.toThrow('Wallet not initialized');
        });
    });

    describe('redeemPositions', () => {
        it('should throw when wallet not initialized', async () => {
            const mockConfigService = {
                getPrivateKey: () => 'invalid-key',
                getRpcProvider: () => 'https://polygon-rpc.com',
                getConfigDir: () => '/tmp',
            } as unknown as ConfigService;

            const service = new ContractService(mockConfigService);
            await expect(service.redeemPositions('0xcondition')).rejects.toThrow('Wallet not initialized');
        });
    });

    describe('redeemNegRiskPositions', () => {
        it('should throw when wallet not initialized', async () => {
            const mockConfigService = {
                getPrivateKey: () => 'invalid-key',
                getRpcProvider: () => 'https://polygon-rpc.com',
                getConfigDir: () => '/tmp',
            } as unknown as ConfigService;

            const service = new ContractService(mockConfigService);
            const amounts = [ethers.BigNumber.from(10), ethers.BigNumber.from(0)];
            await expect(service.redeemNegRiskPositions('0xcondition', amounts)).rejects.toThrow('Wallet not initialized');
        });
    });
});
