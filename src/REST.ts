export const getAPIUrl = (path: string | URL): URL => new URL(path, 'https://discord.com/api/v10/')

export default async <ResponseType = Response>(
  path: string,
  auth?: string,
  options?: { headers?: HeadersInit; method?: string; body?: BodyInit },
): Promise<Dissonance.REST.Response<ResponseType>> => {
  const response = await fetch(getAPIUrl(path), {
    method: typeof options?.method === 'string' ? options.method : 'GET',
    headers: {
      ...options?.headers,
      ...(typeof auth === 'string' ? { Authorization: `Bot ${auth}` } : void 0),
      'Accept-Encoding': 'gzip,deflate',
      'User-Agent': 'Dissonance (https://github.com/Socketlike/Dissonance, 0.0.1)',
    },
  })

  return {
    response,
    data: (await response.clone().json()) as unknown as ResponseType,
  }
}
