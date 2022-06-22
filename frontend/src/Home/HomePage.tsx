import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import { BroadcastMode } from '@cosmjs/launchpad';
import {
  DirectSecp256k1Wallet,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
} from '@cosmjs/proto-signing';
import { GeneratedType, Registry } from '@cosmjs/proto-signing';
import { SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import { Keplr } from '@keplr-wallet/types';
import axios from 'axios';
import { MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { SendAuthorization } from 'cosmjs-types/cosmos/bank/v1beta1/authz';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Timestamp } from 'cosmjs-types/google/protobuf/timestamp';
import dayjs from 'dayjs';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { convertHexStringToBuffer } from '@/core/bot/client';

const defaultRegistryTypes: ReadonlyArray<[string, GeneratedType]> = [
  ['/cosmos.tx.v1beta1.TxBody', TxBody],
  ['/cosmos.bank.v1beta1.MsgSend', MsgSend],
];

export const registry = new Registry(defaultRegistryTypes);

declare global {
  interface Window {
    keplr: Keplr;
  }
}

const HomePage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authString, setAuthString] = useState<string>('');

  const onClick = useCallback(async () => {
    if (typeof window.keplr === 'undefined') {
      window.alert('Please install keplr extension');
      return;
    }

    const {
      data: { randomPixel: memo },
    } = await axios.get<{ randomPixel: string }>('/api/nextpixel');

    setLoading(true);
    try {
      const chainId = 'osmosis-1';
      await window.keplr.enable(chainId);

      const offlineSigner = window.keplr.getOfflineSigner(chainId);

      // const stargateClient = await SigningStargateClient.connectWithSigner(
      //   'https://osmosis-1--rpc--full.datahub.figment.io/apikey/1d501057297ffd7db2a343c2d3daf459',
      //   offlineSigner,
      // );
      const stargateClient = await StargateClient.connect(
        'https://osmosis-1--rpc--full.datahub.figment.io/apikey/1d501057297ffd7db2a343c2d3daf459',
      );

      const accounts = await offlineSigner.getAccounts();
      const firstAccount = accounts[0];

      const pubkey = encodePubkey(encodeSecp256k1Pubkey(firstAccount.pubkey));
      const { sequence, accountNumber } = await stargateClient.getSequence(
        firstAccount.address,
      );

      const sendMsg = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: firstAccount.address,
          toAddress: firstAccount.address,
          amount: [
            {
              amount: '1',
              denom: 'uosmo',
            },
          ],
        },
      };

      const txBodyEncodeObject = {
        typeUrl: '/cosmos.tx.v1beta1.TxBody',
        value: {
          messages: [sendMsg],
          memo,
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

      const privateKey = convertHexStringToBuffer(
        authString.startsWith('0x') ? authString.slice(2) : authString,
      );

      const wallet = await DirectSecp256k1Wallet.fromKey(
        new Uint8Array(privateKey),
        'osmo',
      );
      const { signed, signature } = await wallet.signDirect(
        firstAccount.address,
        signDoc,
      );
      const txRaw = TxRaw.fromPartial({
        bodyBytes: signed.bodyBytes,
        authInfoBytes: signed.authInfoBytes,
        signatures: [
          new Uint8Array(Buffer.from(signature.signature, 'base64')),
        ],
      });

      const tx = TxRaw.encode(txRaw).finish();
      const encodedTxHash = await stargateClient.broadcastTx(tx);
      // const txHash = Buffer.from(encodedTxHash).toString('hex').toUpperCase();
      setLoading(false);

      window.alert(
        `Success! Transaction: ${encodedTxHash.transactionHash.toUpperCase()}`,
      );
    } catch (e) {
      console.error(e);
      setLoading(false);

      if (e.message.toLowerCase() === 'request rejected') {
        return;
      }

      if (e.message.includes('500')) {
        window.alert('Network may be congested. Please try again.');
      } else {
        window.alert(e.message);
      }
    }
  }, [authString]);

  return (
    <Container>
      <ManythingsLogo src="/assets/manythings.png" />
      <Description>0.01 OSMO = 10,000 pixels</Description>
      <Textarea
        placeholder="Private Key?"
        value={authString}
        disabled={loading}
        onChange={(e) => setAuthString(e.target.value)}
      />
      {!loading && <Button onClick={onClick}>Start</Button>}
      {loading && (
        <Button onClick={() => {}} style={{ cursor: 'progress' }}>
          Loading...
        </Button>
      )}
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
const Description = styled.p`
  margin: 0;
  margin-top: 64px;

  font-family: 'Platform';
  font-size: 1.05rem;
  color: white;
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

const Textarea = styled.textarea`
  margin-top: 32px;
  max-width: 800px;
  width: 95%;
  font-family: 'Platform';
  color: white;
  background-color: #27272a;
`;
