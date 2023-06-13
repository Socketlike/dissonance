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
import { Reference, createRefs, unpackRefs } from '@util'

export class Shard extends EventEmitter {
  private _forceClosed = true
  private _heartbeatData: Shard.HeartbeatData = {
    ack: true,
    interval: 0,
    seq: null,
    timer: null,
    timeout: null,
  }
  private _options: Shard.Options
  private _sessionData: GatewayReadyDispatchData
  private _shardData: [Reference<number>, Reference<number>]
  private _ws: WebSocket

  public constructor(options: Shard.Options, shardData: [Reference<number>, Reference<number>]) {
    super()

    this._options = options
    this._shardData = shardData
  }

  public on(
    event: 'ack' | 'connect' | 'reconnect' | 'resume',
    listener: () => void,
    context?: unknown,
  ): this
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
  public on<E extends string | symbol>(
    event: E,
    listener: (...args: any[]) => void,
    context?: unknown,
  ): this {
    return super.on(event, listener, context)
  }

  public get shardData(): [number, number] {
    return unpackRefs(...this._shardData) as [number, number]
  }

  public async connect(): Promise<boolean> {
    if (this._ws instanceof WebSocket && this._ws.readyState !== WebSocket.CLOSED) return false

    this._ws = new WebSocket(
      `${
        this._forceClosed ? this._options.url : this._sessionData.resume_gateway_url
      }?encoding=json`,
    )
      .on('open', () => this.emit('connect'))
      .on('message', (data) => this._message(data as Buffer))
      .on('close', (code, reason) => this.emit('disconnect', code, reason.toString('utf-8')))

    return true
  }

  public disconnect(force = false): boolean {
    if (
      !this._ws ||
      (typeof this._ws?.readyState === 'number' && this._ws.readyState === this._ws.CLOSED)
    )
      return false

    this._stopHeartbeat()

    if (force) {
      this._ws.close(1001)
      this._forceClosed = true
    } else {
      this._ws.terminate()
      this._forceClosed = false
    }

    this._ws.removeAllListeners()
    this._ws = null

    return true
  }

  public async reconnect(forceDisconnect = false): Promise<boolean> {
    const disconnectRes = this.disconnect(forceDisconnect)
    const connectRes = await this.connect()

    return disconnectRes || connectRes
  }

  private _doHeartbeat(force = false): void {
    if (this._heartbeatData.ack || force) {
      this.emit('heartbeat', this._heartbeatData.seq)
      this._ws.send(new Heartbeat(this._heartbeatData.seq).toJSON())
      if (!force) this._heartbeatData.ack = false
    } else
      this.reconnect(false)
        .catch(() => console.error('reconnect failed'))
        .then((res) => console.log('reconnect status', res))
  }

  private _stopHeartbeat(): void {
    clearTimeout(this._heartbeatData.timeout)
    clearInterval(this._heartbeatData.timer)
    this._heartbeatData.timeout = null
    this._heartbeatData.timer = null
  }

  private _startHeartbeat(): void {
    if (this._heartbeatData.timeout !== null || this._heartbeatData.timer !== null)
      this._stopHeartbeat()

    this._heartbeatData.timeout = setTimeout(() => {
      this._doHeartbeat(true)

      this._heartbeatData.timer = setInterval(
        () => this._doHeartbeat(),
        this._heartbeatData.interval,
      )
    }, this._heartbeatData.interval * Math.random())
  }

  private _message(raw: Buffer): void {
    const data = JSON.parse(raw.toString('utf-8')) as GatewayDispatchPayload | GatewayReceivePayload

    this.emit('message', _.clone(data))

    if (data.op === GatewayOpcodes.Dispatch) this._dispatch(data)
    else this._receive(data)
  }

  private _dispatch(data: GatewayDispatchPayload): void {
    switch (data.t) {
      case GatewayDispatchEvents.Ready: {
        this.emit('ready', _.clone(data.d))
        this._sessionData = data.d

        break
      }

      case GatewayDispatchEvents.Resumed: {
        this.emit('resume')

        break
      }
    }
  }

