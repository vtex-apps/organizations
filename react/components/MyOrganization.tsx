import React, { useEffect, useState, useRef } from 'react'
import { useQuery, useApolloClient } from 'react-apollo'
import {
  PageBlock,
  PageHeader,
  Layout,
  Alert,
  ToastConsumer,
  Button,
  Spinner,
} from 'vtex.styleguide'
import { injectIntl } from 'react-intl'
import { pathOr, find, propEq, filter, reject, equals } from 'ramda'

import MyUsers from './MyUsers'
import AddOrganization from './AddOrganization'
import MyPendingAssignments from './MyPendingAssignments'
import DefaultAssignmentInfo from './DefaultAssignmentInfo'

import DOCUMENTS from '../graphql/documents.graphql'
import profileQuery from '../graphql/getProfile.graphql'

import { documentSerializer } from '../utils/documentSerializer'
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
} from '../utils/const'

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
  const [defaultOrgAssignment, setDefaultOrgAssignment] = useState(
    {} as OrganizationAssignment
  )
  const [userRole, setUserRole] = useState({} as Role)
  const [loading, setLoading] = useState(false)
  const [reloadStart, setReloadStart] = useState(false)
  const [showOrganizationReload, setShowOrganizationReload] = useState(false)

  const client = useApolloClient()
  const did_email_set = useRef(false)
  const did_first_load = useRef(false)

  const { data: profileData, loading: profileLoading } = useQuery(profileQuery)

  useEffect(() => {
    const abortController = new AbortController()
    if (did_email_set.current && !did_first_load.current) {
      did_first_load.current = true

      setLoading(true)
      load().then((data: any) => {
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
    const email_d = pathOr('', ['profile', 'email'], profileData)
    setEmail(email_d)
    if (email_d !== '' && !did_first_load.current) {
      did_email_set.current = true
    }
    return () => {
      abortController.abort()
    }
  }, [profileData])

  const updateState = (data: any) => {
    setPersonaId(data.personaId_d)
    setOrganizationId(data.organizationId_d)
    setPendingOrgAssignments(data.pendingAssignments_d)
    setDefaultOrgAssignment(data.defaultAssignment_d)
    setUserRole(data.userRole_d)
  }

  // Compare props to reload - Leave Delete default organization
  const infoUpdatedDefaultAssignment = () => {
    setShowOrganizationReload(true)
    load().then((data: any) => {

      const isValidPendingAssignments = find(propEq('businessOrganizationId', organizationId))(
          pathOr([], ['pendingAssignments_d'], data)
        ) === undefined

      if (
        data &&
        equals(data.personaId_d, personaId) &&
        equals(data.organizationId_d, '') &&
        !equals(data.defaultAssignment_d, defaultOrgAssignment) &&
        isValidPendingAssignments
      ) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedDefaultAssignment()
      }
    })
  }

  // Compare props to reload - Create order
  const infoUpdatedCreateOrganization = () => {
    setShowOrganizationReload(true)
    load().then((data: any) => {
      const isValidDefaultAssignment =
        !equals(data.personaId_d, '') &&
        find(propEq('personaId', data.personaId_d))(
          pathOr([], ['orgAssignments_d'], data)
        ) !== undefined
      if (
        data &&
        equals(data.personaId_d, personaId) &&
        !equals(data.organizationId_d, '') &&
        !equals(data.defaultAssignment_d, {}) &&
        isValidDefaultAssignment
      ) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedCreateOrganization()
      }
    })
  }

  // Compare props to reload - Approve Decline Pending organization
  const infoUpdatedPendingOrganizations = () => {
    setShowOrganizationReload(true)
    load().then((data: any) => {
      const pendingIds_before = pendingOrgAssignments.map(x => x.id).sort()
      const pendingIds_after = pathOr([], ['pendingAssignments_d'], data)
        .map((x: any) => x.id)
        .sort()
      const isValidDefaultAssignment =
        equals(data.organizationId_d, '') ||
        equals(data.organizationId_d, organizationId) ||
        (!equals(data.personaId_d, '') &&
        find(propEq('personaId', data.personaId_d))(
          pathOr([], ['orgAssignments_d'], data)
        ) !== undefined)
      if (
        data &&
        equals(data.personaId_d, personaId) &&
        !equals(pendingIds_before, pendingIds_after) && 
        isValidDefaultAssignment
      ) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedPendingOrganizations()
      }
    })
  }

  // Load data
  const load = () => {
    let personaId_d = ''
    let organizationId_d = ''
    let pendingAssignments_d = [] as OrganizationAssignment[]
    let orgAssignments_d = [] as OrganizationAssignment[]
    let defaultAssignment_d = {} as OrganizationAssignment
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
          orgAssignments_d = documentSerializer(data ? data.myDocuments : [])
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

          setReloadStart(false)
        }
        return Promise.resolve({
          personaId_d,
          organizationId_d,
          pendingAssignments_d,
          orgAssignments_d,
          defaultAssignment_d,
          userRole_d,
        })
      })
  }

  const closeReloadMessage = () => {
    setShowOrganizationReload(false)
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
            {loading || profileLoading ? (
              <Spinner />
            ) : (
              <div>
                {showOrganizationReload && (
                  <div className="mb5">
                    <Alert type="warning" onClose={closeReloadMessage}>
                      <div className="flex">
                        {' '}
                        <div className="flex flex-grow-1 justify-start">
                          Reload message Reload messageReload messageReload
                          messageReload messageReload messageReload
                          messageReload messageReload messageReload
                          messageReload messageReload message
                        </div>
                        <div className="flex flex-grow-1 justify-end">
                          <Button
                            variation="secondary"
                            size="small"
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
                      userRole={userRole}
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
              </div>
            )}
          </PageBlock>
        )}
      </ToastConsumer>
    </Layout>
  )
}

export default React.memo(injectIntl(MyOrganization))
