import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import { fromBase64 } from '@cosmjs/encoding';
import { BroadcastMode } from '@cosmjs/launchpad';
import {
  decodePubkey,
  decodeTxRaw,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
} from '@cosmjs/proto-signing';
import { GeneratedType, Registry } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import { Keplr } from '@keplr-wallet/types';
import { MsgExec, MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { SendAuthorization } from 'cosmjs-types/cosmos/bank/v1beta1/authz';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { PubKey } from 'cosmjs-types/cosmos/crypto/secp256k1/keys';
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing';
import { AuthInfo, Fee, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { Timestamp } from 'cosmjs-types/google/protobuf/timestamp';
import dayjs from 'dayjs';
import React, { useCallback } from 'react';
import styled from 'styled-components';

const defaultRegistryTypes: ReadonlyArray<[string, GeneratedType]> = [
  ['/cosmos.authz.v1beta1.MsgGrant', MsgGrant],
  ['/cosmos.authz.v1beta1.SendAuthorization', SendAuthorization],
  ['/cosmos.authz.v1beta1.MsgExec', MsgExec],
  ['/cosmos.tx.v1beta1.AuthInfo', AuthInfo],
  ['/cosmos.crypto.secp256k1.PubKey', PubKey],
  ['/google/protobuf/any', Any],
  ['/cosmos.bank.v1beta1.tx', MsgSend],
  ['/cosmos.tx.v1beta1.TxRaw', TxRaw],
];

export const registry = new Registry(defaultRegistryTypes);

declare global {
  interface Window {
    keplr: Keplr;
  }
}

const HomePage = () => {
  const onClick = useCallback(async () => {
    if (typeof window.keplr === 'undefined') {
      window.alert('Please install keplr extension');
      return;
    }

    const chainId = 'osmosis-1';
    await window.keplr.enable(chainId);

    const offlineSigner = window.keplr.getOfflineSigner(chainId);

    const stargateClient = await SigningStargateClient.connectWithSigner(
      'https://osmosis-1--rpc--full.datahub.figment.io/apikey/1d501057297ffd7db2a343c2d3daf459',
      offlineSigner,
    );

    const accounts = await offlineSigner.getAccounts();
    const firstAccount = accounts[0];

    const pubkey = encodePubkey(encodeSecp256k1Pubkey(firstAccount.pubkey));
    const { sequence, accountNumber } = await stargateClient.getSequence(
      firstAccount.address,
    );

    // const grantMsg = {
    //   typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    //   value: {
    //     granter: firstAccount.address,
    //     grantee: 'osmo15zysaya5j34vy2cqd7y9q8m3drjpy0d2lvmkpa',
    //     grant: {
    //       authorization: {
    //         typeUrl: '/cosmos.authz.v1beta1.SendAuthorization',
    //         value: SendAuthorization.encode(
    //           SendAuthorization.fromPartial({
    //             spendLimit: [
    //               {
    //                 denom: 'uosmo',
    //                 amount: '0',
    //               },
    //             ],
    //           }),
    //         ).finish(),
    //       },
    //       expiration: Timestamp.fromPartial({
    //         seconds: Math.floor(
    //           dayjs(dayjs().add(1, 'month')).valueOf() / 1000,
    //         ),
    //         nanos: 0,
    //       }),
    //     },
    //   },
    // };

    // const txBodyEncodeObject = {
    //   typeUrl: '/cosmos.tx.v1beta1.TxBody',
    //   value: {
    //     messages: [grantMsg],
    //     memo: 'Grant for MANYTHINGS',
    //   },
    // };
    // const txBodyBytes = registry.encode(txBodyEncodeObject);

    // const signDoc = makeSignDoc(
    //   txBodyBytes,
    //   makeAuthInfoBytes(
    //     [{ pubkey, sequence }],
    //     [{ denom: 'uosmo', amount: '0' }],
    //     0,
    //   ),
    //   chainId,
    //   accountNumber,
    // );

    // const signResponse = await offlineSigner.signDirect(
    //   firstAccount.address,
    //   signDoc,
    // );
    // console.log(signResponse);

    const signResponse = {
      signature: {
        pub_key: {
          type: 'tendermint/PubKeySecp256k1',
          value: 'AyQ45JJrWYfXF6EvRpaP38RCX8S7AWZCsyIg+/HYRzRA',
        },
        signature:
          '/KEPwFYf222BXlfHFvuR9eAklXlhDnLgNR50tFD2QpRoL6nGQURpc8BL8d6WcjT3Fz0nhP2YkRZKlQUXQ9/7TA==',
      },
    };

    // try {
    // const msgExecMsg = {
    //   type: 'cosmos-sdk/MsgExec',
    //   value: MsgExec.fromPartial({
    //     fromAddress: 'osmo15zysaya5j34vy2cqd7y9q8m3drjpy0d2lvmkpa',
    //     toAddress: 'osmo15zysaya5j34vy2cqd7y9q8m3drjpy0d2lvmkpa',
    //     amount: [
    //       {
    //         denom: 'uosmo',
    //         amount: '1',
    //       },
    //     ],
    //   }).finish(),
    // };
    const msgExecMsg = {
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
      value: {
        grantee: 'osmo15zysaya5j34vy2cqd7y9q8m3drjpy0d2lvmkpa',
        msgs: [
          registry.encode({
            typeUrl: '/cosmos.bank.v1beta1.tx',
            value: {
              fromAddress: firstAccount.address,
              toAddress: firstAccount.address,
              amount: [
                {
                  denom: 'uosmo',
                  amount: '0',
                },
              ],
            },
          }),
        ],
      },
    };

    const pubkeyProto = PubKey.fromPartial({
      key: fromBase64(signResponse.signature.pub_key.value),
    });

    const authInfoBytes = makeAuthInfoBytes(
      [
        {
          pubkey,
          sequence,
        },
      ],
      [{ denom: 'uosmo', amount: '0' }],
      80000,
      1,
    );

    const signedTx = registry.encode({
      typeUrl: '/cosmos.tx.v1beta1.TxRaw',
      value: {
        bodyBytes: registry.encode({
          typeUrl: '/cosmos.tx.v1beta1.TxBody',
          value: {
            messages: [msgExecMsg],
            memo: 'osmopixel (107,151,12)',
          },
        }),
        authInfoBytes: registry.encode({
          typeUrl: '/cosmos.tx.v1beta1.AuthInfo',
          value: {
            signerInfos: [
              {
                publicKey: Any.fromPartial({
                  typeUrl: '/cosmos.crypto.secp256k1.PubKey',
                  value: Uint8Array.from(PubKey.encode(pubkeyProto).finish()),
                }),
                modeInfo: {
                  single: {
                    mode: SignMode.SIGN_MODE_DIRECT,
                  },
                },
                // sequence is from signed user's
                sequence: sequence,
              },
            ],
            fee: Fee.fromPartial({
              amount: [{ denom: 'uosmo', amount: '0' }],
              gasLimit: '80000',
            }),
          },
        }),
        signatures: [fromBase64(signResponse.signature.signature)],
      },
    });

    console.log(
      decodeTxRaw(
        registry.encode({
          typeUrl: '/cosmos.tx.v1beta1.TxRaw',
          value: {
            bodyBytes: registry.encode({
              typeUrl: '/cosmos.tx.v1beta1.TxBody',
              value: {
                messages: [msgExecMsg],
                memo: 'osmopixel (107,151,12)',
              },
            }),
            authInfoBytes: authInfoBytes,
            signatures: [fromBase64(signResponse.signature.signature)],
          },
        }),
      ),
    );
    const tx = TxRaw.fromPartial({
      bodyBytes: registry.encode({
        typeUrl: '/cosmos.tx.v1beta1.TxBody',
        value: {
          messages: [msgExecMsg],
          memo: 'osmopixel (107,151,12)',
        },
      }),
      authInfoBytes: authInfoBytes,
      signatures: [fromBase64(signResponse.signature.signature)],
    });
    return window.keplr.sendTx(
      chainId,
      registry.encode({
        typeUrl: '/cosmos.tx.v1beta1.TxRaw',
        value: {
          bodyBytes: registry.encode({
            typeUrl: '/cosmos.tx.v1beta1.TxBody',
            value: {
              messages: [msgExecMsg],
              memo: 'osmopixel (107,151,12)',
            },
          }),
          authInfoBytes: authInfoBytes,
          signatures: [fromBase64(signResponse.signature.signature)],
        },
      }),
      BroadcastMode.Block,
    );
    // }
  }, []);

  return (
    <Container>
      <ManythingsLogo src="/assets/manythings.png" />
      <Button onClick={onClick}>Generate Sign</Button>
    </Container>
  );
};

export default HomePage;

const Container = styled.div`
  padding: 56px 0;

  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ManythingsLogo = styled.img`
  max-width: 800px;
  width: 95%;
  image-rendering: pixelated;
`;
const Button = styled.button`
  margin-top: 32px;
  padding: 16px 20px;

  border: 2px solid rgba(255, 255, 255, 0.45);
  border-radius: 16px;
  background-color: black;

  font-family: 'Platform';
  font-weight: 500;
  font-size: 1.2rem;
  color: white;
`;
