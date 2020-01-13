import React, { Fragment } from 'react'
import { last, find, prop, propEq, pathOr, hasPath } from 'ramda'
import { Route } from 'react-router-dom'
import { useQuery } from 'react-apollo'
import documentQuery from './graphql/documents.graphql'
import profileQuery from './graphql/getProfile.graphql'
import { EmptyState } from 'vtex.styleguide'
import MyOrganization from './components/MyOrganization'

const MyUsersPage = () => {
  const {
    loading: profileLoading,
    error: profileError,
    data: profileData,
  } = useQuery(profileQuery)

  const {
    loading: personaLoading,
    error: personaError,
    data: persona,
  } = useQuery(documentQuery, {
    skip:
      !profileData ||
      !profileData.profile ||
      profileData.profile == null ||
      !profileData.profile.email,
    variables: {
      acronym: 'Persona',
      fields: ['id', 'clientId', 'businessOrganizationId_linked'],
      where: `(email=${
        profileData && profileData.profile ? profileData.profile.email : ''
      })`,
      schema: 'persona-schema-v1',
    },
  })

  if (
    profileLoading ||
    personaLoading ||
    profileError ||
    personaError ||
    profileData.profile == null ||
    !profileData.profile.email
  ) {
    return (
      <Fragment>
        <EmptyState title={'Loading...'} />
      </Fragment>
    )
  }

  const personaFields = pathOr([], ['fields'], last(persona.documents))

  const businessOrganization: BusinessOrganization = JSON.parse(
    pathOr(
      '{}',
      ['value'],
      find(propEq('key', 'businessOrganizationId_linked'), personaFields)
    )
  )

  const organizationId =
    businessOrganization && hasPath(['id'], businessOrganization)
      ? prop('id', businessOrganization)
      : ''
  const personaId =
    personaFields.length > 0
      ? pathOr('', ['value'], find(propEq('key', 'id'), personaFields))
      : ''

  const profileEmail =
    profileData && profileData.profile && profileData.profile.email
      ? profileData.profile.email
      : ''

  return (
    <Fragment>
      <Route
        path="/users"
        exact
        component={() => (
          <MyOrganization
            personaId={personaId}
            organizationId={organizationId}
            userEmail={profileEmail}
          />
        )}
      />
    </Fragment>
  )
}

export default MyUsersPage
