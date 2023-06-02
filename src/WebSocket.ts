import { APIGatewayBotInfo } from 'discord-api-types/v10'
import REST from '@REST'

export const getGatewayBot = (
  token: string,
): Promise<Dissonance.REST.Response<APIGatewayBotInfo>> =>
  REST<APIGatewayBotInfo>('gateway/bot', token)
