import { createContext, useContext } from "react";


const AuthContext = createContext();

function useAuth(){
    const context = useContext(AuthContext);
    return context;
}


export {AuthContext, useAuth};