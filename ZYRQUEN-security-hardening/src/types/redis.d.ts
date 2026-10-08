declare module 'redis' {
  interface RedisClient {
    on(event: 'error', listener: (err: Error) => void): void;
    connect(): Promise<void>;
    set(key: string, value: string, options: { EX: number }): Promise<unknown>;
    sAdd(key: string, value: string): Promise<unknown>;
    expire(key: string, seconds: number): Promise<unknown>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    sMembers(key: string): Promise<string[]>;
  }

  export function createClient(options: { url: string }): RedisClient;
}
