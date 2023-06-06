import {
  APIVersion,
  APIGatewayBotInfo,
  GatewayIntentBits,
  GatewayOpcodes,
  GatewayHello,
  GatewayActivity,
} from 'discord-api-types/v10'
import _ from 'lodash'
import WebSocket from 'ws'
import EventEmitter from 'events'
import process from 'process'

import { endpoints } from '@const'
import { formHeartbeat, formIdentify } from '@events'
import { REST } from '@rest'

const { uniq, uniqBy } = _

export type PossibleGatewayIntentBits =
  | (typeof GatewayIntentBits)[keyof Omit<typeof GatewayIntentBits, 'GuildBans'>]
  | keyof Omit<typeof GatewayIntentBits, 'GuildBans'>

type GatewayBotInfo = APIGatewayBotInfo & { url: string | URL }

const transformDataToType = <NewType>(data: unknown) => data as NewType

function validateIntents(intents: WebSocketManager.Options['intents']): boolean {
  if (typeof intents === 'number') return true

  if (Array.isArray(intents)) {
    const validBits = uniqBy(
      Object.entries(GatewayIntentBits).filter(([_, val]) => typeof val === 'number'),
      ([_, bit]) => bit,
    ).flat() as Array<PossibleGatewayIntentBits>

    return intents.every((value) => {
      if (!validBits.includes(value)) console.log('Invalid Gateway intent bit:', value)

      return validBits.includes(value)
    })
  }

  return false
}

function validateOptions(options: WebSocketManager.Options): void {
  if (!options) throw new TypeError(`Options must be an object. Received ${typeof options}`)

  if (!options.token || typeof options.token !== 'string')
    throw new TypeError(
      !options.token
        ? 'Token must not be falsy'
        : 'Token must be a string. Received ' + typeof options,
    )

  if (!validateIntents(options.intents))
    throw new TypeError(
      'Intents must be a number or an array of Gateway intent bit value (number) / names (string)',
    )
}

function parseIntents(intents: WebSocketManager.Options['intents']): number {
  if (typeof intents === 'number') return intents

  if (Array.isArray(intents)) {
    const intentBits = uniq(
      intents.map((intent) => (typeof intent === 'number' ? intent : GatewayIntentBits[intent])),
    ).filter(
      (intent) => typeof intent === 'number' && typeof GatewayIntentBits[intent] === 'string',
    )

    return intentBits.length ? intentBits.reduce((acc, cur) => acc | cur) : 0
  }

  return 0
}

const getBotGatewayInfo = (token: string): REST.FetchResponse<GatewayBotInfo> =>
  REST.fetch<GatewayBotInfo>(endpoints.gatewayBot, token)

export class WebSocketManager extends EventEmitter {
  private _ws: WebSocket
  private _data: WebSocketManager.Data = {
    options: {
      token: '',
      intents: 0,
    },
    gateway: {
      info: null,
      heartbeat: {
        interval: 0,
        seq: null,
        ack: true,
        timer: null,
        timeout: null,
      },
    },
  }

  private _heartbeat = (() => {
    const _heartbeat = (force = false): void => {
      if (this._heartbeat.ack || force) {
        this.emit('heartbeat')
        this._ws.send(JSON.stringify(formHeartbeat(this._heartbeat.seq)))
        if (!force) this._heartbeat.ack = false
      } else this.reconnect()
    }

    Object.defineProperties(_heartbeat, {
      interval: {
        get: () => this._data.gateway.heartbeat.interval,
        set: (interval: number) => void (this._data.gateway.heartbeat.interval = interval),
      },
      seq: {
        get: () => this._data.gateway.heartbeat.seq,
        set: (seq: null | number) => void (this._data.gateway.heartbeat.seq = seq),
      },
      ack: {
        get: () => this._data.gateway.heartbeat.ack,
        set: (ack: boolean) => void (this._data.gateway.heartbeat.ack = ack),
      },
      timer: {
        get: () => this._data.gateway.heartbeat.timer,
        set: (timer: null | NodeJS.Timer) => {
          clearInterval(this._heartbeat.timer)
          this._data.gateway.heartbeat.timer = timer
        },
      },
      timeout: {
        get: () => this._data.gateway.heartbeat.timeout,
        set: (timeout: null | NodeJS.Timeout) => {
          clearTimeout(this._heartbeat.timeout)
          this._data.gateway.heartbeat.timeout = timeout
        },
      },
    })

    return _heartbeat as {
      (force?: boolean): void
      interval: number
      seq: null | number
      ack: boolean
      timer: null | NodeJS.Timer
      timeout: null | NodeJS.Timeout
    }
  })()

  public constructor(options: WebSocketManager.Options) {
    super({ captureRejections: true })

    validateOptions(options)

    this._data.options = { ...this._data.options, ...options }
    this._data.options.intents = parseIntents(this._data.options.intents)
  }

  public async connect(): Promise<void> {
    if (typeof this._ws?.readyState === 'number' && this._ws.readyState !== this._ws.CLOSED) return

    this._data.gateway.info = (await getBotGatewayInfo(this._data.options.token)).data

    this._ws = new WebSocket(`${this._data.gateway.info.url}?v=${APIVersion}&encoding=json`)
      .on('open', () => this.emit('connected'))
      .on('message', (raw) => this._message(raw as Buffer))
      .on('close', (code, reason) => this.emit('disconnected', code, reason.toString('utf-8')))
  }

  public disconnect(force = true): void {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._heartbeat.timeout = null
      this._heartbeat.timer = null

      if (force) this._ws.close(1001)
      else this._ws.terminate()

      this._ws.removeAllListeners()
      this._ws = null
    } else console.warn('Cannot close a WebSocket that has not been opened.')
  }

  public async reconnect(): Promise<void> {
    this.disconnect()
    await this.connect()
  }

  private async _message(raw: Buffer): Promise<void> {
    const parsed = JSON.parse(raw.toString('utf-8')) as {
      op: (typeof GatewayOpcodes)[keyof typeof GatewayOpcodes]
      s: null | number
    }

    this._data.gateway.heartbeat.seq = parsed.s

    switch (parsed.op) {
      case GatewayOpcodes.Hello: {
        const data = transformDataToType<GatewayHello>(parsed)

        this._heartbeat.interval = data.d.heartbeat_interval

        const identifyData = formIdentify({
          token: this._data.options.token,
          intents: this._data.options.intents as number,
        })

        this._ws.send(JSON.stringify(identifyData))

        this.emit('identify', identifyData)

        this._heartbeat.timeout = setTimeout(() => {
          this._heartbeat(true)

          this._heartbeat.timer = setInterval(() => this._heartbeat(), this._heartbeat.interval)
        }, this._heartbeat.interval * Math.random())

        break
      }

      case GatewayOpcodes.HeartbeatAck: {
        this.emit('heartbeatAck')
        this._heartbeat.ack = true
        break
      }
    }
  }
}

export namespace WebSocketManager {
  export interface Options {
    token: string
    intents: number | Array<PossibleGatewayIntentBits>
    activities?: GatewayActivity[]
  }

  export interface Data {
    options: Options
    gateway: {
      info: null | GatewayBotInfo
      heartbeat: {
        interval: number
        seq: null | number
        ack: boolean
        timer: null | NodeJS.Timer
        timeout: null | NodeJS.Timeout
      }
    }
  }
}
