import { useQuery } from 'react-apollo'
import checkProfileAllowedQuery from '../graphql/documents.graphql'

export const useProfileAllowed = (skip: boolean) => {
  const { loading, data, error } = useQuery(checkProfileAllowedQuery, {
    ssr: false,
    skip,
  })

  return !loading && data && !error ? !!data.checkProfileAllowed.allowed : null
}
