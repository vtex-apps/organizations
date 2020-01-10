import React, { Fragment, useState } from 'react'
import { last, find, prop, propEq, pathOr } from 'ramda'
import { Route } from 'react-router-dom'
import { useQuery } from 'react-apollo'
import documentQuery from './graphql/documents.graphql'
import profileQuery from './graphql/getProfile.graphql'
import { EmptyState } from 'vtex.styleguide'

// Your component pages
import MyUsers from './components/MyUsers'
import AddOrganization from './components/AddOrganization'

const MyUsersPage = () => {
  const [organizationCreated, setOrganizationCreated] = useState(false)

  const {
    loading: profileLoading,
    error: profileError,
    data: profileData,
  } = useQuery(profileQuery)

  const {
    loading: organizationLoading,
    error: organizationError,
    data: persona,
  } = useQuery(documentQuery, {
    skip:
      !profileData ||
      !profileData.profile ||
      profileData.profile == null ||
      !profileData.profile.email,
    variables: {
      acronym: 'Persona',
      fields: ['clientId', 'businessOrganizationId_linked'],
      where: `(email=${
        profileData && profileData.profile ? profileData.profile.email : ''
      })`,
      schema: 'persona-schema-v1',
    },
  })

  if (
    profileLoading ||
    organizationLoading ||
    profileError ||
    organizationError
  ) {
    return (
      <Fragment>
        <EmptyState title="Page Not Found" />
      </Fragment>
    )
  }

  const businessOrganization: BusinessOrganization = JSON.parse(
    pathOr(
      '',
      ['value'],
      find(
        propEq('key', 'businessOrganizationId_linked'),
        pathOr([], ['fields'], last(persona.documents))
      )
    )
  )
  const organizationId = prop('id', businessOrganization)

  const userId: string = find(
    propEq('key', 'clientId'),
    pathOr([], ['fields'], last(persona.documents))
  )

  const hasOrganization =
    organizationId !== undefined &&
    organizationId !== null &&
    organizationId !== '' &&
    organizationId !== 'null'

  const newOrganizationCreated = () => {
    setOrganizationCreated(true)
  }

  return (
    <Fragment>
      {/* This `path` will be added at the end of the URL */}
      {hasOrganization || organizationCreated ? (
        <Route
          path="/users"
          exact
          component={() => <MyUsers organizationId={organizationId} />}
        />
      ) : (
        <Route
          path="/users"
          exact
          component={() => (
            <AddOrganization
              userId={
                userId !== undefined && userId !== '' && userId !== 'null'
                  ? userId
                  : ''
              }
              organizationCreated={newOrganizationCreated}
            />
          )}
        />
      )}
    </Fragment>
  )
}

export default MyUsersPage
