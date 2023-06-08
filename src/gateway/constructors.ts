import {
  GatewayIdentify,
  GatewayOpcodes,
  GatewayHeartbeat,
  GatewayResume,
} from 'discord-api-types/v10'
import { libraryName } from '@const'

import process from 'process'

export function Identify(
  this: GatewayIdentify & { toJSON: () => string },
  token: string,
  intents: number,
): void {
  this.op = GatewayOpcodes.Identify
  this.d = {
    token,
    properties: {
      os: process.platform,
      browser: libraryName,
      device: libraryName,
    },
    intents,
  }

  Object.defineProperty(this, 'toJSON', {
    value: () => JSON.stringify({ ...this }),
    writable: false,
  })
}

export function Heartbeat(
  this: GatewayHeartbeat & { toJSON: () => string },
  seq: null | number,
): void {
  this.op = GatewayOpcodes.Heartbeat
  this.d = seq

  Object.defineProperty(this, 'toJSON', {
    value: () => JSON.stringify({ ...this }),
    writable: false,
  })
}

export function Resume(
  this: GatewayResume & { toJSON: () => string },
  token: string,
  session_id: string,
  seq: null | number,
): void {
  this.op = GatewayOpcodes.Resume
  this.d = {
    token,
    session_id,
    seq,
  }

  Object.defineProperty(this, 'toJSON', {
    value: () => JSON.stringify({ ...this }),
    writable: false,
  })
}
