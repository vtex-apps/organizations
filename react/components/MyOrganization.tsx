import React from 'react'
// import { prop, last, find, propEq, pathOr } from 'ramda'
// import { useQuery } from 'react-apollo'
// import documentQuery from '../graphql/documents.graphql'
// import { EmptyState } from 'vtex.styleguide'

interface Props {
  orgAssignmentId: string
  personaId: string
}

const MyOrganization = (props: Props) => {
  // if approved change status on orgAssignment
  // if declined change status on orgAssignment and remove orgId in persona
  console.log(props)

  return <h1>Test</h1>

  
}

export default MyOrganization