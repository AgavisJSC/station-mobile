import React, { ReactElement, useState } from 'react'
import { View } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import WalletConnect from '@walletconnect/client'

import { CreateTxOptions } from '@terra-money/terra.js'

import { User } from 'use-station/src'

import Body from 'components/layout/Body'
import WithAuth from 'components/layout/WithAuth'
import { navigationHeaderOptions } from 'components/layout/Header'
import SubHeader from 'components/layout/SubHeader'
import { Button, FormLabel, FormInput } from 'components'

import { RootStackParams } from 'types/navigation'

import { testPassword } from 'utils/wallet'
import WalletConnectStore from 'stores/WalletConnectStore'
import useWalletConnect from 'hooks/useWalletConnect'
import { txParamParser } from 'utils/util'
import {
  NavigationProp,
  StackActions,
  useNavigation,
} from '@react-navigation/native'

type Props = StackScreenProps<
  RootStackParams,
  'WalletConnectConfirmPassword'
>

const Render = ({
  user,
  connector,
  id,
  tx,
}: {
  user: User
  connector: WalletConnect
  id: number
  tx: CreateTxOptions
} & Props): ReactElement => {
  const walletName = user.name || ''
  const setIsListenConfirmRemove = useSetRecoilState(
    WalletConnectStore.isListenConfirmRemove
  )
  const [inputPassword, setInputPassword] = useState('')

  const [errorMessage, setErrorMessage] = useState('')

  const { dispatch } = useNavigation<
    NavigationProp<RootStackParams>
  >()
  const { confirmSign } = useWalletConnect()

  const onPressAllow = async (): Promise<void> => {
    setErrorMessage('')
    setIsListenConfirmRemove(false)
    const result = await testPassword({
      name: user.name || '',
      password: inputPassword,
    })
    if (result.isSuccess) {
      const result = await confirmSign({
        connector,
        address: user.address,
        walletName,
        tx,
        password: inputPassword,
        id,
      })
      dispatch(StackActions.popToTop())
      dispatch(StackActions.replace('Complete', { result }))
    } else {
      setErrorMessage('Incorrect password')
      setIsListenConfirmRemove(true)
    }
  }

  return (
    <>
      <SubHeader theme={'sapphire'} title={'Password'} />
      <Body
        theme={'sky'}
        containerStyle={{
          justifyContent: 'space-between',
          marginBottom: 40,
          paddingTop: 20,
        }}
      >
        <View>
          <FormLabel text="Confirm with password" />
          <FormInput
            errorMessage={errorMessage}
            value={inputPassword}
            onChangeText={setInputPassword}
            secureTextEntry
          />
        </View>

        <View>
          <Button
            theme={'sapphire'}
            title={'Confirm'}
            onPress={onPressAllow}
          />
        </View>
      </Body>
    </>
  )
}

const ConfirmPassword = (props: Props): ReactElement => {
  const _handshakeTopic = props.route.params?.handshakeTopic
  const walletConnectors = useRecoilValue(
    WalletConnectStore.walletConnectors
  )
  const id = props.route.params?.id
  const tx = props.route.params?.tx
  const connector = walletConnectors[_handshakeTopic]

  return (
    <WithAuth>
      {(user): ReactElement => (
        <Render
          {...{
            ...props,
            user,
            id,
            tx: txParamParser(tx),
            connector,
          }}
        />
      )}
    </WithAuth>
  )
}

ConfirmPassword.navigationOptions = navigationHeaderOptions({
  theme: 'sapphire',
})

export default ConfirmPassword
