export interface Strategy {
    execute(options: Record<string, unknown>): Promise<void>;
}
