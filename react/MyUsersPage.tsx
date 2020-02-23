import React, { Fragment } from 'react'
import { Route } from 'react-router-dom'
import { ToastProvider } from 'vtex.styleguide'
import MyOrganization from './components/MyOrganization'

const MyUsersPage = () => {
  
  return (
    <Fragment>
      <ToastProvider positioning="window">
        <Route
          path="/users"
          exact
          component={() => (
            <MyOrganization />
          )}
        />
      </ToastProvider>
    </Fragment>
  )
}

export default MyUsersPage
