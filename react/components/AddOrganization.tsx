import React, { useState, useReducer } from 'react'
import { pathOr, isEmpty, filter, propEq, reject, find, last } from 'ramda'
import { PageBlock, Input, Button } from 'vtex.styleguide'
import { useMutation, useQuery } from 'react-apollo'
import { injectIntl } from 'react-intl'

import CREATE_DOCUMENT from '../graphql/createDocument.graphql'
import GET_DOCUMENT from '../graphql/documents.graphql'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'

import {
  BUSINESS_ROLE,
  BUSINESS_ROLE_FIELDS,
  BUSINESS_ROLE_SCHEMA,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_SCHEMA,
  BUSINESS_ORGANIZATION,
  BUSINESS_ORGANIZATION_SCHEMA,
  CLIENT_ACRONYM,
  ORG_ASSIGNMENT_STATUS_APPROVED,
} from '../utils/const'
import { handleGlobalError } from '../utils/graphqlErrorHandler'
import { updateCacheProfile } from '../utils/cacheUtils'

interface Props {
  userEmail: string
  clientId: string
  updateOrgInfo: () => void
  showToast: (message: any) => void
  intl: any
}

interface ErrorMessage {
  name: string
  isError: boolean
  message: string
}

interface ErrorState {
  errorMessages: ErrorMessage[]
}

type Action<K, V = void> = V extends void ? { type: K } : { type: K } & V

type Actions =
  | Action<'NAME_ERROR', { args: { name: string } }>
  | Action<'TELEPHONE_ERROR', { args: { telephone: string } }>
  | Action<'EMAIL_ERROR', { args: { email: string } }>

