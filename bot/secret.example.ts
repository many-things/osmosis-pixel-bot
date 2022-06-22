import { AccountData, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import BIP32Factory from 'bip32';
import { mnemonicToSeedSync } from 'bip39';
import * as ecc from 'tiny-secp256k1';

const MNEMONICS: string[] = [];

const PRIVATE_KEYS =
  MNEMONICS.length > 0
    ? MNEMONICS.map(
        (mnemonic) =>
          BIP32Factory(ecc)
            .fromSeed(mnemonicToSeedSync(mnemonic))
            .derivePath(`m/44'/118'/0'/0/0`).privateKey,
      )
    : [
        // 여기에 하드코딩 해주세요.
        'first',
        'etc',
      ];

export const Secrets = {
  PRIVATE_KEYS, // 0x로 시작해도 되고 아니여도 됨
  granterAddrs: PRIVATE_KEYS.map(async (privateKey) => {
    const wallet = await DirectSecp256k1Wallet.fromKey(
      new Uint8Array(Buffer.from(privateKey!)),
      'osmo',
    );

    const accounts = await wallet.getAccounts();
    const account: AccountData = accounts[0];

    return account.address;
  }),
};
