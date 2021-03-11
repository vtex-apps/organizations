import React from 'react'
import { Route } from 'react-router-dom'
import { ToastProvider } from 'vtex.styleguide'
import MyOrganization from './components/MyOrganization'

const MyOrganizationPage = () => {
  return (
    <ToastProvider positioning="window">
      <Route
        path="/myorganization"
        exact
        component={() => <MyOrganization />}
      />
    </ToastProvider>
  )
}

export default MyOrganizationPage
