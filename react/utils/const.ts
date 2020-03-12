// export const PERSONA_ACRONYM = 'Persona'
// export const PERSONA_FIELDS = ['id', 'businessOrganizationId']
// export const PERSONA_SCHEMA = 'persona-schema-v1'

export const CLIENT_ACRONYM = 'CL'
export const CLIENT_FIELDS = ['id', 'email', 'isOrgAdmin', 'organizationId']
export const PROFILE_FIELDS = 'isOrgAdmin,organizationId'

export const BUSINESS_ROLE = 'BusinessRole'
export const BUSINESS_ROLE_FIELDS = ['id', 'name', 'label']
export const BUSINESS_ROLE_SCHEMA = 'business-role-schema-v1'

export const ORG_ASSIGNMENT = 'UserOrgAssignment'
export const ORG_ASSIGNMENT_FIELDS = [
  'id',
  'email',
  'businessOrganizationId',
  'businessOrganizationId_linked',
  'status',
  'roleId',
  'roleId_linked',
]
export const ORG_ASSIGNMENT_SCHEMA = 'organization-assignment-schema-v2'

export const BUSINESS_ORGANIZATION = 'BusinessOrganization'
export const BUSINESS_ORGANIZATION_FIELDS = []
export const BUSINESS_ORGANIZATION_SCHEMA = 'business-organization-schema-v1'

export const ASSIGNMENT_STATUS_APPROVED = "APPROVED"
export const ASSIGNMENT_STATUS_DECLINED = "DECLINED"
export const ASSIGNMENT_STATUS_PENDING = "PENDING"

export const ORGANIZATION_STATUS_ACCEPTED = 'ACCEPTED'
export const ORGANIZATION_STATUS_REJECTED = 'REJECTED'
export const ORGANIZATION_STATUS_NOT_RESPONDED = 'NOT_RESPONDED'

