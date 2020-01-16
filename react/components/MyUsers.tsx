import React from 'react'
import { useQuery } from 'react-apollo'
import { injectIntl } from 'react-intl'
import documentQuery from '../graphql/documents.graphql'
import { Table, Button } from 'vtex.styleguide'
import { pathOr, find } from 'ramda'
import AddUser from './AddUser'
import { documentSerializer } from '../utils/documentSerializer'
import propEq from 'ramda/es/propEq'

interface Props {
  personaId: string
  organizationId: string
}

const MyUsers = ({ organizationId, personaId }: Props) => {
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

  const roles: Role[] = documentSerializer(pathOr([], ['documents'], roleData))
  const assignments: OrganizationAssignment[] = documentSerializer(
    pathOr([], ['documents'], orgAssignments)
  )

  const defaultUserAssignment = find(
    propEq('personaId', personaId),
    assignments
  )

  const defaultSchema = {
    properties: {
      email: {
        title: 'Email',
      },
      status: {
        title: 'Status',
        cellRenderer: ({ cellData }: any) => {
          if (cellData === 'APPROVED') {
            return 'Active'
          } else if (cellData === 'DECLINED') {
            return 'Inactive'
          } else if (cellData === 'PENDING') {
            return 'Pending'
          }
          return ''
        },
      },
      role: {
        title: 'Role',
      },
      editAssignment: {
        title: 'Edit',
        cellRenderer: ({ cellData }: any) => {
          return defaultUserAssignment && cellData !== defaultUserAssignment.id ? (
            <Button variation="tertiary" size="small">
              Eedit
            </Button>
          ) : (
            ''
          )
        },
      },
      reInviteAssignment: {
        title: 'Delete',
        cellRenderer: ({ cellData }: any) => {
          return defaultUserAssignment && cellData !== defaultUserAssignment.id ? (
            <Button variation="tertiary" size="small">
              Re Invite
            </Button>
          ) : (
            ''
          )
        },
      },
      deleteAssignment: {
        title: 'Delete',
        cellRenderer: ({ cellData }: any) => {
          return defaultUserAssignment && cellData !== defaultUserAssignment.id ? (
            <Button variation="danger-tertiary" size="small">
              Delete
            </Button>
          ) : (
            ''
          )
        },
      },
    },
  }

  const tableItems = assignments.map((assignment: OrganizationAssignment) => ({
    email: pathOr('', ['personaId_linked', 'email'], assignment),
    status: pathOr('', ['status'], assignment),
    role: pathOr('', ['roleId_linked', 'label'], assignment),
    editAssignment: pathOr('', ['id'], assignment),
    reInviteAssignment: pathOr('', ['id'], assignment),
    deleteAssignment: pathOr('', ['id'], assignment),
  }))

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
