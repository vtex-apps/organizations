import React, { useState, useEffect } from 'react'
import { Modal, Button, Dropdown } from 'vtex.styleguide'
import { useMutation } from 'react-apollo'
import { pathOr } from 'ramda'
import { updateCacheEditUser } from '../../utils/cacheUtils'
import UPDATE_DOCUMENT from '../../graphql/updateDocument.graphql'

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
  roles
}: Props) => {
  const [roleId, setRoleId] = useState('')
  const [assignmentId, setAssignmentId] = useState('')
  const [organizationId, setOrganizationId] = useState('')

  const [updateUserDocument] = useMutation(UPDATE_DOCUMENT, {
    update: (cache: any, { data }: any) =>
      updateCacheEditUser(cache, data, roles, organizationId, roleId),
  })
  useEffect(() => {
    setAssignmentId(pathOr('', ['id'], orgAssignment))
    setRoleId(pathOr('', ['roleId_linked', 'id'], orgAssignment))
    setOrganizationId(pathOr('', ['businessOrganizationId'], orgAssignment))
  }, [orgAssignment])

  const handleGlobalError = () => {
    return (e: Error) => {
      console.log(e)
      return Promise.reject()
    }
  }

  const onSaveEdit = () => {
    updateUserDocument({
      variables: {
        acronym: 'OrgAssignment',
        document: {
          fields: [
            { key: 'id', value: assignmentId },
            { key: 'roleId', value: roleId },
          ],
        },
        schema: 'organization-assignment-schema-v1',
      },
    })
      .catch(handleGlobalError())
      .then(() => {
        onSave()
      })
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
