/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from 'eventemitter3'
import {
  GatewayDispatchEvents,
  GatewayDispatchPayload,
  GatewayHelloData,
  GatewayOpcodes,
  GatewayReadyDispatchData,
  GatewayReceivePayload,
} from 'discord-api-types/v10'
import WebSocket from 'ws'
import _ from 'lodash'

import { Heartbeat, Identify, Resume } from '@gateway/constructors'
import { REST } from '@rest'
import { GatewayBotInfo } from '@types'

export class GatewayManager extends EventEmitter {
  private _options: GatewayManager.Options
  private _ws: WebSocket
  private _REST: REST
  private _forceClosed = true
  private _gatewayBotInfo: GatewayBotInfo
  private _data: GatewayManager.Data = {
    heartbeat: {
      ack: true,
      interval: 0,
      seq: null,
      timer: null,
      timeout: null,
    },
    session: null,
  }

  public constructor(options: GatewayManager.Options) {
    super()

    this._options = options
    this._REST = new REST(this._options.token)
    this._gatewayBotInfo = options.gatewayBotInfo
  }

  public on(event: 'ack', listener: () => void, context?: unknown): this
  public on(event: 'connect', listener: () => void, context?: unknown): this
  public on(
    event: 'disconnect',
    listener: (code: number, reason: string) => void,
    context?: unknown,
  ): this
  public on(event: 'heartbeat', listener: (seq: null | number) => void, context?: unknown): this
  public on(event: 'hello', listener: (data: GatewayHelloData) => void, context?: unknown): this
  public on(
    event: 'invalidSession',
    listener: (resumable: boolean) => void,
    context?: unknown,
  ): this
  public on(
    event: 'message',
    listener: (message: GatewayDispatchPayload | GatewayReceivePayload) => void,
    context?: unknown,
  ): this
  public on(
    event: 'ready',
    listener: (data: GatewayReadyDispatchData) => void,
    context?: unknown,
  ): this
  public on(event: 'reconnect', listener: () => void, context?: unknown): this
  public on(event: 'resumed', listener: () => void, context?: unknown): this
  public on<E extends string | symbol>(
    event: E,
    listener: (...args: any[]) => void,
    context?: unknown,
  ): this {
    return super.on(event, listener, context)
  }

  public async connect(): Promise<boolean> {
    if (typeof this._ws?.readyState === 'number' && this._ws.readyState !== this._ws.CLOSED)
      return false

    if (this._gatewayBotInfo.code)
      console.error(
        `gateway connect error: ${this._gatewayBotInfo.code}, ${this._gatewayBotInfo.message}`,
      )
    else {
      this._ws = new WebSocket(
        `${
          this._forceClosed ? this._gatewayBotInfo.url : this._data.session.resume_gateway_url
        }?encoding=json`,
      )
        .on('open', () => this.emit('connect'))
        .on('message', this._message)
        .on('close', (code, reason) => this.emit('disconnect', code, reason.toString('utf-8')))
    }

    return true
  }

  public disconnect(force = true): boolean {
    if (
      !this._ws ||
      (typeof this._ws?.readyState === 'number' && this._ws.readyState === this._ws.CLOSED)
    )
      return false

    this._heartbeat.stop()

    if (force) {
      this._ws.close(1001)
      this._forceClosed = true
    } else this._ws.terminate()

    this._ws.removeAllListeners()
    this._ws = null

    return true
  }

  public async reconnect(forceDisconnect = true): Promise<boolean> {
    const disconnectRes = this.disconnect(forceDisconnect)
    const connectRes = await this.connect()

    return disconnectRes || connectRes
  }

