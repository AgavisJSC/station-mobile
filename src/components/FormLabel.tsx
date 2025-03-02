import React, { ReactElement } from 'react'
import { StyleSheet } from 'react-native'

import Text from './Text'
import color from 'styles/color'

const FormLabel = ({ text }: { text: string }): ReactElement => (
  <Text style={styles.formLabel} fontType={'medium'}>
    {text}
  </Text>
)

export default FormLabel

const styles = StyleSheet.create({
  formLabel: {
    color: color.sapphire,
    fontSize: 14,
    marginBottom: 5,
  },
})
