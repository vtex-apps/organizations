import React, { SyntheticEvent, useReducer, useState } from 'react'
import { isEmpty, path, pathOr, find, propEq, last } from 'ramda'
import classNames from 'classnames'
import {
  Button,
  Dropdown,
  Input,
  ButtonWithIcon,
  IconCheck,
} from 'vtex.styleguide'
import { useMutation, useLazyQuery } from 'react-apollo'
import CREATE_DOCUMENT from '../graphql/createDocument.graphql'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'
import { injectIntl, InjectedIntlProps } from 'react-intl'
import documentQuery from '../graphql/documents.graphql'

interface Props {
  roles: Role[]
  organizationId: string
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

const AddUser = ({
  intl,
  roles,
  organizationId,
}: Props & InjectedIntlProps) => {
  // const [addUser, { error: userError, data: userData }] = useMutation(ADD_USER)
  const [createDocument] = useMutation(CREATE_DOCUMENT)
  const [updateDocument] = useMutation(UPDATE_DOCUMENT)
  const [isEmailChecked, setIsEmailChecked] = useState(false)
  // const [createOrgAssignment] = useMutation(CREATE_DOCUMENT, {
  //   refetchQueries: [
  //     {
  //       query: documentQuery,
  //       variables: {
  //         acronym: 'OrgAssignment',
  //         fields: [
  //           'id',
  //           'personaId_linked',
  //           'businessOrganizationId_linked',
  //           'status',
  //           'roleId_linked',
  //         ],
  //         where: `businessOrganizationId=${organizationId}`,
  //         schema: 'organization-assignment-schema-v1',
  //       },
  //     },
  //   ],
  // })
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
        setIsEmailChecked(false)
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
  const [loadUser, { loading: loadingUser, data: userData }] = useLazyQuery(
    documentQuery,
    {
      variables: {
        acronym: 'Persona',
        schema: 'persona-schema-v1',
        fields: ['id', 'email'],
        where: `email=${state.email}`,
      },
    }
  )

  const emailFields = userData
    ? pathOr([], ['fields'], last(userData.documents))
    : []

  const email =
    emailFields.length > 0
      ? pathOr('', ['value'], find(propEq('key', 'email'), emailFields))
      : ''
  const personaId =
    emailFields.length > 0
      ? pathOr('', ['value'], find(propEq('key', 'id'), emailFields))
      : ''

  const handleGraphqlError = () => {
    return (e: Error) => {
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
    }
  }

  const getPersonaFields = () => {
    const fields = [
      { key: 'email', value: state.email },
      {
        key: 'businessOrganizationId',
        value: '',
      },
    ]
    if (personaId) {
      fields.push({ key: 'id', value: personaId })
    }
    return fields
  }

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()

    if (state.email && state.roleId) {
      const savePersona =
        personaId !== '' && email !== '' && email === state.email
          ? updateDocument
          : createDocument

      savePersona({
        variables: {
          acronym: 'Persona',
          document: {
            fields: getPersonaFields(),
          },
          schema: 'persona-schema-v1',
        },
      })
        .catch(handleGraphqlError())
        .then((response: any) => {
          return createDocument({
            variables: {
              acronym: 'OrgAssignment',
              document: {
                fields: [
                  {
                    key: 'businessOrganizationId',
                    value: organizationId,
                  },
                  {
                    key: 'personaId',
                    value: pathOr(
                      pathOr('', ['data', 'updateDocument', 'cacheId'], response),
                      ['data', 'createDocument', 'cacheId'],
                      response
                    )
                  },
                  {
                    key: 'roleId',
                    value: state.roleId,
                  },
                  {
                    key: 'status',
                    value: 'PENDING',
                  },
                ],
              },
              schema: 'organization-assignment-schema-v1',
            },
          }).catch(handleGraphqlError())
        })
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
        <div className="mt6">
          <ButtonWithIcon
            icon={<IconCheck />}
            isLoading={loadingUser}
            variation="secondary"
            disabled={!state.touched.email ||
              (state.touched.email && !isEmpty(state.formErrors.email))}
            onClick={() => {loadUser(); setIsEmailChecked(true)}}>
            Check
          </ButtonWithIcon>
        </div>
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
          disabled={!isEmailChecked}
        />
      </div>
      <div className="mb5">
        <Button
          variation="primary"
          type="submit"
          disabled={
            !state.touched.email || !state.touched.roleId ||
            (state.touched.email && !isEmpty(state.formErrors.email)) ||
            (state.touched.roleId && !isEmpty(state.formErrors.roleId)) || 
            !isEmailChecked
          }>
          {intl.formatMessage({ id: 'store/my-users.add-user' })}
        </Button>
      </div>
    </form>
  )
}

export default injectIntl(AddUser)
