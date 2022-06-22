import { AccountData, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import BIP32Factory from 'bip32';
import { mnemonicToSeedSync } from 'bip39';
import * as ecc from 'tiny-secp256k1';

import _HardcodedSecrets from './secret.json';

export const GAME_CONFIG = {
  PIXEL_SIZE: 30,
  PIXEL_WIDTH: 250,
  PIXEL_HEIGHT: 250,
  SIDE_BAR_WIDTH: 206,
  CANVAS_SIZE: 30 * 250,
};

export const COLOR_SET = [
  '#FFF',
  '#D4D7D9',
  '#898D90',
  '#000',
  '#FF4500',
  '#FFA800',
  '#FFD635',
  '#00A368',
  '#7EED56',
  '#2450A4',
  '#3690EA',
  '#51E9F4',
  '#811E9F',
  '#B44AC0',
  '#FF99AA',
  '#9C6926',
];

export type Secrets = {
  wallets: {
    privateKey: string;
    address: string;
  }[];
};

const HardcodedSecrets: {
  PRIVATE_KEYS: string[];
  MNEMONICS: string[];
} = _HardcodedSecrets as any;

const PRIVATE_KEYS: string[] = [
  ...(HardcodedSecrets.MNEMONICS.length > 0
    ? HardcodedSecrets.MNEMONICS.map((mnemonic) =>
        (
          BIP32Factory(ecc)
            .fromSeed(mnemonicToSeedSync(mnemonic))
            .derivePath(`m/44'/118'/0'/0/0`).privateKey as Buffer
        ).toString('hex'),
      )
    : []),
  ...HardcodedSecrets.PRIVATE_KEYS,
];

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
