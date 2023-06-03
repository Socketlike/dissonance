import { listenerOnClose, listenerOnMessage } from '@ws/handlers'
import { DissonanceWebSocket, getGatewayURL, getGatewayBotInfo } from '@ws/utils'

export const createWS = async (
  token: string,
  options?: Dissonance.WebSocket.Options,
): Promise<DissonanceWebSocket> => {
  const gatewayBotInfo = await getGatewayBotInfo(token)
  const gatewayURL = getGatewayURL(gatewayBotInfo.data, options)

  console.log(gatewayURL)

  return new DissonanceWebSocket(gatewayURL, token, options)
    .on('open', () => console.log('gateway opened'))
    .on('message', listenerOnMessage)
    .on('close', listenerOnClose)
}
