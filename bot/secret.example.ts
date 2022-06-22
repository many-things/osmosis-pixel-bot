type Secret = (
  | {
      PRIVATE_KEY: string;
      MNEMONIC: undefined;
    }
  | {
      PRIVATE_KEY: undefined;
      MNEMONIC: string;
    }
) & {
  granterAddrs: [string];
};

export const Secrets: Secret = {
  PRIVATE_KEY: 'foopriv',
  MNEMONIC: undefined,
  granterAddrs: ['foopub'],
};
