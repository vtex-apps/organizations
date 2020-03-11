import React, { useState } from 'react'
import { injectIntl } from 'react-intl'
import { reject, filter, propEq, pathOr } from 'ramda'
import { Button } from 'vtex.styleguide'
import { useApolloClient, useMutation } from 'react-apollo'

import WarningModal from './modals/WarningModal'
import ConfirmationModal from './modals/ConfirmationModal'

import DOCUMENTS from '../graphql/documents.graphql'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'
import DELETE_DOCUMENT from '../graphql/deleteDocument.graphql'

import { getErrorMessage } from '../utils/graphqlErrorHandler'
import { documentSerializer } from '../utils/documentSerializer'
import {
  ORG_ASSIGNMENT,
  ORG_ASSIGNMENT_FIELDS,
  ORG_ASSIGNMENT_SCHEMA,
  ASSIGNMENT_STATUS_APPROVED,
  ASSIGNMENT_STATUS_PENDING,
  CLIENT_ACRONYM,
  BUSINESS_ORGANIZATION,
  ASSIGNMENT_STATUS_DECLINED,
} from '../utils/const'

import { updateCacheProfile } from '../utils/cacheUtils'
import { addressSplitter } from '../utils/textUtil'

interface Props {
  clientId: string
  defaultAssignment: OrganizationAssignment
  userRole: any
  infoUpdated: () => void
  showToast: (message: any) => void
  intl: any
  showLeaveBtn: boolean
}

