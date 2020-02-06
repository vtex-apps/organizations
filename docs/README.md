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

You should have these master data tables in order to use this application

### Roles (`BusinessRole`)
`BusinessRole` master data entity should be created and `Manager` role with required permissions should be exist before install this application. Follow [this article](https://github.com/clouda-inc/vtex-admin-authorization) if you need more help on creating roles with permission

<details><summary>Roles Schema</summary>

``` 
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



If the user does not have an organization, he will have the option to create one. If he already has one he will see te list of users he has added
and the option to add, edit users.
