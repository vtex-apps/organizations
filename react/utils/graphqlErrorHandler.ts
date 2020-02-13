import { pathOr } from 'ramda'

export const getErrorMessage = (e: any) => {
  const message = pathOr(
    '',
    [
      'graphQLErrors',
      0,
      'extensions',
      'exception',
      'response',
      'data',
      'Message',
    ],
    e
  )
  return message
}

export const handleGlobalError = () => {
  return (e: Error) => {
    var message: string = pathOr(
      '',
      [
        'graphQLErrors',
        0,
        'extensions',
        'exception',
        'response',
        'data',
        'Message',
      ],
      e
    )
    return Promise.reject(message)
  }
}
