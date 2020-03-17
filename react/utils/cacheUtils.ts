import GET_DOCUMENT from '../graphql/documents.graphql'
import profileQuery from '../graphql/getProfile.graphql'
import { pathOr, find, propEq, reject } from 'ramda'
import {
  CLIENT_ACRONYM,
  CLIENT_FIELDS,
  PROFILE_FIELDS,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_FIELDS,
  ORG_ASSIGNMENT_SCHEMA,
  ASSIGNMENT_STATUS_APPROVED,
} from './const'

export const updateCacheClient = (
  cache: any,
  data: any,
  email: string,
  organizationId: string,
  isOrgAdmin: string
) => {
  try {
    const response: any = cache.readQuery(clientListArgs(email))
    const id = pathOr(
      pathOr('', ['updateMyDocument', 'cacheId'], data),
      ['createMyDocument', 'cacheId'],
      data
    )
    let fields = pathOr([], ['myDocuments', 0, 'fields'], response)

    fields = reject(propEq('key', 'organizationId'), fields) as any
    fields = reject(propEq('key', 'isOrgAdmin'), fields) as any
    fields = reject(propEq('key', 'email'), fields)  as any

    const newFields = [ 
      ...fields, 
      ...[{ key: 'organizationId', value: organizationId, __typename: 'Field' }, 
      { key: 'isOrgAdmin', value: isOrgAdmin, __typename: 'Field' }, 
      { key: 'email', value: email, __typename: 'Field' }] ]
    
    response.myDocuments = [
      { id: id, fields: newFields, __typename: 'Document' },
    ]
    const writeData = {
      ...clientListArgs(email),
      data: { myDocuments: response.myDocuments },
    }
    cache.writeQuery(writeData)
  } catch (e) {
    console.log(e)
  }
}

export const updateCacheAddUser = (
  cache: any,
  data: any,
  roles: Role[],
  organizationId: string,
  email: string,
  roleId: string
) => {
  try {
    const response: any = cache.readQuery(userListArgs(organizationId))

    const org = pathOr(
      '',
      ['value'],
      find(
        propEq('key', 'businessOrganizationId_linked'),
        pathOr([], ['myDocuments', 0, 'fields'], response)
      )
    )
    const selectedRole = find(propEq('value', roleId), roles)
    const id = pathOr(
      pathOr('', ['updateMyDocument', 'cacheId'], data),
      ['createMyDocument', 'cacheId'],
      data
    )
    const assignmentFields = [
      { key: 'id', value: id, __typename: 'Field' },
      {
        key: 'businessOrganizationId',
        value: organizationId,
        __typename: 'Field',
      },
      {
        key: 'email',
        value: email,
        __typename: 'Field',
      },
      {
        key: 'roleId',
        value: roleId,
        __typename: 'Field',
      },
      {
        key: 'status',
        value: ASSIGNMENT_STATUS_APPROVED,
        __typename: 'Field',
      },
      { key: 'businessOrganizationId_linked', value: org, __typename: 'Field' },
      {
        key: 'roleId_linked',
        value: selectedRole
          ? JSON.stringify({
              name: selectedRole.name,
              label: selectedRole.label,
              id: selectedRole.value,
            })
          : '',
        __typename: 'Field',
      },
    ]

    response.myDocuments = [
      ...response.myDocuments,
      { id: id, fields: assignmentFields, __typename: 'Document' },
    ]
    const writeData = {
      ...userListArgs(organizationId),
      data: { myDocuments: response.myDocuments },
    }
    cache.writeQuery(writeData)
  } catch (e) {
    console.log(e)
  }
}

