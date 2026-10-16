import React, { useState } from 'react'
import styles from "./Login.module.css";
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../Auth/Authcontext";

import { API_URL } from "../../config";

const Login = () => {
  const { fetchAuth } = useAuth();

  const navigate = useNavigate();

  const [info, setinfo] = useState("");
  const [err, seterr] = useState("");
  const [isloading, setisloading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    seterr("");
    setinfo("");

    if (!formData.email.trim() || !formData.password.trim()) {
      seterr("Please fill in all fields");
      return;
    }


    try {
      setisloading(true);
      const userlogin = await fetch(`${API_URL}/user/login`, {
        credentials: "include",
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await userlogin.json();

      if (result.success) {
        setinfo(result.msg || "logged in successfully");
        await fetchAuth();
        navigate("/");

      } else {
        console.log(result.msg);
        seterr(result.msg || "unable to login some error occured")
      }

    } catch (err) {
      seterr(err.message || "internal server error");
    } finally {
      setisloading(false);
    }
  }

  return (
    <div className={styles.main}>

      {info && <p className={styles.success}>{info}</p>}
      {err && <p className={styles.error}>{err}</p>}
      {isloading && <p className={styles.loading}>Loading...</p>}

      <div className={styles.heading}>Login</div>

      <div className={styles.form}>
        <form onSubmit={handleSubmit} className={styles.formPage}>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} />
          </div>

          <button className={styles.button} disabled={isloading}>Submit</button>

          <div className={styles.links}>
            <Link to="/forgot-password" className={styles.forgot}>Forgot Password?</Link>
            <Link to="/signup" className={styles.link}>Create account</Link>
          </div>
          
        </form>
      </div>
    </div>
  )
}

export default Login