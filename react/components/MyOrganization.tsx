import React, { Fragment, useState } from 'react'
import { useQuery, useMutation } from 'react-apollo'
import documentQuery from '../graphql/documents.graphql'
import {
  EmptyState,
  PageBlock,
  PageHeader,
  Layout,
  Button,
} from 'vtex.styleguide'
import { last, find, propEq, pathOr } from 'ramda'
import MyUsers from './MyUsers'
import AddOrganization from './AddOrganization'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'

interface Props {
  userEmail: string
  organizationId: string
  personaId: string
}

const MyOrganization = (props: Props) => {

  const [redirectTo, setRedirectTo] = useState('')
  const [orgId, setOrgId] = useState(props.organizationId)
  const [updateOrganizationAssignment] = useMutation(UPDATE_DOCUMENT)

  const {
    loading: orgAssignmentLoading,
    error: orgAssignmentError,
    data: orgAssignmentData,
  } = useQuery(documentQuery, {
    skip: props.organizationId === '' || props.personaId === '',
    variables: {
      acronym: 'OrgAssignment',
      schema: 'organization-assignment-schema-v1',
      fields: ['id', 'status'],
      where: `(businessOrganizationId=${orgId} AND personaId=${props.personaId})`,
    },
  })

  if (orgAssignmentLoading || orgAssignmentError) {
    return (
      <Fragment>
        <EmptyState title={'Loading2...'} />
      </Fragment>
    )
  }

  const orgAssignmentFields = orgAssignmentData
    ? pathOr([], ['fields'], last(orgAssignmentData.documents))
    : []

  const orgAssignmentId = pathOr(
    '',
    ['value'],
    find(propEq('key', 'id'), orgAssignmentFields)
  )

  const organizationStatus: string = pathOr(
    '',
    ['value'],
    find(propEq('key', 'status'), orgAssignmentFields)
  )

  const redirectToUsers = (newOrganizationId: string) => {
    setOrgId(newOrganizationId)
    setRedirectTo('USERS')
    debugger
  }

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: string
  ) => {

    await updateOrganizationAssignment({
      variables: {
        acronym: 'OrgAssignment',
        document: {
          fields: [
            { key: 'id', value: assignmentId },
            { key: 'status', value: status }
          ],
        },
        schema: 'organization-assignment-schema-v1',
      },
    })

    setRedirectTo(status === 'APPROVED' ? 'USERS' : 'CREATE_ORGANIZATION')
  }

  if (organizationStatus === 'APPROVED' || redirectTo == 'USERS') {
    return <MyUsers organizationId={orgId} />
  } else if (
    props.personaId == '' ||
    orgId == '' ||
    redirectTo === 'CREATE_ORGANIZATION'
  ) {
    return (
      <AddOrganization
        userEmail={props.userEmail}
        redirectToUsers={redirectToUsers}
      />
    )
  }

  return (
    <Layout
      fullWidth
      pageHeader={
        <PageHeader title="Organization" linkLabel="Return"></PageHeader>
      }>
      <PageBlock>
        <div className="flex flex-column mb5">
          <div className="mb5">Approve or decline organization request</div>
          <div className="flex flex-row">
            <span className="mr2">
              <Button
                onClick={() => updateAssignmentStatus(orgAssignmentId, 'APPROVED')}>
                Approve
              </Button>
            </span>
            <span className="ml2">
              <Button
                onClick={() => updateAssignmentStatus(orgAssignmentId, 'DECLINED')}>
                Decline
              </Button>
            </span>
          </div>
        </div>
      </PageBlock>
    </Layout>
  )
}

export default MyOrganization
