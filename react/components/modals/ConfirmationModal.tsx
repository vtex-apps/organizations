import React from 'react'
import { ModalDialog } from 'vtex.styleguide'
import { pathOr } from 'ramda'

interface Props {
  isOpen: boolean
  isLoading: boolean
  onConfirm: Function
  onClose: Function
  assignment: OrganizationAssignment
  confirmAction: string
  message: string
}

const ConfirmationModal = ({
  isOpen,
  isLoading,
  onConfirm,
  onClose,
  assignment,
  confirmAction,
  message
}: Props) => {
  return (
    <ModalDialog
      centered
      loading={isLoading}
      confirmation={{
        onClick: () => onConfirm(assignment),
        label: confirmAction,
        isDangerous: true,
      }}
      cancelation={{
        onClick: () => onClose(),
        label: 'Cancel',
      }}
      isOpen={isOpen}
      onClose={() => onClose()}>
      <h1>{confirmAction} organization</h1>
      <div className="flex flex-column mb5 mt5">
        <div>
          <span>
            {message}
          </span>
          <span className="b">
            {pathOr('', ['businessOrganizationId_linked', 'name'], assignment)}
          </span>
        </div>
      </div>
    </ModalDialog>
  )
}

export default ConfirmationModal
