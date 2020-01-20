import GET_DOCUMENT from '../graphql/documents.graphql'
import { pathOr, find, propEq } from 'ramda'

export const updateCacheAddUser = (
  cache: any,
  data: any,
  roles: Role[],
  organizationId: string,
  personaId: string,
  email: string,
  roleId: string
) => {
  const response: any = cache.readQuery({
    query: GET_DOCUMENT,
    variables: {
      acronym: 'OrgAssignment',
      fields: [
        'id',
        'personaId',
        'personaId_linked',
        'businessOrganizationId_linked',
        'status',
        'roleId_linked',
      ],
      where: `businessOrganizationId=${organizationId}`,
      schema: 'organization-assignment-schema-v1',
    },
  })

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

  cache.writeQuery(
    {
      query: GET_DOCUMENT,
      variables: {
        acronym: 'OrgAssignment',
        fields: [
          'id',
          'personaId',
          'personaId_linked',
          'businessOrganizationId_linked',
          'status',
          'roleId_linked',
        ],
        where: `businessOrganizationId=${organizationId}`,
        schema: 'organization-assignment-schema-v1',
      },
    },
    response.documents
  )
}
