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

    if (message == '') {
      message = pathOr(
        '',
        [
          'graphQLErrors',
          0,
          'extensions',
          'exception',
          'response',
          'data',
          'errors',
          0,
          'errors',
          0,
          'Message',
        ],
        e
      )
    }

    return Promise.reject(message)
  }
}
