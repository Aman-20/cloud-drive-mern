import React, { useEffect, useState } from 'react'
import {API_URL} from "../../config";
import { AuthContext } from './Authcontext';

const Authprovider = ({children}) => {

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    async function fetchAuth() {

        try{
            const result = await fetch(`${API_URL}/user/me`, {
                credentials:"include",
            });
            const data = await result.json();

            if(data.success){
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (err){
            setUser(null);
        } finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAuth();
    }, []);
    

  return (
    <AuthContext.Provider value={{loading, user, fetchAuth}}>{children}</AuthContext.Provider>
  )
}

export default Authprovider