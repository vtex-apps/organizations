# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2020-11-23

## [1.2.0] - 2020-10-29

## [1.1.2] - 2020-10-29
### Added
- Budget amount field on user edit/create

## [1.1.1] - 2020-08-24

## [1.1.0] - 2020-08-19

### Changed
- Users list pagination

### Fixed
- Organization page not loading issue fixed

## [1.0.0] - 2020-04-03
### Changed
- Remove organization assignment status
- Delete organization assignment on leave
- Update `approved` status on `CL` on create or delete users

### Fixed
- Fix create organization not showing for admin users issue

## [1.0.0] - 2020-03-18
### Fixed
- Fixed CSS handles typing issue
- Fixed linting issues

### Added
- Added functionality to transfer admin privilege (only admin users can transfer his privilege to others)
- Added `organization` and `isOrgAdmin` columns to `CL` master data table

### Changed
- Show notification if user is already assigned to some other organization
- Create organization assignment with `APPROVED` status
- Add checkbox to change `isOrgAdmin` in Add and Edit users in organization
- Rename collection `OrgAssignment` to `UserOrganization`
- Remove `persona` from `user-organization-schema-v1` and added `email` to identify the user
- Rename schema `organization-assignment-schema-v1` to `user-organization-schema-v1`

### Removed
- Removed `persona` entity
- Remove pending organization request feature


## [0.0.3] - 2020-02-28
### Added
- Auto reload until changes reflect on the web page
- Use `document-graphql` application to query master data instead of `vtex.store-graphql` application

## [0.0.2] - 2020-02-13

## [0.0.1] - 2020-02-13
### Added
- Delete, edit and reinvite users in organization functionality
- Approve and reject user pending requests
- Add users to the organization functionality
- Create organization functionality
- Master data collections and schemas added
    * `BusinessRole` with schema name `business-role-schema-v1`
    * `Persona` with schema name `persona-schema-v1`
    * `BusinessOrganization` with schema name `business-organization-schema-v1`
    * `OrgAssignment` with schema name `organization-assignment-schema-v1`

