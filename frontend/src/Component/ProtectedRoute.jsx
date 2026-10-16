import React from 'react';
import {useAuth} from "../Component/Auth/Authcontext";
import {Navigate} from "react-router-dom";

export const ProtectedRoute = ({children}) => {
    
    const {user, loading} = useAuth();

    if(loading){
        return <p>Loading...</p>
    }

    if(!user){
        return <Navigate to="/login" replace />
    }

  return children;
}
