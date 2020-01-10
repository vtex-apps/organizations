import React from 'react'
import { useQuery } from 'react-apollo'
import { injectIntl } from 'react-intl'
import documentQuery from '../graphql/documents.graphql'
import { Table } from 'vtex.styleguide'
import { find, path, pathOr, propEq } from 'ramda'
import AddUser from './AddUser'

interface Props {
  organizationId: string
}

const MyUsers = ({ organizationId }: Props) => {
  const { data: roleData } = useQuery(documentQuery, {
    // skip: !rolePermissionFields || isEmpty(roleId),
    variables: {
      acronym: 'BusinessRole',
      fields: ['id', 'name', 'label'],
      schema: 'business-role-schema-v1',
    },
  })
  const { data: orgAssignments } = useQuery(documentQuery, {
    variables: {
      acronym: 'OrgAssignment',
      fields: [
        'id',
        'personaId_linked',
        'businessOrganizationId_linked',
        'status',
        'roleId_linked',
      ],
      where: `businessOrganizationId=${organizationId}`,
      schema: 'organization-assignment-schema-v1',
    },
  })

  const roleDocuments: MDSearchDocumentResult[] = roleData
    ? roleData.documents
    : []

  const roles: Role[] = roleDocuments.map(
    (document: MDSearchDocumentResult) => ({
      label: pathOr(
        '',
        ['value'],
        find(propEq('key', 'label'), document.fields || { key: '', value: '' })
      ),
      value: pathOr(
        '',
        ['value'],
        find(propEq('key', 'id'), document.fields || { key: '', value: '' })
      ),
    })
  )
  const defaultSchema = {
    properties: {
      email: {
        title: 'Email',
      },
      role: {
        title: 'Role',
      },
    },
  }
  const tableItems = pathOr([], ['documents'], orgAssignments).map(
    (document: MDSearchDocumentResult) => ({
      email: path(
        ['email'],
        JSON.parse(
          pathOr(
            '',
            ['value'],
            find(
              propEq('key', 'personaId_linked'),
              document.fields || { key: '', value: '' }
            )
          )
        )
      ),
      role: pathOr(
        '',
        ['label'],
        find(
          propEq('key', 'id') &&
            propEq(
              'value',
              path(
                ['id'],
                JSON.parse(
                  pathOr(
                    '',
                    ['value'],
                    find(
                      propEq('key', 'roleId_linked'),
                      document.fields || { key: '', value: '' }
                    )
                  )
                )
              )
            ),
          roles
        )
      ),
    })
  )
  return (
    <div className="flex flex-column">
      <AddUser roles={roles} organizationId={organizationId} />
      <div>
        <div className="mb5">
          <Table fullWidth schema={defaultSchema} items={tableItems} />
        </div>
      </div>
    </div>
  )
}

export default injectIntl(MyUsers)
