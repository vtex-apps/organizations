import GET_DOCUMENT from '../graphql/documents.graphql'
import { pathOr, find, propEq, reject } from 'ramda'

export const updateCacheAddUser = (
  cache: any,
  data: any,
  roles: Role[],
  organizationId: string,
  personaId: string,
  email: string,
  roleId: string
) => {
  const response: any = cache.readQuery(userListArgs(organizationId))

  const org = pathOr(
    '',
    ['value'],
    find(
      propEq('key', 'businessOrganizationId_linked'),
      pathOr([], ['documents', 0, 'fields'], response)
    )
  )
  const selectedRole = find(propEq('value', roleId), roles)
  const id = pathOr(
    pathOr('', ['updateDocument', 'cacheId'], data),
    ['createDocument', 'cacheId'],
    data
  )
  const assignmentFields = [
    { key: 'id', value: id },
    {
      key: 'businessOrganizationId',
      value: organizationId,
    },
    {
      key: 'personaId',
      value: personaId,
    },
    {
      key: 'roleId',
      value: roleId,
    },
    {
      key: 'status',
      value: 'PENDING',
    },
    { key: 'businessOrganizationId_linked', value: org },
    {
      key: 'roleId_linked',
      value: selectedRole
        ? JSON.stringify({
            name: selectedRole.name,
            label: selectedRole.label,
            id: selectedRole.value,
          })
        : '',
    },
    {
      key: 'personaId_linked',
      value: JSON.stringify({
        id: personaId,
        email: email,
      }),
    },
  ]

  response.documents = [
    ...response.documents,
    { id: id, fields: assignmentFields },
  ]

  cache.writeQuery(userListArgs(organizationId), response)
}

export const updateCacheEditUser = (
  cache: any,
  data: any,
  roles: Role[],
  organizationId: string,
  roleId: string
) => {
  const response: any = cache.readQuery(userListArgs(organizationId))
  const selectedRole = find(propEq('value', roleId), roles)
  const id = pathOr(
    pathOr('', ['createDocument', 'cacheId'], data),
    ['updateDocument', 'cacheId'],
    data
  )

  const fields = pathOr(
    [],
    ['fields'],
    find(propEq('id', id), pathOr([], ['documents'], response))
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
  })
  fieldsExceptRoleAndRoleId_linked.push({
    key: 'roleId',
    value: roleId,
  })

  const newData = pathOr([], ['documents'], response).map((x: any) => {
    if (x.id === id) {
      x.fields = fieldsExceptRoleAndRoleId_linked
    }
    return x
  })

  cache.writeQuery(userListArgs(organizationId), newData)
}

export const updateCacheDeleteUser = (
  cache: any,
  data: any,
  organizationId: string
) => {
  const id = pathOr('', ['deleteDocument', 'cacheId'], data)
  const response: any = cache.readQuery(userListArgs(organizationId))

  response.documents = reject(propEq('id', id), response.documents)

  cache.writeQuery(userListArgs(organizationId), response)
}

const userListArgs = (orgId: string) => {
  return {
    query: GET_DOCUMENT,
    variables: {
      acronym: 'OrgAssignment',
      fields: [
        'id',
        'personaId',
        'personaId_linked',
        'businessOrganizationId',
        'businessOrganizationId_linked',
        'status',
        'roleId_linked',
      ],
      where: `businessOrganizationId=${orgId}`,
      schema: 'organization-assignment-schema-v1',
    },
  }
}
