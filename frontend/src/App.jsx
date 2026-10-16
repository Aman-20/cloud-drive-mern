import React from 'react'
import styles from "./App.module.css";

import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';

import Signup from './Component/Signup/Signup';
import Navbar from './Component/Navbar/Navbar';
import Login from "./Component/Login/Login";
import VerifyOtp from './Component/VerifyOtp/VerifyOtp';
import ForgotPass from './Component/ForgotPass/ForgotPass';
import ResestPass from './Component/ResetPass/ResestPass';

import { ProtectedRoute } from './Component/ProtectedRoute';
import { RedirectIfAuth } from './Component/RedirectIfAuth';
import { useAuth } from './Component/Auth/Authcontext';

import NotFound from './Component/NotFound/NotFound';
import HomePage from './Component/HomePage/HomePage';


const App = () => {

  const {loading} = useAuth();
  if (loading) {
    return (
      <div className={styles.loaderPage}>
        <img src="/auth-loader.svg" alt="Loading" width="110" height="110" />
        <p className={styles.loadingText}>Waking up the server…</p>
      </div>
    )
  }

  return (
    <>
    <Router>

      <Navbar/>

      <Routes>
        <Route path="/" element={ <ProtectedRoute> <HomePage/> </ProtectedRoute> }/>
        
        <Route path="/signup" element={ <RedirectIfAuth> <Signup/> </RedirectIfAuth> }/>
        <Route path="/login" element={ <RedirectIfAuth> <Login/> </RedirectIfAuth> }/>

        <Route path='/verify-otp' element={ <VerifyOtp/> } />

        <Route path="/forgot-password" element={ <RedirectIfAuth> <ForgotPass/> </RedirectIfAuth> } />
        <Route path="/reset-password/:token" element={ <RedirectIfAuth>  <ResestPass/> </RedirectIfAuth> } />

        <Route path='*' element={<NotFound/>} />
      </Routes>
      
    </Router>
    </>
  )
}

export default App