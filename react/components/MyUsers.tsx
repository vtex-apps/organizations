import React, { useState } from 'react'
import { useQuery, useMutation } from 'react-apollo'
import { injectIntl } from 'react-intl'
import { Table, Button } from 'vtex.styleguide'
import { pathOr, find, path, propEq } from 'ramda'

import { documentSerializer } from '../utils/documentSerializer'

import AddUser from './modals/AddUser'
import UserConfirmationModal from './modals/UserConfirmationModal'
import UserEditModal from './modals/UserEditModal'

import documentQuery from '../graphql/documents.graphql'
import DELETE_DOCUMENT from '../graphql/deleteDocument.graphql'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'

import { updateCacheDeleteUser } from '../utils/cacheUtils'
import {
  PERSONA_ACRONYM,
  PERSONA_SCHEMA,
  BUSINESS_ROLE,
  BUSINESS_ROLE_FIELDS,
  BUSINESS_ROLE_SCHEMA,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_FIELDS,
  ORG_ASSIGNMENT_SCHEMA,
} from '../utils/const'

interface Props {
  personaId: string
  organizationId: string
}

const MyUsers = ({ organizationId, personaId }: Props) => {
  const [updateDocument] = useMutation(UPDATE_DOCUMENT)
  const [deleteDocument] = useMutation(DELETE_DOCUMENT, {
    update: (cache: any, { data }: any) =>
      updateCacheDeleteUser(cache, data, organizationId),
  })

  const [isAddNewUserOpen, setIsAddNewUserOpen] = useState(false)

  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(
    false
  )

  const [deleteConfirmationLoading, setDeleteConfirmationLoading] = useState(
    false
  )
  const [globalErrorMessage, setGlobalErrorMessage] = useState('')

  const [sharedOrgAssignment, setSharedOrgAssignment] = useState(
    {} as OrganizationAssignment
  )

  const [isUserEditOpen, setIsUserEditOpen] = useState(false)

  const { data: roleData } = useQuery(documentQuery, {
    variables: {
      acronym: BUSINESS_ROLE,
      fields: BUSINESS_ROLE_FIELDS,
      schema: BUSINESS_ROLE_SCHEMA,
    },
  })
  const { data: orgAssignments } = useQuery(documentQuery, {
    variables: {
      acronym: ORG_ASSIGNMENT,
      fields: ORG_ASSIGNMENT_FIELDS,
      where: `businessOrganizationId=${organizationId}`,
      schema: ORG_ASSIGNMENT_SCHEMA,
    },
  })

  const rolesList: any[] = documentSerializer(
    pathOr([], ['myDocuments'], roleData)
  )
  const roles: Role[] = rolesList.map((role: any) => ({
    label: role.label,
    value: role.id,
    name: role.name,
  }))
  const assignments: OrganizationAssignment[] = documentSerializer(
    pathOr([], ['myDocuments'], orgAssignments)
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
          return defaultUserAssignment &&
            cellData !== defaultUserAssignment.id ? (
            <Button
              variation="tertiary"
              size="small"
              onClick={() => editUser(cellData)}>
              Edit
            </Button>
          ) : (
            ''
          )
        },
      },
      reInviteAssignment: {
        title: 'Invite',
        cellRenderer: ({ cellData }: any) => {
          const assignment = find(propEq('id', cellData), assignments)
          return defaultUserAssignment &&
            cellData !== defaultUserAssignment.id &&
            assignment &&
            assignment.status === 'DECLINED' ? (
            <Button
              variation="tertiary"
              size="small"
              onClick={() => reInvite(cellData)}>
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
          return defaultUserAssignment &&
            cellData !== defaultUserAssignment.id ? (
            <Button
              variation="danger-tertiary"
              size="small"
              onClick={() => deleteUserAssignment(cellData as string)}>
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

  const deleteOrgAssignment = (assignment: OrganizationAssignment) => {
    return deleteDocument({
      variables: {
        acronym: ORG_ASSIGNMENT,
        documentId: assignment.id,
      },
    }).catch(handleGlobalError())
  }

  const deleteAssignmentWithUser = (assignment: OrganizationAssignment) => {
    return deleteOrgAssignment(assignment)
      .then(() => {
        return updateDocument({
          variables: {
            acronym: PERSONA_ACRONYM,
            document: {
              fields: [
                { key: 'id', value: assignment.personaId },
                { key: 'businessOrganizationId', value: '' },
              ],
            },
            schema: PERSONA_SCHEMA,
          },
        })
      })
      .catch(handleGlobalError())
  }

  // DELETE
  const deleteUserAssignment = (assignmentId: string) => {
    const assignment = find(propEq('id', assignmentId), assignments)
    setSharedOrgAssignment(assignment as OrganizationAssignment)
    setIsDeleteConfirmationOpen(true)
  }

  const confirmDelete = () => {
    setDeleteConfirmationLoading(true)
    const doDelete =
      sharedOrgAssignment.status === 'APPROVED'
        ? deleteAssignmentWithUser
        : deleteOrgAssignment
    doDelete(sharedOrgAssignment).then(() => {
      setDeleteConfirmationLoading(false)
      setIsDeleteConfirmationOpen(false)
      setSharedOrgAssignment({} as OrganizationAssignment)
    })
  }

  const closeDelete = () => {
    setIsDeleteConfirmationOpen(false)
    setSharedOrgAssignment({} as OrganizationAssignment)
  }

  // RE Invite
  const reInvite = (assignmentId: string) => {
    return updateDocument({
      variables: {
        acronym: ORG_ASSIGNMENT,
        document: {
          fields: [
            { key: 'id', value: assignmentId },
            { key: 'status', value: 'PENDING' },
          ],
        },
        schema: ORG_ASSIGNMENT_SCHEMA,
      },
    }).catch(handleGlobalError())
  }

  // EDIT
  const editUser = (assignmentId: string) => {
    const assignment = find(propEq('id', assignmentId), assignments)
    setSharedOrgAssignment(assignment as OrganizationAssignment)
    setIsUserEditOpen(true)
  }

  const closeUserEdit = () => {
    setSharedOrgAssignment({} as OrganizationAssignment)
    setIsUserEditOpen(false)
  }

  const saveEditUser = () => {
    setSharedOrgAssignment({} as OrganizationAssignment)
    setIsUserEditOpen(false)
  }

  // CREATE
  const addNewUser = () => {
    setIsAddNewUserOpen(true)
  }

  const newUserAdded = () => {
    setIsAddNewUserOpen(false)
  }

  const addNewUserClosed = () => {
    setIsAddNewUserOpen(false)
  }

  return (
    <div className="flex flex-column">
      <div>
        <div className="red">{globalErrorMessage}</div>
        <div className="mb5">
          <Table
            fullWidth
            schema={defaultSchema}
            items={tableItems}
            toolbar={{
              newLine: {
                label: 'Add User',
                handleCallback: () => addNewUser(),
              },
            }}
          />
        </div>
      </div>
      <UserConfirmationModal
        isOpen={isDeleteConfirmationOpen}
        isLoading={deleteConfirmationLoading}
        onConfirm={confirmDelete}
        onClose={closeDelete}
        assignment={sharedOrgAssignment}
        confirmAction={'Delete'}
        message={'Do you want to delete user: '}
      />
      <UserEditModal
        isOpen={isUserEditOpen}
        onClose={closeUserEdit}
        onSave={saveEditUser}
        orgAssignment={sharedOrgAssignment}
        roles={roles}
      />
      <AddUser
        roles={roles}
        organizationId={organizationId}
        isOpen={isAddNewUserOpen}
        onClose={addNewUserClosed}
        onSuccess={newUserAdded}
        existingUsers={assignments.map((assignment: OrganizationAssignment) =>
          pathOr('', ['personaId_linked', 'email'], assignment)
        )}
      />
    </div>
  )
}

export default injectIntl(MyUsers)
