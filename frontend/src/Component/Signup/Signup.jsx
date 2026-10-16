import React, { useState } from 'react';
import styles from "./Signup.module.css";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config"

const Signup = () => {
  const navigate = useNavigate();

  const [data, setdata] = useState();
  const [err, seterr] = useState();
  const [isloading, setisloading] = useState(false);


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    seterr("");
    setdata("");

    if (formData.name.trim().length < 3) {
      seterr("Name must be at least 3 characters");
      return;
    }

    if (!formData.email.includes("@gmail.com")) {
      seterr("Enter a valid email");
      return;
    }

    if (formData.password.length < 6) {
      seterr("Password must be at least 6 characters");
      return;
    }

    try {
      setisloading(true);
      const register = await fetch(`${API_URL}/user/signup`, {
        credentials: "include",
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await register.json();

      if (result.success) {
        setdata(result.msg || "Otp Sent Successfully");
        navigate("/verify-otp", { state: { email: formData.email, msg: result.msg } })
      } else {
        seterr(result.msg || "Some Error Occured While Signup")
      }

    } catch (err) {
      seterr(err.message || "internal server error");
    } finally {
      setisloading(false);
    }

  }


  return (
    <div className={styles.main}>

      {err && <p className={styles.error}>{err}</p>}
      {data && <p className={styles.success}>{data}</p>}
      {isloading && <p className={styles.loading}>Loading...</p>}

      <div className={styles.heading}>SignUp</div>

      <div className={styles.form}>

        <form onSubmit={handleSubmit} className={styles.formPage}>
        
          <div className={styles.field}>
            <label htmlFor="name">Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} />
          </div>

          <button className={styles.button} disabled={isloading}>Submit</button>

          <Link to="/login" className={styles.link}>Already have an account? Login</Link>
          
        </form>
      </div>
    </div>
  )
}

export default Signup