import React, { Fragment, useState } from 'react'
import { useQuery, useMutation } from 'react-apollo'
import documentQuery from '../graphql/documents.graphql'
import {
  EmptyState,
  PageBlock,
  PageHeader,
  Layout,
  Button,
  Modal,
  ModalDialog,
} from 'vtex.styleguide'
import { find, propEq, filter, reject } from 'ramda'
import MyUsers from './MyUsers'
import AddOrganization from './AddOrganization'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'
import { documentSerializer } from '../utils/documentSerializer'
import pathOr from 'ramda/es/pathOr'

interface Props {
  userEmail: string
  organizationId: string
  personaId: string
  infoUpdated: Function
}

const MyOrganization = (props: Props) => {
  //const [redirectTo, setRedirectTo] = useState('')
  //const [props.organizationId, setprops.organizationId] = useState(props.organizationId)

  // const [updateOrganizationAssignment] = useMutation(UPDATE_DOCUMENT)
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

  // const orgAssignmentFields = orgAssignmentData
  //   ? pathOr([], ['fields'], last(orgAssignmentData.documents))
  //   : []

  // const orgAssignmentId = pathOr(
  //   '',
  //   ['value'],
  //   find(propEq('key', 'id'), orgAssignmentFields)
  // )

  // const organizationStatus: string = pathOr(
  //   '',
  //   ['value'],
  //   find(propEq('key', 'status'), orgAssignmentFields)
  // )

  // const orgInfoUpdated = (newPersonaId: string, newOrganizationId: string) => {
  //   props.infoUpdated(newPersonaId, newOrganizationId)
  //   debugger
  // }

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: string
  ) => {
    updateDocument({
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
    })
      .then(() => {
        const updatedAssignmentId: string =
          status === 'APPROVED'
            ? pathOr(
                '',
                ['id'],
                find(propEq('id', assignmentId))(orgAssignments)
              )
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
      .then(() => {
        const updatedOrgId: string =
          status === 'APPROVED'
            ? pathOr(
                '',
                ['businessOrganizationId'],
                find(propEq('id', assignmentId))(orgAssignments)
              )
            : ''
        props.infoUpdated(
          props.personaId,
          status === 'APPROVED' ? updatedOrgId : ''
        )
      })
  }

  const leaveOrganization = (assignmentId: string) => {
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
      updateAssignmentStatus(assignmentId, 'DECLINED')
    } else {
      setIsLeaveOrganizationMessageOpen(true)
    }
  }

  const approveOrganization = (assignmentId: string) => {
    if (defaultAssignment) {
      setIsApproveMessageOpen(true)
    } else {
      updateAssignmentStatus(assignmentId, 'APPROVE')
    }
  }

  const declineOrganization = (assignment: OrganizationAssignment) => {
    setDeclineOrgAssignment(assignment)
    setIsDeclineOrganizationMessageOpen(true)
  }

  const confirmDeclineOrgAssignment = () => {
    updateAssignmentStatus(declineOrgAssignment.id, 'DECLINE')
    setIsDeclineOrganizationMessageOpen(false)
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
  }

  // if (organizationStatus === 'APPROVED' || redirectTo == 'USERS') {
  //   return <MyUsers organizationId={props.organizationId} />
  // } else

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
                    {x.businessOrganizationId_linked &&
                    x.businessOrganizationId_linked.name
                      ? x.businessOrganizationId_linked.name
                      : ''}
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
                    {defaultAssignment.businessOrganizationId_linked &&
                    defaultAssignment.businessOrganizationId_linked.name
                      ? defaultAssignment.businessOrganizationId_linked.name
                      : ''}
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
                    variation="secondary"
                    size="small"
                    onClick={() => leaveOrganization(defaultAssignment.id)}>
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
                <MyUsers organizationId={props.organizationId} />
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={isApproveMessageOpen}
          title="Unable to join organization "
          responsiveFullScreen
          centered
          bottomBar={
            <div className="nowrap">
              <span className="mr4">
                <Button
                  variation="tertiary"
                  onClick={() => closeApproveMessageModal()}>
                  Ok
                </Button>
              </span>
            </div>
          }
          onClose={() => closeApproveMessageModal()}>
          <div className="flex flex-column mb5 mt5">
            <div>
              <span>You have already joined organization: </span>
              <span className="b">
                {defaultAssignment.businessOrganizationId_linked &&
                defaultAssignment.businessOrganizationId_linked.name
                  ? defaultAssignment.businessOrganizationId_linked.name
                  : ''}
              </span>
            </div>
            <div className="mt2">
              <span className="yellow">
                Please leave current organization before joining another
                organization
              </span>
            </div>
          </div>
        </Modal>
        <Modal
          isOpen={isLeaveOrganizationMessageOpen}
          title="Unable to leave organization "
          responsiveFullScreen
          centered
          bottomBar={
            <div className="nowrap">
              <span className="mr4">
                <Button
                  variation="tertiary"
                  onClick={() => closeLeaveOrganizationMessageModal()}>
                  Ok
                </Button>
              </span>
            </div>
          }
          onClose={() => closeLeaveOrganizationMessageModal()}>
          <div className="flex flex-column mb5 mt5">
            <div>
              <span>You are unable to leave organization: </span>
              <span className="b">
                {defaultAssignment.businessOrganizationId_linked &&
                defaultAssignment.businessOrganizationId_linked.name
                  ? defaultAssignment.businessOrganizationId_linked.name
                  : ''}
              </span>
            </div>
            <div className="mt2">
              <span className="red">
                You should transfer "Manager" role before leaving the
                organization
              </span>
            </div>
          </div>
        </Modal>
        <ModalDialog
          centered
          loading={false}
          confirmation={{
            onClick: () => confirmDeclineOrgAssignment(),
            label: 'Decline',
            isDangerous: true,
          }}
          cancelation={{
            onClick: () => closeDeclineOrgAssignment(),
            label: 'Cancel',
          }}
          isOpen={isDeclineOrganizationMessageOpen}
          onClose={() => closeDeclineOrgAssignment()}>
          <h1>Decline organization</h1>
          <div className="flex flex-column mb5 mt5">
            <div>
              <span>
                Do you need to decline the join request from organization:{' '}
              </span>
              <span className="b">
                {declineOrgAssignment.businessOrganizationId_linked &&
                declineOrgAssignment.businessOrganizationId_linked.name
                  ? declineOrgAssignment.businessOrganizationId_linked.name
                  : ''}
              </span>
            </div>
          </div>
        </ModalDialog>
      </PageBlock>
    </Layout>
  )
}

export default MyOrganization
