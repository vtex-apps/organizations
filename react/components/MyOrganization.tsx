import React, { useEffect, useState, useRef } from 'react'
import { useQuery, useApolloClient } from 'react-apollo'
import { Alert, ToastConsumer, Button, Spinner, Tag } from 'vtex.styleguide'
import { injectIntl } from 'react-intl'
import { pathOr, find, propEq, filter, reject, equals } from 'ramda'

import { ContentWrapper } from 'vtex.my-account-commons'

import MyUsers from './MyUsers'
import AddOrganization from './AddOrganization'
import MyPendingAssignments from './MyPendingAssignments'
import DefaultAssignmentInfo from './DefaultAssignmentInfo'

import DOCUMENTS from '../graphql/documents.graphql'
import profileQuery from '../graphql/getProfile.graphql'

import { documentSerializer } from '../utils/documentSerializer'
import {
  PROFILE_FIELDS,
  BUSINESS_ROLE,
  BUSINESS_ROLE_FIELDS,
  BUSINESS_ROLE_SCHEMA,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_FIELDS,
  ORG_ASSIGNMENT_SCHEMA,
  ASSIGNMENT_STATUS_APPROVED,
  ASSIGNMENT_STATUS_PENDING,
  CLIENT_ACRONYM,
  CLIENT_FIELDS,
} from '../utils/const'
import styles from '../my-organization.css'

interface Props {
  intl: any
}

