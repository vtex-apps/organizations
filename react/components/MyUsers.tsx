import React from 'react'
import { useQuery } from 'react-apollo'
import { injectIntl } from 'react-intl'
import documentQuery from '../graphql/documents.graphql'
import { Table } from 'vtex.styleguide'
import { find, pathOr, propEq } from 'ramda'
import AddUser from './AddUser'

const MyUsers = () => {
  const { data: roleData } = useQuery(documentQuery, {
    // skip: !rolePermissionFields || isEmpty(roleId),
    variables: {
      acronym: 'BusinessRole',
      fields: ['id', 'name', 'label'],
      schema: 'business-role-schema-v1',
    },
  })
  const { data: userData } = useQuery(documentQuery, {
    variables: {
      acronym: 'CL',
      fields: ['id', 'email', 'roleId'],
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
  const lineActions = [
    {
      label: () => `Edit`,
      onClick: ({ rowData }: { rowData: { name: string } }) =>
        alert(`Executed action for ${rowData.name}`),
    },
    // {
    //   label: ({ rowData }) => `DANGEROUS action for ${rowData.name}`,
    //   isDangerous: true,
    //   onClick: ({ rowData }) =>
    //     alert(`Executed a DANGEROUS action for ${rowData.name}`),
    // },
  ]
  const tableItems = pathOr([], ['documents'], userData).map(
    (document: MDSearchDocumentResult) => ({
      email: pathOr(
        '',
        ['value'],
        find(propEq('key', 'email'), document.fields || { key: '', value: '' })
      ),
      role: pathOr(
        '',
        ['label'],
        find(
          propEq('key', 'id') &&
            propEq(
              'value',
              pathOr(
                '',
                ['value'],
                find(
                  propEq('key', 'roleId'),
                  document.fields || { key: '', value: '' }
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
      <AddUser roles={roles} />
      <div>
        <div className="mb5">
          <Table
            fullWidth
            schema={defaultSchema}
            items={tableItems}
            lineActions={lineActions}
          />
        </div>
      </div>
    </div>
  )
}

export default injectIntl(MyUsers)
