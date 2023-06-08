<p>
  <h1 align="center">Dissonance</h1>
</p>

<p align="center">
  <a href="https://github.com/Socketlike/Dissonance/releases/latest">
    <img alt="latest release" src="https://img.shields.io/github/v/release/Socketlike/Dissonance?label=version&sort=semver">
  </a>
  <a href="https://github.com/Socketlike/Dissonance/actions/workflows/lint.yml">
    <img alt="lint status" src="https://img.shields.io/github/actions/workflow/status/Socketlike/Dissonance/lint.yml?label=lint">
  </a>
  <a href="https://github.com/Socketlike/Dissonance/actions/workflows/release.yml">
    <img alt="build status" src="https://img.shields.io/github/actions/workflow/status/Socketlike/Dissonance/release.yml?label=build">
  </a>
  <a href="https://justforfunnoreally.dev">
    <img alt="just for fun. no, really." src="https://img.shields.io/badge/justforfunnoreally-dev-9ff">
  </a>
</p>

<p align="center">Yet another Discord library for bots in TypeScript, with a primary focus on performance and instability</p>

## What the hell is this?

It is just another Discord library for bots, just like [D.JS](https://discord.js.org) and
[Eris](https://abal.moe/eris).  
This is a **work-in-progress**.

## Why does this exist? We already have so many of them already!

- It exists because I wanted to [have a bit of fun. No, really.](https://justforfunnoreally.dev)
- This also exists because (not to irritate anyone, this is my personal opinion) I find the generic
  Discord bot library either too slow or bloated (D.JS) or has literally illegible code (Eris).

## Requirements

- node >= `LTS`
- pnpm `current` or not too outdated from `current`
- knowledge in `ECMAScript` (we don't talk about `CommonJS`)

## Installation

```bash
pnpm i @sckt/dissonance
```

## Notes

This library only supports `ECMAScript`. (we don't talk about `CommonJS`)

- If you want to use this with TypeScript, don't forget to build it with `esm` as the `format`.
- If you want to use this without TypeScript, don't forget to use `.mjs` extensions or use `module`
  for the `type` field in `package.json`.
- If you **REALLY** want to use this with `CommonJS`, use `import()`. (I will not provide support
  for this)
