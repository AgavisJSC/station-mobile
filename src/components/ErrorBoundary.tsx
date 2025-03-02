import React, { FC, ReactNode } from 'react'
import { ErrorBoundary as Component, useText } from 'use-station/src'

interface Props {
  fallback?: ReactNode
}

const ErrorBoundary: FC<Props> = ({ fallback, children }) => {
  const { OOPS } = useText()

  return <Component fallback={fallback ?? OOPS}>{children}</Component>
}

export default ErrorBoundary
