import React, { Fragment } from 'react'
import { useQuery, useMutation } from 'react-apollo'
import {
  EmptyState,
  PageBlock,
  PageHeader,
  Layout,
  ToastConsumer,
} from 'vtex.styleguide'
import { injectIntl, InjectedIntlProps } from 'react-intl'

import { find, propEq, filter, pathOr } from 'ramda'
import MyUsers from './MyUsers'
import AddOrganization from './AddOrganization'
import MyPendingAssignments from './MyPendingAssignments'
import DefaultAssignmentInfo from './DefaultAssignmentInfo'

import DOCUMENTS from '../graphql/documents.graphql'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'
import DELETE_DOCUMENT from '../graphql/deleteDocument.graphql'

import { documentSerializer } from '../utils/documentSerializer'
import {
  updateCacheOrgAssignmentStatus,
  updateCachePersonaOrgId,
  updateCacheDeleteAssignment,
} from '../utils/cacheUtils'
import {
  PERSONA_ACRONYM,
  PERSONA_SCHEMA,
  BUSINESS_ROLE,
  BUSINESS_ROLE_FIELDS,
  BUSINESS_ROLE_SCHEMA,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_FIELDS,
  ORG_ASSIGNMENT_SCHEMA,
  ASSIGNMENT_STATUS_APPROVED,
  ASSIGNMENT_STATUS_PENDING
} from '../utils/const'
import { handleGlobalError } from '../utils/graphqlErrorHandler'

interface Props {
  userEmail: string
  organizationId: string
  personaId: string
  infoUpdated: Function
}

