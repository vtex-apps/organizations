declare module 'vtex.my-account-commons' {
  import React from 'react'

  interface ComponentProps {
    titleId: string
    namespace: string
  }

  export const ContentWrapper: React.SFC<ComponentProps>
}
