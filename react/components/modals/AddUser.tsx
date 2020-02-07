import React, { SyntheticEvent, useReducer } from 'react'
import { isEmpty, path, pathOr, find, propEq, last, contains } from 'ramda'
import { injectIntl, InjectedIntlProps } from 'react-intl'
import { Modal, Button, Dropdown, Input } from 'vtex.styleguide'
import { useMutation, useApolloClient } from 'react-apollo'

import CREATE_DOCUMENT from '../../graphql/createDocument.graphql'
import UPDATE_DOCUMENT from '../../graphql/updateDocument.graphql'
import GET_DOCUMENT from '../../graphql/documents.graphql'

import { updateCacheAddUser } from '../../utils/cacheUtils'
import {
  PERSONA_ACRONYM,
  PERSONA_SCHEMA,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_SCHEMA,
  ASSIGNMENT_STATUS_PENDING
} from '../../utils/const'

interface Props {
  isOpen: boolean
  onClose: Function
  onSuccess: Function
  existingUsers: string[]
  roles: Role[]
  organizationId: string
  showToast: Function
}

interface State {
  email: string
  roleId: string
  personaId: string
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
  | Action<'CHANGE_PERSONA_ID', { args: { personaId: string } }>
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
  showToast
}: Props & InjectedIntlProps) => {
  const client = useApolloClient()
  const [createDocument] = useMutation(CREATE_DOCUMENT)
  const [updateDocument] = useMutation(UPDATE_DOCUMENT)
  const [createAssignmentDocument] = useMutation(CREATE_DOCUMENT, {
    update: (cache: any, { data }: any) =>
      updateCacheAddUser(
        cache,
        data,
        roles,
        organizationId,
        state.personaId,
        state.email,
        state.roleId
      ),
  })

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
      const message = path(
        [
          'graphQLErrors',
          0,
          'extensions',
          'exception',
          'response',
          'data',
          'Message',
        ],
        e
      ) as string
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

  const getPersonaFields = (persona?: string) => {
    const fields = [{ key: 'email', value: state.email }]
    if (persona) {
      fields.push({ key: 'id', value: persona })
    } else {
      fields.push({
        key: 'businessOrganizationId',
        value: '',
      })
    }
    return fields
  }

  const getAssignmentFields = (persona: string) => {
    const fields = [
      {
        key: 'businessOrganizationId',
        value: organizationId,
      },
      {
        key: 'personaId',
        value: persona,
      },
      {
        key: 'roleId',
        value: state.roleId,
      },
      {
        key: 'status',
        value: ASSIGNMENT_STATUS_PENDING,
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
            acronym: PERSONA_ACRONYM,
            schema: PERSONA_SCHEMA,
            fields: ['id', 'email', 'businessOrganizationId'],
            where: `email=${state.email}`,
          },
        })
        .then(({ data: personaData }: any) => {
          const personaFields =
            personaData && personaData.myDocuments
              ? pathOr([], ['fields'], last(personaData.myDocuments))
              : []
          const personaId =
            personaFields.length > 0
              ? pathOr('', ['value'], find(propEq('key', 'id'), personaFields))
              : ''
          return Promise.resolve({ personaId })
        })
        .then((data: { personaId: string }) => {
          const savePersona =
            data && data.personaId ? updateDocument : createDocument
          return savePersona({
            variables: {
              acronym: PERSONA_ACRONYM,
              document: {
                fields: getPersonaFields(data.personaId),
              },
              schema: PERSONA_SCHEMA,
            },
          })
        })
        .then((response: any) => {
          const persona = pathOr(
            pathOr('', ['data', 'updateMyDocument', 'cacheId'], response),
            ['data', 'createMyDocument', 'cacheId'],
            response
          )

          dispatch({
            type: 'CHANGE_PERSONA_ID',
            args: { personaId: persona },
          })

          return createAssignmentDocument({
            variables: {
              acronym: ORG_ASSIGNMENT,
              document: {
                fields: getAssignmentFields(persona),
              },
              schema: ORG_ASSIGNMENT_SCHEMA,
            },
          })
        }).catch(handleGraphqlError())
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
            type: 'CHANGE_ROLE',
            args: { roleId: '' },
          })
          dispatch({
            type: 'CHANGE_PERSONA_ID',
            args: { personaId: '' },
          })

          onSuccess()
        })
        .catch((message: string) => {
          showToast({
            message: `Can't create user because "${message}"`,
            duration: 5000,
            horizontalPosition: 'right',
          })
        })
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={() => onClose()}>
      <form onSubmit={(e: SyntheticEvent) => handleSubmit(e)}>
        <div className="mb5 flex">
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
        <div className="mb5">
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
        <div className="mb5">
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
