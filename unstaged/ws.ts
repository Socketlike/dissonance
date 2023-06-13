/* eslint-disable @typescript-eslint/no-explicit-any */
import { GatewayManager } from '@gateway'

export class WebSocketManager {
  private _options: WebSocketManager.Options
  private _gateway: GatewayManager

  public constructor(options: WebSocketManager.Options) {
    this._options = options
    this._gateway = new GatewayManager(this._options)
  }

  public connect(): Promise<boolean> {
    return this._gateway.connect()
  }

  public disconnect(force?: boolean): boolean {
    return this._gateway.disconnect(force)
  }

  public reconnect(forceDisconnect?: boolean): Promise<boolean> {
    return this._gateway.reconnect(forceDisconnect)
  }

  public on(event: string | symbol, listener: (...args: any[]) => void, context?: any): this {
    this._gateway.on(event, listener, context)

    return this
  }

  public once(event: string | symbol, listener: (...args: any[]) => void, context?: any): this {
    this._gateway.once(event, listener, context)

    return this
  }

  public off(event: string | symbol, listener: (...args: any[]) => void, context?: any): this {
    this._gateway.off(event, listener, context)

    return this
  }
}

export namespace WebSocketManager {
  export type Options = GatewayManager.Options
}
