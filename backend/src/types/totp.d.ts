declare module '@digitalbazaar/totp' {
  export function generateSecret(options?: { algorithm?: string }): Promise<{ algorithm: string; secret: Uint8Array }>
  export function generateToken(options: { secret: Uint8Array | string; algorithm?: string; digits?: number; period?: number; now?: number }): Promise<{ token: string; algorithm: string; digits: number; period: number }>
  export function toKeyUri(params: { type: string; secret: string; label: string; issuer: string; accountname: string }): string
  export function verify(options: { token: string; secret: Uint8Array; algorithm?: string; period?: number; delta?: number; now?: number }): Promise<boolean>
  export function base32Decode(str: string): Uint8Array
  export function base32Encode(buf: Uint8Array): string
  export function fromKeyUri(uri: string): any
}
