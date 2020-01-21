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

// export const updateCacheCreateOrganization = (
//   cache: any,
//   data: any,
//   orgName: string,
//   orgEmail: string
// ) => {
//   const id = pathOr('', ['createDocument', 'cacheId'], data)
//   const orgFields = [
//     { key: 'id', value: id },
//     { key: 'name', value: orgName },
//     { key: 'email', value: orgEmail },
//   ]

//   // cache.writeData({id: `_currentOrgId`, data: orgFields})

//   // cache.writeQuery(organizationArgs(orgEmail), { documents: [{
//   //   id: id,
//   //   fields: orgFields,
//   // }]})
// }

// export const updateCacheUpdatePersona = (
//   cache: any,
//   email: string,
//   orgEmail: string) => {

//   const userResponse: any = cache.readQuery(personaArgs(email))
//   const persona: any = pathOr({}, ['documents', 0], userResponse)

//   const personaFields = pathOr([], ['fields'], persona)
//   const fieldsExcept_business = reject(
//     propEq('key', 'roleId'),
//     reject(propEq('key', 'businessOrganizationId_linked'), personaFields)
//   )

//   const responseOrg: any = cache.readQuery(organizationArgs(orgEmail))
//   const org: any = pathOr({}, ['documents', 0], responseOrg)
//   const orgFields = pathOr([], ['fields'], org)

//   const newPersona =
//     persona && persona.id
//       ? {
//           id: persona.id,
//           fields: [
//             ...fieldsExcept_business,
//             {
//               key: 'businessOrganizationId_linked',
//               value: JSON.stringify(orgFields),
//             },
//           ],
//         }
//       : {}

//   cache.writeQuery(personaArgs(email), { documents: [newPersona] })
// }

export const updateCacheCreatePersona = (
  cache: any,
  data: any,
  email: string
) => {
  const id = pathOr('', ['createDocument', 'cacheId'], data)
  const persona = {
    id: id,
    fields: [{ key: 'id', value: id }, { key: 'email', value: email }],
  }
  cache.writeQuery(personaArgs(email), { documents: [persona] })
}

// export const updateCacheCreateOrganizationAssignment = (
//   cache: any,
//   data: any,
//   email: string,
//   orgEmail: string,
//   personaId?: string
// ) => {
//   // const responseOrg: any = cache.readQuery(organizationArgs(orgEmail))
//   // const org: any = pathOr({}, ['documents', 0], responseOrg)
//   // const orgFields = pathOr([], ['fields'], org)
//   // const orgId = pathOr(
//   //   '',
//   //   ['value'],
//   //   find(propEq('email', orgEmail), orgFields)
//   // )

//   // const id = pathOr('', ['createDocument', 'cacheId'], data)

//   // const roleData = cache.readQuery(rolesArgs())
//   // const roleFields = roleData
//   //   ? pathOr([], ['fields'], last(roleData.documents))
//   //   : []
//   // const roleId =
//   //   roleFields.length > 0
//   //     ? pathOr('', ['value'], find(propEq('key', 'id'), roleFields))
//   //     : ''

//   // const OrgAssignment = {
//   //   id: id,
//   //   fields: [
//   //     { key: 'id', value: id },
//   //     {
//   //       key: 'businessOrganizationId',
//   //       value: orgId,
//   //     },
//   //     {
//   //       key: 'personaId',
//   //       value: personaId,
//   //     },
//   //     {
//   //       key: 'roleId',
//   //       value: roleId,
//   //     },
//   //     {
//   //       key: 'status',
//   //       value: 'PENDING',
//   //     },
//   //     { key: 'businessOrganizationId_linked', value: orgFields },
//   //     {
//   //       key: 'roleId_linked',
//   //       value: roleFields,
//   //     },
//   //     {
//   //       key: 'personaId_linked',
//   //       value: JSON.stringify({
//   //         id: personaId,
//   //         email: email,
//   //       }),
//   //     },
//   //   ],
//   // }

//   // const orgDocuments = { documents: [OrgAssignment] }

//   // cache.writeQuery(
//   //   organizationAssignmentArgs(personaId ? personaId : '', orgId),
//   //   orgDocuments
//   // )

//   console.log(cache)
//   console.log(data)
//   console.log(email)
//   console.log(personaId)
//   console.log(orgEmail)
// }

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
  const assignment = find(propEq('id', assignmentId), response.documents)
  const assignmentFields = reject(
    propEq('key', 'status'),
    pathOr([], ['fields'], assignment)
  )

  response.documents = reject(propEq('id', assignmentId), response.documents)
  response.documents = [
    ...response.documents,
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
  response.documents = reject(propEq('id', personaId), response.documents)

  const persona = {
    id: personaId,
    fields: [
      { key: 'id', value: personaId },
      { key: 'email', value: email },
      { key: 'businessOrganizationId_linked', value: orgFields },
    ],
  }
  cache.writeQuery(personaArgs(email), { documents: [persona] })
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
  response.documents = reject(propEq('id', assignmentId), response.documents)
  cache.writeQuery(
    organizationAssignmentArgs(personaId ? personaId : '', organizationId),
    response
  )
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

const personaArgs = (email: string) => {
  return {
    query: GET_DOCUMENT,
    variables: {
      acronym: 'Persona',
      fields: ['id', 'businessOrganizationId_linked'],
      where: `(email=${email})`,
      schema: 'persona-schema-v1',
    },
  }
}

// const organizationArgs = (email: string) => {
//   return {
//     query: GET_DOCUMENT,
//     variables: {
//       acronym: 'BusinessOrganization',
//       fields: ['id', 'name', 'email'],
//       where: `(email=${email})`,
//       schema: 'business-organization-schema-v1',
//     },
//   }
// }

const organizationAssignmentArgs = (
  personaId: string,
  organizationId: string
) => {
  return {
    query: GET_DOCUMENT,
    variables: {
      acronym: 'OrgAssignment',
      schema: 'organization-assignment-schema-v1',
      fields: [
        'id',
        'personaId',
        'roleId',
        'status',
        'businessOrganizationId',
        'businessOrganizationId_linked',
      ],
      where: `(personaId=${personaId} OR businessOrganizationId=${organizationId})`,
    },
  }
}

// const rolesArgs = () => {
//   return {
//     query: GET_DOCUMENT,
//     variables: {
//       acronym: 'BusinessRole',
//       fields: ['id', 'name', 'label'],
//       where: '(name=*manager*)',
//       schema: 'business-role-schema-v1',
//     },
//   }
// }
