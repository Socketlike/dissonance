import process from 'process'
import { GatewayHeartbeat, GatewayIdentify, GatewayOpcodes } from 'discord-api-types/v10'

import { libraryName } from '@const'

export const formIdentify = ({
  token,
  intents,
}: {
  token: string
  intents: number
}): GatewayIdentify => ({
  op: GatewayOpcodes.Identify,
  d: {
    token,
    properties: {
      os: process.platform,
      browser: libraryName,
      device: libraryName,
    },
    intents,
  },
})

export const formHeartbeat = (seq: null | number): GatewayHeartbeat => ({
  op: GatewayOpcodes.Heartbeat,
  d: seq,
})
