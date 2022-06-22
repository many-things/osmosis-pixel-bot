import { AccountData, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import BIP32Factory from 'bip32';
import { mnemonicToSeedSync } from 'bip39';
import * as ecc from 'tiny-secp256k1';

const mnemonic: string[] = [];

const PRIVATE_KEYS =
  mnemonic.length > 0
    ? mnemonic.map((mnemonic) =>
        (
          BIP32Factory(ecc)
            .fromSeed(mnemonicToSeedSync(mnemonic))
            .derivePath(`m/44'/118'/0'/0/0`).privateKey as Buffer
        ).toString('hex'),
      )
    : [
        // 여기에 하드코딩 해주세요.
        '1st',
        '2nd',
      ];

export const Secrets = {
  PRIVATE_KEYS, // 0x로 시작해도 되고 아니여도 됨
  granterAddrs: PRIVATE_KEYS.map(async (privateKey) => {
    const wallet = await DirectSecp256k1Wallet.fromKey(
      new Uint8Array(Buffer.from(privateKey!, 'hex')),
      'osmo',
    );

    const accounts = await wallet.getAccounts();
    const account: AccountData = accounts[0];

    return account.address;
  }),
};
