import React, { ReactElement, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { StackScreenProps } from '@react-navigation/stack'

import Body from 'components/layout/Body'
import { Text, Icon, Button } from 'components'
import color from 'styles/color'
import { CreateWalletStackParams } from 'types'
import { useAuth } from 'use-station/src'
import { getIsUseBioAuth, settings } from 'utils/storage'
import { useBioAuth } from 'hooks/useBioAuth'
import { isSupportedBiometricAuthentication } from 'utils/bio'

type Props = StackScreenProps<
  CreateWalletStackParams,
  'WalletCreated'
>

const WalletCreated = ({ route }: Props): ReactElement => {
  const wallet = route.params?.wallet

  const { signIn } = useAuth()
  const { openIsUseBioAuth } = useBioAuth()

  const onPressButton = (): void => {
    signIn(wallet)
    settings.set({ walletName: wallet.name })
  }

  const checkIfUseBioAuth = async (): Promise<void> => {
    if (
      false === (await getIsUseBioAuth()) &&
      (await isSupportedBiometricAuthentication())
    ) {
      openIsUseBioAuth()
    }
  }

  useEffect(() => {
    checkIfUseBioAuth()
  }, [])

  return (
    <Body containerStyle={styles.container}>
      <View style={styles.infoSection}>
        <Icon
          name={'account-balance-wallet'}
          size={60}
          color={color.sapphire}
        />
        <Text style={styles.infoTitle} fontType={'bold'}>
          {'Wallet created!'}
        </Text>
        <Text style={{ color: color.sapphire, textAlign: 'center' }}>
          {'Welcome aboard to Terra Station'}
        </Text>
      </View>
      <Button
        theme={'sapphire'}
        title={'Explore the Terra network'}
        onPress={onPressButton}
      />
    </Body>
  )
}

export default WalletCreated

const styles = StyleSheet.create({
  container: {
    paddingBottom: 50,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 24,
    fontStyle: 'normal',
    lineHeight: 36,
    letterSpacing: 0,
    textAlign: 'center',
    color: color.sapphire,
    marginVertical: 5,
  },
})
