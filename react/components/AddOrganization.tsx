import React, { useState, useReducer } from 'react'
import {
  pathOr,
  isEmpty,
  filter,
  propEq,
  reject,
  find,
  last,
  path,
} from 'ramda'
import { PageBlock, Input, Button } from 'vtex.styleguide'
import { useMutation, useQuery } from 'react-apollo'
import CREATE_DOCUMENT from '../graphql/createDocument.graphql'
import GET_DOCUMENT from '../graphql/documents.graphql'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'

interface Props {
  userEmail: string
  personaId?: string
  updateOrgInfo: Function
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
  const [globalErrorMessage, setGlobalErrorMessage] = useState('')

  const [addOrganization] = useMutation(CREATE_DOCUMENT)
  const [addOrganizationAssignment] = useMutation(CREATE_DOCUMENT)
  const [addPersona] = useMutation(CREATE_DOCUMENT)
  const [updatePersona] = useMutation(UPDATE_DOCUMENT)

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
    personaId: string,
    roleId: string
  ) => {
    return [
      { key: 'personaId', value: personaId },
      { key: 'businessOrganizationId', value: organizationId },
      { key: 'roleId', value: roleId },
      { key: 'status', value: 'APPROVED' },
    ]
  }

  const getPersonaFields = (organizationId: string, personaId?: string) => {
    let array = [
      { key: 'email', value: props.userEmail },
      { key: 'businessOrganizationId', value: organizationId },
    ]
    if(personaId !== undefined){
      array.push({ key: 'id', value: personaId })
    }
    return array
  }

  const handleGlobalError = () => {
    return (e: Error) => {
      setGlobalErrorMessage(path(
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
      ) as string)
      return Promise.reject()
    }
  }

  // const getMessage = (error: Error) => {
  //   return path(
  //     [
  //       'graphQLErrors',
  //       0,
  //       'extensions',
  //       'exception',
  //       'response',
  //       'data',
  //       'Message',
  //     ],
  //     error
  //   ) as string
  // }

  // const createOrg = () => {
  //   return addOrganization({
  //     variables: {
  //       acronym: 'BusinessOrganization',
  //       document: { fields: getOrganizationFields() },
  //       schema: 'business-organization-schema-v1',
  //     },
  //   }).then((organizationResponse: any) => {
  //     const organizationId = pathOr(
  //       '',
  //       ['data', 'createDocument', 'cacheId'],
  //       organizationResponse
  //     )
  //     return Promise.resolve({ organizationId: organizationId })
  //   })
  //     .catch((e: Error) => {
  //       const error = getMessage(e)
  //       if(error === 'The document already exist with id or alternate key.'){
  //         useQuery(GET_DOCUMENT, {
  //           variables: {
  //             acronym: 'BusinessOrganization',
  //             schema: 'business-organization-schema-v1',
  //             fields: [
  //               'id'
  //             ], where: `name=${name}`
  //           },
  //         }).then((data: any) => {

  //         })
  //       }
  //       return Promise.reject()
  //     })
  // }

  const createOrganization = async (roleId: string) => {
    let orgId = ''
    let pid = props.personaId? props.personaId: ''

    addOrganization({
      variables: {
        acronym: 'BusinessOrganization',
        document: { fields: getOrganizationFields() },
        schema: 'business-organization-schema-v1',
      },
    })
      .catch(handleGlobalError())
      .then((organizationResponse: any) => {
        orgId = pathOr(
          '',
          ['data', 'createDocument', 'cacheId'],
          organizationResponse
        )
        const save = props.personaId !== undefined? updatePersona: addPersona

        return save({
          variables: {
            acronym: 'Persona',
            document: { fields: getPersonaFields(orgId, props.personaId) },
            schema: 'persona-schema-v1',
          },
        }).catch(handleGlobalError())
      })
      .then((personaResponse: any) => {
        pid = pathOr(
          pathOr('', ['data', 'updateDocument', 'cacheId'], personaResponse),
          ['data', 'createDocument', 'cacheId'],
          personaResponse
        )
        addOrganizationAssignment({
          variables: {
            acronym: 'OrgAssignment',
            document: {
              fields: getOrganizationAssignmentFields(
                orgId,
                pid,
                roleId
              ),
            },
            schema: 'organization-assignment-schema-v1',
          },
        })
      })
      .then(() => {
        setName('')
        setTelephone('')
        setAddress('')
        setEmail('')
        props.updateOrgInfo(pid ,orgId)
      })

    // const organizationResponse = await

    // const organizationId = pathOr(
    //   '',
    //   ['data', 'createDocument', 'cacheId'],
    //   organizationResponse
    // )

    // if (!organizationId || organizationId === '') {
    //   return
    // }

    // const personaResponse = await addPersona({
    //   variables: {
    //     acronym: 'Persona',
    //     document: { fields: getPersonaFields(clientId, organizationId) },
    //     schema: 'persona-schema-v1',
    //   },
    // })

    // const personaId = pathOr(
    //   '',
    //   ['data', 'createDocument', 'cacheId'],
    //   personaResponse
    // )

    // // if (!personaId || personaId === '') {
    // //   return
    // // }

    // await addOrganizationAssignment({
    //   variables: {
    //     acronym: 'OrgAssignment',
    //     document: {
    //       fields: getOrganizationAssignmentFields(
    //         organizationId,
    //         personaId,
    //         roleId
    //       ),
    //     },
    //     schema: 'organization-assignment-schema-v1',
    //   },
    // })
  }

  // const { data: clientData } = useQuery(GET_DOCUMENT, {
  //   variables: {
  //     acronym: 'CL',
  //     fields: ['id'],
  //     where: `(email=${props.userEmail})`,
  //   },
  // })

  const { data: roleData } = useQuery(GET_DOCUMENT, {
    variables: {
      acronym: 'BusinessRole',
      fields: ['id', 'name', 'label'],
      where: '(name=*manager*)', 
      schema: 'business-role-schema-v1',
    },
  })

  const roleFields = roleData
    ? pathOr([], ['fields'], last(roleData.documents))
    : []
  // const clientFields = clientData
  //   ? pathOr([], ['fields'], last(clientData.documents))
  //   : []

  const roleId =
    roleFields.length > 0
      ? pathOr('', ['value'], find(propEq('key', 'id'), roleFields))
      : ''
  // const clientId =
  //   clientFields.length > 0
  //     ? pathOr('', ['value'], find(propEq('key', 'id'), clientFields))
  //     : ''

  return (
    <PageBlock>
      <div className="mb5">
        <div>
          <span className="red">{globalErrorMessage}</span>
        </div>
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
          onClick={() => createOrganization(roleId)}>
          Save
        </Button>
      </div>
    </PageBlock>
  )
}

export default AddOrganization
