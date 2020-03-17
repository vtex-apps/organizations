import React, { useState } from 'react'
import { pathOr } from 'ramda'
import { useQuery } from 'react-apollo'
import DOCUMENTS from '../graphql/documents.graphql'
import {
  CLIENT_ACRONYM,
  CLIENT_FIELDS,
  ASSIGNMENT_STATUS_APPROVED,
  ASSIGNMENT_STATUS_DECLINED,
} from '../utils/const'
import { Collapsible, Tag, Button } from 'vtex.styleguide'
import { documentSerializer } from '../utils/documentSerializer'

import { injectIntl } from 'react-intl'

import styles from '../my-organization.css'

interface Props {
  isDefaultAssignment: boolean
  orgAssignment: OrganizationAssignment
  intl: any
  edit: (assignmentId: string) => void
  reInvite: (assignmentId: string) => void
  deleteAssignment: (assignmentId: string) => void
}

const UserListItem = ({
  isDefaultAssignment,
  orgAssignment,
  edit,
  reInvite,
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
                  id: 'store/my-users.my-user.table-title.email',
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
                  id: 'store/my-users.my-user.table-title.role',
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
                  id: 'store/my-users.my-user.table-title.status',
                })}
              </span>
            </div>
            <div className="pt3">
              <span>
                {orgAssignment.status === ASSIGNMENT_STATUS_DECLINED ? (
                  <Tag type="error" variation="low">
                    Rejected
                  </Tag>
                ) : orgAssignment.status === ASSIGNMENT_STATUS_APPROVED ? (
                  <Tag type="success" variation="low">
                    Accepted
                  </Tag>
                ) : (
                  <Tag type="warning" variation="low">
                    Pending
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
    <div />
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
            <div className="flex-column fl w-70">
              <div className="flex-row pa3 w-100">
                <div className="pt2 f6">
                  <span>
                    {intl.formatMessage({
                      id: 'store/my-users.my-user.table-title.isAdmin',
                    })}
                  </span>
                </div>
                <div className="pt3 b flex flex-column">
                  {client && client.isOrgAdmin && client.isOrgAdmin === 'true'
                    ? intl.formatMessage({
                        id: 'store/my-users.my-user.table-title.isAdmin.yes',
                      })
                    : intl.formatMessage({
                        id: 'store/my-users.my-user.table-title.isAdmin.no',
                      })}
                </div>
              </div>
            </div>
            <div className="flex-column fl w-30">
              {!isDefaultAssignment ? (
                <div className="pt5 pb5 pr3">
                  <div className="pa2 w-100">
                    <Button
                      variation="tertiary"
                      size="small"
                      onClick={() => edit(orgAssignment.id)}
                      block>
                      {intl.formatMessage({
                        id: 'store/my-users.my-user.table-title.edit',
                      })}
                    </Button>
                  </div>
                  {orgAssignment.status === ASSIGNMENT_STATUS_DECLINED ? (
                    <div className="pa2 w-100">
                      <Button
                        variation="tertiary"
                        size="small"
                        onClick={() => reInvite(orgAssignment.id)}
                        block>
                        {intl.formatMessage({
                          id: 'store/my-users.my-user.table-title.invite',
                        })}
                      </Button>
                    </div>
                  ) : (
                    <div />
                  )}
                  <div className="pa2 w-100">
                    <Button
                      variation="danger-tertiary"
                      size="small"
                      onClick={() => deleteAssignment(orgAssignment.id)}
                      block>
                      {intl.formatMessage({
                        id: 'store/my-users.my-user.table-title.delete',
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
