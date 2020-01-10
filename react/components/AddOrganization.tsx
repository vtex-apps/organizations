import React, { useState, useReducer } from 'react'
import { pathOr, isEmpty, filter, propEq, reject } from 'ramda'
import { Layout, PageHeader, PageBlock, Input, Button } from 'vtex.styleguide'
import { useMutation } from 'react-apollo'
import CREATE_DOCUMENT from '../graphql/createDocument.graphql'

interface Props {
  userId: string
  userEmail: string
  roleId: string
  organizationCreated: Function
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

const AddOrganization = (props: Props) => {
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

  const [addOrganization] = useMutation(CREATE_DOCUMENT)
  const [addOrganizationAssignment] = useMutation(CREATE_DOCUMENT)
  const [addPersona] = useMutation(CREATE_DOCUMENT)

  const getOrganizationFields = () => {
    return [
      { key: 'name', value: name },
      { key: 'telephone', value: telephone },
      { key: 'address', value: address },
      { key: 'email', value: email },
    ]
  }

  const getOrganizationAssignmentFields = (organizationId: string, personaId: string) => {
    return [
      { key: 'personaId', value: personaId },
      { key: 'businessOrganizationId', value: organizationId },
      { key: 'roleId', value: props.roleId },
      { key: 'status', value: 'ACTIVE' },
    ]
  }

  const getPersonaFields = (organizationId: string) => {
    return [
      { key: 'clientId', value: props.userId },
      { key: 'email', value: props.userEmail },
      { key: 'businessOrganizationId', value: organizationId },
    ]
  }

  const createOrganization = async () => {
    const organizationResponse = await addOrganization({
      variables: {
        acronym: 'BusinessOrganization',
        document: { fields: getOrganizationFields() },
        schema: 'business-organization-schema-v1',
      },
    })

    const organizationId = pathOr(
      '',
      ['data', 'createDocument', 'cacheId'],
      organizationResponse
    )

    // if (!organizationId || organizationId === '') {
    //   return
    // }

    const personaResponse = await addPersona({
      variables: {
        acronym: 'Persona',
        document: { fields: getPersonaFields(organizationId) },
        schema: 'persona-schema-v1',
      },
    })

    const personaId = pathOr(
      '',
      ['data', 'createDocument', 'cacheId'],
      personaResponse
    )

    // if (!personaId || personaId === '') {
    //   return
    // }

    await addOrganizationAssignment({
      variables: {
        acronym: 'OrganizationAssignment',
        document: { fields: getOrganizationAssignmentFields(organizationId, personaId) },
        schema: 'organization-assignment-schema-v1',
      },
    })

    props.organizationCreated()
  }

  return (
    <Layout
      fullWidth
      pageHeader={
        <PageHeader title="Create Organization" linkLabel="Return"></PageHeader>
      }>
      <PageBlock>
        <div className="mb5">
          <Input
            placeholder="Organization name"
            dataAttributes={{ 'hj-white-list': true }}
            label="Name"
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
            placeholder="Telephone"
            dataAttributes={{ 'hj-white-list': true }}
            label="Telephone"
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
            placeholder="Address"
            dataAttributes={{ 'hj-white-list': true }}
            label="Address"
            value={address}
            onChange={(e: any) => setAddress(e.target.value)}
          />
        </div>
        <div className="mb5">
          <Input
            placeholder="Organization email"
            dataAttributes={{ 'hj-white-list': true }}
            label="Email"
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
            onClick={() => createOrganization()}>
            Save
          </Button>
        </div>
      </PageBlock>
    </Layout>
  )
}

export default AddOrganization
