# My Organization

This application allows you to create organization and manage users under that organization with diffrent roles. 

## Usage

Install this app in your workspace

```js
vtex install vtex.my-organization
```

> **_NOTE:_**  This application is not yet published under `vtex` vendor name, therefore you have to publish this app with your own vendor name or you have to `link` this app to your development workspace directly.
>
> ### Link application to development workspace
> - clone the application to your working environment and checkout to the correct branch (i.e: `dev-master`)
> - link this app to your workspace (`vtex link --verbose`)
>
> ### publish with your vendor name
> - clone the application to your working environment and checkout to the correct branch (i.e: `dev-master`)
> - go to `manufest.json` in your project's root directory and change `vendor` to your current vendor name (i.e: `"vendor": "biscoindqa"`)
> - update the `version` in `manufest.json` if you have published the same version earlier
> - install that published version to your workspace (`vtex install biscoindqa.my-organization`)

## Prerequisites

In order to run this application following master data schemas should be created. 
Use `MASTER DATA API - V2` in vtex api documentation to create those schemas (https://developers.vtex.com/reference#master-data-api-v2-overview)

These schemas are shared among several applications `vtex-admin-authorization`, `vtex-permission-challenge` and `vtex-my-organization`, therefore if you have already created these schemas you can ignore this step

<details><summary>BusinessPermission</summary>

``` 

Data Entity Name: BusinessPermission
Schema Name: business-permission-schema-v1

{
	"properties": {
		"name": {
			"type": "string"
		},
		"label": {
			"type": "string"
		}
	},
	"v-default-fields": [
		"name",
		"label",
		"id"
	],
	"required": [
		"name"
	],
	"v-indexed": [
		"name"
	],
	"v-security": {
		"allowGetAll": true,
		"publicRead": [
			"name",
			"label",
			"id"
		],
		"publicWrite": [
			"name",
			"label"
		],
		"publicFilter": [
			"name",
			"id"
		]
	}
}

```
</details>

<details><summary>BusinessRole</summary>

``` 

Data Entity Name: BusinessRole
Schema Name: business-role-schema-v1

{
	"properties": {
		"name": {
			"type": "string"
		},
		"label": {
			"type": "string"
		},
		"permissions": {
			"type": "string"
		}
	},
	"definitions": {
		"permission": {
			"type": "string"
		}
	},
	"v-default-fields": [
		"name",
		"label",
		"id",
		"permissions"
	],
	"required": [
		"name"
	],
	"v-indexed": [
		"name"
	],
	"v-security": {
		"allowGetAll": true,
		"publicRead": [
			"name",
			"label",
			"permissions",
			"id"
		],
		"publicWrite": [
			"name",
			"label",
			"permissions"
		],
		"publicFilter": [
			"name",
			"id"
		]
	}
}

```
</details>

<details><summary>BusinessOrganization</summary>

``` 

Data Entity Name: BusinessOrganization
Schema Name: business-organization-schema-v1

{
	"properties": {
		"name": {
			"type": "string"
		},
		"telephone": {
			"type": "string"
		},
		"address": {
			"type": "string"
		},
		"email": {
			"type": "string"
		}
	},
	"v-default-fields": [
		"name",
		"telephone",
		"id",
		"address",
		"email"
	],
	"required": [
		"name",
		"telephone"
	],
	"v-indexed": [
		"name",
		"telephone",
		"email"
	],
	"v-security": {
		"allowGetAll": true,
		"publicRead": [
			"name",
			"telephone",
			"id",
			"address",
			"email"
		],
		"publicWrite": [
			"name",
			"telephone",
			"address",
			"email"
		],
		"publicFilter": [
			"name",
			"telephone",
			"id",
			"email"
		]
	}
}

```
</details>

<details><summary>UserOrganization</summary>

``` 

Data Entity Name: UserOrganization
Schema Name: user-organization-schema-v1

{
	"properties": {
		"email": {
			"type": "string"
		},
		"businessOrganizationId": {
			"type": "string",
			"link": "http://api.vtex.com/biscoindqa/dataentities/BusinessOrganization/schemas/business-organization-schema-v1"
		},
		"roleId": {
			"type": "string",
			"link": "http://api.vtex.com/biscoindqa/dataentities/BusinessRole/schemas/business-role-schema-v1"
		},
		"status": {
			"type": "string"
		}
	},
	"v-default-fields": [
		"email",
		"id",
		"businessOrganizationId",
		"roleId",
		"status"
	],
	"required": [
		"email",
		"businessOrganizationId",
		"roleId",
		"status"
	],
	"v-indexed": [
		"email",
		"businessOrganizationId",
		"roleId",
		"status"
	],
	"v-security": {
		"allowGetAll": true,
		"publicRead": [
			"email",
			"id",
			"businessOrganizationId",
			"businessOrganizationId_linked",
			"roleId",
			"roleId_linked",
			"status"
		],
		"publicWrite": [
			"id",
			"email",
			"businessOrganizationId",
			"roleId",
			"status"
		],
		"publicFilter": [
			"email",
			"id",
			"businessOrganizationId",
			"roleId",
			"status"
		]
	},
	"v-triggers": [
		{
			"name": "organization-assignment-accept-email",
			"active": true,
			"condition": "status=APPROVED",
			"action": {
				"type": "email",
				"provider": "default",
				"subject": "Organization Assignment Acceptance",
				"to": [
					"{!email}"
				],
				"bcc": [
					"jayendra@clouda.io",
					"sahan@clouda.io"
				],
				"replyTo": "noreply@company.com",
				"body": "You have been assigned to {!businessOrganizationId_linked.name}."
			}
		},
		{
			"name": "organization-assignment-decline-email",
			"active": true,
			"condition": "status=DECLINED",
			"action": {
				"type": "email",
				"provider": "default",
				"subject": "Organization Assignment Decline",
				"to": [
					"{!email}"
				],
				"bcc": [
					"jayendra@clouda.io",
					"sahan@clouda.io"
				],
				"replyTo": "noreply@company.com",
				"body": "You have left the organization {!businessOrganizationId_linked.name}."
			}
		}
	]
}

```
</details>

### [Deprecated] removed master data collections and schemas
>Data Entity Name: **Persona**, Schema Name: **persona-schema-v1**

>Data Entity Name: **OrgAssignment**, Schema Name: **organization-assignment-schema-v1**

## Important

> **_NOTE:_**  create `Manager` role with required permissions using `vtex-admin-authorization` application (https://github.com/clouda-inc/vtex-admin-authorization)

