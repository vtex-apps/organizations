import React, { Fragment } from 'react'
import { Route } from 'react-router-dom'
// Your component pages
import MyUsers from './components/MyUsers'

const MyUsersPage = () => (
  <Fragment>
    {/* This `path` will be added at the end of the URL */}
    <Route path="/users" exact component={MyUsers} />
  </Fragment>
)

export default MyUsersPage
