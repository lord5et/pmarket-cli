import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ConfigService', () => {
    let tmpDir: string;
    const origEnv = process.env.PMARKET_CONFIG_DIR;

    beforeAll(() => {
        tmpDir = mkdtempSync(join(tmpdir(), 'pmarket-test-'));
        process.env.PMARKET_CONFIG_DIR = tmpDir;
    });

    afterAll(() => {
        if (origEnv === undefined) {
            delete process.env.PMARKET_CONFIG_DIR;
        } else {
            process.env.PMARKET_CONFIG_DIR = origEnv;
        }
        rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should return default RPC provider when no rpcUrl configured', async () => {
        const { ConfigService } = await import('./config.service.js');
        const configService = new ConfigService();
        expect(configService.getRpcProvider()).toBe('https://polygon-rpc.com');
    });

    it('should return true for isConfigAvailable when config exists', async () => {
        const { ConfigService } = await import('./config.service.js');
        const configService = new ConfigService();
        expect(configService.isConfigAvailable()).toBe(true);
    });

    it('should return a string from getPrivateKey', async () => {
        const { ConfigService } = await import('./config.service.js');
        const configService = new ConfigService();
        expect(typeof configService.getPrivateKey()).toBe('string');
    });

    it('should return a string from getConfigDir', async () => {
        const { ConfigService } = await import('./config.service.js');
        const configService = new ConfigService();
        expect(typeof configService.getConfigDir()).toBe('string');
    });

    it('should return null for getCreds when no credentials file exists', async () => {
        const { ConfigService } = await import('./config.service.js');
        const configService = new ConfigService();
        expect(configService.getCreds()).toBeNull();
    });

    it('should use custom rpcUrl from config when set', async () => {
        const { ConfigService } = await import('./config.service.js');
        const { writeFileSync } = await import('fs');
        const configService = new ConfigService();
        // Write a config with rpcUrl
        writeFileSync(configService.getConfigPath(), JSON.stringify({
            privateKey: '',
            rpcUrl: 'https://custom-rpc.example.com'
        }));
        // Create new instance to pick up changed config
        const configService2 = new ConfigService();
        expect(configService2.getRpcProvider()).toBe('https://custom-rpc.example.com');
    });
});
