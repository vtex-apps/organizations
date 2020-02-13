export const PERSONA_ACRONYM = 'Persona'
export const PERSONA_FIELDS = ['id', 'businessOrganizationId_linked']
export const PERSONA_SCHEMA = 'persona-schema-v1'

export const BUSINESS_ROLE = 'BusinessRole'
export const BUSINESS_ROLE_FIELDS = ['id', 'name', 'label']
export const BUSINESS_ROLE_SCHEMA = 'business-role-schema-v1'

export const ORG_ASSIGNMENT = 'OrgAssignment'
export const ORG_ASSIGNMENT_FIELDS = [
  'id',
  'personaId',
  'personaId_linked',
  'businessOrganizationId',
  'businessOrganizationId_linked',
  'status',
  'roleId',
  'roleId_linked',
]
export const ORG_ASSIGNMENT_SCHEMA = 'organization-assignment-schema-v1'

export const BUSINESS_ORGANIZATION = 'BusinessOrganization'
export const BUSINESS_ORGANIZATION_FIELDS = []
export const BUSINESS_ORGANIZATION_SCHEMA = 'business-organization-schema-v1'

export const ASSIGNMENT_STATUS_APPROVED = "APPROVED"
export const ASSIGNMENT_STATUS_DECLINED = "DECLINED"
export const ASSIGNMENT_STATUS_PENDING = "PENDING"
