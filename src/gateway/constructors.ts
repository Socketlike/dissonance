import { GatewayIdentifyData, GatewayOpcodes, GatewayResumeData } from 'discord-api-types/v10'
import { name as libraryName } from '@const'

import process from 'process'

export class JSONable {
  public toJSON(): string {
    return JSON.stringify({ ...this })
  }
}

export class Identify extends JSONable {
  public op = GatewayOpcodes.Identify
  public d: GatewayIdentifyData

  public constructor(token: string, intents: number, shard?: [number, number]) {
    super()

    this.d = {
      token,
      properties: {
        os: process.platform,
        browser: libraryName,
        device: libraryName,
      },
      intents,
      ...(Array.isArray(shard) ? { shard } : void 0),
    }
  }
}

export class Heartbeat extends JSONable {
  public op = GatewayOpcodes.Heartbeat
  public d: null | number

  public constructor(seq: null | number) {
    super()

    this.d = seq
  }
}

export class Resume extends JSONable {
  public op = GatewayOpcodes.Resume
  public d: GatewayResumeData

  public constructor(token: string, session_id: string, seq: null | number) {
    super()

    this.d = {
      token,
      session_id,
      seq,
    }
  }
}
