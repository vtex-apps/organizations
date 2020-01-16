import React, { useState, useEffect } from 'react'
import { Modal, Button, Dropdown } from 'vtex.styleguide'
import { pathOr } from 'ramda'

interface Props {
  isOpen: boolean
  onClose: Function
  onSave: Function
  orgAssignment: OrganizationAssignment
  roles: Role[]
}

const UserEditModal = ({
  isOpen,
  onClose,
  onSave,
  orgAssignment,
  roles,
}: Props) => {
  const [roleId, setRoleId] = useState('')

  useEffect(() => {
    setRoleId(pathOr('', ['roleId_linked', 'id'], orgAssignment))
  }, [orgAssignment])

  const onSaveEdit = () => {
    onSave(orgAssignment.id, roleId)
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Edit User"
      responsiveFullScreen
      centered
      bottomBar={
        <div className="nowrap">
          <span className="mr4">
            <Button variation="tertiary" onClick={() => onClose()}>
              Cancel
            </Button>
          </span>
          <span>
            <Button
              variation="secondary"
              disabled={roleId === ''}
              onClick={() => onSaveEdit()}>
              Save
            </Button>
          </span>
        </div>
      }
      onClose={() => onClose()}>
      <div>
        <div className="mb5 mt5">
          Email : {pathOr('', ['personaId_linked', 'email'], orgAssignment)}
        </div>
        <div className="mb5">
          <Dropdown
            label={'Role'}
            options={roles}
            onChange={(e: { target: { value: string } }) => {
              setRoleId(e.target.value)
            }}
            value={roleId}
            errorMessage={roleId === '' ? 'Role is required' : ''}
          />
        </div>
      </div>
    </Modal>
  )
}

export default UserEditModal
