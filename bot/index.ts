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

export const main = async () => {
  const authString = 'foo';
  const privateKey = convertHexStringToBuffer(
    authString.startsWith('0x') ? authString.slice(2) : authString,
  );

  const client = await getClient(chainInfo.rpcUrl);
  const account: Account = await getAccount(privateKey, chainInfo);
  const txMessages = createTxMessage(chainInfo, account.address);
  const rawTx = await createTx(
    client,
    chainInfo,
    account.address,
    txMessages,
    'osmopixel (0,0,4)',
  );
  console.log(rawTx);
  const signedTx = await signTx(privateKey, rawTx, chainInfo);

  const result = await sendTx(client, signedTx);
  console.log(result);
};

main().catch(console.error);