  private _receive(data: GatewayReceivePayload): void {
    switch (data.op) {
      case GatewayOpcodes.Hello: {
        this.emit('hello', _.clone(data.d))

        if (this._forceClosed)
          this._ws.send(
            new Identify(this._options.token, this._options.intents, this.shardData).toJSON(),
          )
        else
          this._ws.send(
            new Resume(
              this._options.token,
              this._sessionData.session_id,
              this._heartbeatData.seq,
            ).toJSON(),
          )

        this._heartbeatData.interval = data.d.heartbeat_interval
        this._startHeartbeat()

        break
      }

      case GatewayOpcodes.HeartbeatAck: {
        this.emit('ack')
        this._heartbeatData.ack = true

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

export namespace Shard {
  export interface Options {
    token: string
    intents: number
    url: string
  }

  export interface HeartbeatData {
    ack: boolean
    interval: number
    seq: null | number
    timer: null | NodeJS.Timer
    timeout: null | NodeJS.Timeout
  }
}

export class ShardManager extends EventEmitter {
  private _gatewayData: GatewayBotInfo
  private _options: ShardManager.Options
  private _REST: REST
  private _prepared = false
  private _shards = {
    data: [] as Array<[Reference<number>, Reference<number>]>,
    instances: [] as Shard[],
  }

  public constructor(options: ShardManager.Options) {
    super()

    this._options = options
    this._REST = new REST(options.token)
  }

  public on(
    event: 'ack' | 'connect' | 'reconnect' | 'resume',
    listener: (shardInstance: Shard) => void,
    context?: unknown,
  ): this
  public on(
    event: 'disconnect',
    listener: (code: number, reason: string, shardInstance: Shard) => void,
    context?: unknown,
  ): this
  public on(
    event: 'heartbeat',
    listener: (seq: null | number, shardInstance: Shard) => void,
    context?: unknown,
  ): this
  public on(
    event: 'hello',
    listener: (data: GatewayHelloData, shardInstance: Shard) => void,
    context?: unknown,
  ): this
  public on(
    event: 'invalidSession',
    listener: (resumable: boolean, shardInstance: Shard) => void,
    context?: unknown,
  ): this
  public on(
    event: 'message',
    listener: (
      message: GatewayDispatchPayload | GatewayReceivePayload,
      shardInstance: Shard,
    ) => void,
    context?: unknown,
  ): this
  public on(
    event: 'ready',
    listener: (data: GatewayReadyDispatchData, shardInstance: Shard) => void,
    context?: unknown,
  ): this
  public on<E extends string | symbol>(
    event: E,
    listener: (...args: any[]) => void,
    context?: unknown,
  ): this {
    return super.on(event, listener, context)
  }

  private _forwardShardEvents(shard: Shard): Shard {
    return shard
      .on('ack', () => this.emit('ack', shard))
      .on('connect', () => this.emit('connect', shard))
      .on('disconnect', (code, reason) => this.emit('disconnect', code, reason, shard))
      .on('heartbeat', (seq) => this.emit('heartbeat', seq, shard))
      .on('hello', (data) => this.emit('hello', data, shard))
      .on('invalidSession', (resumable) => this.emit('invalidSession', resumable, shard))
      .on('message', (message) => this.emit('message', message, shard))
      .on('ready', (data) => this.emit('ready', data, shard))
      .on('reconnect', () => this.emit('reconnect', shard))
      .on('resume', () => this.emit('resume', shard))
  }

  public async prepare(): Promise<void> {
    if (this._prepared) return

    this._gatewayData = (await this._REST.getGatewayBotInfo()).data

    for (let shard = 0; shard < this._gatewayData.shards; shard++) {
      const shardData = createRefs(shard, this._gatewayData.shards) as [
        Reference<number>,
        Reference<number>,
      ]

      const shardInstance = new Shard({ ...this._options, url: this._gatewayData.url }, shardData)

      this._shards.data.push(shardData)
      this._shards.instances.push(shardInstance)
      this._forwardShardEvents(shardInstance)
    }

    this._prepared = true
  }

  public connect(): Promise<boolean[]> {
    const promises = [] as Array<Promise<boolean>>

    for (const shardInstance of this._shards.instances) promises.push(shardInstance.connect())

    return Promise.all(promises)
  }

  public disconnect(force = false): Promise<boolean[]> {
    const promises = [] as Array<Promise<boolean>>

    for (const shardInstance of this._shards.instances)
      promises.push(new Promise((resolve) => resolve(shardInstance.disconnect(force))))

    return Promise.all(promises)
  }

  public reconnect(forceDisconnect = false): Promise<boolean[]> {
    const promises = [] as Array<Promise<boolean>>

    for (const shardInstance of this._shards.instances)
      promises.push(shardInstance.reconnect(forceDisconnect))

    return Promise.all(promises)
  }
}

export namespace ShardManager {
  export interface Options {
    token: string
    intents: number
  }
}
