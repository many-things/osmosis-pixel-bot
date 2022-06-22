# Osmosis Pixel Bot

### 1. 크리덴셜 채우기

`./bot/secret.ts` 파일을 생성한 뒤에, 아래 내용을 채우세요. `MsgGrant` & `MsgExec` 방법이 안되서 `granterAddrs`에는 하나만 들어갈 수 있습니다(`PRIVATE_KEY`와 대응되는 public 주소여야 합니다). 여러 개의 지갑을 사용하고 싶으시다면 걍 인스턴스 여러번 실행해야 합니다(기여 환영).

```ts
export const Secrets: Secret = {
  PRIVATE_KEY: 'pk-key', // 0x로 시작해도 되고 아니여도 됨
  MNEMONIC: 'mnemonic', // 니모닉으로 하는 경우 PRIVATE_KEY를 undefined로 설정
  granterAddrs: ['osmo15zysaya5j34vy2cqd7y9q8m3drjpy0d2lvmkpa'],
};
```

### 2. 봇 돌리기

```bash
yarn
yarn workspace bot start
```

### 3. 프론트엔드

```bash
yarn dlx @yarnpkg/sdks
yarn workspace frontend dev
```
