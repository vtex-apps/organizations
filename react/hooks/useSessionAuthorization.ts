import { useEffect, useState } from 'react'
import { Session, SessionUnauthorized } from 'vtex.render-runtime'
import { getSession } from '../modules/session'

export const useSessionAuthorization = () => {
  const [session, setSession] = useState<Session | SessionUnauthorized>()
  const sessionPromise = getSession()

  useEffect(() => {
    if (!sessionPromise) {
      return
    }

    sessionPromise.then(sessionResponse => {
      setSession(sessionResponse.response)
    })
  }, [sessionPromise])

  if (session === undefined) {
    return null
  }

  return session &&
  (session as SessionUnauthorized).type &&
  (session as SessionUnauthorized).type.toLowerCase() === 'unauthorized'
    ? false
    : true
}
