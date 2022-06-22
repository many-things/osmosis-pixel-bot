import _ from 'lodash';

import { Client } from './cosmos/Client';

const main = async () => {
  const address = '';
  const key = {
    public: address,
    private: '',
  };

  const client = await Client.new(address, key);

  const txMessages = [];
  for (const num of _.range(0, 10)) {
    const msg = client.createTx(`${num}`);

    txMessages.push(await client.signTx(msg));
  }

  for (const msg of txMessages) {
    const hash = await client.sendTx(msg);
    console.log(hash);
  }
};

main()
  .catch(console.error)
  .finally(() => process.exit());
