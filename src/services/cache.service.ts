import Database from 'better-sqlite3';
import { join } from 'path';
import { ConfigService } from './config.service.js';
import { Market } from './polymarket.service.js';

const CACHE_DB = 'cache.db';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedMarket {
    condition_id: string;
    question: string;
    description: string;
    category: string;
    end_date_iso: string;
    active: number;
    closed: number;
    yes_token_id: string;
    no_token_id: string;
    yes_outcome: string;
    no_outcome: string;
    cached_at: number;
}

export class CacheService {
    private db: Database.Database;

    constructor(configService: ConfigService) {
        const dbPath = join(configService.getConfigDir(), CACHE_DB);
        this.db = new Database(dbPath);
        this.initializeSchema();
    }

    private initializeSchema(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS markets (
                condition_id TEXT PRIMARY KEY,
                question TEXT,
                description TEXT,
                category TEXT,
                end_date_iso TEXT,
                active INTEGER,
                closed INTEGER,
                yes_token_id TEXT,
                no_token_id TEXT,
                yes_outcome TEXT,
                no_outcome TEXT,
                cached_at INTEGER
            );

            CREATE TABLE IF NOT EXISTS cache_metadata (
                key TEXT PRIMARY KEY,
                value TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_markets_question ON markets(question);
            CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(active, closed);
        `);
    }

    isCacheValid(): boolean {
        const stmt = this.db.prepare('SELECT value FROM cache_metadata WHERE key = ?');
        const row = stmt.get('last_full_refresh') as { value: string } | undefined;

        if (!row) {
            return false;
        }

        const lastRefresh = parseInt(row.value, 10);
        return Date.now() - lastRefresh < CACHE_TTL_MS;
    }

    getCachedMarkets(filter?: string): CachedMarket[] {
        let query = 'SELECT * FROM markets WHERE active = 1 AND closed = 0';
        const params: string[] = [];

        if (filter) {
            query += ' AND LOWER(question) LIKE ?';
            params.push(`%${filter.toLowerCase()}%`);
        }

        const stmt = this.db.prepare(query);
        return stmt.all(...params) as CachedMarket[];
    }

    cacheMarkets(markets: Market[]): void {
        const insertStmt = this.db.prepare(`
            INSERT OR REPLACE INTO markets
            (condition_id, question, description, category, end_date_iso, active, closed, yes_token_id, no_token_id, yes_outcome, no_outcome, cached_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const now = Date.now();

        const insertMany = this.db.transaction((markets: Market[]) => {
            for (const market of markets) {
                insertStmt.run(
                    market.condition_id,
                    market.question,
                    market.description,
                    market.category,
                    market.end_date_iso,
                    market.active ? 1 : 0,
                    market.closed ? 1 : 0,
                    market.tokens[0]?.token_id ?? '',
                    market.tokens[1]?.token_id ?? '',
                    market.tokens[0]?.outcome ?? 'Yes',
                    market.tokens[1]?.outcome ?? 'No',
                    now
                );
            }
        });

        insertMany(markets);

        const metaStmt = this.db.prepare('INSERT OR REPLACE INTO cache_metadata (key, value) VALUES (?, ?)');
        metaStmt.run('last_full_refresh', now.toString());
    }

    clearCache(): void {
        this.db.exec('DELETE FROM markets');
        this.db.exec('DELETE FROM cache_metadata');
    }

    getMarketCount(): number {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM markets');
        const row = stmt.get() as { count: number };
        return row.count;
    }

    getCacheAge(): string | null {
        const stmt = this.db.prepare('SELECT value FROM cache_metadata WHERE key = ?');
        const row = stmt.get('last_full_refresh') as { value: string } | undefined;

        if (!row) {
            return null;
        }

        const lastRefresh = parseInt(row.value, 10);
        const ageMs = Date.now() - lastRefresh;

        const minutes = Math.floor(ageMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'just now';
        }
    }

    hasCache(): boolean {
        return this.getMarketCount() > 0;
    }

    close(): void {
        this.db.close();
    }
}
