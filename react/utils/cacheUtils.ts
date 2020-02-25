import GET_DOCUMENT from '../graphql/documents.graphql'
import { pathOr, find, propEq, reject } from 'ramda'
import {
  // PERSONA_ACRONYM,
  // PERSONA_SCHEMA,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_FIELDS,
  ORG_ASSIGNMENT_SCHEMA,
  ASSIGNMENT_STATUS_PENDING,
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

  try{
  console.log(cache)
  console.log(data)
  console.log(roles)
  console.log(organizationId)
  console.log(personaId)
  console.log(email)
  console.log(roleId)
  }catch (e){
    console.log(e)
  }

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
        key: 'personaId',
        value: personaId,
        __typename: 'Field',
      },
      {
        key: 'roleId',
        value: roleId,
        __typename: 'Field',
      },
      {
        key: 'status',
        value: ASSIGNMENT_STATUS_PENDING,
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
      {
        key: 'personaId_linked',
        value: JSON.stringify({
          id: personaId,
          email: email,
        }),
        __typename: 'Field',
      },
    ]

    response.myDocuments = [
      ...response.myDocuments,
      { id: id, fields: assignmentFields, __typename: 'Document', },
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

  try{
    console.log(cache)
    console.log(data)
    console.log(organizationId)
    }catch (e){
      console.log(e)
    }
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

export const updateCacheCreatePersona = (
  cache: any,
  data: any,
  email: string
) => {
  try{
    console.log(cache)
    console.log(data)
    console.log(email)
    }catch (e){
      console.log(e)
    }
  // try {
  //   const id = pathOr('', ['createMyDocument', 'cacheId'], data)
  //   const persona = {
  //     id: id,
  //     fields: [{ key: 'id', value: id, __typename: 'Field', }, { key: 'email', value: email, __typename: 'Field', }],
  //     __typename: 'Document'
  //   }

  //   const writeData = {
  //     ...personaArgs(email),
  //     data: { myDocuments: [persona] },
  //   }
  //   cache.writeQuery(writeData)
  // } catch (e) {
  //   console.log(e)
  // }
}

export const updateCacheOrgAssignmentStatus = (
  cache: any,
  assignmentId: string,
  status: string,
  organizationId: string,
  personaId?: string
) => {
  try{
    console.log(cache)
    console.log(assignmentId)
    console.log(status)
    console.log(organizationId)
    console.log(personaId)
    }catch (e){
      console.log(e)
    }
  // try {
  //   const response = cache.readQuery(
  //     organizationAssignmentArgs(personaId ? personaId : '', organizationId)
  //   )
  //   const assignment = find(propEq('id', assignmentId), response.myDocuments)
  //   const assignmentFields = reject(
  //     propEq('key', 'status'),
  //     pathOr([], ['fields'], assignment)
  //   )

  //   response.myDocuments = reject(
  //     propEq('id', assignmentId),
  //     response.myDocuments
  //   )
  //   response.myDocuments = [
  //     ...response.myDocuments,
  //     {
  //       id: assignment.id,
  //       fields: [...assignmentFields, { key: 'status', value: status, __typename: 'Field', }],
  //     },
  //   ]

  //   const writeData = {
  //     ...organizationAssignmentArgs(personaId ? personaId : '', organizationId),
  //     data: { myDocuments: response.myDocuments },
  //   }

  //   cache.writeQuery(writeData)
  // } catch (e) {
  //   console.log(e)
  // }
}

export const updateCachePersonaOrgId = (
  cache: any,
  orgFields: any,
  email: string,
  personaId: string
) => {

  try{
    console.log(cache)
    console.log(orgFields)
    console.log(personaId)
    console.log(email)
    }catch (e){
      console.log(e)
    }

  // try {
  //   const response = cache.readQuery(personaArgs(email))
  //   response.myDocuments = reject(propEq('id', personaId), response.myDocuments)

  //   const persona = {
  //     id: personaId,
  //     fields: [
  //       { key: 'id', value: personaId, __typename: 'Field' },
  //       { key: 'email', value: email, __typename: 'Field' },
  //       { key: 'businessOrganizationId_linked', value: orgFields, __typename: 'Field' },
  //     ],
  //     __typename: 'Document'
  //   }
  //   response.myDocuments.push(persona)
  //   cache.writeQuery(personaArgs(email), response)
  // } catch (e) {
  //   console.log(e)
  // }
}

export const updateCacheDeleteAssignment = (
  cache: any,
  assignmentId: string,
  organizationId: string,
  personaId?: string
) => {

  try{
    console.log(cache)
    console.log(assignmentId)
    console.log(organizationId)
    console.log(personaId)
    }catch (e){
      console.log(e)
    }

  // try {
  //   const response = cache.readQuery(
  //     organizationAssignmentArgs(personaId ? personaId : '', organizationId)
  //   )
  //   response.myDocuments = reject(
  //     propEq('id', assignmentId),
  //     response.myDocuments
  //   )
  //   cache.writeQuery(
  //     organizationAssignmentArgs(personaId ? personaId : '', organizationId),
  //     response
  //   )
  // } catch (e) {
  //   console.log(e)
  // }
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

// const personaArgs = (email: string) => {
//   return {
//     query: GET_DOCUMENT,
//     variables: {
//       acronym: PERSONA_ACRONYM,
//       fields: ['id', 'businessOrganizationId_linked'],
//       where: `(email=${email})`,
//       schema: PERSONA_SCHEMA,
//     },
//   }
// }

// const organizationAssignmentArgs = (
//   personaId: string,
//   organizationId: string
// ) => {
//   return {
//     query: GET_DOCUMENT,
//     variables: {
//       acronym: ORG_ASSIGNMENT,
//       schema: ORG_ASSIGNMENT_SCHEMA,
//       fields: ORG_ASSIGNMENT_FIELDS,
//       where: `(personaId=${personaId} OR businessOrganizationId=${organizationId})`,
//     },
//   }
// }
