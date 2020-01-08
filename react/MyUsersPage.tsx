import React, { Fragment, useState } from 'react'
import { prop, last, find, propEq, pathOr } from 'ramda'
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
    data: organizationData,
  } = useQuery(documentQuery, {
    skip:
      !profileData ||
      !profileData.profile ||
      profileData.profile == null ||
      !profileData.profile.email,
    variables: {
      acronym: 'CL',
      fields: ['id', 'organizationId'],
      where: `(email=${
        profileData && profileData.profile ? profileData.profile.email : ''
      })`,
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

  const fields: MDField[] = prop(
    'fields',
    last((organizationData ? organizationData.documents : []) as any[])
  )

  const organizationId: string = pathOr(
    '',
    ['value'],
    find(propEq('key', 'organizationId'), fields || { key: '', value: '' })
  )

  const userId: string = pathOr(
    '',
    ['value'],
    find(propEq('key', 'id'), fields || { key: '', value: '' })
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
        <Route path="/users" exact component={MyUsers} />
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
