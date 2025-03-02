import {
  CreateTxOptions,
  LCDClient,
  RawKey,
  Key,
  TxBroadcastResult,
  TxSuccess,
  TxError,
} from '@terra-money/terra.js'

import { useConfig } from 'use-station/src'

import { getDecyrptedKey } from 'utils/wallet'

interface Block {
  height: number
  txhash: string
  raw_log: string
  gas_wanted: number
  gas_used: number
}

const useTx = (): {
  broadcastTx: (props: {
    address: string
    walletName: string
    password: string
    tx: CreateTxOptions
  }) => Promise<TxBroadcastResult<Block, TxSuccess | TxError>>
} => {
  const { chain } = useConfig()

  const getKey = async (params: {
    name: string
    password: string
  }): Promise<Key> => {
    const { name, password } = params
    const decyrptedKey = await getDecyrptedKey(name, password)
    return new RawKey(Buffer.from(decyrptedKey, 'hex'))
  }

  const broadcastTx = async ({
    address,
    walletName,
    password,
    tx,
  }: {
    address: string
    walletName: string
    password: string
    tx: CreateTxOptions
  }): Promise<TxBroadcastResult<Block, TxSuccess | TxError>> => {
    const lcd = new LCDClient({
      chainID: chain.current.chainID,
      URL: chain.current.lcd,
      gasPrices: tx.gasPrices,
    })

    // fee + tax
    const unsignedTx = await lcd.tx.create(address, tx)

    const key = await getKey({
      name: walletName,
      password,
    })
    const signed = await key.signTx(unsignedTx)

    return lcd.tx.broadcast(signed)
  }

  return {
    broadcastTx,
  }
}

export default useTx
