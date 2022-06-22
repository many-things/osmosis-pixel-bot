import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import {
  DirectSecp256k1Wallet,
  decodeTxRaw,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
} from '@cosmjs/proto-signing';
import { StargateClient } from '@cosmjs/stargate';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import { registry } from './registry';

type Address = string;

export class Client {
  public static readonly chainInfo = {
    name: 'osmo',
    rpcUrl:
      'https://osmosis-1--rpc--full.datahub.figment.io/apikey/1d501057297ffd7db2a343c2d3daf459',
    prefix: 'osmo',
    denom: 'uosmo',
  };
  public static readonly chainId = 'osmosis-1';

  public readonly address: Address;
  public readonly accountNumber: number;

  // mutable
  private seqNum: number;

  // immutable
  private key: {
    public: string;
    private: string;
  };
  private wallet: DirectSecp256k1Wallet;
  private client: StargateClient;

  private constructor(
    address: Address,
    seqNum: number,
    accountNumber: number,
    key: { public: string; private: string },
    wallet: DirectSecp256k1Wallet,
    client: StargateClient,
  ) {
    this.address = address;
    this.seqNum = seqNum;
    this.accountNumber = accountNumber;
    this.key = key;
    this.wallet = wallet;
    this.client = client;
    console.log(`CREATE ${address}`);
  }

  public static async new(
    address: string,
    key: { public: string; private: string },
  ): Promise<Client> {
    const client = await getClient(Client.chainInfo.rpcUrl);
    const { accountNumber, sequence } = await client.getSequence(address);

    const privateKey = Buffer.from(
      key.private.startsWith('0x') ? key.private.slice(2) : key.private,
      'hex',
    );

    const wallet = await DirectSecp256k1Wallet.fromKey(
      new Uint8Array(privateKey),
      Client.chainInfo.prefix,
    );

    return new Client(address, sequence, accountNumber, key, wallet, client);
  }

  get sequnceNumber(): number {
    return this.seqNum++;
  }

  public createTxMessage() {
    return [
      {
        typeUrl: '/cosmos.authz.v1beta1.MsgExec',
        value: {
          grantee: this.address,
          msgs: [
            {
              typeUrl: '/cosmos.bank.v1beta1.MsgSend',
              value: MsgSend.encode(
                MsgSend.fromPartial({
                  fromAddress: this.address,
                  toAddress: this.address,
                  amount: [
                    {
                      amount: '1',
                      denom: Client.chainInfo.denom,
                    },
                  ],
                }),
              ).finish(),
            },
          ],
        },
      },
    ];
  }

  public createTx(memo: string) {
    const sequence = this.sequnceNumber;
    const messages = this.createTxMessage();

    return {
      signerData: {
        accountNumber: `${this.accountNumber}`,
        sequence: sequence,
        chainId: Client.chainId,
      },
      fee: {
        amount: [],
        gas: '80000',
      },
      memo,
      msgs: messages,
      sequence: `${sequence}`,
    };
  }

  public async signTx(rawTx: RawTx): Promise<SignedTx> {
    const txBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: rawTx.msgs,
        memo: rawTx.memo,
      },
    };

    const account = (await this.wallet.getAccounts())[0];

    const txBodyBytes = registry.encode(txBodyEncodeObject);

    const secp256k1 = encodeSecp256k1Pubkey(account.pubkey);
    const pubKey = encodePubkey(secp256k1);

    const signDoc = makeSignDoc(
      txBodyBytes,
      makeAuthInfoBytes(
        [
          {
            pubkey: pubKey,
            sequence: rawTx.signerData.sequence,
          },
        ],
        rawTx.fee.amount,
        rawTx.fee.gas,
      ),
      rawTx.signerData.chainId,
      rawTx.signerData.accountNumber,
    );

    const { signature } = await this.wallet.signDirect(
      account.address,
      signDoc,
    );

    const txRaw = TxRaw.fromPartial({
      bodyBytes: signDoc.bodyBytes,
      authInfoBytes: signDoc.authInfoBytes,
      signatures: [new Uint8Array(Buffer.from(signature.signature, 'base64'))],
    });

    return { rawTx, signedTx: { txRaw } };
  }

  public async sendTx(signedTx: SignedTx): Promise<string> {
    const txRawCall = signedTx.signedTx.txRaw;
    const txBytes = TxRaw.encode(txRawCall).finish();
    const response = await this.client.broadcastTx(txBytes);

    return response.transactionHash;
  }
}

const getClient = async (rpcUrl: string): Promise<StargateClient> => {
  const client = await StargateClient.connect(rpcUrl);

  return client;
};

export interface BIP44 {
  type: number;
  account: number;
  index: number;
  prefix: string;
}

export interface Account {
  address: string;
  publicKey: string;
}

export interface RawTx {
  [key: string]: any;
}

export interface SignedTx {
  rawTx: RawTx;
  signedTx?: any;
}

export interface ChainInformation {
  name: string;
  // apiUrl: string;
  rpcUrl: string;
  prefix: string;
  denom: string;
}

export interface RewardAmount {
  denom: string;
  amount: string;
}
