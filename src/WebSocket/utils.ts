import { APIVersion, GatewayOpcodes, GatewayIntentBits } from 'discord-api-types/v10'
import _ from 'lodash'
import process from 'process'
import WebSocket from 'ws'
import zlib from 'zlib-sync'

import restFetch, { endpoints } from '@REST'

const inflator = new zlib.Inflate({ chunkSize: 128 * 1024 })

export const parseIntents = (intents: Dissonance.WebSocket.Options['intents']): number => {
  if (typeof intents === 'number') return intents

  if (Array.isArray(intents))
    return intents
      .map((value) => (typeof value === 'string' ? GatewayIntentBits[value] : value))
      .reduce((acc, cur) => acc | cur)

  return 0
}

export const constructEvents = {
  identify: (token: string, options?: Dissonance.WebSocket.Options): string =>
    JSON.stringify({
      op: GatewayOpcodes.Identify,
      d: {
        token,
        properties: { os: process.platform, browser: 'Dissonance', device: 'Dissonance' },
        compress: !!options?.compress,
        intents: parseIntents(options?.intents),
      },
    }),
  heartbeat: (seq: null | number): string =>
    JSON.stringify({
      op: GatewayOpcodes.Heartbeat,
      d: seq,
    }),
}

export const inflateData = <ResultData>(
  buffer: Buffer,
  flush: number | boolean = zlib.Z_SYNC_FLUSH,
): ResultData => {
  inflator.push(buffer, flush)

  if (inflator.err < 0) throw new Error('zlib-sync error: ' + inflator.msg)

  return JSON.parse(inflator.result.toString('utf-8')) as ResultData
}

export function getGatewayURL(
  gatewayBotInfo: Dissonance.Gateway.BotInfo,
  options?: Dissonance.WebSocket.Options,
): URL {
  const gatewayURL = new URL(`${gatewayBotInfo.url}?v=${APIVersion}`)

  gatewayURL.searchParams.append(
    'encoding',
    _.includes(['json', 'etf'], options?.encoding) ? options.encoding : 'json',
  )

  if (options?.compress) gatewayURL.searchParams.append('compress', 'zlib-stream')

  return gatewayURL
}

export const getGatewayBotInfo = (
  token: string,
): Promise<Dissonance.REST.Response<Dissonance.Gateway.BotInfo>> =>
  restFetch<Dissonance.Gateway.BotInfo>(endpoints.gatewayBot, token)

// challenge: not commit TypeScript fuckery - 100% failure rate
export const transformDataType = <NewType>(data: unknown): NewType => data as NewType

export class DissonanceWebSocket extends WebSocket {
  public data = {
    token: '',
    options: {} as Dissonance.WebSocket.Options,
    gateway: {
      isNew: true,
      heartbeat: {
        interval: 0,
        seq: null,
        received: true,
        timer: null,
      },
    },
  } as Dissonance.WebSocket.Data

  public constructor(url: string | URL, token: string, options?: Dissonance.WebSocket.Options) {
    super(url)

    this.data.token = token
    this.data.options = options || {}
  }
}
