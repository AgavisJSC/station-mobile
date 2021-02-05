import { MnemonicKey } from '@terra-money/terra.js'
import { encrypt, decrypt } from './crypto'

import preferences, {
  PreferencesEnum,
} from 'nativeModules/preferences'
import keystore from 'nativeModules/keystore'
import {
  removeBioAuthPassword,
  upsertBioAuthPassword,
} from './storage'

const sanitize = (s = ''): string =>
  s.toLowerCase().replace(/[^a-z]/g, '')

export const formatSeedStringToArray = (seed: string): string[] => {
  return seed
    .trim()
    .replace(/[\n\r]/g, ' ')
    .replace(/\s\s+/g, ' ')
    .split(' ')
    .map(sanitize)
}

export const generateAddresses = (
  mnemonic: string
): {
  mk118: MnemonicKey
  mk330: MnemonicKey
} => {
  const formatted = formatSeedStringToArray(mnemonic).join(' ')
  const mk118 = new MnemonicKey({
    mnemonic: formatted,
    coinType: 118,
  })
  const mk330 = new MnemonicKey({
    mnemonic: formatted,
    coinType: 330,
  })

  return { mk118, mk330 }
}

export const createWallet = async ({
  seed,
  name,
  password,
}: {
  seed: string
  name: string
  password: string
}): Promise<
  { success: true; wallet: LocalWallet } | { success: false }
> => {
  const { mk330 } = generateAddresses(seed)

  return recoverWalletWithMnemonicKey(mk330, { name, password })
}

export const recoverWalletWithMnemonicKey = async (
  mk: MnemonicKey,
  { name, password }: { name: string; password: string }
): Promise<
  { success: true; wallet: LocalWallet } | { success: false }
> => {
  try {
    const key = encrypt(mk.privateKey.toString('hex'), password)
    if (!key) {
      throw new Error('Encryption error occurred')
    }
    const wallet = { name, address: mk.accAddress }
    await addWallet({ wallet, key, password })
    return { success: true, wallet }
  } catch {
    return { success: false }
  }
}

export const decryptKey = (
  encryptedKey: string,
  password: string
): string => {
  try {
    return decrypt(encryptedKey, password)
  } catch {
    throw new Error('Incorrect password')
  }
}

export const getWallets = async (): Promise<LocalWallet[]> => {
  try {
    const wallets = await preferences.getString(
      PreferencesEnum.wallets
    )
    return JSON.parse(wallets)
  } catch {
    return []
  }
}

export const getWallet = async (
  name: string
): Promise<LocalWallet | undefined> => {
  const wallets = await getWallets()
  return wallets.find((wallet) => wallet.name === name)
}

export const getEncryptedKey = async (
  name: string
): Promise<string> => {
  const encryptedKey = await keystore.read(name)
  return encryptedKey
}

export const addWallet = async ({
  wallet,
  key,
  password,
}: {
  wallet: LocalWallet
  key: string
  password: string
}): Promise<void> => {
  const wallets = await getWallets()

  if (wallets.find((w) => w.name === wallet.name))
    throw new Error('Wallet with that name already exists')

  preferences.setString(
    PreferencesEnum.wallets,
    JSON.stringify([...wallets, wallet])
  )
  keystore.write(wallet.name, key)

  await upsertBioAuthPassword({ walletName: wallet.name, password })
}

export const getDecyrptedKey = async (
  name: string,
  password: string
): Promise<string> => {
  const encryptedKey = await getEncryptedKey(name)
  const decrypted = decryptKey(encryptedKey, password)

  return decrypted
}

export const deleteWallet = async ({
  walletName,
}: {
  walletName: string
}): Promise<boolean> => {
  try {
    const wallets = await getWallets()

    const removedWallets = wallets.filter(
      (x) => x.name !== walletName
    )
    preferences.setString(
      PreferencesEnum.wallets,
      JSON.stringify(removedWallets)
    )
    keystore.remove(walletName)
    await removeBioAuthPassword({ walletName })
    return true
  } catch {
    return false
  }
}

export const changePassword = async (
  name: string,
  ondPassword: string,
  newPassword: string
): Promise<boolean> => {
  try {
    const decryptedKey = await getDecyrptedKey(name, ondPassword)
    const encryptedKey = encrypt(decryptedKey, newPassword)
    keystore.write(name, encryptedKey)
    await upsertBioAuthPassword({
      walletName: name,
      password: newPassword,
    })
    return true
  } catch {
    return false
  }
}

export const testPassword = async ({
  name,
  password,
}: {
  name: string
  password: string
}): Promise<
  { isSuccess: true } | { isSuccess: false; errorMessage: string }
> => {
  const wallet = await getWallet(name)

  if (!wallet) {
    return {
      isSuccess: false,
      errorMessage: 'Wallet with that name does not exist',
    }
  }

  const key = await keystore.read(wallet.name)
  const ret = decrypt(key, password)
  if (ret) {
    return {
      isSuccess: true,
    }
  }
  return {
    isSuccess: false,
    errorMessage: 'Incorrect password',
  }
}
