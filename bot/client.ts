// Copyright(c) 2022 @HeesungB
// MIT Licensed
// https://github.com/HeesungB/no-bad-chihuahua
import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import {
  AccountData,
  DirectSecp256k1Wallet,
  decodeTxRaw,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
} from '@cosmjs/proto-signing';
import { GeneratedType, Registry } from '@cosmjs/proto-signing';
import { StargateClient } from '@cosmjs/stargate';
import { MsgExec } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { MsgMultiSend, MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import {
  MsgFundCommunityPool,
  MsgSetWithdrawAddress,
  MsgWithdrawDelegatorReward,
  MsgWithdrawValidatorCommission,
} from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
import {
  MsgDeposit,
  MsgSubmitProposal,
  MsgVote,
} from 'cosmjs-types/cosmos/gov/v1beta1/tx';
import {
  MsgBeginRedelegate,
  MsgCreateValidator,
  MsgDelegate,
  MsgEditValidator,
  MsgUndelegate,
} from 'cosmjs-types/cosmos/staking/v1beta1/tx';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import {
  MsgAcknowledgement,
  MsgChannelCloseConfirm,
  MsgChannelCloseInit,
  MsgChannelOpenAck,
  MsgChannelOpenConfirm,
  MsgChannelOpenInit,
  MsgChannelOpenTry,
  MsgRecvPacket,
  MsgTimeout,
  MsgTimeoutOnClose,
} from 'cosmjs-types/ibc/core/channel/v1/tx';
import {
  MsgCreateClient,
  MsgSubmitMisbehaviour,
  MsgUpdateClient,
  MsgUpgradeClient,
} from 'cosmjs-types/ibc/core/client/v1/tx';
import {
  MsgConnectionOpenAck,
  MsgConnectionOpenConfirm,
  MsgConnectionOpenInit,
  MsgConnectionOpenTry,
} from 'cosmjs-types/ibc/core/connection/v1/tx';

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

const defaultRegistryTypes: ReadonlyArray<[string, GeneratedType]> = [
  ['/cosmos.authz.v1beta1.MsgExec', MsgExec],
  ['/cosmos.bank.v1beta1.MsgSend', MsgSend],
  ['/cosmos.bank.v1beta1.MsgMultiSend', MsgMultiSend],
  ['/cosmos.distribution.v1beta1.MsgFundCommunityPool', MsgFundCommunityPool],
  ['/cosmos.distribution.v1beta1.MsgSetWithdrawAddress', MsgSetWithdrawAddress],
  [
    '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    MsgWithdrawDelegatorReward,
  ],
  [
    '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission',
    MsgWithdrawValidatorCommission,
  ],
  ['/cosmos.gov.v1beta1.MsgDeposit', MsgDeposit],
  ['/cosmos.gov.v1beta1.MsgSubmitProposal', MsgSubmitProposal],
  ['/cosmos.gov.v1beta1.MsgVote', MsgVote],
  ['/cosmos.staking.v1beta1.MsgBeginRedelegate', MsgBeginRedelegate],
  ['/cosmos.staking.v1beta1.MsgCreateValidator', MsgCreateValidator],
  ['/cosmos.staking.v1beta1.MsgDelegate', MsgDelegate],
  ['/cosmos.staking.v1beta1.MsgEditValidator', MsgEditValidator],
  ['/cosmos.staking.v1beta1.MsgUndelegate', MsgUndelegate],
  ['/ibc.core.channel.v1.MsgChannelOpenInit', MsgChannelOpenInit],
  ['/ibc.core.channel.v1.MsgChannelOpenTry', MsgChannelOpenTry],
  ['/ibc.core.channel.v1.MsgChannelOpenAck', MsgChannelOpenAck],
  ['/ibc.core.channel.v1.MsgChannelOpenConfirm', MsgChannelOpenConfirm],
  ['/ibc.core.channel.v1.MsgChannelCloseInit', MsgChannelCloseInit],
  ['/ibc.core.channel.v1.MsgChannelCloseConfirm', MsgChannelCloseConfirm],
  ['/ibc.core.channel.v1.MsgRecvPacket', MsgRecvPacket],
  ['/ibc.core.channel.v1.MsgTimeout', MsgTimeout],
  ['/ibc.core.channel.v1.MsgTimeoutOnClose', MsgTimeoutOnClose],
  ['/ibc.core.channel.v1.MsgAcknowledgement', MsgAcknowledgement],
  ['/ibc.core.client.v1.MsgCreateClient', MsgCreateClient],
  ['/ibc.core.client.v1.MsgUpdateClient', MsgUpdateClient],
  ['/ibc.core.client.v1.MsgUpgradeClient', MsgUpgradeClient],
  ['/ibc.core.client.v1.MsgSubmitMisbehaviour', MsgSubmitMisbehaviour],
  ['/ibc.core.connection.v1.MsgConnectionOpenInit', MsgConnectionOpenInit],
  ['/ibc.core.connection.v1.MsgConnectionOpenTry', MsgConnectionOpenTry],
  ['/ibc.core.connection.v1.MsgConnectionOpenAck', MsgConnectionOpenAck],
  [
    '/ibc.core.connection.v1.MsgConnectionOpenConfirm',
    MsgConnectionOpenConfirm,
  ],
  ['/ibc.applications.transfer.v1.MsgTransfer', MsgTransfer],
];

const registry = new Registry(defaultRegistryTypes);

export const convertHexStringToBuffer = (hexString: string) =>
  Buffer.from(hexString, 'hex');

export const getClient = async (rpcUrl: string): Promise<StargateClient> => {
  const client = await StargateClient.connect(rpcUrl);

  return client;
};

export const getAccount = async (
  privateKey: Buffer,
  chainInformation: ChainInformation,
): Promise<Account> => {
  const wallet = await DirectSecp256k1Wallet.fromKey(
    new Uint8Array(privateKey),
    chainInformation.prefix,
  );
  const accounts = await wallet.getAccounts();
  const accountData: AccountData = accounts[0];

  return {
    address: accountData.address,
    publicKey: accountData.pubkey.toString(),
  };
};

export const createTxMessage = (
  chainInformation: ChainInformation,
  walletAddress: string,
) => {
  const messages = [];

  console.log({ walletAddress });
  messages.push({
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: MsgSend.encode(
      MsgSend.fromPartial({
        fromAddress: walletAddress,
        toAddress: walletAddress,
        amount: [
          {
            amount: '1',
            denom: chainInformation.denom,
          },
        ],
      }),
    ).finish(),
  });

  return [
    {
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
      value: {
        grantee: walletAddress,
        msgs: messages,
      },
    },
  ];
};

export const createTx = async (
  client: StargateClient,
  delegatorAddress: string,
  messages: any[],
  memo: string,
) => {
  const sequence = await client.getSequence(delegatorAddress);
  const chainId = 'osmosis-1';

  const rawTx: RawTx = {
    signerData: {
      accountNumber: `${sequence.accountNumber}`,
      sequence: sequence.sequence,
      chainId,
    },
    fee: {
      amount: [],
      gas: '80000',
    },
    memo,
    msgs: messages,
    sequence: `${sequence.sequence}`,
  };

  return rawTx;
};

export const signTx = async (
  privateKeyBuffer: Buffer,
  rawTx: RawTx,
  chainInformation: ChainInformation,
): Promise<SignedTx> => {
  const wallet = await DirectSecp256k1Wallet.fromKey(
    new Uint8Array(privateKeyBuffer),
    chainInformation.prefix,
  );
  const accounts = await wallet.getAccounts();

  const txBodyEncodeObject = {
    typeUrl: '/cosmos.tx.v1beta1.TxBody',
    value: {
      messages: rawTx.msgs,
      memo: rawTx.memo,
    },
  };

  const txBodyBytes = registry.encode(txBodyEncodeObject);
  // console.log(JSON.stringify(decodeTxBody txBodyBytes))

  const pubkey = encodePubkey(encodeSecp256k1Pubkey(accounts[0].pubkey));

  const signDoc = makeSignDoc(
    txBodyBytes,
    makeAuthInfoBytes(
      [
        {
          pubkey,
          sequence: rawTx.signerData.sequence,
        },
      ],
      rawTx.fee.amount,
      rawTx.fee.gas,
    ),
    rawTx.signerData.chainId,
    rawTx.signerData.accountNumber,
  );

  const { signature } = await wallet.signDirect(accounts[0].address, signDoc);

  const txRaw = TxRaw.fromPartial({
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    signatures: [new Uint8Array(Buffer.from(signature.signature, 'base64'))],
  });

  return { rawTx, signedTx: { txRaw } };
};

export const sendTx = async (
  client: StargateClient,
  signedTx: SignedTx,
): Promise<string> => {
  const txRawCall = signedTx.signedTx.txRaw;
  const txBytes = TxRaw.encode(txRawCall).finish();
  console.log(JSON.stringify(decodeTxRaw(txBytes)));
  const response = await client.broadcastTx(txBytes);

  return response.transactionHash;
};
