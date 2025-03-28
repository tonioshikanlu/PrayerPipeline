declare module 'crypto-browserify' {
  export function scrypt(
    password: string | Buffer, 
    salt: string | Buffer, 
    keylen: number, 
    callback: (err: Error | null, derivedKey: Buffer) => void
  ): void;

  export function randomBytes(size: number): {
    toString(encoding: string): string;
  };

  export function timingSafeEqual(a: Buffer, b: Buffer): boolean;

  export class Buffer {
    toString(encoding: string): string;
    static from(data: string, encoding?: string): Buffer;
  }
}