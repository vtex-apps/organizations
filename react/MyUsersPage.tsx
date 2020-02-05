import React, { Fragment, useState } from 'react'
import { last, find, prop, propEq, pathOr, hasPath } from 'ramda'
import { Route } from 'react-router-dom'
import { useQuery } from 'react-apollo'

import documentQuery from './graphql/documents.graphql'
import profileQuery from './graphql/getProfile.graphql'

import { EmptyState } from 'vtex.styleguide'
import MyOrganization from './components/MyOrganization'
import { PERSONA_ACRONYM, PERSONA_FIELDS, PERSONA_SCHEMA } from './utils/const'

const MyUsersPage = () => {

  const [persona, setPersonaId] = useState('')
  const [orgId, setOrgId] = useState('')

  const {
    loading: profileLoading,
    error: profileError,
    data: profileData,
  } = useQuery(profileQuery)

  const {
    loading: personaLoading,
    error: personaError,
    data: personaData,
  } = useQuery(documentQuery, {
    skip:
      !profileData ||
      !profileData.profile ||
      profileData.profile == null ||
      !profileData.profile.email,
    variables: {
      acronym: PERSONA_ACRONYM,
      fields: PERSONA_FIELDS,
      where: `(email=${
        profileData && profileData.profile ? profileData.profile.email : ''
      })`,
      schema: PERSONA_SCHEMA,
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

  const personaFields = pathOr([], ['fields'], last(personaData.myDocuments))

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
  personaFields && personaFields.length > 0
      ? pathOr('', ['value'], find(propEq('key', 'id'), personaFields))
      : ''

  const profileEmail =
    profileData && profileData.profile && profileData.profile.email
      ? profileData.profile.email
      : ''


  const updated = (newPersonaId: string, newOrgId: string) => {
    if(newPersonaId && newPersonaId !== ''){
      setPersonaId(newPersonaId)
    }
    if(newOrgId && newOrgId !== ''){
      setOrgId(newOrgId)
    }
  }

  return (
    <Fragment>
      <Route
        path="/users"
        exact
        component={() => (
          <MyOrganization
            personaId={personaId || persona}
            organizationId={organizationId || orgId}
            userEmail={profileEmail}
            infoUpdated={updated}
          />
        )}
      />
    </Fragment>
  )
}

export default MyUsersPage
