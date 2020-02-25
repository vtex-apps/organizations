import React, { useEffect, useState, Fragment } from 'react' //Fragment
import { useQuery, useApolloClient, useMutation } from 'react-apollo' //useMutation
import {
  EmptyState,
  PageBlock,
  PageHeader,
  Layout,
  Alert,
  ToastConsumer,
  Button,
} from 'vtex.styleguide'
import { injectIntl } from 'react-intl'

import { pathOr, find, propEq, filter, reject, equals } from 'ramda'
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

// import documentQuery from './graphql/documents.graphql'
import profileQuery from '../graphql/getProfile.graphql'

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
  ASSIGNMENT_STATUS_PENDING,
  PERSONA_FIELDS,
  BUSINESS_ORGANIZATION,
} from '../utils/const'
import { handleGlobalError } from '../utils/graphqlErrorHandler'

interface Props {
  intl: any
}

const MyOrganization = ({ intl }: Props) => {
  const [personaId, setPersonaId] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [email, setEmail] = useState('')
  const [pendingOrgAssignments, setPendingOrgAssignments] = useState(
    [] as OrganizationAssignment[]
  )
  const [orgAssignments, setOrgAssignments] = useState(
    [] as OrganizationAssignment[]
  )

  const [defaultOrgAssignment, setDefaultOrgAssignment] = useState(
    {} as OrganizationAssignment
  )
  const [userRole, setUserRole] = useState({} as Role)

  const [loading, setLoading] = useState(false)
  const [reloadStart, setReloadStart] = useState(false)

  const [showOrganizationReload, setShowOrganizationReload] = useState(false)
  const client = useApolloClient()
  const [updateDocument] = useMutation(UPDATE_DOCUMENT)
  const [deleteDocument] = useMutation(DELETE_DOCUMENT)
  const [updateOrgAssignmentStatus] = useMutation(UPDATE_DOCUMENT)
  const [updatePersonaOrgId] = useMutation(UPDATE_DOCUMENT)

  const { data: profileData, loading: profileLoading } = useQuery(profileQuery)

  useEffect(() => {
    const abortController = new AbortController()
    if (email !== '') {
      setLoading(true)
      reload().then((data: any) => {
        updateState(data)
        setLoading(false)
      })
    }
    return () => {
      setLoading(false)
      abortController.abort()
    }
  }, [email])

  useEffect(() => {
    const abortController = new AbortController()

    setEmail(pathOr('', ['profile', 'email'], profileData))
    return () => {
      abortController.abort()
    }
  }, [profileData])

  const updateState = (data: any) => {
    setPersonaId(data.personaId_d)
    setOrganizationId(data.organizationId_d)
    setPendingOrgAssignments(data.pendingAssignments_d)
    setDefaultOrgAssignment(data.defaultAssignment_d)
    setOrgAssignments(data.orgAssignments_d)
    setUserRole(data.userRole_d)
  }

  const infoUpdatedDefaultAssignment = () => {
    setShowOrganizationReload(true)
    reload().then((data: any) => {
      if (
        data &&
        equals(data.personaId_d, personaId) &&
        equals(data.organizationId_d, '') &&
        equals(data.pendingAssignments_d, pendingOrgAssignments) && // Remove this
        !equals(data.defaultAssignment_d, defaultOrgAssignment) &&
        !equals(data.orgAssignments_d, orgAssignments)
      ) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedDefaultAssignment()
      }
    })
  }

  const infoUpdatedCreateOrganization = () => {
    setShowOrganizationReload(true)
    reload().then((data: any) => {
      if (
        data &&
        equals(data.personaId_d, personaId) &&
        !equals(data.organizationId_d, '') &&
        !equals(data.defaultAssignment_d, {}) &&
        !equals(data.orgAssignments_d, orgAssignments)
      ) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedCreateOrganization()
      }
    })
  }

  const infoUpdatedPendingOrganizations = () => {
    setShowOrganizationReload(true)
    reload().then((data: any) => {
      if (
        data &&
        equals(data.personaId_d, personaId) &&
        !equals(data.organizationId_d, '') &&
        !equals(data.organizationId_d, organizationId) &&
        data.defaultAssignment_d &&
        data.defaultAssignment_d.id !== defaultOrgAssignment.id
      ) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedPendingOrganizations()
      }
    })
  }

  const reload = () => {
    let personaId_d = ''
    let organizationId_d = ''
    let pendingAssignments_d = [] as OrganizationAssignment[]
    let defaultAssignment_d = {} as OrganizationAssignment
    let orgAssignments_d = [] as OrganizationAssignment[]
    let userRole_d = {} as Role

    setReloadStart(true)

    return client
      .query({
        query: DOCUMENTS,
        variables: {
          acronym: PERSONA_ACRONYM,
          schema: PERSONA_SCHEMA,
          fields: PERSONA_FIELDS,
          where: `email=${email}`,
        },
        fetchPolicy: 'no-cache',
      })
      .then(({ data }: any) => {
        if (data) {
          const persona = documentSerializer(data.myDocuments)

          organizationId_d = pathOr('', [0, 'businessOrganizationId'], persona)
          personaId_d = pathOr('', [0, 'id'], persona)
        }

        return client
          .query({
            query: DOCUMENTS,
            variables: {
              acronym: ORG_ASSIGNMENT,
              schema: ORG_ASSIGNMENT_SCHEMA,
              fields: ORG_ASSIGNMENT_FIELDS,
              where: `(personaId=${personaId_d} AND (status=${ASSIGNMENT_STATUS_PENDING} OR status=${ASSIGNMENT_STATUS_APPROVED}))`,
            },
            fetchPolicy: 'no-cache',
          })
          .catch(() => {
            return Promise.resolve({ myDocuments: [] })
          })
      })
      .then(({ data }: any) => {
        if (data) {
          const assignments = documentSerializer(data ? data.myDocuments : [])

          const defaultAssignment: OrganizationAssignment = find(
            propEq('businessOrganizationId', organizationId_d)
          )(filter(propEq('status', ASSIGNMENT_STATUS_APPROVED), assignments))

          pendingAssignments_d = reject(
            propEq('status', ASSIGNMENT_STATUS_APPROVED),
            assignments
          )
          defaultAssignment_d = defaultAssignment
            ? defaultAssignment
            : ({} as OrganizationAssignment)
        }

        return client
          .query({
            query: DOCUMENTS,
            variables: {
              acronym: ORG_ASSIGNMENT,
              schema: ORG_ASSIGNMENT_SCHEMA,
              fields: ORG_ASSIGNMENT_FIELDS,
              where: `(businessOrganizationId=${organizationId_d} AND (status=${ASSIGNMENT_STATUS_PENDING} OR status=${ASSIGNMENT_STATUS_APPROVED}))`,
            },
            fetchPolicy: 'no-cache',
          })
          .catch(() => {
            return Promise.resolve({ myDocuments: [] })
          })
      })
      .then(({ data }: any) => {
        if (data) {
          const assignments = documentSerializer(data ? data.myDocuments : [])
          orgAssignments_d = assignments
        }
        return client.query({
          query: DOCUMENTS,
          variables: {
            acronym: BUSINESS_ROLE,
            schema: BUSINESS_ROLE_SCHEMA,
            fields: BUSINESS_ROLE_FIELDS,
          },
          fetchPolicy: 'no-cache',
        })
      })
      .then(({ data }: any) => {
        if (data) {
          const rolesList = documentSerializer(data ? data.myDocuments : [])
          const roleId = pathOr('', ['roleId'], defaultAssignment_d)
          userRole_d =
            roleId !== '' ? find(propEq('id', roleId))(rolesList) : {}

          // setPersonaId(personaId_d)
          // setOrganizationId(organizationId_d)
          // setPendingOrgAssignments(pendingAssignments_d)
          // setDefaultOrgAssignment(defaultAssignment_d)
          // setOrgAssignments(orgAssignments_d)
          // setUserRole(userRole)

          // personaId_d = ''
          // organizationId_d = ''
          // pendingAssignments_d = [] as OrganizationAssignment[]
          // defaultAssignment_d = {} as OrganizationAssignment
          // orgAssignments_d = [] as OrganizationAssignment[]

          setReloadStart(false)
        }
        return Promise.resolve({
          personaId_d,
          organizationId_d,
          pendingAssignments_d,
          defaultAssignment_d,
          orgAssignments_d,
          userRole_d,
        })
      })
  }

  const closeReloadMessage = () => {
    setShowOrganizationReload(false)
  }

  const updateAssignmentStatus = (assignmentId: string, status: string) => {
    const allAssignments: OrganizationAssignment[] = [
      ...pendingOrgAssignments,
      ...orgAssignments,
    ]
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
                find(propEq('id', assignmentId))(allAssignments)
              )
            : ''
        const orgFields: any =
          status === ASSIGNMENT_STATUS_APPROVED
            ? JSON.stringify(
                pathOr(
                  {},
                  ['businessOrganizationId_linked'],
                  find(propEq('id', assignmentId))(allAssignments)
                )
              )
            : '{}'
        const personaEmail = pathOr(
          '',
          ['email'],
          pathOr(
            {},
            ['personaId_linked'],
            find(propEq('id', assignmentId))(allAssignments)
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
    const allAssignments: OrganizationAssignment[] = [
      ...pendingOrgAssignments,
      ...orgAssignments,
    ]
    return deleteDocument({
      variables: {
        acronym: ORG_ASSIGNMENT,
        documentId: assignmentId,
      },
      update: (cache: any, { data }: any) =>
        updateCacheDeleteAssignment(cache, data, assignmentId),
    })
      .then(() => {
        const orgId: string = pathOr(
          '',
          ['businessOrganizationId'],
          find(propEq('id', assignmentId))(allAssignments)
        )
        return deleteDocument({
          variables: {
            acronym: BUSINESS_ORGANIZATION,
            documentId: orgId,
          },
        })
      })
      .then(() => {
        const personaEmail = pathOr(
          '',
          ['email'],
          pathOr(
            {},
            ['personaId_linked'],
            find(propEq('id', assignmentId))(allAssignments)
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
            updateCachePersonaOrgId(cache, '{}', personaEmail, personaId),
        })
      })
      .catch(handleGlobalError())
  }

  if (loading || profileLoading) {
    return (
      <Fragment>
        <EmptyState title={'Loading...'} />
      </Fragment>
    )
  }

  // if (
  //   profileError ||
  //   personaError ||
  //   personOrgAssignmentError ||
  //   orgAssignmentError ||
  //   rolesError
  // ) {
  //   return (
  //     <Fragment>
  //       <EmptyState title={'Error..'} />
  //     </Fragment>
  //   )
  // }
  return (
    <Layout
      fullWidth
      pageHeader={
        <PageHeader title="Organization" linkLabel="Return"></PageHeader>
      }>
      <ToastConsumer>
        {({ showToast }: any) => (
          <PageBlock>
            {showOrganizationReload && (
              <div className="mb5">
                <Alert type="warning" onClose={closeReloadMessage}>
                  <div className="flex">
                    {' '}
                    <div className="flex flex-grow-1 justify-start">
                      Reload message Reload messageReload messageReload
                      messageReload messageReload messageReload messageReload
                      messageReload messageReload messageReload messageReload
                      message
                    </div>
                    <div className="flex flex-grow-1 justify-end">
                      <Button
                        variation="secondary"
                        size="small"
                        onClick={reload}
                        isLoading={reloadStart}>
                        Reload
                      </Button>
                    </div>
                  </div>
                </Alert>
              </div>
            )}

            <MyPendingAssignments
              personaId={personaId}
              assignments={pendingOrgAssignments}
              defaultAssignment={defaultOrgAssignment}
              updateAssignmentStatus={updateAssignmentStatus}
              infoUpdated={infoUpdatedPendingOrganizations}
              showToast={showToast}
            />
            {organizationId === '' && (
              <div className="mb5 mt5">
                <h2 className="">
                  {intl.formatMessage({
                    id:
                      'store/my-users.my-organization.create-new-organization',
                  })}
                </h2>

                <AddOrganization
                  userEmail={email}
                  personaId={personaId}
                  updateOrgInfo={infoUpdatedCreateOrganization}
                  showToast={showToast}
                />
              </div>
            )}
            {defaultOrgAssignment && defaultOrgAssignment.id && (
              <div>
                <DefaultAssignmentInfo
                  personaId={personaId}
                  defaultAssignment={defaultOrgAssignment}
                  assignments={orgAssignments}
                  userRole={userRole}
                  updateAssignmentStatus={updateAssignmentStatus}
                  deleteOrgAssignment={deleteOrgAssignment}
                  infoUpdated={infoUpdatedDefaultAssignment}
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
