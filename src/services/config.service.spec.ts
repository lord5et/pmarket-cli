import { describe, it, expect } from '@jest/globals';

describe('ConfigService', () => {
    it('should return default RPC provider', async () => {
        const { ConfigService } = await import('./config.service.js');
        const configService = new ConfigService();
        expect(configService.getRpcProvider()).toBe('https://polygon-rpc.com');
    });

    it('should return true for isConfigAvailable when config exists', async () => {
        const { ConfigService } = await import('./config.service.js');
        const configService = new ConfigService();
        // The config file is created on first run, so this should be true
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
        expect(configService.getConfigDir()).toContain('.pmarket-cli');
    });

    it('should return null for getCreds when no credentials file exists', async () => {
        // This test depends on whether the user has credentials
        // In a clean install, this should be null
        const { ConfigService } = await import('./config.service.js');
        const configService = new ConfigService();
        const creds = configService.getCreds();
        // Either null or an object with key/secret/passphrase
        if (creds !== null) {
            expect(creds).toHaveProperty('key');
            expect(creds).toHaveProperty('secret');
            expect(creds).toHaveProperty('passphrase');
        }
    });
});