export const updateCacheEditUser = (
  cache: any,
  data: any,
  roles: Role[],
  organizationId: string,
  roleId: string
) => {
  try {
    const response: any = cache.readQuery(userListArgs(organizationId))
    const selectedRole = find(propEq('value', roleId), roles)
    const id = pathOr(
      pathOr('', ['createMyDocument', 'cacheId'], data),
      ['updateMyDocument', 'cacheId'],
      data
    )

    const fields = pathOr(
      [],
      ['fields'],
      find(propEq('id', id), pathOr([], ['myDocuments'], response))
    )
    const fieldsExceptRoleAndRoleId_linked = reject(
      propEq('key', 'roleId'),
      reject(propEq('key', 'roleId_linked'), fields)
    )

    fieldsExceptRoleAndRoleId_linked.push({
      key: 'roleId_linked',
      value: selectedRole
        ? JSON.stringify({
            name: selectedRole.name,
            label: selectedRole.label,
            id: selectedRole.value,
          })
        : '',
      __typename: 'Field',
    })
    fieldsExceptRoleAndRoleId_linked.push({
      key: 'roleId',
      value: roleId,
      __typename: 'Field',
    })

    const newData = pathOr([], ['myDocuments'], response).map((x: any) => {
      if (x.id === id) {
        x.fields = fieldsExceptRoleAndRoleId_linked
      }
      return x
    })
    const writeData = {
      ...userListArgs(organizationId),
      data: { myDocuments: newData },
    }
    cache.writeQuery(writeData)
  } catch (e) {
    console.log(e)
  }
}

export const updateCacheDeleteUser = (
  cache: any,
  data: any,
  organizationId: string
) => {
  try {
    const id = pathOr('', ['deleteMyDocument', 'cacheId'], data)
    const response: any = cache.readQuery(userListArgs(organizationId))

    const writeData = {
      ...userListArgs(organizationId),
      data: { myDocuments: reject(propEq('id', id), response.myDocuments) },
    }

    cache.writeQuery(writeData)
  } catch (e) {
    console.log(e)
  }
}

export const updateCacheProfile = (
  cache: any,
  organizationId: string
) => {
  try {
    const response: any = cache.readQuery(getProfile())

    const customFieldsExceptOrgId = reject(
      propEq('key', 'organizationId'),
      response.profile.customFields
    )

    const customFields = [
      ...customFieldsExceptOrgId,
      {
        key: 'organizationId',
        value: organizationId,
        __typename: 'ProfileCustomField',
      },
    ]

    response.profile.customFields = customFields

    const writeData = {
      ...getProfile(),
      data: { profile: response.profile },
    }

    cache.writeQuery(writeData)
  } catch (e) {
    console.log(e)
  }
}

export const updateCacheReInvite = (
  cache: any,
  data: any,
  organizationId: string) => {

  try {
    const response: any = cache.readQuery(userListArgs(organizationId))

    const id = pathOr(
      pathOr('', ['createMyDocument', 'cacheId'], data),
      ['updateMyDocument', 'cacheId'],
      data
    )

    const fields = pathOr(
      [],
      ['fields'],
      find(propEq('id', id), pathOr([], ['myDocuments'], response))
    )

    const fieldsExceptStatus = reject(propEq('key', 'status'), fields)
    const newFields = [...fieldsExceptStatus, { key: 'status', value: ASSIGNMENT_STATUS_APPROVED, __typename: 'Field' }]

    const newData = pathOr([], ['myDocuments'], response).map((x: any) => {
      if (x.id === id) {
        x.fields = newFields
      }
      return x
    })
    const writeData = {
      ...userListArgs(organizationId),
      data: newData,
    }

    cache.writeQuery(writeData)
  } catch (e) {
    console.log(e)
  }
}

const userListArgs = (orgId: string) => {
  return {
    query: GET_DOCUMENT,
    variables: {
      acronym: ORG_ASSIGNMENT,
      fields: ORG_ASSIGNMENT_FIELDS,
      where: `businessOrganizationId=${orgId}`,
      schema: ORG_ASSIGNMENT_SCHEMA,
    },
  }
}

const getProfile = () => {
  return {
    query: profileQuery,
    variables: { customFields: PROFILE_FIELDS },
  }
}

const clientListArgs = (email: string) => {
  return {
    query: GET_DOCUMENT,
    variables: {
      acronym: CLIENT_ACRONYM,
      fields: CLIENT_FIELDS,
      where: `email=${email}`,
    },
  }
}
