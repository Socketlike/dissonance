import fs from 'fs'

export const endpoints = {
  gatewayBot: 'gateway/bot',
}

export const libraryName = 'Dissonance'
export const creator = 'Socketlike'

export const version = (
  JSON.parse(fs.readFileSync('./package.json', 'utf-8')) as { version: string }
).version

export const userAgent = `${libraryName} (https://github.com/${creator}/${libraryName}, ${version})`
