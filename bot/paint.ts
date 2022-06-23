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

// const primaryPrivateKey =
//   convertHexStringToBuffer();
//   // '?',

export const paint = async (
  authString: string,
  walletAddress: string,
  memo: string = 'osmopixel (0,0,0)',
) => {
  const privateKey = convertHexStringToBuffer(
    authString.startsWith('0x') ? authString.slice(2) : authString,
  );

  const client = await getClient(chainInfo.rpcUrl);

  // if (
  //   [
  //     'osmo1rlwemt45ryzc8ynakzwgfkltm7jy8lswpnfswn',
  //     'osmo15cenya0tr7nm3tz2wn3h3zwkht2rxrq7g9ypmq',
  //   ].includes(walletAddress)
  // ) {
  //   const account: Account = await getAccount(primaryPrivateKey, chainInfo);
  //   const txMessages = createTxMessage(
  //     chainInfo,
  //     account.address,
  //     walletAddress,
  //   );
  //   const rawTx = await createTx(
  //     client,
  //     account.address,
  //     txMessages,
  //     'hahahaha',
  //   );
  //   const signedTx = await signTx(primaryPrivateKey, rawTx, chainInfo);
  //   await sendTx(client, signedTx);
  //   console.log('Funding');
  // }
  const account: Account = await getAccount(privateKey, chainInfo);
  const txMessages = createTxMessage(chainInfo, walletAddress, walletAddress);
  const rawTx = await createTx(client, account.address, txMessages, memo);
  const signedTx = await signTx(privateKey, rawTx, chainInfo);

  console.log('[Transaction] Committing transaction...', {
    walletAddress,
    memo,
  });
  const txHash = await sendTx(client, signedTx);

  // const txInfo = await axios.get<TenderMintRPCTXResponse>(
  //   queryString.stringifyUrl({
  //     url: `${chainInfo.rpcUrl}/tx`,
  //     query: {
  //       hash: `0x${txHash}`,
  //     },
  //   }),
  // );

  // const blockHeight = parseInt(txInfo.data.result.height);
  console.log('[Transaction] Committed on ', { txHash });
  // return blockHeight;
  return 0;
};
