import React, { useRef, useEffect } from 'react'
import { Route } from 'react-router-dom'
import { ToastProvider } from 'vtex.styleguide'
import MyOrganization from './components/MyOrganization'

const MyUsersPage = () => {
  
  const first_load = useRef(false)

  useEffect(() => {
    if(!first_load.current){
      console.log('this is route first load')
      first_load.current = false
    }
  })

  return (
      <ToastProvider positioning="window">
        <Route
          path="/users"
          exact
          component={() => (
            <MyOrganization />
          )}
        />
      </ToastProvider>
  )
}

export default MyUsersPage
