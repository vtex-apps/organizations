import React, { useState } from 'react'
import { injectIntl } from 'react-intl'
import { reject, filter, propEq, pathOr } from 'ramda'
import { Button } from 'vtex.styleguide'

import WarningModal from './modals/WarningModal'
import ConfirmationModal from './modals/ConfirmationModal'
import { ASSIGNMENT_STATUS_DECLINED } from '../utils/const'

interface Props {
  personaId: string
  defaultAssignment: OrganizationAssignment
  assignments: OrganizationAssignment[]
  userRole: any
  updateAssignmentStatus: Function
  deleteOrgAssignment: Function
  infoUpdated: Function
  showToast: Function
  intl: any
}

const DefaultAssignmentInfo = ({
  personaId,
  defaultAssignment,
  assignments,
  userRole,
  updateAssignmentStatus,
  deleteOrgAssignment,
  infoUpdated,
  showToast,
  intl,
}: Props) => {
  const [isLeaveWarningOpen, setIsLeaveWarningOpen] = useState(false)
  const [sharedOrgAssignment, setSharedOrgAssignment] = useState(
    {} as OrganizationAssignment
  )

  const [
    isDeleteAssignmentWarningOpen,
    setIsDeleteAssignmentWarningOpen,
  ] = useState(false)

  const [
    isDeleteOrgConfirmationOpen,
    setIsDeleteOrgConfirmationOpen,
  ] = useState(false)

  const [
    deleteOrgConfirmationLoading,
    setDeleteOrgConfirmationLoading,
  ] = useState(false)

  const [isLeaveOrgConfirmationOpen, setIsLeaveOrgConfirmationOpen] = useState(
    false
  )

  const [
    leaveOrgConfirmationLoading,
    setLeaveOrgConfirmationLoading,
  ] = useState(false)

  // LEAVE
  const leaveOrganization = (assignment: OrganizationAssignment) => {
    const assignmentsExceptMe = reject(
      propEq('personaId', personaId),
      assignments
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
      setSharedOrgAssignment(assignment)
      setIsLeaveOrgConfirmationOpen(true)
    } else {
      setIsLeaveWarningOpen(true)
    }
  }

  const closeLeaveOrganizationMessageModal = () => {
    setIsLeaveWarningOpen(false)
  }

  const confirmLeaveOrganization = () => {
    setLeaveOrgConfirmationLoading(true)
    updateAssignmentStatus(sharedOrgAssignment.id, ASSIGNMENT_STATUS_DECLINED)
      .then(() => {
        setLeaveOrgConfirmationLoading(false)
        setIsLeaveOrgConfirmationOpen(false)
        setSharedOrgAssignment({} as OrganizationAssignment)

        infoUpdated(personaId, '')
      })
      .catch((message: string) => {
        setLeaveOrgConfirmationLoading(false)
        setIsLeaveOrgConfirmationOpen(false)
        setSharedOrgAssignment({} as OrganizationAssignment)
        showToast({
          message: `Can't leave organization because "${message}"`,
          duration: 5000,
          horizontalPosition: 'right',
        })
      })
  }
  const closeLeaveOrganization = () => {
    setIsLeaveOrgConfirmationOpen(false)
    setSharedOrgAssignment({} as OrganizationAssignment)
  }

  // DELETE ORGANIZATION
  const deleteCurrentOrganization = (assignment: OrganizationAssignment) => {
    const assignmentsExceptMe = reject(
      propEq('personaId', personaId),
      assignments
    )
    if (assignmentsExceptMe && assignmentsExceptMe.length > 0) {
      setIsDeleteAssignmentWarningOpen(true)
    } else {
      deleteOrganization(assignment)
      console.log(assignment)
    }
  }

  const closeDeleteAssignmentWarningModal = () => {
    setIsDeleteAssignmentWarningOpen(false)
  }

  const deleteOrganization = (assignment: OrganizationAssignment) => {
    setSharedOrgAssignment(assignment)
    setIsDeleteOrgConfirmationOpen(true)
  }

  const confirmDeleteOrganization = () => {
    setDeleteOrgConfirmationLoading(true)
    deleteOrgAssignment(sharedOrgAssignment.id).then(() => {
      setDeleteOrgConfirmationLoading(false)
      setIsDeleteOrgConfirmationOpen(false)
      setSharedOrgAssignment({} as OrganizationAssignment)

      infoUpdated(personaId, '')
    })
    .catch((message: string) => {
      setDeleteOrgConfirmationLoading(false)
      setIsDeleteOrgConfirmationOpen(false)
      setSharedOrgAssignment({} as OrganizationAssignment)
      showToast({
        message: `Can't leave organization because "${message}"`,
        duration: 5000,
        horizontalPosition: 'right',
      })
    })
  }

  const closeDeleteOrganization = () => {
    setIsDeleteOrgConfirmationOpen(false)
    setSharedOrgAssignment({} as OrganizationAssignment)
  }

  return (
    <div className="flex flex-row mb5 mt5">
      <div className="mt3 w-50">
        <h2>
          {intl.formatMessage({
            id: 'store/my-users.my-organization.organization',
          })}
          :{' '}
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
          {intl.formatMessage({
            id: 'store/my-users.my-organization.role',
          })}
          : {userRole && userRole.label ? userRole.label : ''}
        </h3>
      </div>
      <div className="ml5 w-25 flex items-center">
        <span className="mr2">
          <Button
            variation="danger-tertiary"
            size="small"
            onClick={() => leaveOrganization(defaultAssignment)}>
            {intl.formatMessage({
              id: 'store/my-users.my-organization.leave',
            })}
          </Button>
        </span>
        {userRole && userRole.name && userRole.name === 'manager' && (
          <span className="ml2">
            <Button
              variation="danger-tertiary"
              size="small"
              onClick={() => deleteCurrentOrganization(defaultAssignment)}>
              {intl.formatMessage({
                id: 'store/my-users.my-organization.delete',
              })}
            </Button>
          </span>
        )}
      </div>
      <WarningModal
        onOk={closeLeaveOrganizationMessageModal}
        onClose={closeLeaveOrganizationMessageModal}
        isOpen={isLeaveWarningOpen}
        assignment={defaultAssignment}
        title={intl.formatMessage({
          id: 'store/my-users.my-organization.unable-to-leave-title',
        })}
        messageLine1={intl.formatMessage({
          id: 'store/my-users.my-organization.unable-to-leave-message1',
        })}
        messageLine2={intl.formatMessage({
          id: 'store/my-users.my-organization.unable-to-leave-message2',
        })}
      />

      <WarningModal
        onOk={closeDeleteAssignmentWarningModal}
        onClose={closeDeleteAssignmentWarningModal}
        isOpen={isDeleteAssignmentWarningOpen}
        assignment={defaultAssignment}
        title={intl.formatMessage({
          id: 'store/my-users.my-organization.unable-to-delete-title',
        })}
        messageLine1={intl.formatMessage({
          id: 'store/my-users.my-organization.unable-to-delete-message1',
        })}
        messageLine2={intl.formatMessage({
          id: 'store/my-users.my-organization.unable-to-delete-message2',
        })}
      />

      <ConfirmationModal
        isOpen={isLeaveOrgConfirmationOpen}
        isLoading={leaveOrgConfirmationLoading}
        onConfirm={confirmLeaveOrganization}
        onClose={closeLeaveOrganization}
        assignment={sharedOrgAssignment}
        confirmAction={intl.formatMessage({
          id: 'store/my-users.my-organization.button.leave',
        })}
        message={intl.formatMessage({
          id: 'store/my-users.my-organization.leave.message',
        })}
      />

      <ConfirmationModal
        isOpen={isDeleteOrgConfirmationOpen}
        isLoading={deleteOrgConfirmationLoading}
        onConfirm={confirmDeleteOrganization}
        onClose={closeDeleteOrganization}
        assignment={sharedOrgAssignment}
        confirmAction={intl.formatMessage({
          id: 'store/my-users.my-organization.button.delete',
        })}
        message={intl.formatMessage({
          id: 'store/my-users.my-organization.delete.message',
        })}
      />
    </div>
  )
}

export default injectIntl(DefaultAssignmentInfo)
