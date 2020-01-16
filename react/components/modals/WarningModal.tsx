import React from 'react'
import { Modal, Button } from 'vtex.styleguide'
import { pathOr } from 'ramda'

interface Props {
  isOpen: boolean
  onOk: Function
  onClose: Function
  assignment: OrganizationAssignment
  title: string
  messageLine1?: string
  messageLine2?: string
}

const WarningModal = ({ isOpen, onOk, onClose, assignment, title, messageLine1, messageLine2 }: Props) => {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      responsiveFullScreen
      centered
      bottomBar={
        <div className="nowrap">
          <span className="mr4">
            <Button variation="tertiary" onClick={() => onOk()}>
              Ok
            </Button>
          </span>
        </div>
      }
      onClose={() => onClose()}>
      <div className="flex flex-column mb5 mt5">
        <div>
          <span>{messageLine1}</span>
          <span className="b">
            {pathOr('', ['businessOrganizationId_linked', 'name'], assignment)}
          </span>
        </div>
        <div className="mt2">
          <span className="red">
          {messageLine2}
          </span>
        </div>
      </div>
    </Modal>
  )
}

export default WarningModal
