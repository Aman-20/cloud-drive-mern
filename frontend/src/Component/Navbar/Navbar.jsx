import React from 'react'
import styles from "./Navbar.module.css"
import { Link, useNavigate } from 'react-router-dom'
import {useAuth} from "../Auth/Authcontext";

import {API_URL} from "../../config"

const Navbar = () => {
  const {fetchAuth, user} = useAuth();

  const handleLogout = async() =>{
    try{
      await fetch(`${API_URL}/user/logout`, {
        credentials:"include",
        method:"POST",
      });
    } catch(err){
      console.log(err);
    } finally{
      await fetchAuth();
    }
  }

  return (
    <div className={styles.main}>
      <div className={styles.head}>Dashboard</div>
  
      <div className={styles.links}>
        {user ? (
          <button onClick={handleLogout} className={`${styles.btn} ${styles.logout}`}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/signup" className={`${styles.btn} ${styles.signup}`}>SignUp</Link>
            <Link to="/login" className={`${styles.btn} ${styles.login}`}>Login</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default Navbar