# Osmosis Pixel Bot

### 1. 크리덴셜 채우기

`./bot/secret.ts` 파일을 생성한 뒤에, 아래 내용을 채우세요.

```ts
export const Secrets = {
  PRIVATE_KEY: 'pk-key', // 0x로 시작해도 되고 아니여도 됨
  granterAddrs: ['osmo15zysaya5j34vy2cqd7y9q8m3drjpy0d2lvmkpa'],
};
```

### 2. 봇 돌리기

```bash
yarn
yarn workspace bot start
```
