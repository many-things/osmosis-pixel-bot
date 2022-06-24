# Osmosis Pixel Bot

![latest pixels](https://github.com/many-things/osmosis-pixel-bot/blob/main/bot/assets/pixels.png?raw=true)

### 1. 크리덴셜 채우기

`./bot/secret.json` 파일을 생성한 뒤에, 아래 내용을 입력해 주세요. 인증 종류에 따라 `PRIVATE_KEYS` 또는 `MNEMONICS`를 채우면 됩니다(하나의 지갑에 대해서 중복되면 안됩니다).

```jsonc
{
  "PRIVATE_KEYS": [
    // 0x로 시작해도 되고 아니여도 됨
    "pk-wallet-a"
  ],
  "MNEMONICS": ["seed-of-wallet-b", "seed-of-wallet-c"]
}
```

### 2. 봇 돌리기

```bash
yarn
yarn workspace bot start
```

### 3. 프론트엔드 (`MsgGrant`를 받기 위해 있었으나, 현재는 사용되지 않음)

```bash
yarn dlx @yarnpkg/sdks
yarn workspace frontend dev
```
