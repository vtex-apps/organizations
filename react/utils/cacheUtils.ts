import GET_DOCUMENT from '../graphql/documents.graphql'
import { pathOr, find, propEq, reject } from 'ramda'
import {
  PERSONA_ACRONYM,
  PERSONA_SCHEMA,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_FIELDS,
  ORG_ASSIGNMENT_SCHEMA,
} from './const'

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

  response.myDocuments = [
    ...response.myDocuments,
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
  })
  fieldsExceptRoleAndRoleId_linked.push({
    key: 'roleId',
    value: roleId,
  })

  const newData = pathOr([], ['myDocuments'], response).map((x: any) => {
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
  debugger
  const id = pathOr('', ['deleteMyDocument', 'cacheId'], data)
  const response: any = cache.readQuery(userListArgs(organizationId))

  response.myDocuments = reject(propEq('id', id), response.myDocuments)

  cache.writeQuery(userListArgs(organizationId), response)
}

export const updateCacheCreatePersona = (
  cache: any,
  data: any,
  email: string
) => {
  const id = pathOr('', ['createMyDocument', 'cacheId'], data)
  const persona = {
    id: id,
    fields: [{ key: 'id', value: id }, { key: 'email', value: email }],
  }
  cache.writeQuery(personaArgs(email), { myDocuments: [persona] })
}

export const updateCacheOrgAssignmentStatus = (
  cache: any,
  assignmentId: string,
  status: string,
  organizationId: string,
  personaId?: string
) => {
  const response = cache.readQuery(
    organizationAssignmentArgs(personaId ? personaId : '', organizationId)
  )
  const assignment = find(propEq('id', assignmentId), response.myDocuments)
  const assignmentFields = reject(
    propEq('key', 'status'),
    pathOr([], ['fields'], assignment)
  )

  response.myDocuments = reject(propEq('id', assignmentId), response.myDocuments)
  response.myDocuments = [
    ...response.myDocuments,
    {
      id: assignment.id,
      fields: [...assignmentFields, { kay: 'status', value: status }],
    },
  ]

  cache.writeQuery(
    organizationAssignmentArgs(personaId ? personaId : '', organizationId),
    response
  )
}

export const updateCachePersonaOrgId = (
  cache: any,
  orgFields: any,
  email: string,
  personaId: string
) => {
  const response = cache.readQuery(personaArgs(email))
  response.myDocuments = reject(propEq('id', personaId), response.myDocuments)

  const persona = {
    id: personaId,
    fields: [
      { key: 'id', value: personaId },
      { key: 'email', value: email },
      { key: 'businessOrganizationId_linked', value: orgFields },
    ],
  }
  cache.writeQuery(personaArgs(email), { myDocuments: [persona] })
}

export const updateCacheDeleteAssignment = (
  cache: any,
  assignmentId: string,
  organizationId: string,
  personaId?: string
) => {
  const response = cache.readQuery(
    organizationAssignmentArgs(personaId ? personaId : '', organizationId)
  )
  response.myDocuments = reject(propEq('id', assignmentId), response.myDocuments)
  cache.writeQuery(
    organizationAssignmentArgs(personaId ? personaId : '', organizationId),
    response
  )
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

const personaArgs = (email: string) => {
  return {
    query: GET_DOCUMENT,
    variables: {
      acronym: PERSONA_ACRONYM,
      fields: ['id', 'businessOrganizationId_linked'],
      where: `(email=${email})`,
      schema: PERSONA_SCHEMA,
    },
  }
}

const organizationAssignmentArgs = (
  personaId: string,
  organizationId: string
) => {
  return {
    query: GET_DOCUMENT,
    variables: {
      acronym: ORG_ASSIGNMENT,
      schema: ORG_ASSIGNMENT_SCHEMA,
      fields: ORG_ASSIGNMENT_FIELDS,
      where: `(personaId=${personaId} OR businessOrganizationId=${organizationId})`,
    },
  }
}