const MyOrganization = ({ intl }: Props) => {
  const [clientId, setClientId] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [email, setEmail] = useState('')
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)
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
  const [showLeaveOrganizationBtn, setShowLeaveOrganizationBtn] = useState(
    false
  )

  const client = useApolloClient()
  const did_email_set = useRef(false)
  const did_first_load = useRef(false)

  const { data: profileData, loading: profileLoading } = useQuery(
    profileQuery,
    { variables: { customFields: PROFILE_FIELDS } }
  )

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

    const id_d = pathOr('', ['profile', 'id'], profileData)
    const email_d = pathOr('', ['profile', 'email'], profileData)
    const isOrgAdmin_d = pathOr(
      'false',
      ['value'],
      find(propEq('key', 'isOrgAdmin'))(
        pathOr([], ['profile', 'customFields'], profileData)
      )
    ) as any
    const organizationId_d = pathOr(
      '',
      ['value'],
      find(propEq('key', 'organizationId'))(
        pathOr([], ['profile', 'customFields'], profileData)
      )
    ) as any

    if (email_d !== '') {
      setClientId(id_d)
      setEmail(email_d)
      setIsOrgAdmin(isOrgAdmin_d === 'true' || isOrgAdmin_d === true)
      setOrganizationId(organizationId_d)
    }

    if (email_d !== '' && !did_first_load.current) {
      did_email_set.current = true
    }

    return () => {
      abortController.abort()
    }
  }, [profileData])

  const updateState = (data: any) => {
    setOrganizationId(data.organizationId_d)
    setPendingOrgAssignments(data.pendingAssignments_d)
    setDefaultOrgAssignment(data.defaultAssignment_d)
    setUserRole(data.userRole_d)

    if (pathOr([], ['orgAssignments_d'], data).length > 1) {
      setShowLeaveOrganizationBtn(true)
    }
  }

  // Compare props to reload - Leave Delete default organization
  const infoUpdatedDefaultAssignment = () => {
    setShowOrganizationReload(true)
    load().then((data: any) => {
      
      const isValidPendingAssignments =
        find(propEq('email', email))(
          pathOr([], ['pendingAssignments_d'], data)
        ) === undefined
      
      if (
        data &&
        isValidPendingAssignments &&
        equals(data.organizationId_d, '')
      ) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedDefaultAssignment()
      }
    })
  }

  // Compare props to reload - Create organization
  const infoUpdatedCreateOrganization = (orgId: string) => {
    setShowOrganizationReload(true)
    load().then((data: any) => {
      const isValidDefaultAssignment =
        find(propEq('email', email))(pathOr([], ['orgAssignments_d'], data)) !==
        undefined
      if (
        data &&
        !equals(data.organizationId_d, '') &&
        !equals(data.defaultAssignment_d, {}) &&
        isValidDefaultAssignment
      ) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedCreateOrganization(orgId)
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
      if (data && !equals(pendingIds_before, pendingIds_after)) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedPendingOrganizations()
      }
    })
  }

  // Load data
  const load = () => {
    //let personaId_d = ''
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
          acronym: CLIENT_ACRONYM,
          fields: CLIENT_FIELDS,
          where: `(email=${email})`,
        },
        fetchPolicy: 'no-cache',
      })
      .then(({ data }: any) => {
        const clients = documentSerializer(data ? data.myDocuments : [])

        organizationId_d = pathOr('', [0, 'organizationId'], clients)

        return client
          .query({
            query: DOCUMENTS,
            variables: {
              acronym: ORG_ASSIGNMENT,
              schema: ORG_ASSIGNMENT_SCHEMA,
              fields: ORG_ASSIGNMENT_FIELDS,
              where: `(email=${email} AND (status=${ASSIGNMENT_STATUS_PENDING} OR status=${ASSIGNMENT_STATUS_APPROVED}))`,
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

  const getHeaderContent = () => {
    return isOrgAdmin ? (
      <span className="mr4">
        <Tag type="success" variation="low">
          {intl.formatMessage({
            id: 'store/my-users.my-organization.status.accepted',
          })}
        </Tag>
      </span>
    ) : (
      <span />
    )
  }

  const headerConfig = () => {
    return {
      namespace: 'vtex-account__my_organization',
      titleId: 'store/my-users.my-organization.organization.title',
      headerContent: getHeaderContent(),
    }
  }

  return (
    <ContentWrapper {...headerConfig()}>
      {() => (
        <ToastConsumer>
          {({ showToast }: any) =>
            loading || profileLoading ? (
              <Spinner />
            ) : (
              <div className="pl5 pl7-ns near-black">
                {showOrganizationReload && (
                  <div className={`${styles.reloadMessage} mb5`}>
                    <Alert type="warning" onClose={closeReloadMessage}>
                      <div className="flex-row w-100">
                        {' '}
                        <div className="fl flex-grow-1 justify-start w-90">
                          {intl.formatMessage({
                            id: 'store/my-users.my-organization.reload-message',
                          })}
                        </div>
                        <div className="fl flex-grow-1 justify-end w-10">
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
                  clientId={clientId}
                  assignments={pendingOrgAssignments}
                  defaultAssignment={defaultOrgAssignment}
                  infoUpdated={infoUpdatedPendingOrganizations}
                  showToast={showToast}
                />
                {organizationId === '' && isOrgAdmin && (
                  <div className="mb5 mt5">
                    <h2 className="">
                      {intl.formatMessage({
                        id:
                          'store/my-users.my-organization.create-new-organization',
                      })}
                    </h2>

                    <AddOrganization
                      userEmail={email}
                      clientId={clientId}
                      updateOrgInfo={infoUpdatedCreateOrganization}
                      showToast={showToast}
                    />
                  </div>
                )}
                {defaultOrgAssignment && defaultOrgAssignment.id && (
                  <div>
                    <DefaultAssignmentInfo
                      clientId={clientId}
                      defaultAssignment={defaultOrgAssignment}
                      userRole={userRole}
                      infoUpdated={infoUpdatedDefaultAssignment}
                      showToast={showToast}
                      showLeaveBtn={showLeaveOrganizationBtn}
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
                          email={email}
                          showToast={showToast}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }
        </ToastConsumer>
      )}
    </ContentWrapper>
  )
}

export default React.memo(injectIntl(MyOrganization))
