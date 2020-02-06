# My Organization

This application allows you to create organization and manage users under that organization with diffrent roles. 

## Usage

Add this app to your theme dependencies:

```js
// manifest.json
// ...
  "dependencies": {
    // ...
    "vtex.my-users": "0.x"
  }
```

## Master data tables and schemas

You should have created these master data entities and schemas in order to use this application

> **_NOTE:_**  `BusinessRole` master data entity should be created and `Manager` role with required permissions should be exist before install this application. Follow [this article](https://github.com/clouda-inc/vtex-admin-authorization) if you need more help on creating roles with permission

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
            "type": "array",
            "items": {
                "$ref": "#/definitions/permission"
            }
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

<details><summary>Persona</summary>

``` 

Data Entity Name: Persona
Schema Name: persona-schema-v1

{
	"properties": {
		"businessOrganizationId": {
			"type": "string",
			"link": "http://api.vtex.com/biscoindqa/dataentities/BusinessOrganization/schemas/business-organization-schema-v1"
		},
		"email": {
			"type": "string",
			"format": "email"
		}
	},
	"v-default-fields": [
		"id",
		"businessOrganizationId",
		"businessOrganizationId_linked",
		"email"
	],
	"required": [
		"businessOrganizationId",
		"email"
	],
	"v-indexed": [
		"businessOrganizationId",
		"email"
	],
	"v-security": {
		"allowGetAll": true,
		"publicRead": [
			"id",
			"businessOrganizationId",
			"businessOrganizationId_linked",
			"email"
		],
		"publicWrite": [
			"businessOrganizationId",
			"email"
		],
		"publicFilter": [
			"id",
			"businessOrganizationId",
			"email"
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

<details><summary>OrgAssignment</summary>

``` 

Data Entity Name: OrgAssignment
Schema Name: organization-assignment-schema-v1

{
	"properties": {
		"personaId": {
			"type": "string",
			"link": "http://api.vtex.com/biscoindqa/dataentities/Persona/schemas/persona-schema-v1"
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
		"personaId",
		"id",
		"businessOrganizationId",
		"roleId",
		"status"
	],
	"required": [
		"personaId",
		"businessOrganizationId",
		"roleId",
		"status"
	],
	"v-indexed": [
		"personaId",
		"businessOrganizationId",
		"roleId"
	],
	"v-security": {
		"allowGetAll": true,
		"publicRead": [
			"personaId",
			"personaId_linked",
			"id",
			"businessOrganizationId",
			"businessOrganizationId_linked",
			"roleId",
			"roleId_linked",
			"status"
		],
		"publicWrite": [
			"id",
			"personaId",
			"businessOrganizationId",
			"roleId",
			"status"
		],
		"publicFilter": [
			"personaId",
			"id",
			"businessOrganizationId",
			"roleId",
			"status"
		]
	}
}

```
</details>


