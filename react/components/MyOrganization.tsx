import React, { useEffect, useState, Fragment } from 'react' //Fragment
import { useQuery, useApolloClient } from 'react-apollo' //useMutation
import {
  EmptyState,
  // PageBlock,
  // PageHeader,
  // Layout,
  Alert,
  ToastConsumer,
} from 'vtex.styleguide'
import { injectIntl } from 'react-intl'

import { pathOr } from 'ramda' //find, propEq, filter, reject
// import MyUsers from './MyUsers'
import AddOrganization from './AddOrganization'
// import MyPendingAssignments from './MyPendingAssignments'
// import DefaultAssignmentInfo from './DefaultAssignmentInfo'

import DOCUMENTS from '../graphql/documents.graphql'
// import UPDATE_DOCUMENT from '../graphql/updateDocument.graphql'
// import DELETE_DOCUMENT from '../graphql/deleteDocument.graphql'

import { documentSerializer } from '../utils/documentSerializer'
// import {
//   updateCacheOrgAssignmentStatus,
//   updateCachePersonaOrgId,
//   updateCacheDeleteAssignment,
// } from '../utils/cacheUtils'

// import documentQuery from './graphql/documents.graphql'
import profileQuery from '../graphql/getProfile.graphql'

import {
  PERSONA_ACRONYM,
  PERSONA_SCHEMA,
  // BUSINESS_ROLE,
  // BUSINESS_ROLE_FIELDS,
  // BUSINESS_ROLE_SCHEMA,
  // ORG_ASSIGNMENT,
  // ORG_ASSIGNMENT_FIELDS,
  // ORG_ASSIGNMENT_SCHEMA,
  // ASSIGNMENT_STATUS_APPROVED,
  // ASSIGNMENT_STATUS_PENDING,
  // ASSIGNMENT_STATUS_DECLINED,
  PERSONA_FIELDS,
} from '../utils/const'
// import { handleGlobalError } from '../utils/graphqlErrorHandler'

interface Props {
  intl: any
}

