import React, { Fragment, useState } from 'react'
import { prop, last, find, propEq, pathOr } from 'ramda'
import { useQuery } from 'react-apollo'
import documentQuery from '../graphql/documents.graphql'
import { EmptyState } from 'vtex.styleguide'

interface Props {
  organizationId: string
  clientId: string
  clientEmail: string
  personaId: string
}

const MyOrganization = (props: Props) => {

  // if organization is not exist OR persona id is not exist --> create organization
  // if organization id and persona id exists check for organizationAssignments status to be 'ACTIVE'
  // if status is ACTIVE show regular MyUsers page
  // if status !== ACTIVE show 

  if(props.personaId === '' || props.organizationId ===''){
    // load create organization
  }

  const {
    loading: organizationAssignmentLoading,
    error: organizationAssignmentError,
    data: organizationAssignmentData,
  } = useQuery(documentQuery, {
    variables: {
      acronym: 'OrganizationAssignment',
      schema: 'organization-assignment-schema-v1',
      fields: ['id', 'personaId', 'businessOrganizationId', 'roleId', 'status'],
      where: `(businessOrganizationId=${props.organizationId} AND personaId=${props.personaId})`,
    },
  })


  if(organizationAssignmentLoading || organizationAssignmentError){
    // No content
  }

  const orgAssignmentFields: MDField[] = prop(
    'fields',
    last((organizationAssignmentData ? organizationAssignmentData.documents : []) as any[])
  )

  const organizationStatus: string = pathOr(
    '',
    ['value'],
    find(propEq('key', 'status'), orgAssignmentFields || { key: '', value: '' })
  )

  if(organizationStatus === 'APPROVED'){
    // go to user listing
  }

  if(organizationStatus === 'DECLINED'){
    // create organization
  }

  if(organizationStatus === 'PENDING'){
    // load challenge
  }

  return <div></div>
}
