import React, { useState } from 'react'
import { pathOr } from 'ramda'
import { useQuery } from 'react-apollo'
import DOCUMENTS from '../graphql/documents.graphql'
import { CLIENT_ACRONYM, CLIENT_FIELDS } from '../utils/const'
import { Collapsible, Tag, Button } from 'vtex.styleguide'
import { documentSerializer } from '../utils/documentSerializer'

import { injectIntl } from 'react-intl'

import styles from '../my-organization.css'

interface Props {
  isCurrentUserAdmin: boolean
  isDefaultAssignment: boolean
  orgAssignment: OrganizationAssignment
  intl: any
  edit: (assignmentId: string) => void
  deleteAssignment: (assignmentId: string) => void
}

const UserListItem = ({
  isCurrentUserAdmin,
  isDefaultAssignment,
  orgAssignment,
  edit,
  deleteAssignment,
  intl,
}: Props) => {
  const { data, loading } = useQuery(DOCUMENTS, {
    variables: {
      acronym: CLIENT_ACRONYM,
      fields: CLIENT_FIELDS,
      where: `email=${orgAssignment.email}`,
    },
  })

  const client = pathOr(
    {},
    [0],
    documentSerializer(pathOr([], ['myDocuments'], data))
  ) as any

  const isAdminUserListItem: boolean = ((pathOr(
    'false',
    ['isOrgAdmin'],
    client
  ) as string) === 'true') as boolean

  const isApprovedUser: boolean = ((pathOr(
    'false',
    ['approved'],
    client
  ) as string) === 'true') as boolean

  const [isOpen, setIsOpen] = useState(false)

  const userContent = () => {
    return (
      <div
        key={`item-sub-key-${orgAssignment.id}`}
        className="flex center ph3-ns pa2">
        <div className="flex-row w-100  cf ph2-ns">
          <div className="fl w-60 pa2">
            <div className="pt2 f6">
              <span>
                {intl.formatMessage({
                  id: 'store/my-organization.my-user.table-title.email',
                })}
              </span>
            </div>
            <div className="pt3 b">
              <span>{orgAssignment.email}</span>
            </div>
          </div>
          <div className="fl w-20 pa2">
            <div className="pt2 f6">
              <span>
                {intl.formatMessage({
                  id: 'store/my-organization.my-user.table-title.role',
                })}
              </span>
            </div>
            <div className="pt3 b">
              <span>
                {pathOr('', ['roleId_linked', 'label'], orgAssignment)}
              </span>
            </div>
          </div>
          <div className="fl w-20 pa2">
            <div className="pt2 f6">
              <span>
                {intl.formatMessage({
                  id: 'store/my-organization.my-user.table-title.status',
                })}
              </span>
            </div>
            <div className="pt3">
              <span>
                {isApprovedUser ? (
                  <Tag type="success" variation="low">
                    {intl.formatMessage({
                      id:
                        'store/my-organization.my-organization.status.approved',
                    })}
                  </Tag>
                ) : (
                  <Tag type="warning" variation="low">
                    {intl.formatMessage({
                      id:
                        'store/my-organization.my-organization.status.not-approved',
                    })}
                  </Tag>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  return loading ? (
    <div key="loading-" />
  ) : (
    <div
      id={`item-${orgAssignment.id}`}
      key={`item-key-${orgAssignment.id}`}
      className={`${styles.collapsibleWrapper} bg-muted-5 ma3 ba b--black-10`}>
      <Collapsible
        header={userContent()}
        onClick={toggleOpen}
        isOpen={isOpen}
        align="right"
        caretColor="muted">
        <div className="center bg-white bt b--black-10 pt3">
          <div className="flex cf ph2-ns">
            <div className="flex-column fl w-70 pa5 f6">
              <span>
                {isAdminUserListItem && (
                  <Tag type="success" variation="low">
                    {intl.formatMessage({
                      id:
                        'store/my-organization.my-organization.status.isOrgAdmin',
                    })}
                  </Tag>
                )}
              </span>
            </div>
            <div className="flex-column fl w-30">
              {!isDefaultAssignment &&
              (isCurrentUserAdmin || !isAdminUserListItem) ? (
                <div className="pt5 pb5 pr3">
                  <div className="pa2 w-100">
                    <Button
                      variation="tertiary"
                      size="small"
                      onClick={() => edit(orgAssignment.id)}
                      block>
                      {intl.formatMessage({
                        id: 'store/my-organization.my-user.table-title.edit',
                      })}
                    </Button>
                  </div>
                  <div className="pa2 w-100">
                    <Button
                      variation="danger-tertiary"
                      size="small"
                      onClick={() => deleteAssignment(orgAssignment.id)}
                      block>
                      {intl.formatMessage({
                        id: 'store/my-organization.my-user.table-title.delete',
                      })}
                    </Button>
                  </div>
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      </Collapsible>
    </div>
  )
}

export default injectIntl(UserListItem)