  private _heartbeat = (() => {
    const _heartbeat = (force = false): void => {
      if (this._heartbeat.ack || force) {
        this.emit('heartbeat', this._heartbeat.seq)
        this._ws.send(new Heartbeat(this._heartbeat.seq).toJSON())
        if (!force) this._heartbeat.ack = false
      } else
        this.reconnect(false)
          .catch(() => console.error('reconnect failed'))
          .then((res) => console.log('reconnect status', res))
    }

    Object.defineProperties(_heartbeat, {
      ack: {
        get: () => this._data.heartbeat.ack,
        set: (ack: boolean) => void (this._data.heartbeat.ack = ack),
      },
      interval: {
        get: () => this._data.heartbeat.interval,
        set: (interval: number) => void (this._data.heartbeat.interval = interval),
      },
      seq: {
        get: () => this._data.heartbeat.seq,
        set: (seq: null | number) => void (this._data.heartbeat.seq = seq),
      },
      start: {
        value: () => {
          this._heartbeat.timeout = setTimeout(() => {
            this._heartbeat(true)

            this._heartbeat.timer = setInterval(this._heartbeat, this._heartbeat.interval)
          }, this._heartbeat.interval * Math.random())
        },
      },
      stop: {
        value: () => {
          this._heartbeat.timeout = null
          this._heartbeat.timer = null
        },
      },
      timer: {
        get: () => this._data.heartbeat.timer,
        set: (timer: null | NodeJS.Timer) => {
          clearInterval(this._heartbeat.timer)
          this._data.heartbeat.timer = timer
        },
      },
      timeout: {
        get: () => this._data.heartbeat.timeout,
        set: (timeout: null | NodeJS.Timeout) => {
          clearTimeout(this._heartbeat.timeout)
          this._data.heartbeat.timeout = timeout
        },
      },
    })

    return _heartbeat as {
      (force?: boolean): void
      ack: boolean
      interval: number
      seq: null | number
      start: () => void
      stop: () => void
      timer: null | NodeJS.Timer
      timeout: null | NodeJS.Timeout
    }
  })()

  private _message = (raw: Buffer): void => {
    const data = JSON.parse(raw.toString('utf-8')) as GatewayDispatchPayload | GatewayReceivePayload

    this.emit('message', _.clone(data))

    if (data.op == 0) this._dispatch(data)
    else this._receive(data)

    this._heartbeat.seq = data.s
  }

  private _dispatch(data: GatewayDispatchPayload): void {
    switch (data.t) {
      case GatewayDispatchEvents.Ready: {
        this.emit('ready', _.clone(data.d))
        this._data.session = data.d

        break
      }

      case GatewayDispatchEvents.Resumed: {
        this.emit('resumed')

        break
      }
    }
  }

  private _receive(data: GatewayReceivePayload): void {
    switch (data.op) {
      case GatewayOpcodes.Hello: {
        this.emit('hello', _.clone(data.d))
        this._heartbeat.interval = data.d.heartbeat_interval

        if (this._forceClosed)
          this._ws.send(new Identify(this._options.token, this._options.intents).toJSON())
        else
          this._ws.send(
            new Resume(
              this._options.token,
              this._data.session.session_id,
              this._heartbeat.seq,
            ).toJSON(),
          )

        this._heartbeat.start()
        this._forceClosed = false

        break
      }

      case GatewayOpcodes.HeartbeatAck: {
        this.emit('ack')
        this._heartbeat.ack = true

        break
      }

      case GatewayOpcodes.Reconnect: {
        this.emit('reconnect')
        this.reconnect(false)

        break
      }

      case GatewayOpcodes.InvalidSession: {
        this.emit('invalidSession', data.d)
        this.reconnect(!data.d)

        break
      }
    }
  }
}

export namespace GatewayManager {
  export interface Data {
    heartbeat: {
      ack: boolean
      interval: number
      seq: null | number
      timer: null | NodeJS.Timer
      timeout: null | NodeJS.Timeout
    }
    session: null | GatewayReadyDispatchData
  }

  export interface Options {
    token: string
    intents: number
    gatewayBotInfo: GatewayBotInfo
  }
}
