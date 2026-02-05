import { Command } from 'commander';
import { getProgram } from './program.js';

describe('Program', () => {
    let program: Command;

    beforeEach(() => {
        program = getProgram();
    });

    it('should parse list option', () => {
        const options = program.parse(['node', 'main', '-l', 'test']).opts();
        expect(options.list).toBe('test');
    });

    it('should parse refresh option standalone', () => {
        const options = program.parse(['node', 'main', '-r']).opts();
        expect(options.refresh).toBe(true);
    });

    it('should parse buy option', () => {
        const options = program.parse(['node', 'main', '-b', 'tokenId', '30', '0.6']).opts();
        expect(options.buy.length).toBe(3);
        expect(options.buy[0]).toBe('tokenId');
        expect(options.buy[1]).toBe('30');
        expect(options.buy[2]).toBe('0.6');
    });

    it('should parse sell option', () => {
        const options = program.parse(['node', 'main', '-s', 'tokenId', '100', '0.99']).opts();
        expect(options.sell.length).toBe(3);
        expect(options.sell[0]).toBe('tokenId');
        expect(options.sell[1]).toBe('100');
        expect(options.sell[2]).toBe('0.99');
    });

    it('should parse allowance option', () => {
        const options = program.parse(['node', 'main', '-a', '200']).opts();
        expect(options.allowance).toBe('200');
    });

    it('should parse order book option', () => {
        const options = program.parse(['node', 'main', '-o', 'tokenId']).opts();
        expect(options.orderBook).toBe('tokenId');
    });

    it('should parse cancel all option', () => {
        const options = program.parse(['node', 'main', '-c']).opts();
        expect(options.cancelAll).toBe(true);
    });

    it('should parse keys option', () => {
        const options = program.parse(['node', 'main', '-k']).opts();
        expect(options.keys).toBe(true);
    });

    it('should parse init option', () => {
        const options = program.parse(['node', 'main', '-i', '0x1234']).opts();
        expect(options.init).toBe('0x1234');
    });

    it('should parse positions option', () => {
        const options = program.parse(['node', 'main', '-p']).opts();
        expect(options.positions).toBe(true);
    });
});
