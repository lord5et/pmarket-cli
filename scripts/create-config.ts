import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from 'path';
import { homedir } from 'os';

const PMARKET_CLI_DIR = '.pmarket-cli';
const CONFIG_FILE = 'config.json';

const configDir = join(homedir(), PMARKET_CLI_DIR);
const configPath = join(configDir, CONFIG_FILE);

const config = {
    privateKey: ''
};

if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
}

if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify(config, null, 4));
    console.log('Configuration file created:', configPath);
    console.log('Please add your private key to the config file.');
}
