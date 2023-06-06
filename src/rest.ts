/* eslint-disable @typescript-eslint/no-extraneous-class --- The REST class will have real methods soon */
import { APIVersion } from 'discord-api-types/v10'

import { userAgent } from '@const'

export const getAPIUrl = (path: string | URL): URL =>
  new URL(path, `https://discord.com/api/v${APIVersion}/`)

export class REST {
  public static async fetch<ResponseType = Response>(
    path: string,
    auth?: string,
    options?: { headers?: HeadersInit; method?: string; body?: BodyInit },
  ): REST.FetchResponse<ResponseType> {
    const response = await fetch(getAPIUrl(path), {
      method: typeof options?.method === 'string' ? options.method : 'GET',
      headers: {
        ...options?.headers,
        ...(typeof auth === 'string' ? { Authorization: `Bot ${auth}` } : void 0),
        'Accept-Encoding': 'gzip,deflate',
        'User-Agent': userAgent,
      },
    })

    return {
      response,
      data: (await response.clone().json()) as unknown as ResponseType,
    }
  }
}

export namespace REST {
  export type FetchResponse<ResponseType> = Promise<{
    response: Response
    data: ResponseType
  }>
}
