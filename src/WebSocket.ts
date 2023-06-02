import { APIGatewayBotInfo } from 'discord-api-types/v10'
import restFetch from '@REST'

export const getGatewayBot = (
  token: string,
): Promise<Dissonance.REST.Response<APIGatewayBotInfo>> =>
  restFetch<APIGatewayBotInfo>('gateway/bot', token)
