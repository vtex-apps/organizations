import React, { SyntheticEvent, useReducer } from 'react'
import { isEmpty, path, contains, pathOr } from 'ramda'
import { injectIntl } from 'react-intl'
import { Modal, Button, Dropdown, Input, Checkbox } from 'vtex.styleguide'
import CurrencyInput from '../../components/CurrencyInput'
import { useMutation, useApolloClient } from 'react-apollo'

import CREATE_DOCUMENT from '../../graphql/createDocument.graphql'
import UPDATE_DOCUMENT from '../../graphql/updateDocument.graphql'
import GET_DOCUMENT from '../../graphql/documents.graphql'

import { documentSerializer } from '../../utils/documentSerializer'
import { updateCacheAddUser, updateCacheClient } from '../../utils/cacheUtils'
import { getErrorMessage } from '../../utils/graphqlErrorHandler'
import {
  CLIENT_ACRONYM,
  CLIENT_FIELDS,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_SCHEMA,
  ORG_ASSIGNMENT_STATUS_APPROVED,
} from '../../utils/const'

interface Props {
  isOpen: boolean
  onClose: Function
  onSuccess: Function
  existingUsers: string[]
  roles: Role[]
  organizationId: string
  showToast: (message: any) => void
  isCurrentUserAdmin: boolean
  intl: any
}

interface State {
  email: string
  roleId: string
  budgetAmount: string
  personaId: string
  isOrgAdmin: boolean
  formErrors: Errors
  touched: {
    email: boolean
    roleId: boolean
  }
  messages: {
    type: string
    value: string
  }[]
}

interface Errors {
  email: string[]
  roleId: string[]
}

type Action<K, V = void> = V extends void ? { type: K } : { type: K } & V

type Actions =
  | Action<'CHANGE_ROLE', { args: { roleId: string } }>
  | Action<'CHANGE_EMAIL', { args: { email: string } }>
  | Action<'CHANGE_BUDGET_AMOUNT', { args: { budgetAmount: string } }>
  | Action<'CHANGE_PERSONA_ID', { args: { personaId: string } }>
  | Action<'CHANGE_IS_ORG_ADMIN', { args: { isOrgAdmin: boolean } }>
  | Action<
      'RESPONSE',
      {
        args: {
          type: string
          message: string
        }
      }
    >
  | Action<'INPUT_TOUCHED', { args: { input: string } }>