const MyOrganization = ({
  userEmail,
  organizationId,
  personaId,
  infoUpdated,
  intl,
}: Props & InjectedIntlProps) => {
  const [updateDocument] = useMutation(UPDATE_DOCUMENT)
  const [deleteDocument] = useMutation(DELETE_DOCUMENT)
  const [updateOrgAssignmentStatus] = useMutation(UPDATE_DOCUMENT)
  const [updatePersonaOrgId] = useMutation(UPDATE_DOCUMENT)

  const assignmentFilter =
    `(personaId=${personaId}` +
    (organizationId !== ''
      ? ` OR businessOrganizationId=${organizationId})`
      : ')')

  const {
    loading: orgAssignmentLoading,
    error: orgAssignmentError,
    data: orgAssignmentData,
  } = useQuery(DOCUMENTS, {
    skip: personaId === '',
    variables: {
      acronym: ORG_ASSIGNMENT,
      schema: ORG_ASSIGNMENT_SCHEMA,
      fields: ORG_ASSIGNMENT_FIELDS,
      where: assignmentFilter,
    },
  })

  const {
    loading: rolesLoading,
    error: rolesError,
    data: rolesData,
  } = useQuery(DOCUMENTS, {
    skip: personaId === '',
    variables: {
      acronym: BUSINESS_ROLE,
      schema: BUSINESS_ROLE_SCHEMA,
      fields: BUSINESS_ROLE_FIELDS,
    },
  })

  if (
    orgAssignmentLoading ||
    orgAssignmentError ||
    rolesLoading ||
    rolesError
  ) {
    return (
      <Fragment>
        <EmptyState title={'Loading2...'} />
      </Fragment>
    )
  }

  const orgAssignments: OrganizationAssignment[] = orgAssignmentData
    ? documentSerializer(orgAssignmentData.myDocuments)
    : []

  const userAssignments =
    orgAssignments && personaId
      ? filter(propEq('personaId', personaId), orgAssignments)
      : []

  const organizationAssignments =
    orgAssignments && organizationId !== ''
      ? filter(propEq('businessOrganizationId', organizationId), orgAssignments)
      : []

  const pendingAssignments: OrganizationAssignment[] = filter(
    propEq('status', ASSIGNMENT_STATUS_PENDING),
    userAssignments
  )
  const defaultAssignment: OrganizationAssignment = find(
    propEq('businessOrganizationId', organizationId)
  )(userAssignments)

  const roles: Role[] = rolesData
    ? documentSerializer(rolesData.myDocuments)
    : []

  const userRole =
    defaultAssignment && defaultAssignment.roleId
      ? find(propEq('id', defaultAssignment.roleId))(roles)
      : {}

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: string
  ) => {
    return updateOrgAssignmentStatus({
      variables: {
        acronym: ORG_ASSIGNMENT,
        document: {
          fields: [
            { key: 'id', value: assignmentId },
            { key: 'status', value: status },
          ],
        },
        schema: ORG_ASSIGNMENT_SCHEMA,
      },
      update: (cache: any) =>
        updateCacheOrgAssignmentStatus(
          cache,
          assignmentId,
          status,
          organizationId,
          personaId
        ),
    })
      .then(() => {
        const updatedOrgId: string =
          status === ASSIGNMENT_STATUS_APPROVED
            ? pathOr(
                '',
                ['businessOrganizationId'],
                find(propEq('id', assignmentId))(orgAssignments)
              )
            : ''
        const orgFields: any =
          status === ASSIGNMENT_STATUS_APPROVED
            ? pathOr(
                [],
                ['businessOrganizationId_linked'],
                find(propEq('id', assignmentId))(orgAssignments)
              )
            : []
        const personaEmail: any = pathOr(
          '',
          ['value'],
          find(
            propEq('key', 'email'),
            pathOr(
              [],
              ['personaId_linked'],
              find(propEq('id', assignmentId))(orgAssignments)
            )
          )
        )

        return updatePersonaOrgId({
          variables: {
            acronym: PERSONA_ACRONYM,
            document: {
              fields: [
                { key: 'id', value: personaId },
                { key: 'businessOrganizationId', value: updatedOrgId },
              ],
            },
            schema: PERSONA_SCHEMA,
          },
          update: (cache: any) =>
            updateCachePersonaOrgId(cache, orgFields, personaEmail, personaId),
        })
      })
      .catch(handleGlobalError())
  }

  const deleteOrgAssignment = (assignmentId: string) => {
    return deleteDocument({
      variables: {
        acronym: ORG_ASSIGNMENT,
        documentId: assignmentId,
      },
      update: (cache: any, { data }: any) =>
        updateCacheDeleteAssignment(cache, data, assignmentId),
    })
      .then(() => {
        const personaEmail: any = pathOr(
          '',
          ['value'],
          find(
            propEq('key', 'email'),
            pathOr(
              [],
              ['personaId_linked'],
              find(propEq('id', assignmentId))(orgAssignments)
            )
          )
        )
        return updateDocument({
          variables: {
            acronym: PERSONA_ACRONYM,
            document: {
              fields: [
                { key: 'id', value: personaId },
                { key: 'businessOrganizationId', value: '' },
              ],
            },
            schema: PERSONA_SCHEMA,
          },
          update: (cache: any) =>
            updateCachePersonaOrgId(cache, [], personaEmail, personaId),
        })
      })
      .catch(handleGlobalError())
  }

  if (personaId == '') {
    return (
      <ToastConsumer>
        {({ showToast }: any) => (
          <AddOrganization
            userEmail={userEmail}
            updateOrgInfo={infoUpdated}
            showToast={showToast}
          />
        )}
      </ToastConsumer>
    )
  }

  return (
    <Layout
      fullWidth
      pageHeader={
        <PageHeader title="Organization" linkLabel="Return"></PageHeader>
      }>
      <ToastConsumer>
        {({ showToast }: any) => (
          <PageBlock>
            <MyPendingAssignments
              personaId={personaId}
              assignments={pendingAssignments}
              defaultAssignment={defaultAssignment}
              updateAssignmentStatus={updateAssignmentStatus}
              infoUpdated={infoUpdated}
              showToast={showToast}
            />
            {!defaultAssignment && (
              <div className="mb5 mt5">
                <h2 className="">
                  {intl.formatMessage({
                    id:
                      'store/my-users.my-organization.create-new-organization',
                  })}
                </h2>
                <AddOrganization
                  userEmail={userEmail}
                  updateOrgInfo={infoUpdated}
                  personaId={personaId}
                  showToast={showToast}
                />
              </div>
            )}
            {defaultAssignment && (
              <div>
                <DefaultAssignmentInfo
                  personaId={personaId}
                  defaultAssignment={defaultAssignment}
                  assignments={organizationAssignments}
                  userRole={userRole}
                  updateAssignmentStatus={updateAssignmentStatus}
                  deleteOrgAssignment={deleteOrgAssignment}
                  infoUpdated={infoUpdated}
                  showToast={showToast}
                />

                {userRole && userRole.name && userRole.name === 'manager' && (
                  <div className="flex flex-column mb5 mt5">
                    <h2 className="">
                      {intl.formatMessage({
                        id:
                          'store/my-users.my-organization.users-in-organization',
                      })}
                    </h2>
                    <MyUsers
                      organizationId={organizationId}
                      personaId={personaId}
                      showToast={showToast}
                    />
                  </div>
                )}
              </div>
            )}
          </PageBlock>
        )}
      </ToastConsumer>
    </Layout>
  )
}

export default injectIntl(MyOrganization)