const DefaultAssignmentInfo = ({
  clientId,
  defaultAssignment,
  userRole,
  infoUpdated,
  showToast,
  intl,
  showLeaveBtn,
}: Props) => {
  const [isLeaveWarningOpen, setIsLeaveWarningOpen] = useState(false)
  const [
    isDeleteAssignmentWarningOpen,
    setIsDeleteAssignmentWarningOpen,
  ] = useState(false)

  const [
    isDeleteOrgConfirmationOpen,
    setIsDeleteOrgConfirmationOpen,
  ] = useState(false)

  const [
    deleteOrgConfirmationLoading,
    setDeleteOrgConfirmationLoading,
  ] = useState(false)

  const [isLeaveOrgConfirmationOpen, setIsLeaveOrgConfirmationOpen] = useState(
    false
  )

  const [
    leaveOrgConfirmationLoading,
    setLeaveOrgConfirmationLoading,
  ] = useState(false)

  const [isLeaveBtnLoading, setIsLeaveBtnLoading] = useState(false)
  const [isDeleteBtnLoading, setIsDeleteBtnLoading] = useState(false)

  const client = useApolloClient()
  const [updateDocument] = useMutation(UPDATE_DOCUMENT)
  const [deleteDocument] = useMutation(DELETE_DOCUMENT)

  // LEAVE
  const leaveOrganization = () => {
    const orgId = pathOr('', ['businessOrganizationId'], defaultAssignment)
    const email = pathOr('', ['email'], defaultAssignment)
    setIsLeaveBtnLoading(true)
    client
      .query({
        query: DOCUMENTS,
        variables: {
          acronym: ORG_ASSIGNMENT,
          schema: ORG_ASSIGNMENT_SCHEMA,
          fields: ORG_ASSIGNMENT_FIELDS,
          where: `(businessOrganizationId=${orgId} AND (status=${ASSIGNMENT_STATUS_PENDING} OR status=${ASSIGNMENT_STATUS_APPROVED}))`,
        },
        fetchPolicy: 'no-cache',
      })
      .then(({ data }: any) => {
        if (data) {
          const assignments_d = documentSerializer(data ? data.myDocuments : [])
          const assignmentsExceptMe = reject(
            propEq('email', email),
            assignments_d
          )
          const assignmentsWithManagerRole = filter(
            propEq('roleId', userRole.id),
            assignmentsExceptMe
          )

          if (
            userRole.name !== 'manager' ||
            (assignmentsExceptMe && assignmentsExceptMe.length == 0) ||
            assignmentsWithManagerRole.length > 0
          ) {
            setIsLeaveOrgConfirmationOpen(true)
            setIsLeaveBtnLoading(false)
          } else {
            setIsLeaveWarningOpen(true)
            setIsLeaveBtnLoading(false)
          }
        }
      })
      .catch((e: any) => {
        setIsLeaveBtnLoading(false)
        const message = getErrorMessage(e)
        showToast({
          message: `${intl.formatMessage({
            id: 'store/my-users.toast.organization.leave.error',
          })}"${message}"`,
          duration: 5000,
          horizontalPosition: 'right',
        })
        return Promise.resolve({ myDocuments: [] })
      })
  }

  const closeLeaveOrganizationMessageModal = () => {
    setIsLeaveWarningOpen(false)
  }

  const confirmLeaveOrganization = () => {
    setLeaveOrgConfirmationLoading(true)
    const assignmentId = pathOr('', ['id'], defaultAssignment)
    updateDocument({
      variables: {
        acronym: ORG_ASSIGNMENT,
        document: {
          fields: [
            { key: 'id', value: assignmentId },
            { key: 'status', value: ASSIGNMENT_STATUS_DECLINED },
          ],
        },
        schema: ORG_ASSIGNMENT_SCHEMA,
      },
    })
      .then(() => {
        return updateDocument({
          variables: {
            acronym: CLIENT_ACRONYM,
            document: {
              fields: [
                { key: 'id', value: clientId },
                { key: 'organizationId', value: '' },
              ],
            },
          },
          update: (cache: any, { data }: any) =>
            updateCacheProfile(cache, data, ''),
        })
      })
      .then(() => {
        setLeaveOrgConfirmationLoading(false)
        setIsLeaveOrgConfirmationOpen(false)

        infoUpdated()
      })
      .catch((e: any) => {
        const message = getErrorMessage(e)
        setLeaveOrgConfirmationLoading(false)
        setIsLeaveOrgConfirmationOpen(false)
        showToast({
          message: `${intl.formatMessage({
            id: 'store/my-users.toast.organization.leave.error',
          })}"${message}"`,
          duration: 5000,
          horizontalPosition: 'right',
        })
      })
  }
  const closeLeaveOrganization = () => {
    setIsLeaveOrgConfirmationOpen(false)
  }

  // DELETE ORGANIZATION
  const deleteCurrentOrganization = () => {
    const orgId = pathOr('', ['businessOrganizationId'], defaultAssignment)
    const email = pathOr('', ['email'], defaultAssignment)
    setIsDeleteBtnLoading(true)
    client
      .query({
        query: DOCUMENTS,
        variables: {
          acronym: ORG_ASSIGNMENT,
          schema: ORG_ASSIGNMENT_SCHEMA,
          fields: ORG_ASSIGNMENT_FIELDS,
          where: `(businessOrganizationId=${orgId} AND (status=${ASSIGNMENT_STATUS_PENDING} OR status=${ASSIGNMENT_STATUS_APPROVED}))`,
        },
        fetchPolicy: 'no-cache',
      })
      .then(({ data }: any) => {
        if (data) {
          const assignments_d = documentSerializer(data ? data.myDocuments : [])
          const assignmentsExceptMe = reject(
            propEq('email', email),
            assignments_d
          )
          if (assignmentsExceptMe && assignmentsExceptMe.length > 0) {
            setIsDeleteAssignmentWarningOpen(true)
            setIsDeleteBtnLoading(false)
          } else {
            setIsDeleteBtnLoading(false)
            deleteOrganization()
          }
        }
      })
      .catch((e: any) => {
        setIsDeleteBtnLoading(false)
        const message = getErrorMessage(e)
        showToast({
          message: `${intl.formatMessage({
            id: 'store/my-users.toast.organization.leave.error',
          })}"${message}"`,
          duration: 5000,
          horizontalPosition: 'right',
        })
        return Promise.resolve({ myDocuments: [] })
      })
  }

  const closeDeleteAssignmentWarningModal = () => {
    setIsDeleteAssignmentWarningOpen(false)
  }

  const deleteOrganization = () => {
    setIsDeleteOrgConfirmationOpen(true)
  }

  const confirmDeleteOrganization = () => {
    setDeleteOrgConfirmationLoading(true)
    const assignmentId = pathOr('', ['id'], defaultAssignment)
    return deleteDocument({
      variables: {
        acronym: ORG_ASSIGNMENT,
        documentId: assignmentId,
      },
    })
      .then(() => {
        const orgId: string = pathOr(
          '',
          ['businessOrganizationId'],
          defaultAssignment
        )
        return deleteDocument({
          variables: {
            acronym: BUSINESS_ORGANIZATION,
            documentId: orgId,
          },
        })
      })
      .then(() => {
        return updateDocument({
          variables: {
            acronym: CLIENT_ACRONYM,
            document: {
              fields: [
                { key: 'id', value: clientId },
                { key: 'organizationId', value: '' },
              ],
            },
          },
          update: (cache: any, { data }: any) =>
            updateCacheProfile(cache, data, ''),
        })
      })
      .then(() => {
        setDeleteOrgConfirmationLoading(false)
        setIsDeleteOrgConfirmationOpen(false)
        infoUpdated()
      })
      .catch((e: any) => {
        const message = getErrorMessage(e)
        setDeleteOrgConfirmationLoading(false)
        setIsDeleteOrgConfirmationOpen(false)
        showToast({
          message: `${intl.formatMessage({
            id: 'store/my-users.toast.organization.delete.error',
          })} "${message}"`,
          duration: 5000,
          horizontalPosition: 'right',
        })
      })
  }

  const closeDeleteOrganization = () => {
    setIsDeleteOrgConfirmationOpen(false)
  }

  return (
    <div className="pa5">
      <div>
        <h3>
          {intl.formatMessage({
            id: 'store/my-users.my-organization.organization',
          })}
        </h3>
      </div>
      <div className="flex flex-row">
        <div className="fl mt3 w-40">
          <div className="w-100 pt2 pb2">
            <span>
              {intl.formatMessage({
                id: 'store/my-users.my-organization.organization.name',
              })}
              :{' '}
            </span>
            <span className="b">
              {pathOr(
                '',
                ['businessOrganizationId_linked', 'name'],
                defaultAssignment
              )}
            </span>
          </div>
          <div className="w-100 pt2 pb2">
            <span>
              {intl.formatMessage({
                id: 'store/my-users.my-organization.role',
              })}{' '}
            </span>
            :{' '}
            <span className="b">
              {' '}
              {userRole && userRole.label ? userRole.label : ''}
            </span>
          </div>
          <div className="w-100 pt2 pb2">
            <span>
              {intl.formatMessage({
                id: 'store/my-users.my-organization.organization.telephone',
              })}
              :{' '}
            </span>
            <span className="b">
              {pathOr(
                '',
                ['businessOrganizationId_linked', 'telephone'],
                defaultAssignment
              )}
            </span>
          </div>
          <div className="w-100 pt2 pb2">
            <span>
              {intl.formatMessage({
                id: 'store/my-users.my-organization.organization.email',
              })}
              :{' '}
            </span>
            <span className="b">
              {pathOr(
                '',
                ['businessOrganizationId_linked', 'email'],
                defaultAssignment
              )}
            </span>
          </div>
          <div className="w-100 pt2 pb2"></div>
        </div>
        <div className="fl mt3 w-40 ">
          <div className="fl w-30">
            {intl.formatMessage({
              id: 'store/my-users.my-organization.organization.address',
            })}
            :{' '}
          </div>
          <div className="fl w-70 flex flex-column pl3 pr3">
            {addressSplitter(
              pathOr(
                '',
                ['businessOrganizationId_linked', 'address'],
                defaultAssignment
              )
            ).map((line: string) => (
              <span className="pa1 b">{line}</span>
            ))}
          </div>
        </div>
        <div className="fl w-20 flex flex-column">
          <span className="pa2">
            {(showLeaveBtn || true) && (
              <Button
                variation="danger-tertiary"
                size="small"
                isLoading={isLeaveBtnLoading}
                onClick={() => leaveOrganization()}
                block>
                {intl.formatMessage({
                  id: 'store/my-users.my-organization.leave',
                })}
              </Button>
            )}
          </span>
          {userRole && userRole.name && userRole.name === 'manager' && (
            <span className="pa2">
              <Button
                variation="danger-tertiary"
                isLoading={isDeleteBtnLoading}
                size="small"
                onClick={() => deleteCurrentOrganization()}
                block>
                {intl.formatMessage({
                  id: 'store/my-users.my-organization.delete',
                })}
              </Button>
            </span>
          )}
        </div>
        <WarningModal
          onOk={closeLeaveOrganizationMessageModal}
          onClose={closeLeaveOrganizationMessageModal}
          isOpen={isLeaveWarningOpen}
          assignment={defaultAssignment}
          title={intl.formatMessage({
            id: 'store/my-users.my-organization.unable-to-leave-title',
          })}
          messageLine1={intl.formatMessage({
            id: 'store/my-users.my-organization.unable-to-leave-message1',
          })}
          messageLine2={intl.formatMessage({
            id: 'store/my-users.my-organization.unable-to-leave-message2',
          })}
        />

        <WarningModal
          onOk={closeDeleteAssignmentWarningModal}
          onClose={closeDeleteAssignmentWarningModal}
          isOpen={isDeleteAssignmentWarningOpen}
          assignment={defaultAssignment}
          title={intl.formatMessage({
            id: 'store/my-users.my-organization.unable-to-delete-title',
          })}
          messageLine1={intl.formatMessage({
            id: 'store/my-users.my-organization.unable-to-delete-message1',
          })}
          messageLine2={intl.formatMessage({
            id: 'store/my-users.my-organization.unable-to-delete-message2',
          })}
        />

        <ConfirmationModal
          isOpen={isLeaveOrgConfirmationOpen}
          isLoading={leaveOrgConfirmationLoading}
          onConfirm={confirmLeaveOrganization}
          onClose={closeLeaveOrganization}
          assignment={defaultAssignment}
          confirmAction={intl.formatMessage({
            id: 'store/my-users.my-organization.button.leave',
          })}
          message={intl.formatMessage({
            id: 'store/my-users.my-organization.leave.message',
          })}
        />

        <ConfirmationModal
          isOpen={isDeleteOrgConfirmationOpen}
          isLoading={deleteOrgConfirmationLoading}
          onConfirm={confirmDeleteOrganization}
          onClose={closeDeleteOrganization}
          assignment={defaultAssignment}
          confirmAction={intl.formatMessage({
            id: 'store/my-users.my-organization.button.delete',
          })}
          message={intl.formatMessage({
            id: 'store/my-users.my-organization.delete.message',
          })}
        />
      </div>
    </div>
  )
}

export default injectIntl(DefaultAssignmentInfo)