const AddUser = ({
  isOpen,
  onClose,
  onSuccess,
  intl,
  roles,
  organizationId,
  existingUsers,
  showToast,
  isCurrentUserAdmin,
}: Props) => {
  const client = useApolloClient()
  const [createDocument] = useMutation(CREATE_DOCUMENT)
  const [updateDocument] = useMutation(UPDATE_DOCUMENT)

  const reducer = (state: State, action: Actions): State => {
    let errors: string[] = []
    switch (action.type) {
      case 'CHANGE_ROLE':
        if (isEmpty(action.args.roleId)) {
          errors = [
            intl.formatMessage({ id: 'store/my-users.errors.role-id.empty' }),
          ]
        }
        return {
          ...state,
          roleId: action.args.roleId,
          formErrors: { roleId: errors, email: state.formErrors.email },
        }
      case 'CHANGE_EMAIL': {
        if (isEmpty(action.args.email)) {
          errors = [
            intl.formatMessage({ id: 'store/my-users.errors.email.empty' }),
          ]
        } else if (
          !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(action.args.email)
        ) {
          errors = [
            intl.formatMessage({ id: 'store/my-users.errors.email.invalid' }),
          ]
        } else if (contains(action.args.email, existingUsers)) {
          errors = [
            intl.formatMessage({ id: 'store/my-users.errors.email.exists' }),
          ]
        }

        return {
          ...state,
          email: action.args.email,
          formErrors: { roleId: state.formErrors.roleId, email: errors },
        }
      }
      case 'CHANGE_BUDGET_AMOUNT': {
        return {
          ...state,
          budgetAmount: action.args.budgetAmount,
        }
      }
      case 'CHANGE_IS_ORG_ADMIN':
        return {
          ...state,
          ...{ isOrgAdmin: action.args.isOrgAdmin },
        }
      case 'RESPONSE': {
        return {
          ...state,
          messages: [
            {
              type: action.args.type,
              value: action.args.message,
            },
          ],
        }
      }
      case 'INPUT_TOUCHED': {
        if (action.args.input == 'email') {
          return {
            ...state,
            touched: {
              email: true,
              roleId: state.touched.roleId,
            },
          }
        } else if (action.args.input == 'roleId') {
          return {
            ...state,
            touched: {
              roleId: true,
              email: state.touched.email,
            },
          }
        }
        return state
      }
      case 'CHANGE_PERSONA_ID':
        return {
          ...state,
          personaId: action.args.personaId,
        }
      default:
        throw new Error(`Unhandled action type on my-users`)
    }
  }
  const initialState = {
    roleId: '',
    email: '',
    budgetAmount: '',
    isOrgAdmin: false,
    personaId: '',
    formErrors: {
      email: [],
      roleId: [],
    },
    messages: [],
    touched: {
      email: false,
      roleId: false,
    },
  }
  const [state, dispatch] = useReducer(reducer, initialState)

  const handleGraphqlError = () => {
    return (e: Error) => {
      const message = getErrorMessage(e)
      dispatch({
        type: 'RESPONSE',
        args: {
          type: 'ERROR',
          message: message,
        },
      })
      return Promise.reject(message)
    }
  }

  const getClientFields = (clientId?: string) => {
    const fields = [
      { key: 'email', value: state.email },
      { key: 'budgetAmount', value: state.budgetAmount },
      { key: 'organizationId', value: organizationId },
      { key: 'isOrgAdmin', value: state.isOrgAdmin.toString() },
      { key: 'approved', value: 'true' },
    ]
    if (clientId) {
      fields.push({ key: 'id', value: clientId })
    }
    return fields
  }

  const getAssignmentFields = () => {
    const fields = [
      {
        key: 'businessOrganizationId',
        value: organizationId,
      },
      {
        key: 'email',
        value: state.email,
      },
      {
        key: 'budgetAmount',
        value: state.budgetAmount,
      },
      {
        key: 'roleId',
        value: state.roleId,
      },
      {
        key: 'status',
        value: ORG_ASSIGNMENT_STATUS_APPROVED,
      },
    ]

    return fields
  }

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()

    if (state.email && state.roleId) {
      client
        .query({
          query: GET_DOCUMENT,
          variables: {
            acronym: CLIENT_ACRONYM,
            fields: CLIENT_FIELDS,
            where: `email=${state.email}`,
          },
          fetchPolicy: 'no-cache',
        })
        .then(({ data }: any) => {
          const clients = documentSerializer(data ? data.myDocuments : [])

          const clientIdData = pathOr('', [0, 'id'], clients)
          const organizationIdData = pathOr('', [0, 'organizationId'], clients)

          if (clients.length == 0) {
            return createDocument({
              variables: {
                acronym: CLIENT_ACRONYM,
                document: {
                  fields: getClientFields(),
                },
              },
              update: (cache: any, { data }: any) =>
                updateCacheClient(
                  cache,
                  data,
                  state.email,
                  state.budgetAmount,
                  organizationId,
                  state.isOrgAdmin.toString()
                ),
            })
          } else if (
            organizationIdData == undefined ||
            organizationIdData === '' ||
            organizationIdData === 'null'
          ) {
            return updateDocument({
              variables: {
                acronym: CLIENT_ACRONYM,
                document: {
                  fields: getClientFields(clientIdData),
                },
              },
              update: (cache: any, { data }: any) =>
                updateCacheClient(
                  cache,
                  data,
                  state.email,
                  state.budgetAmount,
                  organizationId,
                  state.isOrgAdmin.toString()
                ),
            })
          } else {
            showToast({
              message: intl.formatMessage({
                id: 'store/my-users.my-organization.user.already.assigned',
              }),
              duration: 5000,
              horizontalPosition: 'right',
            })
            return Promise.reject()
          }
        })
        .then(() => {
          return createDocument({
            variables: {
              acronym: ORG_ASSIGNMENT,
              document: {
                fields: getAssignmentFields(),
              },
              schema: ORG_ASSIGNMENT_SCHEMA,
            },
            update: (cache: any, { data }: any) =>
              updateCacheAddUser(
                cache,
                data,
                roles,
                organizationId,
                state.email,
                state.budgetAmount,
                state.roleId
              ),
          })
        })
        .catch(handleGraphqlError())
        .then(() => {
          dispatch({
            type: 'RESPONSE',
            args: {
              type: 'SUCCESS',
              message: intl.formatMessage({ id: 'store/my-users.success' }),
            },
          })
          dispatch({
            type: 'CHANGE_EMAIL',
            args: { email: '' },
          })
          dispatch({
            type: 'CHANGE_BUDGET_AMOUNT',
            args: { budgetAmount: '' },
          })
          dispatch({
            type: 'CHANGE_ROLE',
            args: { roleId: '' },
          })
          dispatch({
            type: 'CHANGE_PERSONA_ID',
            args: { personaId: '' },
          })
          dispatch({
            type: 'CHANGE_IS_ORG_ADMIN',
            args: { isOrgAdmin: false },
          })

          onSuccess()
        })
        .catch((message: string) => {
          if (message) {
            showToast({
              message: `${intl.formatMessage({
                id: 'store/my-users.toast.user.create.error',
              })} "${message}"`,
              duration: 5000,
              horizontalPosition: 'right',
            })
          }
        })
    }
  }

  return (
    <Modal
      title={intl.formatMessage({ id: 'store/my-users.add-user.title' })}
      isOpen={isOpen}
      onClose={() => onClose()}>
      <form onSubmit={(e: SyntheticEvent) => handleSubmit(e)}>
        <div className="mt3 flex">
          <Input
            type="text"
            label={intl.formatMessage({ id: 'store/my-users.email' })}
            onChange={(e: { target: { value: string } }) => {
              dispatch({
                type: 'CHANGE_EMAIL',
                args: { email: e.target.value },
              })
              dispatch({ type: 'INPUT_TOUCHED', args: { input: 'email' } })
            }}
            value={state.email}
            errorMessage={path(['formErrors', 'email', 0], state)}
          />
        </div>
        <div className="mt3 flex">
          <CurrencyInput
            type="text"
            label={intl.formatMessage({ id: 'store/my-users.budget-amount' })}
            onChange={(e: { target: { value: string } }) => {
              dispatch({
                type: 'CHANGE_BUDGET_AMOUNT',
                args: { budgetAmount: e.target.value },
              })
              dispatch({
                type: 'INPUT_TOUCHED',
                args: { input: 'budgetAmount' },
              })
            }}
            value={state.budgetAmount}
            errorMessage={path(['formErrors', 'budgetAmount', 0], state)}
          />
        </div>
        <div className="mt5">
          <Dropdown
            label={intl.formatMessage({ id: 'store/my-users.role-id' })}
            options={roles}
            onChange={(e: { target: { value: string } }) => {
              dispatch({
                type: 'CHANGE_ROLE',
                args: { roleId: e.target.value },
              })
              dispatch({ type: 'INPUT_TOUCHED', args: { input: 'roleId' } })
            }}
            value={state.roleId}
            errorMessage={path(['formErrors', 'roleId', 0], state)}
          />
        </div>
        {isCurrentUserAdmin && (
          <div className="mt5">
            <Checkbox
              checked={state.isOrgAdmin}
              name="disabled-checkbox-group"
              label="Organization Admin"
              onChange={(e: { target: { checked: boolean } }) => {
                dispatch({
                  type: 'CHANGE_IS_ORG_ADMIN',
                  args: { isOrgAdmin: e.target.checked },
                })
              }}
              id="option-0"
            />
          </div>
        )}

        <div className="mt5">
          <Button
            variation="primary"
            type="submit"
            disabled={
              !state.touched.email ||
              !state.touched.roleId ||
              (state.touched.email && !isEmpty(state.formErrors.email)) ||
              (state.touched.roleId && !isEmpty(state.formErrors.roleId))
            }>
            {intl.formatMessage({ id: 'store/my-users.add-user' })}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default injectIntl(AddUser)
