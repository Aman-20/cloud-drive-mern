import React from 'react'
import {Navigate} from "react-router-dom";
import { useAuth } from './Auth/Authcontext';

export const RedirectIfAuth = ({children}) => {
    const {user, loading} = useAuth();

    if(loading){
      return <p>Loading...</p>
    }

    if(user){
        return <Navigate to="/" replace/>
    }
  return children
}
