import { APIGatewayInfo, APIVersion } from 'discord-api-types/v10'

import { endpoints, userAgent } from '@const'
import { GatewayBotInfo } from '@types'

export const getAPIUrl = (path: string | URL): URL =>
  new URL(path, `https://discord.com/api/v${APIVersion}/`)

export class REST {
  private _token: string

  public static endpoints = endpoints

  public static async fetch<ResponseType = Response>(
    path: string,
    token?: string,
    options?: { headers?: HeadersInit; method?: string; body?: BodyInit },
  ): REST.FetchResponse<ResponseType> {
    const response = await fetch(getAPIUrl(path), {
      method: typeof options?.method === 'string' ? options.method : 'GET',
      headers: {
        ...options?.headers,
        ...(typeof token === 'string' ? { Authorization: `Bot ${token}` } : void 0),
        'Accept-Encoding': 'gzip,deflate',
        'User-Agent': userAgent,
      },
    })

    return {
      response,
      data: (await response.clone().json()) as unknown as ResponseType,
    }
  }

  public constructor(token: string) {
    if (typeof token !== 'string' || !token) console.warn('rest: token is not a string | falsy.')

    this._token = `Bot ${token}`
  }

  public async fetch<ResponseType = Response>(
    path: string,
    options?: { headers?: HeadersInit; method?: string; body?: BodyInit },
  ): REST.FetchResponse<ResponseType> {
    const response = await fetch(getAPIUrl(path), {
      method: typeof options?.method === 'string' ? options.method : 'GET',
      headers: {
        ...options?.headers,
        Authorization: this._token,
        'Accept-Encoding': 'gzip,deflate',
        'User-Agent': userAgent,
      },
    })

    return {
      response,
      data: (await response.clone().json()) as unknown as ResponseType,
    }
  }

  public getGateway(): REST.FetchResponse<APIGatewayInfo> {
    return this.fetch(endpoints.gateway.self)
  }

  public getGatewayBotInfo(): REST.FetchResponse<GatewayBotInfo> {
    return this.fetch(endpoints.gateway.bot)
  }
}

export namespace REST {
  export type FetchResponse<ResponseType> = Promise<{
    response: Response
    data: ResponseType
  }>
}
