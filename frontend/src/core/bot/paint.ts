import axios from 'axios';
import queryString from 'query-string';

import {
  Account,
  convertHexStringToBuffer,
  createTx,
  createTxMessage,
  getAccount,
  getClient,
  sendTx,
  signTx,
} from './client';

const chainInfo = {
  name: 'osmo',
  rpcUrl:
    'https://osmosis-1--rpc--full.datahub.figment.io/apikey/1d501057297ffd7db2a343c2d3daf459',
  prefix: 'osmo',
  denom: 'uosmo',
};

type TenderMintRPCTXResponse = {
  result: {
    hash: string;
    height: string;
  };
};

export const paintWithGranter = async (
  granter: string,
  memo: string = 'osmopixel (0,0,0)',
) => {
  const txMessages = createTxMessage(chainInfo, account.address, granter);
  const rawTx = await createTx(client, account.address, txMessages, memo);
  const signedTx = await signTx(privateKey, rawTx, chainInfo);

  console.log('[Transaction] Committing transaction...', { granter, memo });
  const txHash = await sendTx(client, signedTx);

  const txInfo = await axios.get<TenderMintRPCTXResponse>(
    queryString.stringifyUrl({
      url: `${chainInfo.rpcUrl}/tx`,
      query: {
        hash: `0x${txHash}`,
      },
    }),
  );

  const blockHeight = parseInt(txInfo.data.result.height);
  console.log('[Transaction] Committed on ', { blockHeight, txHash });
  return blockHeight;
};
