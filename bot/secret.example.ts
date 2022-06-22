import { AccountData, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import BIP32Factory from 'bip32';
import { mnemonicToSeedSync } from 'bip39';
import * as ecc from 'tiny-secp256k1';

export type Secrets = {
  wallets: {
    privateKey: string;
    address: string;
  }[];
};

const ChangeThis: {
  PRIVATE_KEYS: string[];
  MNEMONICS: string[];
} = {
  PRIVATE_KEYS: [''],
  MNEMONICS: [],
};

const PRIVATE_KEYS =
  ChangeThis.MNEMONICS.length > 0
    ? ChangeThis.MNEMONICS.map((mnemonic) =>
        (
          BIP32Factory(ecc)
            .fromSeed(mnemonicToSeedSync(mnemonic))
            .derivePath(`m/44'/118'/0'/0/0`).privateKey as Buffer
        ).toString('hex'),
      )
    : ChangeThis.PRIVATE_KEYS;

export const getSecrets = async () => {
  const ADDRESS_LIST = await Promise.all(
    PRIVATE_KEYS.map(async (privateKey) => {
      const wallet = await DirectSecp256k1Wallet.fromKey(
        new Uint8Array(Buffer.from(privateKey!, 'hex')),
        'osmo',
      );

      const accounts = await wallet.getAccounts();
      const account: AccountData = accounts[0];

      return account.address;
    }),
  );

  const wallets = ADDRESS_LIST.map((address, index) => ({
    address,
    privateKey: PRIVATE_KEYS[index],
  }));

  return {
    wallets,
  };
};
