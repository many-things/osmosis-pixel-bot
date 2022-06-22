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

const granter = 'osmo1schsnh9pg5eexg349e5gqslcurqm9nn5wcf703';

export const main = async () => {
  const authString = 'foo';
  const privateKey = convertHexStringToBuffer(
    authString.startsWith('0x') ? authString.slice(2) : authString,
  );

  const client = await getClient(chainInfo.rpcUrl);
  const account: Account = await getAccount(privateKey, chainInfo);
  const txMessages = createTxMessage(chainInfo, account.address, granter);
  const rawTx = await createTx(
    client,
    account.address,
    txMessages,
    'osmopixel (0,0,0)',
  );
  console.log(rawTx);
  const signedTx = await signTx(privateKey, rawTx, chainInfo);

  const result = await sendTx(client, signedTx);
  console.log(result);
};

main().catch(console.error);
