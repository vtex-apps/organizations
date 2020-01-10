import React, { Fragment, useState } from 'react'
import { last, find, prop, propEq, pathOr, hasPath } from 'ramda'
import { Route } from 'react-router-dom'
import { useQuery } from 'react-apollo'
import documentQuery from './graphql/documents.graphql'
import profileQuery from './graphql/getProfile.graphql'
import { EmptyState } from 'vtex.styleguide'
import MyOrganization from './components/MyOrganization'
// Your component pages
import MyUsers from './components/MyUsers'
import AddOrganization from './components/AddOrganization'

const MyUsersPage = () => {
  const [redirectTo, setRedirectTo] = useState('')

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
    personaFields.length > 0 ? find(propEq('key', 'id'), personaFields) : ''

  const {
    loading: orgAssignmentLoading,
    error: orgAssignmentError,
    data: orgAssignmentData,
  } = useQuery(documentQuery, {
    skip: organizationId === '' || personaId === '',
    variables: {
      acronym: 'OrgAssignment',
      schema: 'organization-assignment-schema-v1',
      fields: ['id', 'status'],
      where: `(businessOrganizationId=${organizationId} AND personaId=${personaId})`,
    },
  })

  if (orgAssignmentLoading || orgAssignmentError) {
    return (
      <Fragment>
        <EmptyState title={'Loading...'} />
      </Fragment>
    )
  }

  const orgAssignmentFields = orgAssignmentData
    ? pathOr([], ['fields'], last(orgAssignmentData.documents))
    : []

  const orgAssignmentId =
    personaFields.length > 0
      ? find(propEq('key', 'id'), orgAssignmentFields)
      : ''
  const organizationStatus =
    personaFields.length > 0
      ? find(propEq('key', 'status'), orgAssignmentFields)
      : ''

  const redirectToUsers = () => {
    // TODO: update orgId and personaId created
    setRedirectTo('USERS')
  }

  return (
    <Fragment>
      {personaId === '' ||
      organizationId === '' ||
      organizationStatus === 'DECLINED' ||
      redirectTo === 'CREATE_ORGANIZATION' ? (
        <Route
          path="/users"
          exact
          component={() => (
            <AddOrganization
              userEmail={profileData.profile.email}
              redirectToUsers={redirectToUsers}
            />
          )}
        />
      ) : organizationStatus === 'APPROVED' || redirectTo === 'USERS' ? (
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
            <MyOrganization
              personaId={personaId}
              orgAssignmentId={orgAssignmentId}
            />
          )}
        />
      )}
    </Fragment>
  )
}

export default MyUsersPage
