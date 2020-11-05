import React, { useEffect, useState, useRef } from 'react'
import { useQuery, useApolloClient } from 'react-apollo'
import { Alert, ToastConsumer, Button, Spinner, Tag } from 'vtex.styleguide'
import { injectIntl } from 'react-intl'
import { pathOr, find, propEq, equals } from 'ramda'

import { ContentWrapper } from 'vtex.my-account-commons'

import MyUsers from './MyUsers'
import AddOrganization from './AddOrganization'
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
  CLIENT_ACRONYM,
  CLIENT_FIELDS,
  ORG_ASSIGNMENT_STATUS_APPROVED,
} from '../utils/const'
import styles from '../my-organization.css'

interface Props {
  intl: any
}

const MyOrganization = ({ intl }: Props) => {
  // my organization state
  const [clientId, setClientId] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [email, setEmail] = useState('')
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)
  const [defaultOrgAssignment, setDefaultOrgAssignment] = useState(
    ({} as any) as OrganizationAssignment
  )
  const [userRole, setUserRole] = useState(({} as any) as Role)
  const [loading, setLoading] = useState(false)
  const [reloadStart, setReloadStart] = useState(false)
  const [showOrganizationReload, setShowOrganizationReload] = useState(false)

  // apollo client
  const client = useApolloClient()

  // restrict re render multiple times
  const afterEmailSet = useRef(false)
  const afterFirstLoad = useRef(false)

  // get initial profile info
  const { data: profileData, loading: profileLoading } = useQuery(
    profileQuery,
    { variables: { customFields: PROFILE_FIELDS } }
  )

  // Load data
  const load = () => {
    let organizationIdData = ''
    let orgAssignmentsData = ([] as any) as OrganizationAssignment[]
    let defaultAssignmentData = ({} as any) as OrganizationAssignment
    let userRoleData = ({} as any) as Role

    setReloadStart(true)

    // Get client info
    return client
      .query({
        query: DOCUMENTS,
        variables: {
          acronym: CLIENT_ACRONYM,
          fields: CLIENT_FIELDS,
          where: `email=${email}`,
        },
        fetchPolicy: 'no-cache',
      })
      .then(({ data }: any) => {
        const clients = documentSerializer(data ? data.myDocuments : [])

        organizationIdData = pathOr('', [0, 'organizationId'], clients)

        // get current user organization assignments
        return client
          .query({
            query: DOCUMENTS,
            variables: {
              acronym: ORG_ASSIGNMENT,
              schema: ORG_ASSIGNMENT_SCHEMA,
              fields: ORG_ASSIGNMENT_FIELDS,
              where: `email=${email}`,
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
            propEq('businessOrganizationId', organizationIdData)
          )(assignments)

          defaultAssignmentData = defaultAssignment
            ? defaultAssignment
            : (({} as any) as OrganizationAssignment)
        }

        // get current organization's users assignments
        return client
          .query({
            query: DOCUMENTS,
            variables: {
              acronym: ORG_ASSIGNMENT,
              schema: ORG_ASSIGNMENT_SCHEMA,
              fields: ORG_ASSIGNMENT_FIELDS,
              where: `(businessOrganizationId=${organizationIdData} AND status=${ORG_ASSIGNMENT_STATUS_APPROVED})`,
            },
            fetchPolicy: 'no-cache',
          })
          .catch(() => {
            return Promise.resolve({ myDocuments: [] })
          })
      })
      .then(({ data }: any) => {
        if (data) {
          orgAssignmentsData = documentSerializer(data ? data.myDocuments : [])
        }

        // get roles in the system
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
          const roleId = pathOr('', ['roleId'], defaultAssignmentData)
          userRoleData =
            roleId !== '' ? find(propEq('id', roleId))(rolesList) : {}

          setReloadStart(false)
        }
        return Promise.resolve({
          organizationIdData,
          orgAssignmentsData,
          defaultAssignmentData,
          userRoleData,
        })
      })
  }

  // update state variables
  const updateState = (data: any) => {
    setOrganizationId(data.organizationIdData)
    setDefaultOrgAssignment(data.defaultAssignmentData)
    setUserRole(data.userRoleData)
  }

  // after email changed
  useEffect(() => {
    const abortController = new AbortController()
    if (afterEmailSet.current && !afterFirstLoad.current) {
      afterFirstLoad.current = true

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

  // after profile data loaded
  useEffect(() => {
    const abortController = new AbortController()

    const idData = pathOr('', ['profile', 'id'], profileData)
    const emailData = pathOr('', ['profile', 'email'], profileData)
    const isOrgAdminData = pathOr(
      'false',
      ['value'],
      find(propEq('key', 'isOrgAdmin'))(
        pathOr([], ['profile', 'customFields'], profileData)
      )
    ) as any
    const organizationIdData = pathOr(
      '',
      ['value'],
      find(propEq('key', 'organizationId'))(
        pathOr([], ['profile', 'customFields'], profileData)
      )
    ) as any

    if (emailData !== '') {
      setClientId(idData)
      setEmail(emailData)
      setIsOrgAdmin(isOrgAdminData === 'true' || isOrgAdminData === true)
      setOrganizationId(organizationIdData)
    }

    if (emailData !== '' && !afterFirstLoad.current) {
      afterEmailSet.current = true
    }

    return () => {
      abortController.abort()
    }
  }, [profileData])

  // Continue reload - [Leave, Delete] default organization
  const infoUpdatedDefaultAssignment = () => {
    setShowOrganizationReload(true)
    load().then((data: any) => {
      if (
        data &&
        equals(
          data.organizationIdData,
          '' && equals(data.defaultAssignmentData, {})
        )
      ) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedDefaultAssignment()
      }
    })
  }

  // Continue reload - [Create] organization
  const infoUpdatedCreateOrganization = () => {
    setShowOrganizationReload(true)
    load().then((data: any) => {
      const isValidDefaultAssignment =
        find(propEq('email', email))(
          pathOr([], ['orgAssignmentsData'], data)
        ) !== undefined
      if (
        data &&
        !equals(data.organizationIdData, '') &&
        !equals(data.defaultAssignmentData, {}) &&
        isValidDefaultAssignment
      ) {
        updateState(data)
        setShowOrganizationReload(false)
      } else {
        infoUpdatedCreateOrganization()
      }
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
            id: 'store/my-users.my-organization.status.isOrgAdmin',
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
                {(organizationId == '' || organizationId === 'null') &&
                  (isOrgAdmin ? (
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
                  ) : (
                    <div className="flex flex-column items-center">
                      <span className="c-on-base">
                        {intl.formatMessage({
                          id: 'store/my-users.my-organization.not-yet-assigned-1',
                        })}
                      </span>
                      <span className="c-on-base">
                        {intl.formatMessage({
                          id: 'store/my-users.my-organization.not-yet-assigned-2',
                        })}
                      </span>
                    </div>
                  ))}
                {defaultOrgAssignment && defaultOrgAssignment.id && (
                  <div className="ba b--light-gray">
                    <DefaultAssignmentInfo
                      clientId={clientId}
                      defaultAssignment={defaultOrgAssignment}
                      userRole={userRole}
                      infoUpdated={infoUpdatedDefaultAssignment}
                      showToast={showToast}
                      isOrgAdmin={isOrgAdmin}
                    />

                    {((userRole &&
                      userRole.name &&
                      userRole.name === 'manager') ||
                      isOrgAdmin) && (
                      <MyUsers
                        isCurrentUserAdmin={isOrgAdmin}
                        organizationId={organizationId}
                        email={email}
                        showToast={showToast}
                      />
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
