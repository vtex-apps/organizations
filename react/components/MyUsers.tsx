import React, { useState } from 'react'
import { useQuery, useMutation, useApolloClient } from 'react-apollo'
import { Table, Button } from 'vtex.styleguide'
import { pathOr, find, propEq } from 'ramda'
import { injectIntl } from 'react-intl'

import { documentSerializer } from '../utils/documentSerializer'

import AddUser from './modals/AddUser'
import UserConfirmationModal from './modals/UserConfirmationModal'
import UserEditModal from './modals/UserEditModal'

import documentQuery from '../graphql/documents.graphql'
import DELETE_DOCUMENT from '../graphql/deleteDocument.graphql'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'

import { updateCacheDeleteUser } from '../utils/cacheUtils'
import {
  CLIENT_ACRONYM,
  CLIENT_FIELDS,
  BUSINESS_ROLE,
  BUSINESS_ROLE_FIELDS,
  BUSINESS_ROLE_SCHEMA,
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_FIELDS,
  ORG_ASSIGNMENT_SCHEMA,
  ASSIGNMENT_STATUS_APPROVED,
  ASSIGNMENT_STATUS_DECLINED,
  ASSIGNMENT_STATUS_PENDING,
} from '../utils/const'
import { getErrorMessage } from '../utils/graphqlErrorHandler'

interface Props {
  email: string
  organizationId: string
  showToast: Function
  intl: any
}

