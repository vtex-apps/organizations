import React, { useState } from 'react'
import { useQuery, useMutation, useApolloClient } from 'react-apollo'
import { Button } from 'vtex.styleguide'
import { pathOr, find, propEq } from 'ramda'
import { injectIntl } from 'react-intl'

import { documentSerializer } from '../utils/documentSerializer'

import AddUser from './modals/AddUser'
import UserConfirmationModal from './modals/UserConfirmationModal'
import UserEditModal from './modals/UserEditModal'

import documentQuery from '../graphql/documents.graphql'
import DELETE_DOCUMENT from '../graphql/deleteDocument.graphql'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'
import UserListItem from './UserListItem'

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
} from '../utils/const'
import { getErrorMessage } from '../utils/graphqlErrorHandler'

interface Props {
  isCurrentUserAdmin: boolean
  email: string
  organizationId: string
  showToast: (message: any) => void
  intl: any
}

const MyUsers = ({
  isCurrentUserAdmin,
  organizationId,
  email,
  showToast,
  intl,
}: Props) => {
  const PAGE_SIZE_STEPPER = 10
  const [assignmentsPageSize, setAssignmentsPageSize] = useState(PAGE_SIZE_STEPPER)

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
    ({} as any) as OrganizationAssignment
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
  const { data: orgAssignments, loading: loadingAssignments } = useQuery(documentQuery, {
    skip: organizationId == '',
    variables: {
      acronym: ORG_ASSIGNMENT,
      fields: ORG_ASSIGNMENT_FIELDS,
      where: `businessOrganizationId=${organizationId}`,
      schema: ORG_ASSIGNMENT_SCHEMA,
      page: 1,
      pageSize: assignmentsPageSize
    },
  })

  const { data: defaultAssignmentData } = useQuery(documentQuery, {
    skip: organizationId == '',
    variables: {
      acronym: ORG_ASSIGNMENT,
      fields: ORG_ASSIGNMENT_FIELDS,
      where: `businessOrganizationId=${organizationId} AND email=${email}`,
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

  const defaultAssignment: OrganizationAssignment[] = documentSerializer(
    pathOr([], ['myDocuments'], defaultAssignmentData)
  )

  const defaultUserAssignment = find(
    propEq('email', email),
    defaultAssignment
  ) as OrganizationAssignment

  const deleteOrgAssignment = (assignment: OrganizationAssignment) => {
    return deleteDocument({
      variables: {
        acronym: ORG_ASSIGNMENT,
        documentId: assignment.id,
      },
    })
  }

  // ** Delete Org Assignment
  // ** Remove `organizationId` from CL
  // ** Remove `isOrgAdmin` from CL
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
                { key: 'isOrgAdmin', value: 'false' },
                { key: 'approved', value: 'false' },
              ],
            },
          },
        })
      })
  }

  // Delete user - [Delete Btn clicked]
  const deleteUserAssignment = (assignmentId: string) => {
    const assignment = find(propEq('id', assignmentId), assignments)
    setSharedOrgAssignment(assignment as OrganizationAssignment)
    setIsDeleteConfirmationOpen(true)
  }

  // Confirm delete - [Confirm delete btn clicked]
  // ** delete org assignment with user if request is approved
  const confirmDelete = () => {
    setDeleteConfirmationLoading(true)
    deleteAssignmentWithUser(sharedOrgAssignment)
      .then(() => {
        setDeleteConfirmationLoading(false)
        setIsDeleteConfirmationOpen(false)
        setSharedOrgAssignment(({} as any) as OrganizationAssignment)
      })
      .catch((e: Error) => {
        const message = getErrorMessage(e)
        setDeleteConfirmationLoading(false)
        setIsDeleteConfirmationOpen(false)
        setSharedOrgAssignment(({} as any) as OrganizationAssignment)
        showToast({
          message: `${intl.formatMessage({
            id: 'store/my-users.toast.user.delete.error',
          })} ${message}`,
          duration: 5000,
          horizontalPosition: 'right',
        })
      })
  }

  // Close delete confirmation
  const closeDelete = () => {
    setIsDeleteConfirmationOpen(false)
    setSharedOrgAssignment(({} as any) as OrganizationAssignment)
  }

  // Edit organization assignment - [Edit Btn clicked]
  const editUser = (assignmentId: string) => {
    const assignment = find(propEq('id', assignmentId), assignments)
    setSharedOrgAssignment(assignment as OrganizationAssignment)
    setIsUserEditOpen(true)
  }

  // Close edit organization assignment
  const closeUserEditModal = () => {
    setSharedOrgAssignment(({} as any) as OrganizationAssignment)
    setIsUserEditOpen(false)
  }

  // Create organization assignment - [New organization Btn clicked]
  const addNewUser = () => {
    setIsAddNewUserOpen(true)
  }

  // close modals org assignment create
  const closeModalAddNewUser = () => {
    setIsAddNewUserOpen(false)
  }

  const loadMoreAssignments = () => {
    setAssignmentsPageSize(assignmentsPageSize + PAGE_SIZE_STEPPER)
  }

  return defaultUserAssignment? (
    <div className="flex flex-column pa5">
      <div className="flex-row">
        <div className="fl pr2">
          <h3>
            {intl.formatMessage({
              id: 'store/my-users.my-organization.users-in-organization',
            })}
          </h3>
        </div>
        <div className="fl pl3 mt5">
          <Button
            variation="secondary"
            size="small"
            onClick={() => addNewUser()}>
            {intl.formatMessage({
              id: 'store/my-users.my-user.table.button.add-new',
            })}
          </Button>
        </div>
      </div>
      <div className="flex flex-column">
        <div>
          <div className="mb5">
            {assignments.map(
              (assignment: OrganizationAssignment, index: number) => {
                return (
                  <div key={`list-item-${index}`}>
                    <UserListItem
                      isCurrentUserAdmin={isCurrentUserAdmin}
                      isDefaultAssignment={
                        defaultUserAssignment.id == assignment.id
                      }
                      orgAssignment={assignment}
                      edit={editUser}
                      deleteAssignment={deleteUserAssignment}
                    />
                  </div>
                )
              }
            )}
          </div>
        </div>
        <div className="flex justify-center">
          {
            loadingAssignments || assignments.length >= assignmentsPageSize ? 
            <Button 
            size="small" 
            onClick={loadMoreAssignments}
            isLoading={loadingAssignments}
            >{intl.formatMessage({
              id: 'store/my-users.my-organization.showMore',
            })}</Button> : <div />
          }
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
          onClose={closeUserEditModal}
          onSave={closeUserEditModal}
          orgAssignment={sharedOrgAssignment}
          roles={roles}
          showToast={showToast}
          isCurrentUserAdmin={isCurrentUserAdmin}
        />
        <AddUser
          roles={roles}
          organizationId={organizationId}
          isOpen={isAddNewUserOpen}
          onClose={closeModalAddNewUser}
          onSuccess={closeModalAddNewUser}
          showToast={showToast}
          isCurrentUserAdmin={isCurrentUserAdmin}
          existingUsers={assignments.map((assignment: OrganizationAssignment) =>
            pathOr('', ['personaId_linked', 'email'], assignment)
          )}
        />
      </div>
    </div>
  ): <div />
}

export default injectIntl(MyUsers)
