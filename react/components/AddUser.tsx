import React, { SyntheticEvent, useReducer } from 'react'
import { isEmpty, path } from 'ramda'
import classNames from 'classnames'
import { Button, Dropdown, Input } from 'vtex.styleguide'
import { useMutation } from 'react-apollo'
import ADD_USER from '../graphql/addUser.graphql'
import { injectIntl, InjectedIntlProps } from 'react-intl'

interface Props {
  roles: Role[]
}

interface State {
  email: string
  roleId: string
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

const AddUser = ({ intl, roles }: Props & InjectedIntlProps) => {
  // const [addUser, { error: userError, data: userData }] = useMutation(ADD_USER)
  const [addUser] = useMutation(ADD_USER)
  const reducer = (state: State, action: Actions): State => {
    let errors: string[] = []
    switch (action.type) {
      case 'CHANGE_ROLE':
        if (isEmpty(action.args.roleId)) {
          errors = [
            ...state.formErrors.roleId,
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
            ...state.formErrors.email,
            intl.formatMessage({ id: 'store/my-users.errors.email.empty' }),
          ]
        }
        if (
          !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(action.args.email)
        ) {
          errors = [
            ...state.formErrors.email,
            intl.formatMessage({ id: 'store/my-users.errors.email.invalid' }),
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
      default:
        throw new Error(`Unhandled action type on my-users`)
    }
  }
  const initialState = {
    roleId: '',
    email: '',
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
  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    if (state.email && state.roleId) {
      addUser({
        variables: {
          acronym: 'CL',
          document: {
            fields: [
              { key: 'email', value: state.email },
              { key: 'roleId', value: state.roleId },
            ],
          },
        },
      })
        .then(() => {
          dispatch({
            type: 'RESPONSE',
            args: {
              type: 'SUCCESS',
              message: intl.formatMessage({ id: 'store/my-users.success' }),
            },
          })
        })
        .catch(e => {
          dispatch({
            type: 'RESPONSE',
            args: {
              type: 'ERROR',
              message: path(
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
              ) as string,
            },
          })
        })
    }
  }
  return (
    <form onSubmit={(e: SyntheticEvent) => handleSubmit(e)}>
      {!isEmpty(state.messages) && (
        <div className="mb5">
          {state.messages.map(
            (message: { value: string; type: string }, index: number) => (
              <p
                key={`message-${index}`}
                className={classNames(
                  { 'c-danger hover-c-danger': message.type == 'ERROR' },
                  { 'c-success hover-c-success': message.type == 'SUCCESS' }
                )}>
                {message.value}
              </p>
            )
          )}
        </div>
      )}
      <div className="mb5">
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
            (!state.touched.email && !state.touched.roleId) ||
            (state.touched.email && !isEmpty(state.formErrors.email)) ||
            (state.touched.roleId && !isEmpty(state.formErrors.roleId))
          }>
          {intl.formatMessage({ id: 'store/my-users.add-user' })}
        </Button>
      </div>
    </form>
  )
}

export default injectIntl(AddUser)
