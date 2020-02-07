import React, { useState, useEffect } from 'react'
import { Modal, Button, Dropdown } from 'vtex.styleguide'
import { useMutation } from 'react-apollo'
import { pathOr } from 'ramda'
import { injectIntl, InjectedIntlProps } from 'react-intl'

import { updateCacheEditUser } from '../../utils/cacheUtils'
import UPDATE_DOCUMENT from '../../graphql/updateDocument.graphql'

import { ORG_ASSIGNMENT, ORG_ASSIGNMENT_SCHEMA } from '../../utils/const'
import { getErrorMessage } from '../../utils/graphqlErrorHandler'

interface Props {
  isOpen: boolean
  onClose: Function
  onSave: Function
  orgAssignment: OrganizationAssignment
  roles: Role[]
  showToast: Function
}

const UserEditModal = ({
  isOpen,
  onClose,
  onSave,
  orgAssignment,
  roles,
  showToast,
  intl,
}: Props & InjectedIntlProps) => {
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

  const onSaveEdit = () => {
    updateUserDocument({
      variables: {
        acronym: ORG_ASSIGNMENT,
        document: {
          fields: [
            { key: 'id', value: assignmentId },
            { key: 'roleId', value: roleId },
          ],
        },
        schema: ORG_ASSIGNMENT_SCHEMA,
      },
    })
      .then(() => {
        onSave()
      })
      .catch((e: Error) => {
        const message = getErrorMessage(e)
        showToast({
          message: `Can't edit user because "${message}"`,
          duration: 5000,
          horizontalPosition: 'right',
        })
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
              {intl.formatMessage({ id: 'store/my-users.button.cancel' })}
            </Button>
          </span>
          <span>
            <Button
              variation="secondary"
              disabled={roleId === ''}
              onClick={() => onSaveEdit()}>
              {intl.formatMessage({ id: 'store/my-users.button.save' })}
            </Button>
          </span>
        </div>
      }
      onClose={() => onClose()}>
      <div>
        <div className="mb5 mt5">
          {intl.formatMessage({ id: 'store/my-users.label.email' })} :{' '}
          {pathOr('', ['personaId_linked', 'email'], orgAssignment)}
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

export default injectIntl(UserEditModal)
