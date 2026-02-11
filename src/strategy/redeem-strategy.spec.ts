import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ethers } from 'ethers';
import { PolymarketService, Position } from '../services/polymarket.service.js';
import { ContractService } from '../services/contract.service.js';
import { RedeemStrategy } from './redeem-strategy.js';

const mockTx = {
    hash: '0xabc123',
    wait: jest.fn<() => Promise<unknown>>().mockResolvedValue({}),
};

function makePosition(overrides: Partial<Position> = {}): Position {
    return {
        asset: 'token_123',
        conditionId: '0xcondition1',
        curPrice: 1.0,
        currentValue: 10,
        initialValue: 5,
        outcome: 'Yes',
        percentPnl: 100,
        cashPnl: 5,
        price: 1.0,
        pricePerShare: 0.5,
        proxyWallet: null,
        redeemable: true,
        size: 10,
        title: 'Test Market',
        ...overrides,
    };
}

describe('RedeemStrategy', () => {
    let polymarketService: PolymarketService;
    let contractService: ContractService;
    let strategy: RedeemStrategy;

    beforeEach(() => {
        jest.useFakeTimers();

        polymarketService = {
            getWalletAddress: jest.fn().mockReturnValue('0xWALLET'),
            getPositions: jest.fn<() => Promise<Position[]>>().mockResolvedValue([]),
        } as unknown as PolymarketService;

        contractService = {
            isStandardRedemption: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
            redeemPositions: jest.fn<() => Promise<unknown>>().mockResolvedValue(mockTx),
            redeemNegRiskPositions: jest.fn<() => Promise<unknown>>().mockResolvedValue(mockTx),
        } as unknown as ContractService;

        strategy = new RedeemStrategy(polymarketService, contractService);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should print message and return when no redeemable positions', async () => {
        const consoleSpy = jest.spyOn(console, 'log');
        (polymarketService.getPositions as jest.Mock<any>).mockResolvedValue([
            makePosition({ redeemable: false }),
        ]);

        await strategy.execute();

        expect(consoleSpy).toHaveBeenCalledWith('No redeemable positions found.');
        expect(contractService.isStandardRedemption).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('should use standard CTF redemption when isStandardRedemption returns true', async () => {
        const consoleSpy = jest.spyOn(console, 'log');
        (polymarketService.getPositions as jest.Mock<any>).mockResolvedValue([
            makePosition({ conditionId: '0xSTD', redeemable: true, size: 20 }),
        ]);
        (contractService.isStandardRedemption as jest.Mock<any>).mockResolvedValue(true);

        const promise = strategy.execute();
        await jest.runAllTimersAsync();
        await promise;

        expect(contractService.isStandardRedemption).toHaveBeenCalledWith('0xSTD');
        expect(contractService.redeemPositions).toHaveBeenCalledWith('0xSTD');
        expect(contractService.redeemNegRiskPositions).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('  Detected: standard market');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Redeemed 1/1'));
        consoleSpy.mockRestore();
    });

    it('should use NegRiskAdapter when isStandardRedemption returns false', async () => {
        const consoleSpy = jest.spyOn(console, 'log');
        (polymarketService.getPositions as jest.Mock<any>).mockResolvedValue([
            makePosition({ conditionId: '0xNEG', redeemable: true, outcome: 'Yes', size: 15 }),
        ]);
        (contractService.isStandardRedemption as jest.Mock<any>).mockResolvedValue(false);

        const promise = strategy.execute();
        await jest.runAllTimersAsync();
        await promise;

        expect(contractService.isStandardRedemption).toHaveBeenCalledWith('0xNEG');
        expect(contractService.redeemNegRiskPositions).toHaveBeenCalledWith(
            '0xNEG',
            [
                ethers.parseUnits('15.000000', 6),
                ethers.parseUnits('0.000000', 6),
            ]
        );
        expect(contractService.redeemPositions).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('  Detected: neg_risk market');
        consoleSpy.mockRestore();
    });

    it('should group Yes and No positions by conditionId', async () => {
        (polymarketService.getPositions as jest.Mock<any>).mockResolvedValue([
            makePosition({ conditionId: '0xABC', outcome: 'Yes', size: 10, redeemable: true }),
            makePosition({ conditionId: '0xABC', outcome: 'No', size: 5, redeemable: true }),
        ]);
        (contractService.isStandardRedemption as jest.Mock<any>).mockResolvedValue(false);

        const promise = strategy.execute();
        await jest.runAllTimersAsync();
        await promise;

        expect(contractService.redeemNegRiskPositions).toHaveBeenCalledTimes(1);
        expect(contractService.redeemNegRiskPositions).toHaveBeenCalledWith(
            '0xABC',
            [
                ethers.parseUnits('10.000000', 6),
                ethers.parseUnits('5.000000', 6),
            ]
        );
    });

    it('should handle multiple conditions from different markets separately', async () => {
        (polymarketService.getPositions as jest.Mock<any>).mockResolvedValue([
            makePosition({ conditionId: '0xMARKET1', outcome: 'Yes', size: 15, redeemable: true, title: 'Market A' }),
            makePosition({ conditionId: '0xMARKET2', outcome: 'Yes', size: 5, redeemable: true, title: 'Market B' }),
        ]);
        (contractService.isStandardRedemption as jest.Mock<any>).mockResolvedValue(false);

        const promise = strategy.execute();
        await jest.runAllTimersAsync();
        await promise;

        expect(contractService.isStandardRedemption).toHaveBeenCalledTimes(2);
        expect(contractService.redeemNegRiskPositions).toHaveBeenCalledTimes(2);
        expect(contractService.redeemNegRiskPositions).toHaveBeenCalledWith(
            '0xMARKET1',
            [ethers.parseUnits('15.000000', 6), ethers.parseUnits('0.000000', 6)]
        );
        expect(contractService.redeemNegRiskPositions).toHaveBeenCalledWith(
            '0xMARKET2',
            [ethers.parseUnits('5.000000', 6), ethers.parseUnits('0.000000', 6)]
        );
    });

    it('should filter out non-redeemable positions', async () => {
        (polymarketService.getPositions as jest.Mock<any>).mockResolvedValue([
            makePosition({ conditionId: '0xREDEEM', redeemable: true, size: 10 }),
            makePosition({ conditionId: '0xOPEN', redeemable: false, size: 20 }),
        ]);
        (contractService.isStandardRedemption as jest.Mock<any>).mockResolvedValue(true);

        const promise = strategy.execute();
        await jest.runAllTimersAsync();
        await promise;

        expect(contractService.isStandardRedemption).toHaveBeenCalledTimes(1);
        expect(contractService.isStandardRedemption).toHaveBeenCalledWith('0xREDEEM');
    });

    it('should handle redemption failure gracefully and continue', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error');
        const consoleSpy = jest.spyOn(console, 'log');
        (polymarketService.getPositions as jest.Mock<any>).mockResolvedValue([
            makePosition({ conditionId: '0xFAIL', redeemable: true, title: 'Failing Market' }),
            makePosition({ conditionId: '0xOK', redeemable: true, title: 'OK Market' }),
        ]);
        (contractService.isStandardRedemption as jest.Mock<any>)
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true);
        (contractService.redeemPositions as jest.Mock<any>)
            .mockRejectedValueOnce(new Error('tx reverted'))
            .mockResolvedValueOnce(mockTx);

        const promise = strategy.execute();
        await jest.runAllTimersAsync();
        await promise;

        expect(consoleErrorSpy).toHaveBeenCalledWith('  Failed to redeem: tx reverted');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Redeemed 1/2'));
        consoleErrorSpy.mockRestore();
        consoleSpy.mockRestore();
    });

    it('should handle detection failure gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error');
        (polymarketService.getPositions as jest.Mock<any>).mockResolvedValue([
            makePosition({ conditionId: '0xRPC_FAIL', redeemable: true }),
        ]);
        (contractService.isStandardRedemption as jest.Mock<any>)
            .mockRejectedValue(new Error('RPC rate limit'));

        const promise = strategy.execute();
        await jest.runAllTimersAsync();
        await promise;

        expect(consoleErrorSpy).toHaveBeenCalledWith('  Failed to redeem: RPC rate limit');
        expect(contractService.redeemPositions).not.toHaveBeenCalled();
        expect(contractService.redeemNegRiskPositions).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it('should pass correct amounts for No-only position in neg_risk market', async () => {
        (polymarketService.getPositions as jest.Mock<any>).mockResolvedValue([
            makePosition({ conditionId: '0xNO_ONLY', outcome: 'No', size: 25, redeemable: true }),
        ]);
        (contractService.isStandardRedemption as jest.Mock<any>).mockResolvedValue(false);

        const promise = strategy.execute();
        await jest.runAllTimersAsync();
        await promise;

        expect(contractService.redeemNegRiskPositions).toHaveBeenCalledWith(
            '0xNO_ONLY',
            [
                ethers.parseUnits('0.000000', 6),
                ethers.parseUnits('25.000000', 6),
            ]
        );
    });
});
