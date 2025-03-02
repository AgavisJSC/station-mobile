import {
  NavigationProp,
  useNavigation,
} from '@react-navigation/native'
import { useSetRecoilState } from 'recoil'
import _ from 'lodash'
import { RawKey, Key } from '@terra-money/terra.js'

import {
  ConfirmPage,
  ConfirmProps,
  useConfirm as useStationConfirm,
  User,
} from 'use-station/src'

import ConfirmStore from 'stores/ConfirmStore'
import { RootStackParams } from 'types'

// @ts-ignore
import getSigner from 'utils/wallet-helper/signer'
// @ts-ignore
import signTx from 'utils/wallet-helper/api/signTx'
import { getDecyrptedKey } from 'utils/wallet'

export type NavigateToConfirmProps = {
  confirm: ConfirmProps
}

export const useConfirm = (): {
  navigateToConfirm: (props: NavigateToConfirmProps) => void
  getComfirmData: ({
    confirm,
    user,
  }: {
    confirm: ConfirmProps
    user: User
  }) => ConfirmPage
  initConfirm: () => void
} => {
  const { navigate } = useNavigation<
    NavigationProp<RootStackParams>
  >()

  // ConfirmProps couldn't be serialized, so it have to transfer on recoil
  const setConfirm = useSetRecoilState(ConfirmStore.confirm)

  const navigateToConfirm = ({
    confirm,
  }: NavigateToConfirmProps): void => {
    setConfirm(confirm)
    navigate('Confirm')
  }

  const initConfirm = (): void => {
    setConfirm(undefined)
  }

  const getComfirmData = ({
    confirm,
    user,
  }: {
    confirm: ConfirmProps
    user: User
  }): ConfirmPage => {
    return useStationConfirm(confirm, {
      user,
      password: '',
      sign: async ({ tx, base, password }) => {
        const decyrptedKey = await getDecyrptedKey(
          user.name || '',
          password
        )
        if (_.isEmpty(decyrptedKey)) {
          throw new Error('Incorrect password')
        }
        const rk = new RawKey(Buffer.from(decyrptedKey, 'hex'))
        const signer = await getSigner(rk.privateKey, rk.publicKey)
        const signedTx = await signTx(tx, signer, base)
        return signedTx
      },
      getKey: async (params): Promise<Key> => {
        const { name, password } = params!
        const decyrptedKey = await getDecyrptedKey(name, password)
        if (_.isEmpty(decyrptedKey)) {
          throw new Error('Incorrect password')
        }
        return new RawKey(Buffer.from(decyrptedKey, 'hex'))
      },
    })
  }

  return { navigateToConfirm, getComfirmData, initConfirm }
}
