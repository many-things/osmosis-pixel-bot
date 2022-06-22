import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import { BroadcastMode } from '@cosmjs/launchpad';
import {
  decodeTxRaw,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
} from '@cosmjs/proto-signing';
import { GeneratedType, Registry } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import { Keplr } from '@keplr-wallet/types';
import { MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { SendAuthorization } from 'cosmjs-types/cosmos/bank/v1beta1/authz';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Timestamp } from 'cosmjs-types/google/protobuf/timestamp';
import dayjs from 'dayjs';
import React, { useCallback } from 'react';
import styled from 'styled-components';

const defaultRegistryTypes: ReadonlyArray<[string, GeneratedType]> = [
  ['/cosmos.authz.v1beta1.MsgGrant', MsgGrant],
  ['/cosmos.bank.v1beta1.SendAuthorization', SendAuthorization],
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

    const grantMsg = {
      typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
      value: {
        granter: firstAccount.address,
        grantee: 'osmo15zysaya5j34vy2cqd7y9q8m3drjpy0d2lvmkpa',
        grant: {
          authorization: {
            typeUrl: '/cosmos.bank.v1beta1.SendAuthorization',
            value: SendAuthorization.encode(
              SendAuthorization.fromPartial({
                spendLimit: [
                  {
                    denom: 'uosmo',
                    amount: '1',
                  },
                ],
              }),
            ).finish(),
          },
          expiration: Timestamp.fromPartial({
            seconds: Math.floor(
              dayjs(dayjs().add(1, 'month')).valueOf() / 1000,
            ),
            nanos: 0,
          }),
        },
      },
    };

    const txBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: [grantMsg],
        memo: 'Grant for MANYTHINGS',
      },
    };
    const txBodyBytes = registry.encode(txBodyEncodeObject);

    const signDoc = makeSignDoc(
      txBodyBytes,
      makeAuthInfoBytes(
        [{ pubkey, sequence }],
        [{ denom: 'uosmo', amount: '0' }],
        80000,
      ),
      chainId,
      accountNumber,
    );

    const { signed, signature } = await window.keplr.signDirect(
      chainId,
      firstAccount.address,
      signDoc,
    );
    const txRaw = TxRaw.fromPartial({
      bodyBytes: signed.bodyBytes,
      authInfoBytes: signed.authInfoBytes,
      signatures: [new Uint8Array(Buffer.from(signature.signature, 'base64'))],
    });

    const tx = TxRaw.encode(txRaw).finish();
    console.log(tx);
    console.log(decodeTxRaw(tx));
    const encodedTxHash = await window.keplr.sendTx(
      chainId,
      tx,
      BroadcastMode.Block,
    );
    const txHash = Buffer.from(encodedTxHash).toString('hex').toUpperCase();
    window.alert(JSON.stringify(txHash));
  }, []);

  return (
    <Container>
      <ManythingsLogo src="/assets/manythings.png" />
      <Button onClick={onClick}>Grant Send Authorization</Button>
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
