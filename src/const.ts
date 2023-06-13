import fs from 'fs'

const { name, version, repository } = JSON.parse(fs.readFileSync('./package.json', 'utf-8')) as {
  version: string
  name: string
  author: string
  repository: {
    url: string
  }
}

const userAgent = `${name} (${repository.url}, ${version})`

const endpoints = {
  gateway: {
    self: 'gateway',
    bot: 'gateway/bot',
  },
}

export { endpoints, name, userAgent, version }
