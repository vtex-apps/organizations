import React from 'react'
import { Route } from 'react-router-dom'
import { ToastProvider } from 'vtex.styleguide'
import MyOrganization from './components/MyOrganization'

const MyUsersPage = () => {
  return (
    <ToastProvider positioning="window">
      <Route path="/users" exact component={() => <MyOrganization />} />
    </ToastProvider>
  )
}

export default MyUsersPage
