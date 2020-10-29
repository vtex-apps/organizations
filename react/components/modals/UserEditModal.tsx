import React, { useState, useEffect } from 'react'
import { Modal, Button, Dropdown, Checkbox, Spinner } from 'vtex.styleguide'
import { useMutation, useQuery } from 'react-apollo'
import { pathOr } from 'ramda'
import { injectIntl } from 'react-intl'
import CurrencyInput from '../../components/CurrencyInput'

import { updateCacheEditUser, updateCacheClient } from '../../utils/cacheUtils'
import UPDATE_DOCUMENT from '../../graphql/updateDocument.graphql'
import GET_DOCUMENT from '../../graphql/documents.graphql'

import { documentSerializer } from '../../utils/documentSerializer'

import {
  CLIENT_ACRONYM,
  CLIENT_FIELDS,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_SCHEMA,
} from '../../utils/const'
import { getErrorMessage } from '../../utils/graphqlErrorHandler'

interface Props {
  isOpen: boolean
  onClose: Function
  onSave: Function
  orgAssignment: OrganizationAssignment
  roles: Role[]
  showToast: (message: any) => void
  isCurrentUserAdmin: boolean
  intl: any
}

const UserEditModal = ({
  isOpen,
  onClose,
  onSave,
  orgAssignment,
  roles,
  showToast,
  isCurrentUserAdmin,
  intl,
}: Props) => {
  const [clientId, setClientId] = useState('')
  const [email, setEmail] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [roleId, setRoleId] = useState('')
  const [assignmentId, setAssignmentId] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)

  const [updateUserDocument] = useMutation(UPDATE_DOCUMENT, {
    update: (cache: any, { data }: any) =>
      updateCacheEditUser(cache, data, roles, organizationId, roleId),
  })

  const [updateClientDocument] = useMutation(UPDATE_DOCUMENT)

  const { data: clientData, loading } = useQuery(GET_DOCUMENT, {
    skip: email === '',
    variables: {
      acronym: CLIENT_ACRONYM,
      fields: CLIENT_FIELDS,
      where: `email=${email}`,
    },
  })

  useEffect(() => {
    const abortController = new AbortController()

    setEmail(pathOr('', ['email'], orgAssignment))
    setBudgetAmount(pathOr('', ['budgetAmount'], orgAssignment))
    setAssignmentId(pathOr('', ['id'], orgAssignment))
    setRoleId(pathOr('', ['roleId_linked', 'id'], orgAssignment))
    setOrganizationId(pathOr('', ['businessOrganizationId'], orgAssignment))

    return () => {
      abortController.abort()
    }
  }, [orgAssignment])

  useEffect(() => {
    const abortController = new AbortController()

    const clients = documentSerializer(clientData ? clientData.myDocuments : [])
    setClientId(pathOr('', [0, 'id'], clients))
    setIsOrgAdmin((pathOr('', [0, 'isOrgAdmin'], clients) as string) === 'true')

    return () => {
      abortController.abort()
    }
  }, [clientData])

  // update client if isOrgAdmin changed
  const updateClient = () => {
    const clients = documentSerializer(clientData ? clientData.myDocuments : [])
    if (
      (pathOr('', [0, 'isOrgAdmin'], clients) as string) !==
      isOrgAdmin.toString()
    ) {
      return updateClientDocument({
        variables: {
          acronym: CLIENT_ACRONYM,
          document: {
            fields: [
              { key: 'id', value: clientId },
              { key: 'isOrgAdmin', value: isOrgAdmin.toString() },
            ],
          },
        },
        update: (cache: any, { data }: any) =>
          updateCacheClient(
            cache,
            data,
            email,
            budgetAmount,
            organizationId,
            isOrgAdmin.toString()
          ),
      })
    } else {
      return Promise.resolve() as any
    }
  }

  const onSaveEdit = () => {
    updateClient()
      .then(() => {
        return updateUserDocument({
          variables: {
            acronym: ORG_ASSIGNMENT,
            document: {
              fields: [
                { key: 'id', value: assignmentId },
                { key: 'budgetAmount', value: budgetAmount },
                { key: 'roleId', value: roleId },
              ],
            },
            schema: ORG_ASSIGNMENT_SCHEMA,
          },
        })
      })
      .then(() => {
        onSave()
      })
      .then(() => {
        window.location.reload()
      })
      .catch((e: Error) => {
        const message = getErrorMessage(e)
        showToast({
          message: `${intl.formatMessage({
            id: 'store/my-users.toast.user.edit.error',
          })} "${message}"`,
          duration: 5000,
          horizontalPosition: 'right',
        })
      })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={intl.formatMessage({ id: 'store/my-users.edit-user.title' })}
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
      {loading ? (
        <Spinner />
      ) : (
        <div>
          <div className="mb5 mt5">
            {intl.formatMessage({ id: 'store/my-users.label.email' })} : {email}
          </div>
          <div className="mb5">
            <CurrencyInput
              type="text"
              label={intl.formatMessage({ id: 'store/my-users.budget-amount' })}
              onChange={(e: { target: { value: string } }) => {
                setBudgetAmount(e.target.value)
              }}
              defaultValue={budgetAmount}
              value={budgetAmount}
            />
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
          {isCurrentUserAdmin && (
            <div className="mb5">
              <Checkbox
                checked={isOrgAdmin}
                name="disabled-checkbox-group"
                label="Organization Admin"
                onChange={(e: { target: { checked: boolean } }) => {
                  setIsOrgAdmin(e.target.checked)
                }}
                id="option-0"
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default injectIntl(UserEditModal)
