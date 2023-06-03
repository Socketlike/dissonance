import { GatewayHeartbeatAck, GatewayHello, GatewayOpcodes } from 'discord-api-types/v10'
import _ from 'lodash'
import WebSocket from 'ws'
import { DissonanceWebSocket, constructEvents, inflateData, transformDataType } from '@ws/utils'

export const hello = (ws: DissonanceWebSocket, data: GatewayHello): void => {
  ws.data.gateway.heartbeat.interval = data.d.heartbeat_interval

  ws.send(constructEvents.identify(ws.data.token, ws.data.options))

  setTimeout(() => {
    ws.send(constructEvents.heartbeat(ws.data.gateway.heartbeat.seq))

    ws.data.gateway.heartbeat.timer = setInterval(() => {
      if (ws.data.gateway.heartbeat.received) {
        ws.send(constructEvents.heartbeat(ws.data.gateway.heartbeat.seq))
        ws.data.gateway.heartbeat.received = true
      } else {
        ws.terminate()

        clearInterval(ws.data.gateway.heartbeat.timer)

        ws.data.gateway.heartbeat.received = true
        ws.data.gateway.heartbeat.seq = null
        ws.data.gateway.heartbeat.timer = null

        ws.emit('reconnect', ws.data)
      }
    }, ws.data.gateway.heartbeat.interval)
  }, ws.data.gateway.heartbeat.interval * Math.random())
}

export const heartbeatAck = (ws: DissonanceWebSocket): void => {
  ws.data.gateway.heartbeat.received = true
  console.log('received heartbeat ACK')
}

export function listenerOnMessage(
  this: WebSocket | DissonanceWebSocket,
  raw: WebSocket.RawData,
): void {
  const parsed = (
    (this as DissonanceWebSocket).data.options.compress
      ? inflateData(raw as Buffer)
      : JSON.parse((raw as Buffer).toString('utf-8'))
  ) as { op: number; s: null | number }

  switch (parsed.op) {
    case GatewayOpcodes.Hello: {
      hello(this as DissonanceWebSocket, transformDataType<GatewayHello>(parsed))
      break
    }

    case GatewayOpcodes.HeartbeatAck: {
      heartbeatAck(this as DissonanceWebSocket, transformDataType<GatewayHeartbeatAck>(parsed))
      break
    }
  }

  // Prettier wants it like this
  // eslint-disable-next-line no-extra-semi
  ;(this as DissonanceWebSocket).data.gateway.heartbeat.seq = parsed.s
}

export function listenerOnClose(
  this: WebSocket | DissonanceWebSocket,
  code: number,
  reason: Buffer,
): void {
  console.log(`gateway closed. code: ${code}, reason: ${reason.toString('utf-8')}`)
}