const AddOrganization = ({
  userEmail,
  clientId,
  intl,
  updateOrgInfo,
  showToast,
}: Props) => {
  const initialState = {
    errorMessages: [] as ErrorMessage[],
  }

  const reducer = (state: ErrorState, action: Actions): ErrorState => {
    switch (action.type) {
      case 'NAME_ERROR': {
        const isErrorN = isEmpty(action.args.name)
        const messageN = isErrorN ? 'Name is required' : ''
        const _errorN: ErrorMessage = {
          ...pathOr(
            [],
            [0],
            filter(propEq('name', 'NAME_ERROR'), state.errorMessages)
          ),
          ...{ name: 'NAME_ERROR', isError: isErrorN, message: messageN },
        }
        return {
          ...state,
          ...{
            errorMessages: [
              ...reject(propEq('name', 'NAME_ERROR'), state.errorMessages),
              ...[_errorN],
            ],
          },
        }
      }
      case 'TELEPHONE_ERROR': {
        const isErrorT = isEmpty(action.args.telephone)
        const messageT = isErrorT ? 'Telephone is required' : ''
        const _errorT: ErrorMessage = {
          ...pathOr(
            [],
            [0],
            filter(propEq('name', 'TELEPHONE_ERROR'), state.errorMessages)
          ),
          ...{ name: 'TELEPHONE_ERROR', isError: isErrorT, message: messageT },
        }
        return {
          ...state,
          ...{
            errorMessages: [
              ...reject(propEq('name', 'TELEPHONE_ERROR'), state.errorMessages),
              ...[_errorT],
            ],
          },
        }
      }
      case 'EMAIL_ERROR': {
        let isErrorE = false
        let messageE = ''
        if (
          !isEmpty(action.args.email) &&
          !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(action.args.email)
        ) {
          isErrorE = true
        }

        messageE = isErrorE ? 'Email is incorrect' : ''
        const _errorE: ErrorMessage = {
          ...pathOr(
            [],
            [0],
            filter(propEq('name', 'EMAIL_ERROR'), state.errorMessages)
          ),
          ...{ name: 'EMAIL_ERROR', isError: isErrorE, message: messageE },
        }
        return {
          ...state,
          ...{
            errorMessages: [
              ...reject(propEq('name', 'EMAIL_ERROR'), state.errorMessages),
              ...[_errorE],
            ],
          },
        }
      }
      default:
        return state
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState)

  const [name, setName] = useState('')
  const [telephone, setTelephone] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')

  const [createDocument] = useMutation(CREATE_DOCUMENT)
  const [updateDocument] = useMutation(UPDATE_DOCUMENT)

  const getOrganizationFields = () => {
    return [
      { key: 'name', value: name },
      { key: 'telephone', value: telephone },
      { key: 'address', value: address },
      { key: 'email', value: email },
    ]
  }

  const getOrganizationAssignmentFields = (
    organizationId: string,
    roleId: string
  ) => {
    return [
      { key: 'email', value: userEmail },
      { key: 'businessOrganizationId', value: organizationId },
      { key: 'roleId', value: roleId },
      { key: 'status', value: ORG_ASSIGNMENT_STATUS_APPROVED },
    ]
  }

  const createOrganization = async (roleId: string) => {
    let orgId = ''
    createDocument({
      variables: {
        acronym: BUSINESS_ORGANIZATION,
        document: { fields: getOrganizationFields() },
        schema: BUSINESS_ORGANIZATION_SCHEMA,
      },
    })
      .then((organizationResponse: any) => {
        orgId = pathOr(
          '',
          ['data', 'createMyDocument', 'cacheId'],
          organizationResponse
        )

        return createDocument({
          variables: {
            acronym: ORG_ASSIGNMENT,
            document: {
              fields: getOrganizationAssignmentFields(orgId, roleId),
            },
            schema: ORG_ASSIGNMENT_SCHEMA,
          },
        })
      })
      .then(() => {
        return updateDocument({
          variables: {
            acronym: CLIENT_ACRONYM,
            document: {
              fields: [
                { key: 'id', value: clientId },
                { key: 'organizationId', value: orgId },
              ],
            },
          },
          update: (cache: any) => updateCacheProfile(cache, orgId),
        })
      })

      .catch(handleGlobalError())
      .then(() => {
        setName('')
        setTelephone('')
        setAddress('')
        setEmail('')
        updateOrgInfo()
      })
      .catch((message: string) => {
        showToast({
          message: `${intl.formatMessage({
            id: 'store/my-organization.toast.organization.create.error',
          })} "${message}"`,
          duration: 5000,
          horizontalPosition: 'right',
        })
      })
  }

  const { data: roleData } = useQuery(GET_DOCUMENT, {
    variables: {
      acronym: BUSINESS_ROLE,
      fields: BUSINESS_ROLE_FIELDS,
      where: '(name=*manager*)',
      schema: BUSINESS_ROLE_SCHEMA,
    },
  })

  const roleFields = roleData
    ? pathOr([], ['fields'], last(roleData.myDocuments))
    : []

  const roleId =
    roleFields && roleFields.length > 0
      ? pathOr('', ['value'], find(propEq('key', 'id'), roleFields))
      : ''

  return (
    <PageBlock>
      <div className="mb5">
        <Input
          placeholder={intl.formatMessage({
            id: 'store/my-organization.input.placeholder.organizationName',
          })}
          label={intl.formatMessage({
            id: 'store/my-organization.input.label.organizationName',
          })}
          value={name}
          error={pathOr(
            false,
            [0, 'isError'],
            filter(propEq('name', 'NAME_ERROR'), state.errorMessages)
          )}
          errorMessage={pathOr(
            '',
            [0, 'message'],
            filter(propEq('name', 'NAME_ERROR'), state.errorMessages)
          )}
          onChange={(e: any) => {
            setName(e.target.value)
            dispatch({ type: 'NAME_ERROR', args: { name: e.target.value } })
          }}
        />
      </div>
      <div className="mb5">
        <Input
          placeholder={intl.formatMessage({
            id: 'store/my-organization.input.placeholder.telephone',
          })}
          label={intl.formatMessage({
            id: 'store/my-organization.input.label.telephone',
          })}
          value={telephone}
          error={pathOr(
            false,
            [0, 'isError'],
            filter(propEq('name', 'TELEPHONE_ERROR'), state.errorMessages)
          )}
          errorMessage={pathOr(
            '',
            [0, 'message'],
            filter(propEq('name', 'TELEPHONE_ERROR'), state.errorMessages)
          )}
          onChange={(e: any) => {
            setTelephone(e.target.value)
            dispatch({
              type: 'TELEPHONE_ERROR',
              args: { telephone: e.target.value },
            })
          }}
        />
      </div>
      <div className="mb5">
        <Input
          placeholder={intl.formatMessage({
            id: 'store/my-organization.input.placeholder.address',
          })}
          label={intl.formatMessage({
            id: 'store/my-organization.input.label.address',
          })}
          value={address}
          onChange={(e: any) => setAddress(e.target.value)}
        />
      </div>
      <div className="mb5">
        <Input
          placeholder={intl.formatMessage({
            id: 'store/my-organization.input.placeholder.email',
          })}
          label={intl.formatMessage({
            id: 'store/my-organization.input.label.email',
          })}
          value={email}
          error={pathOr(
            false,
            [0, 'isError'],
            filter(propEq('name', 'EMAIL_ERROR'), state.errorMessages)
          )}
          errorMessage={pathOr(
            '',
            [0, 'message'],
            filter(propEq('name', 'EMAIL_ERROR'), state.errorMessages)
          )}
          onChange={(e: any) => {
            setEmail(e.target.value)
            dispatch({ type: 'EMAIL_ERROR', args: { email: e.target.value } })
          }}
        />
      </div>

      <div className="mb5">
        <Button
          variation="primary"
          disabled={
            name === '' ||
            telephone === '' ||
            (email !== '' &&
              pathOr(
                true,
                [0, 'isError'],
                filter(propEq('name', 'EMAIL_ERROR'), state.errorMessages)
              ))
          }
          onClick={() => createOrganization(roleId)}>
          {intl.formatMessage({ id: 'store/my-organization.button.save' })}
        </Button>
      </div>
    </PageBlock>
  )
}

export default injectIntl(AddOrganization)
