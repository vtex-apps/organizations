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
import { find, propEq, filter, reject } from 'ramda'
import MyUsers from './MyUsers'
import AddOrganization from './AddOrganization'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'
import { documentSerializer } from '../utils/documentSerializer'
import pathOr from 'ramda/es/pathOr'
import WarningModal from './modals/WarningModal'
import ConfirmationModal from './modals/ConfirmationModal'

interface Props {
  userEmail: string
  organizationId: string
  personaId: string
  infoUpdated: Function
}

const MyOrganization = (props: Props) => {
  const [updateDocument] = useMutation(UPDATE_DOCUMENT)
  const [isApproveMessageOpen, setIsApproveMessageOpen] = useState(false)
  const [
    isLeaveOrganizationMessageOpen,
    setIsLeaveOrganizationMessageOpen,
  ] = useState(false)
  const [
    isDeclineOrganizationMessageOpen,
    setIsDeclineOrganizationMessageOpen,
  ] = useState(false)
  const [declineOrgAssignment, setDeclineOrgAssignment] = useState(
    {} as OrganizationAssignment
  )
  const [declineOrganizationLoading, setDeclineOrganizationLoading] = useState(
    false
  )

  const assignmentFilter =
    `(personaId=${props.personaId}` +
    (props.organizationId !== ''
      ? ` OR businessOrganizationId=${props.organizationId})`
      : ')')
  const {
    loading: orgAssignmentLoading,
    error: orgAssignmentError,
    data: orgAssignmentData,
  } = useQuery(documentQuery, {
    skip: props.personaId === '',
    variables: {
      acronym: 'OrgAssignment',
      schema: 'organization-assignment-schema-v1',
      fields: [
        'id',
        'personaId',
        'roleId',
        'status',
        'businessOrganizationId',
        'businessOrganizationId_linked',
      ],
      where: assignmentFilter,
    },
  })

  const {
    loading: rolesLoading,
    error: rolesError,
    data: rolesData,
  } = useQuery(documentQuery, {
    skip: props.personaId === '',
    variables: {
      acronym: 'BusinessRole',
      schema: 'business-role-schema-v1',
      fields: ['id', 'name', 'label'],
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
    ? documentSerializer(orgAssignmentData.documents)
    : []

  const userAssignments =
    orgAssignments && props.personaId
      ? filter(propEq('personaId', props.personaId), orgAssignments)
      : []

  const organizationAssignments =
    orgAssignments && props.organizationId !== ''
      ? filter(
          propEq('businessOrganizationId', props.organizationId),
          orgAssignments
        )
      : []

  const pendingAssignments: OrganizationAssignment[] = filter(
    propEq('status', 'PENDING'),
    userAssignments
  )
  const defaultAssignment: OrganizationAssignment = find(
    propEq('businessOrganizationId', props.organizationId)
  )(userAssignments)

  const roles: Role[] = rolesData ? documentSerializer(rolesData.documents) : []

  const userRole =
    defaultAssignment && defaultAssignment.roleId
      ? find(propEq('id', defaultAssignment.roleId))(roles)
      : {}

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: string
  ) => {
    return updateDocument({
      variables: {
        acronym: 'OrgAssignment',
        document: {
          fields: [
            { key: 'id', value: assignmentId },
            { key: 'status', value: status },
          ],
        },
        schema: 'organization-assignment-schema-v1',
      },
    }).then(() => {
      const updatedAssignmentId: string =
        status === 'APPROVED'
          ? pathOr('', ['id'], find(propEq('id', assignmentId))(orgAssignments))
          : ''
      return updateDocument({
        variables: {
          acronym: 'Persona',
          document: {
            fields: [
              { key: 'id', value: props.personaId },
              { key: 'businessOrganizationId', value: updatedAssignmentId },
            ],
          },
          schema: 'persona-schema-v1',
        },
      })
    })
  }

  const leaveOrganization = (assignment: OrganizationAssignment) => {
    const assignmentsExceptMe = reject(
      propEq('personaId', props.personaId),
      organizationAssignments
    )
    const assignmentsWithManagerRole = filter(
      propEq('roleId', userRole.id),
      assignmentsExceptMe
    )
    if (
      userRole.name !== 'manager' ||
      assignmentsExceptMe.length == 0 ||
      assignmentsWithManagerRole.length > 0
    ) {
      // updateAssignmentStatus(assignmentId, 'DECLINED').then(() => {
      //   props.infoUpdated(props.personaId, '')
      // })
      declineOrganization(assignment)
    } else {
      setIsLeaveOrganizationMessageOpen(true)
    }
  }

  const approveOrganization = (assignmentId: string) => {
    if (defaultAssignment) {
      setIsApproveMessageOpen(true)
    } else {
      updateAssignmentStatus(assignmentId, 'APPROVE').then(() => {
        const updatedOrgId: string = pathOr(
          '',
          ['businessOrganizationId'],
          find(propEq('id', assignmentId))(orgAssignments)
        )
        props.infoUpdated(props.personaId, updatedOrgId)
      })
    }
  }

  const declineOrganization = (assignment: OrganizationAssignment) => {
    setDeclineOrgAssignment(assignment)
    setIsDeclineOrganizationMessageOpen(true)
  }

  const confirmDeclineOrgAssignment = () => {
    setDeclineOrganizationLoading(true)
    updateAssignmentStatus(declineOrgAssignment.id, 'DECLINE').then(() => {
      setDeclineOrganizationLoading(false)
      setIsDeclineOrganizationMessageOpen(false)
      setDeclineOrgAssignment({} as OrganizationAssignment)

      props.infoUpdated(props.personaId, '')
    })
  }

  const deleteOrganization = (assignment: OrganizationAssignment) => {
    debugger
    console.log(assignment)
  }

  const closeApproveMessageModal = () => {
    setIsApproveMessageOpen(false)
  }

  const closeLeaveOrganizationMessageModal = () => {
    setIsLeaveOrganizationMessageOpen(false)
  }

  const closeDeclineOrgAssignment = () => {
    setIsDeclineOrganizationMessageOpen(false)
    setDeclineOrgAssignment({} as OrganizationAssignment)
  }

  if (props.personaId == '') {
    return (
      <AddOrganization
        userEmail={props.userEmail}
        updateOrgInfo={props.infoUpdated}
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
        {pendingAssignments &&
          pendingAssignments.map(x => (
            <div className="mb7">
              <h2>Pending requests</h2>
              <div className="flex flex-row mb3 mt3 ba b--light-gray pa2 pl3">
                <div className="mt3 w-75">
                  Join request from:{' '}
                  <span className="b">
                    {pathOr('', ['businessOrganizationId_linked', 'name'], x)}
                  </span>
                </div>
                <div className="ml5 w-25 flex">
                  <span className="mr2">
                    <Button
                      variation="secondary"
                      size="small"
                      onClick={() => approveOrganization(x.id)}>
                      Approve
                    </Button>
                  </span>
                  <span className="ml2">
                    <Button
                      variation="danger-tertiary"
                      size="small"
                      onClick={() => declineOrganization(x)}>
                      Decline
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          ))}
        {!defaultAssignment && (
          <div className="mb5 mt5">
            <h2 className="">Create new Organization</h2>
            <AddOrganization
              userEmail={props.userEmail}
              updateOrgInfo={props.infoUpdated}
              personaId={props.personaId}
            />
          </div>
        )}
        {defaultAssignment && (
          <div>
            <div className="flex flex-row mb5 mt5">
              <div className="mt3 w-50">
                <h2>
                  Organization :{' '}
                  <span className="b">
                    {pathOr(
                      '',
                      ['businessOrganizationId_linked', 'name'],
                      defaultAssignment
                    )}
                  </span>
                </h2>
              </div>
              <div className="ml5 w-25 flex items-center">
                <h3 className="flex flex-row mb5 mt5">
                  Role: {userRole && userRole.label ? userRole.label : ''}
                </h3>
              </div>
              <div className="ml5 w-25 flex items-center">
                <span className="mr2">
                  <Button
                    variation="danger-tertiary"
                    size="small"
                    onClick={() => leaveOrganization(defaultAssignment)}>
                    Leave
                  </Button>
                </span>
                <span className="ml2">
                  <Button
                    variation="danger-tertiary"
                    size="small"
                    onClick={() => deleteOrganization(defaultAssignment)}>
                    Delete
                  </Button>
                </span>
              </div>
            </div>

            {userRole && userRole.name && userRole.name === 'manager' && (
              <div className="flex flex-column mb5 mt5">
                <h2 className="">Users in organization</h2>
                <MyUsers
                  organizationId={props.organizationId}
                  personaId={props.personaId}
                />
              </div>
            )}
          </div>
        )}

        <WarningModal
          onOk={closeApproveMessageModal}
          onClose={closeApproveMessageModal}
          isOpen={isApproveMessageOpen}
          assignment={defaultAssignment}
          title={'Unable to join organization'}
          messageLine1={'You have already joined organization: '}
          messageLine2={'Please leave current organization before joining another organization'}
        />
        <WarningModal
          onOk={closeLeaveOrganizationMessageModal}
          onClose={closeLeaveOrganizationMessageModal}
          isOpen={isLeaveOrganizationMessageOpen}
          assignment={defaultAssignment}
          title={'Unable to leave organization'}
          messageLine1={'You are unable to leave organization: '}
          messageLine2={'You should transfer "Manager" role before leaving the organization'}
        />

        <ConfirmationModal 
          isOpen={isDeclineOrganizationMessageOpen}
          isLoading={declineOrganizationLoading}
          onConfirm={confirmDeclineOrgAssignment}
          onClose={closeDeclineOrgAssignment}
          assignment={declineOrgAssignment}
          confirmAction={'Decline'}
          message={'Do you want to decline join request to organization: '}
          />
      </PageBlock>
    </Layout>
  )
}

export default MyOrganization