const MyOrganization = ({ intl }: Props) => {
  const [personaId, setPersonaId] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [email, setEmail] = useState('')

  const [showOrganizationReload, setShowOrganizationReload] = useState(false)
  const client = useApolloClient()
  // const [updateDocument] = useMutation(UPDATE_DOCUMENT)
  // const [deleteDocument] = useMutation(DELETE_DOCUMENT)
  // const [updateOrgAssignmentStatus] = useMutation(UPDATE_DOCUMENT)
  // const [updatePersonaOrgId] = useMutation(UPDATE_DOCUMENT)

  const { data: profileData, loading: profileLoading, error: profileError } = useQuery(profileQuery)

  const {data: personaData, loading: personaLoading, error: personaError} = useQuery(DOCUMENTS, {
    skip: pathOr('', ['profile', 'email'], profileData) === '',
    variables: {
      acronym: PERSONA_ACRONYM,
      fields: PERSONA_FIELDS,
      where: `(email=${pathOr('', ['profile', 'email'], profileData)})`,
      schema: PERSONA_SCHEMA,
    },
  })

  useEffect(() => {
    setEmail(pathOr('', ['profile', 'email'], profileData))
  }, [profileData])

  useEffect(() => {
    const persona = documentSerializer(
      personaData ? personaData.myDocuments : []
    )
    setOrganizationId(pathOr('', [0, 'businessOrganizationId'], persona))
    setPersonaId(pathOr('', [0, 'id'], persona))
  }, [personaData])

  const infoUpdated = () => {

    setShowOrganizationReload(true)
  }

  const loadPersona = () => {
    client
    .query({
      query: DOCUMENTS,
      variables: {
        acronym: PERSONA_ACRONYM,
        schema: PERSONA_SCHEMA,
        fields: PERSONA_FIELDS,
        where: `email=${email}`,
      },
      fetchPolicy: "network-only"
    }).then(({data}: any) => {
      const persona = documentSerializer(
        data ? data.myDocuments : []
      )
      if(persona.length !== 0){
        setOrganizationId(pathOr('', [0, 'businessOrganizationId'], persona))
        setPersonaId(pathOr('', [0, 'id'], persona))
      }
    })
  }

    if (
      profileLoading ||
      profileError ||
      personaLoading ||
      personaError 
  ) {
    return (
      <Fragment>
        <EmptyState title={'Loading...'} />
      </Fragment>
    )
  }

  if (organizationId === '') {
    return (
      <div className="mb5 mt5">
        <h2 className="">
          {intl.formatMessage({
            id: 'store/my-users.my-organization.create-new-organization',
          })}
        </h2>

        { showOrganizationReload && (<div className="mb5">
          <Alert type="warning" action={{ label: 'Reload', onClick: loadPersona }} onClose={() => console.log('Closed!')}>
            Reload message
          </Alert>
        </div>)}

        <ToastConsumer>
          {({ showToast }: any) => (
            <AddOrganization
              userEmail={email}
              personaId={personaId}
              updateOrgInfo={infoUpdated}
              showToast={showToast}
            />
          )}
        </ToastConsumer>
      </div>
    )
  }

  return (
    <div>
      {intl.formatMessage({
        id: 'store/my-users.my-organization.create-new-organization',
      })}
      {JSON.stringify(personaData, null, 2)}
    </div>
  )

  // const assignmentFilter =
  //   `(personaId=${personaId}` +
  //   (organizationId !== ''
  //     ? ` OR businessOrganizationId=${organizationId})`
  //     : ')')

  // const {
  //   loading: orgAssignmentLoading,
  //   error: orgAssignmentError,
  //   data: orgAssignmentData,
  // } = useQuery(DOCUMENTS, {
  //   skip: personaId === '',
  //   variables: {
  //     acronym: ORG_ASSIGNMENT,
  //     schema: ORG_ASSIGNMENT_SCHEMA,
  //     fields: ORG_ASSIGNMENT_FIELDS,
  //     where: assignmentFilter,
  //   },
  // })

  // const {
  //   loading: rolesLoading,
  //   error: rolesError,
  //   data: rolesData,
  // } = useQuery(DOCUMENTS, {
  //   skip: personaId === '',
  //   variables: {
  //     acronym: BUSINESS_ROLE,
  //     schema: BUSINESS_ROLE_SCHEMA,
  //     fields: BUSINESS_ROLE_FIELDS,
  //   },
  // })

  // if (
  //   orgAssignmentLoading ||
  //   orgAssignmentError ||
  //   rolesLoading ||
  //   rolesError
  // ) {
  //   return (
  //     <Fragment>
  //       <EmptyState title={'Loading2...'} />
  //     </Fragment>
  //   )
  // }

  // const orgAssignments: OrganizationAssignment[] = orgAssignmentData
  //   ? documentSerializer(orgAssignmentData.myDocuments)
  //   : []

  // const userAssignments =
  //   orgAssignments && personaId
  //     ? filter(propEq('personaId', personaId), orgAssignments)
  //     : []

  // const organizationAssignments =
  //   orgAssignments && organizationId !== ''
  //     ? filter(propEq('businessOrganizationId', organizationId), orgAssignments)
  //     : []

  // const pendingAssignments: OrganizationAssignment[] = filter(
  //   propEq('status', ASSIGNMENT_STATUS_PENDING),
  //   userAssignments
  // )
  // const defaultAssignment: OrganizationAssignment = find(
  //   propEq('businessOrganizationId', organizationId)
  // )(reject(propEq('status', ASSIGNMENT_STATUS_DECLINED), userAssignments))

  // const roles: Role[] = rolesData
  //   ? documentSerializer(rolesData.myDocuments)
  //   : []

  // const userRole =
  //   defaultAssignment && defaultAssignment.roleId
  //     ? find(propEq('id', defaultAssignment.roleId))(roles)
  //     : {}

  // const updateAssignmentStatus = async (
  //   assignmentId: string,
  //   status: string
  // ) => {
  //   return updateOrgAssignmentStatus({
  //     variables: {
  //       acronym: ORG_ASSIGNMENT,
  //       document: {
  //         fields: [
  //           { key: 'id', value: assignmentId },
  //           { key: 'status', value: status },
  //         ],
  //       },
  //       schema: ORG_ASSIGNMENT_SCHEMA,
  //     },
  //     update: (cache: any) =>
  //       updateCacheOrgAssignmentStatus(
  //         cache,
  //         assignmentId,
  //         status,
  //         organizationId,
  //         personaId
  //       ),
  //   })
  //     .then(() => {
  //       const updatedOrgId: string =
  //         status === ASSIGNMENT_STATUS_APPROVED
  //           ? pathOr(
  //               '',
  //               ['businessOrganizationId'],
  //               find(propEq('id', assignmentId))(orgAssignments)
  //             )
  //           : ''
  //       const orgFields: any =
  //         status === ASSIGNMENT_STATUS_APPROVED
  //           ? JSON.stringify(pathOr(
  //               {},
  //               ['businessOrganizationId_linked'],
  //               find(propEq('id', assignmentId))(orgAssignments)
  //             ))
  //           : '{}'
  //       const personaEmail = pathOr(
  //         '',
  //         ['email'],
  //         pathOr(
  //           {},
  //           ['personaId_linked'],
  //           find(propEq('id', assignmentId))(orgAssignments)
  //         )
  //       )

  //       return updatePersonaOrgId({
  //         variables: {
  //           acronym: PERSONA_ACRONYM,
  //           document: {
  //             fields: [
  //               { key: 'id', value: personaId },
  //               { key: 'businessOrganizationId', value: updatedOrgId },
  //             ],
  //           },
  //           schema: PERSONA_SCHEMA,
  //         },
  //         update: (cache: any) =>
  //           updateCachePersonaOrgId(cache, orgFields, personaEmail, personaId),
  //       })
  //     })
  //     .catch(handleGlobalError())
  // }

  // const deleteOrgAssignment = (assignmentId: string) => {
  //   return deleteDocument({
  //     variables: {
  //       acronym: ORG_ASSIGNMENT,
  //       documentId: assignmentId,
  //     },
  //     update: (cache: any, { data }: any) =>
  //       updateCacheDeleteAssignment(cache, data, assignmentId),
  //   })
  //     .then(() => {
  //       const personaEmail = pathOr(
  //         '',
  //         ['email'],
  //         pathOr(
  //           {},
  //           ['personaId_linked'],
  //           find(propEq('id', assignmentId))(orgAssignments)
  //         )
  //       )

  //       return updateDocument({
  //         variables: {
  //           acronym: PERSONA_ACRONYM,
  //           document: {
  //             fields: [
  //               { key: 'id', value: personaId },
  //               { key: 'businessOrganizationId', value: '' },
  //             ],
  //           },
  //           schema: PERSONA_SCHEMA,
  //         },
  //         update: (cache: any) =>
  //           updateCachePersonaOrgId(cache, '{}', personaEmail, personaId),
  //       })
  //     })
  //     .catch(handleGlobalError())
  // }

  // const infoUpdated = () => {

  // }

  // if (personaId == '') {
  //   return (
  //     <ToastConsumer>
  //       {({ showToast }: any) => (
  //         <AddOrganization
  //           userEmail={email}
  //           updateOrgInfo={infoUpdated}
  //           showToast={showToast}
  //         />
  //       )}
  //     </ToastConsumer>
  //   )
  // }

  // return (
  //   <Layout
  //     fullWidth
  //     pageHeader={
  //       <PageHeader title="Organization" linkLabel="Return"></PageHeader>
  //     }>
  //     <ToastConsumer>
  //       {({ showToast }: any) => (
  //         <PageBlock>
  //           <MyPendingAssignments
  //             personaId={personaId}
  //             assignments={pendingAssignments}
  //             defaultAssignment={defaultAssignment}
  //             updateAssignmentStatus={updateAssignmentStatus}
  //             infoUpdated={infoUpdated}
  //             showToast={showToast}
  //           />
  //           {!defaultAssignment && (
  //             <div className="mb5 mt5">
  //               <h2 className="">
  //                 {intl.formatMessage({
  //                   id:
  //                     'store/my-users.my-organization.create-new-organization',
  //                 })}
  //               </h2>
  //               <AddOrganization
  //                 userEmail={email}
  //                 updateOrgInfo={infoUpdated}
  //                 personaId={personaId}
  //                 showToast={showToast}
  //               />
  //             </div>
  //           )}
  //           {defaultAssignment && (
  //             <div>
  //               <DefaultAssignmentInfo
  //                 personaId={personaId}
  //                 defaultAssignment={defaultAssignment}
  //                 assignments={organizationAssignments}
  //                 userRole={userRole}
  //                 updateAssignmentStatus={updateAssignmentStatus}
  //                 deleteOrgAssignment={deleteOrgAssignment}
  //                 infoUpdated={infoUpdated}
  //                 showToast={showToast}
  //               />

  //               {userRole && userRole.name && userRole.name === 'manager' && (
  //                 <div className="flex flex-column mb5 mt5">
  //                   <h2 className="">
  //                     {intl.formatMessage({
  //                       id:
  //                         'store/my-users.my-organization.users-in-organization',
  //                     })}
  //                   </h2>
  //                   <MyUsers
  //                     organizationId={organizationId}
  //                     personaId={personaId}
  //                     showToast={showToast}
  //                   />
  //                 </div>
  //               )}
  //             </div>
  //           )}
  //         </PageBlock>
  //       )}
  //     </ToastConsumer>
  //   </Layout>
  // )
}

export default injectIntl(MyOrganization)
