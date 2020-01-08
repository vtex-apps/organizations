import React, { useState } from 'react'
import { pathOr } from 'ramda'
import { Layout, PageHeader, PageBlock, Input, Button } from 'vtex.styleguide'
import { useMutation } from 'react-apollo'
import CREATE_DOCUMENT from '../graphql/createDocument.graphql'
import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'

interface Props {
  userId: string
  organizationCreated: Function
}

const AddOrganization = (props: Props) => {
  const [name, setName] = useState('')
  const [telephone, setTelephone] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')

  const [addOrganization] = useMutation(CREATE_DOCUMENT)
  const [addOrganizationAssignment] = useMutation(CREATE_DOCUMENT)
  const [editUser] = useMutation(UPDATE_DOCUMENT)

  const getOrganizationFields = () => {
    return [
      { key: 'name', value: name },
      { key: 'telephone', value: telephone },
      { key: 'address', value: address },
      { key: 'email', value: email },
    ]
  }

  const getOrganizationAssignmentFields = (organizationId: string) => {
    return [
      { key: 'clientId', value: props.userId },
      { key: 'businessOrganizationId', value: organizationId },
      { key: 'status', value: 'DEFAULT' },
    ]
  }

  const getUpdateUserFields = (organizationId: string) => {
    return [
      { key: 'id', value: props.userId },
      { key: 'organizationId', value: organizationId },
    ]
  }

  const createOrganization = async () => {
    const organizationResponse = await addOrganization({
      variables: {
        acronym: 'BusinessOrganization',
        document: { fields: getOrganizationFields() },
        schema: 'business-organization-schema-v1',
      },
    })

    const organizationId = pathOr(
      '',
      ['data', 'createDocument', 'cacheId'],
      organizationResponse
    )

    if (!organizationId || organizationId === '') {
      return
    }

    await addOrganizationAssignment({
      variables: {
        acronym: 'OrganizationAssignment',
        document: { fields: getOrganizationAssignmentFields(organizationId) },
        schema: 'organization-assignment-schema-v1',
      },
    })

    await editUser({
      variables: {
        acronym: 'CL',
        document: { fields: getUpdateUserFields(organizationId) },
      },
    })

    props.organizationCreated()
  }

  return (
    <Layout
      fullWidth
      pageHeader={
        <PageHeader title="Create Organization" linkLabel="Return"></PageHeader>
      }>
      <PageBlock>
        <div className="mb5">
          <Input
            placeholder="Organization name"
            dataAttributes={{ 'hj-white-list': true }}
            label="Name"
            value={name}
            onChange={(e: any) => setName(e.target.value)}
          />
        </div>
        <div className="mb5">
          <Input
            placeholder="Telephone"
            dataAttributes={{ 'hj-white-list': true }}
            label="Telephone"
            value={telephone}
            onChange={(e: any) => setTelephone(e.target.value)}
          />
        </div>
        <div className="mb5">
          <Input
            placeholder="Address"
            dataAttributes={{ 'hj-white-list': true }}
            label="Address"
            value={address}
            onChange={(e: any) => setAddress(e.target.value)}
          />
        </div>
        <div className="mb5">
          <Input
            placeholder="Organization email"
            dataAttributes={{ 'hj-white-list': true }}
            label="Email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb5">
          <Button variation="primary" onClick={() => createOrganization()}>
            Save
          </Button>
        </div>
      </PageBlock>
    </Layout>
  )
}

export default AddOrganization