const MyUsers = ({ organizationId, email, showToast, intl }: Props) => {
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

  const [sharedOrgAssignment, setSharedOrgAssignment] = useState(
    {} as OrganizationAssignment
  )

  const client = useApolloClient()

  const [isUserEditOpen, setIsUserEditOpen] = useState(false)

  const { data: roleData } = useQuery(documentQuery, {
    variables: {
      acronym: BUSINESS_ROLE,
      fields: BUSINESS_ROLE_FIELDS,
      schema: BUSINESS_ROLE_SCHEMA,
    },
  })
  const { data: orgAssignments } = useQuery(documentQuery, {
    skip: organizationId == '',
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

  const defaultUserAssignment = find(propEq('email', email), assignments)

  const defaultSchema = {
    properties: {
      email: {
        title: intl.formatMessage({
          id: 'store/my-users.my-user.table-title.email',
        }),
      },
      status: {
        title: intl.formatMessage({
          id: 'store/my-users.my-user.table-title.status',
        }),
        cellRenderer: ({ cellData }: any) => {
          if (cellData === ASSIGNMENT_STATUS_APPROVED) {
            return 'Active'
          } else if (cellData === ASSIGNMENT_STATUS_DECLINED) {
            return 'Inactive'
          } else if (cellData === ASSIGNMENT_STATUS_PENDING) {
            return 'Pending'
          }
          return ''
        },
      },
      role: {
        title: intl.formatMessage({
          id: 'store/my-users.my-user.table-title.role',
        }),
      },
      editAssignment: {
        title: intl.formatMessage({
          id: 'store/my-users.my-user.table-title.edit',
        }),
        cellRenderer: ({ cellData }: any) => {
          return defaultUserAssignment &&
            cellData !== defaultUserAssignment.id ? (
            <Button
              variation="tertiary"
              size="small"
              onClick={() => editUser(cellData)}>
              {intl.formatMessage({
                id: 'store/my-users.my-user.table-title.edit',
              })}
            </Button>
          ) : (
            ''
          )
        },
      },
      reInviteAssignment: {
        title: intl.formatMessage({
          id: 'store/my-users.my-user.table-title.invite',
        }),
        cellRenderer: ({ cellData }: any) => {
          const assignment = find(propEq('id', cellData), assignments)
          return defaultUserAssignment &&
            cellData !== defaultUserAssignment.id &&
            assignment &&
            assignment.status === ASSIGNMENT_STATUS_DECLINED ? (
            <Button
              variation="tertiary"
              size="small"
              onClick={() => reInvite(cellData)}>
              {intl.formatMessage({
                id: 'store/my-users.my-user.table-title.invite',
              })}
            </Button>
          ) : (
            ''
          )
        },
      },
      deleteAssignment: {
        title: intl.formatMessage({
          id: 'store/my-users.my-user.table-title.delete',
        }),
        cellRenderer: ({ cellData }: any) => {
          return defaultUserAssignment &&
            cellData !== defaultUserAssignment.id ? (
            <Button
              variation="danger-tertiary"
              size="small"
              onClick={() => deleteUserAssignment(cellData as string)}>
              {intl.formatMessage({
                id: 'store/my-users.my-user.table-title.delete',
              })}
            </Button>
          ) : (
            ''
          )
        },
      },
    },
  }

  // const getClient = async (email: string) => {
  //   return client
  //     .query({
  //       query: documentQuery,
  //       variables: {
  //         acronym: 'CL',
  //         fields: ['email', 'isOrgAdmin'],
  //         where: `email=${email}`,
  //       },
  //     }).catch((e) => {
  //       Promise.reject(e)
  //     })
  // }

  const tableItems = assignments.map((assignment: OrganizationAssignment) => {
    // const cl = await getClient("9f30ceaf-ca02-11e8-822e-12ab2183dbbe")
    // console.log(cl)
    return {
      email: pathOr('', ['email'], assignment),
      status: pathOr('', ['status'], assignment),
      role: pathOr('', ['roleId_linked', 'label'], assignment),
      editAssignment: pathOr('', ['id'], assignment),
      reInviteAssignment: pathOr('', ['id'], assignment),
      deleteAssignment: pathOr('', ['id'], assignment),
    }
  })

  const deleteOrgAssignment = (assignment: OrganizationAssignment) => {
    return deleteDocument({
      variables: {
        acronym: ORG_ASSIGNMENT,
        documentId: assignment.id,
      },
    })
  }

  const deleteAssignmentWithUser = (assignment: OrganizationAssignment) => {
    return deleteOrgAssignment(assignment)
      .then(() => {
        return client.query({
          query: documentQuery,
          variables: {
            acronym: CLIENT_ACRONYM,
            fields: CLIENT_FIELDS,
            where: `email=${assignment.email}`,
          },
        })
      })
      .then(({ data }: any) => {
        const clid = pathOr('', ['myDocuments', 0, 'id'], data)
        return updateDocument({
          variables: {
            acronym: CLIENT_ACRONYM,
            document: {
              fields: [
                { key: 'id', value: clid },
                { key: 'organizationId', value: '' },
              ],
            },
          },
        })
      })
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
      sharedOrgAssignment.status === ASSIGNMENT_STATUS_APPROVED
        ? deleteAssignmentWithUser
        : deleteOrgAssignment
    doDelete(sharedOrgAssignment)
      .then(() => {
        setDeleteConfirmationLoading(false)
        setIsDeleteConfirmationOpen(false)
        setSharedOrgAssignment({} as OrganizationAssignment)
      })
      .catch((e: Error) => {
        const message = getErrorMessage(e)
        setDeleteConfirmationLoading(false)
        setIsDeleteConfirmationOpen(false)
        setSharedOrgAssignment({} as OrganizationAssignment)
        showToast({
          message: `${intl.formatMessage({
            id: 'store/my-users.toast.user.delete.error',
          })} ${message}`,
          duration: 5000,
          horizontalPosition: 'right',
        })
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
            { key: 'status', value: ASSIGNMENT_STATUS_PENDING },
          ],
        },
        schema: ORG_ASSIGNMENT_SCHEMA,
      },
    })
      .then(() => {
        showToast({
          message: `${intl.formatMessage({
            id: 'store/my-users.toast.user.reinvitation.sent',
          })} `,
          duration: 5000,
          horizontalPosition: 'right',
        })
        setSharedOrgAssignment({} as OrganizationAssignment)
      })
      .catch((e: Error) => {
        const message = getErrorMessage(e)
        showToast({
          message: `${intl.formatMessage({
            id: 'store/my-users.toast.user.reinvitation.error',
          })} ${message}`,
          duration: 5000,
          horizontalPosition: 'right',
        })
      })
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
    <div className="flex flex-column pa5">
      <h3 className="">
        {intl.formatMessage({
          id: 'store/my-users.my-organization.users-in-organization',
        })}
      </h3>
      <div className="flex flex-column">
        <div>
          <div className="mb5">
            <Table
              fullWidth
              schema={defaultSchema}
              items={tableItems}
              toolbar={{
                newLine: {
                  label: intl.formatMessage({
                    id: 'store/my-users.my-user.table.button.add-new',
                  }),
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
          confirmAction={intl.formatMessage({
            id: 'store/my-users.my-user.delete-confirmation-action',
          })}
          message={intl.formatMessage({
            id: 'store/my-users.my-user.delete-confirmation-message',
          })}
        />
        <UserEditModal
          isOpen={isUserEditOpen}
          onClose={closeUserEdit}
          onSave={saveEditUser}
          orgAssignment={sharedOrgAssignment}
          roles={roles}
          showToast={showToast}
        />
        <AddUser
          roles={roles}
          organizationId={organizationId}
          isOpen={isAddNewUserOpen}
          onClose={addNewUserClosed}
          onSuccess={newUserAdded}
          showToast={showToast}
          existingUsers={assignments.map((assignment: OrganizationAssignment) =>
            pathOr('', ['personaId_linked', 'email'], assignment)
          )}
        />
      </div>
    </div>
  )
}

export default injectIntl(MyUsers)
