import React, { useState } from 'react'
import { pathOr, find, propEq } from 'ramda'
import { Button } from 'vtex.styleguide'
import { injectIntl } from 'react-intl'

import WarningModal from './modals/WarningModal'
import ConfirmationModal from './modals/ConfirmationModal'
import { ASSIGNMENT_STATUS_APPROVED, ASSIGNMENT_STATUS_DECLINED} from '../utils/const'
interface Props {
  personaId: string
  assignments: OrganizationAssignment[]
  defaultAssignment: OrganizationAssignment
  updateAssignmentStatus: Function
  infoUpdated: Function
  showToast: Function
  intl: any
}

const MyPendingAssignments = ({
  personaId,
  assignments,
  defaultAssignment,
  updateAssignmentStatus,
  infoUpdated,
  showToast,
  intl,
}: Props) => {
  const [isApproveWarningOpen, setIsApproveWarningOpen] = useState(false)
  const [isDeclineConfirmationOpen, setIsDeclineConfirmationOpen] = useState(
    false
  )
  const [declineAssignmentLoading, setDeclineAssignmentLoading] = useState(
    false
  )

  const [sharedAssignment, setSharedAssignment] = useState(
    {} as OrganizationAssignment
  )

  // APPROVE
  const approveOrganization = (assignmentId: string) => {
    if (defaultAssignment) {
      setIsApproveWarningOpen(true)
    } else {
      updateAssignmentStatus(assignmentId, ASSIGNMENT_STATUS_APPROVED)
        .then((data: any) => {
          console.log(data)
          const updatedOrgId: string = pathOr(
            '',
            ['businessOrganizationId'],
            find(propEq('id', assignmentId))(assignments)
          )
          infoUpdated(personaId, updatedOrgId)
        })
        .catch((message: string) => {
          showToast({
            message: `${intl.formatMessage({id: 'store/my-users.toast.organization.approve.error'})} "${message}"`,
            duration: 5000,
            horizontalPosition: 'right',
          })
        })
    }
  }

  const closeApproveMessageModal = () => {
    setIsApproveWarningOpen(false)
  }

  // DECLINE
  const declineOrganization = (assignment: OrganizationAssignment) => {
    setSharedAssignment(assignment)
    setIsDeclineConfirmationOpen(true)
  }

  const confirmDeclineOrgAssignment = () => {
    setDeclineAssignmentLoading(true)
    updateAssignmentStatus(sharedAssignment.id, ASSIGNMENT_STATUS_DECLINED)
      .then(() => {
        setDeclineAssignmentLoading(false)
        setIsDeclineConfirmationOpen(false)
        setSharedAssignment({} as OrganizationAssignment)

        infoUpdated(personaId, '')
      })
      .catch((message: string) => {
        setSharedAssignment({} as OrganizationAssignment)
        setIsDeclineConfirmationOpen(false)
        setDeclineAssignmentLoading(false)
        showToast({
          message: `${intl.formatMessage({id: 'store/my-users.toast.organization.decline.error'})}  "${message}"`,
          duration: 5000,
          horizontalPosition: 'right',
        })
      })
  }
  const closeDeclineOrgAssignment = () => {
    setIsDeclineConfirmationOpen(false)
    setSharedAssignment({} as OrganizationAssignment)
  }

  return assignments && assignments.length > 0 ? (
    <div className="mb7">
      <h2>
        {intl.formatMessage({
          id: 'store/my-users.my-organization.pending-requests',
        })}
      </h2>
      {assignments.map((x: OrganizationAssignment) => (
        <div className="flex flex-row mb3 mt3 ba b--light-gray pa2 pl3">
          <div className="mt3 w-75">
            {intl.formatMessage({
              id: 'store/my-users.my-organization.join-request-from',
            })}
            :{' '}
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
                {intl.formatMessage({
                  id: 'store/my-users.my-organization.button.approve',
                })}
              </Button>
            </span>
            <span className="ml2">
              <Button
                variation="danger-tertiary"
                size="small"
                onClick={() => declineOrganization(x)}>
                {intl.formatMessage({
                  id: 'store/my-users.my-organization.button.decline',
                })}
              </Button>
            </span>
          </div>
        </div>
      ))}
      <WarningModal
        onOk={closeApproveMessageModal}
        onClose={closeApproveMessageModal}
        isOpen={isApproveWarningOpen}
        assignment={defaultAssignment}
        title={intl.formatMessage({
          id: 'store/my-users.my-organization.unable-to-join-title',
        })}
        messageLine1={intl.formatMessage({
          id: 'store/my-users.my-organization.unable-to-join-message1',
        })}
        messageLine2={intl.formatMessage({
          id: 'store/my-users.my-organization.unable-to-join-message2',
        })}
      />
      <ConfirmationModal
        isOpen={isDeclineConfirmationOpen}
        isLoading={declineAssignmentLoading}
        onConfirm={confirmDeclineOrgAssignment}
        onClose={closeDeclineOrgAssignment}
        assignment={sharedAssignment}
        confirmAction={intl.formatMessage({
          id: 'store/my-users.my-organization.button.decline',
        })}
        message={intl.formatMessage({
          id: 'store/my-users.my-organization.decline.message',
        })}
      />
    </div>
  ) : (
    <div />
  )
}

export default injectIntl(MyPendingAssignments)
