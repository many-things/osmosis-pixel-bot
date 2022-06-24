# Osmosis Pixel Bot

> [A thread](https://twitter.com/_junhoyeo/status/1539889202292174848) of how it works in Twitter

![latest pixels](https://github.com/many-things/osmosis-pixel-bot/blob/main/bot/assets/pixels.png?raw=true)

### 1. Fill Credentials

Create `./bot/secret.json` and fill the contents. Place one `PRIVATE_KEYS` or `MNEMONICS` for one wallet.

```jsonc
{
  "PRIVATE_KEYS": [
    // It can start with `0x` or not
    "pk-wallet-a"
  ],
  "MNEMONICS": ["seed-of-wallet-b", "seed-of-wallet-c"]
}
```

### 2. Run the bot

```bash
yarn
yarn workspace bot start
```

### 3. Run the Frontend (Initially used to get `MsgGrant`, archived for now)

```bash
yarn dlx @yarnpkg/sdks
yarn workspace frontend dev
```
