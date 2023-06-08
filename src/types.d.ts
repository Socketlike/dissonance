/* eslint-disable @typescript-eslint/array-type */
import type { APIGatewayBotInfo, GatewayIntentBits } from 'discord-api-types/v10'

export type PossibleGatewayIntentBits =
  | (typeof GatewayIntentBits)[keyof Omit<typeof GatewayIntentBits, 'GuildBans'>]
  | keyof Omit<typeof GatewayIntentBits, 'GuildBans'>

export interface GatewayBotInfo extends APIGatewayBotInfo {
  // On auth error
  code?: number
  message?: string
}

// @types/ws
export type BufferLike =
  | string
  | Buffer
  | DataView
  | number
  | ArrayBufferView
  | Uint8Array
  | ArrayBuffer
  | SharedArrayBuffer
  | ReadonlyArray<any>
  | ReadonlyArray<number>
  | { valueOf(): ArrayBuffer }
  | { valueOf(): SharedArrayBuffer }
  | { valueOf(): Uint8Array }
  | { valueOf(): ReadonlyArray<number> }
  | { valueOf(): string }
  | { [Symbol.toPrimitive](hint: string): string }
