declare namespace Dissonance {
  namespace REST {
    /** Discord REST API response. */
    interface Response<ResponseType> {
      response: Response
      data: ResponseType
    }
  }

  namespace Gateway {
    type APIGatewayBotInfo = import('discord-api-types/v10').APIGatewayBotInfo

    interface BotInfo extends APIGatewayBotInfo {
      url: string
    }
  }

  namespace WebSocket {
    interface Data {
      token: string
      options: Options
      gateway: {
        isNew: boolean
        heartbeat: {
          interval: number
          seq: null | number
          received: boolean
          timer: null | NodeJS.Timer
        }
      }
    }

    interface Options {
      encoding?: 'json' | 'etf'
      compress?: boolean
      intents:
        | number
        | Array<keyof typeof import('discord-api-types/v10').GatewayIntentBits | number>
    }

    type ReconnectEvent = Data
  }
}
