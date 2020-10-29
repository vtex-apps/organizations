export const CLIENT_ACRONYM = 'CL'
export const CLIENT_FIELDS = [
  'id',
  'email',
  'budgetAmount',
  'approved',
  'isOrgAdmin',
  'organizationId',
]
export const PROFILE_FIELDS = 'isOrgAdmin,organizationId'

export const BUSINESS_ROLE = 'BusinessRole'
export const BUSINESS_ROLE_FIELDS = ['id', 'name', 'label']
export const BUSINESS_ROLE_SCHEMA = 'business-role-schema-v1'

export const ORG_ASSIGNMENT = 'UserOrganization'
export const ORG_ASSIGNMENT_FIELDS = [
  'id',
  'email',
  'budgetAmount',
  'businessOrganizationId',
  'businessOrganizationId_linked',
  'status',
  'roleId',
  'roleId_linked',
]
export const ORG_ASSIGNMENT_SCHEMA = 'user-organization-schema-v1'

export const BUSINESS_ORGANIZATION = 'BusinessOrganization'
export const BUSINESS_ORGANIZATION_FIELDS = [
  'id',
  'name',
  'telephone',
  'address',
  'email',
]
export const BUSINESS_ORGANIZATION_SCHEMA = 'business-organization-schema-v1'

export const ORG_ASSIGNMENT_STATUS_APPROVED = 'APPROVED'
