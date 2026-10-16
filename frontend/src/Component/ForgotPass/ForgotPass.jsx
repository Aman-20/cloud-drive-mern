import React, { useState } from 'react';
import styles from "./ForgotPass.module.css";
import { Link } from 'react-router-dom';

import { API_URL } from "../../config"

const ForgotPass = () => {
    const [data, setdata] = useState("");

    const [err, seterr] = useState("");
    const [info, setinfo] = useState("");
    const [loading, setloading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        seterr("");
        setinfo("");

        if (!data.includes("@gmail.com")) {
            seterr("Please Enter a valid email");
            return;
        }

        try {
            setloading(true);
            const reset = await fetch(`${API_URL}/user/forgot-password`, {
                credentials: "include",
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: data }),
            });

            const result = await reset.json();

            if (result.success) {
                setinfo(result.msg || "reset link sent to your email");
            } else {
                seterr(result.msg || "unable to sent reset link");
            }
        } catch (err) {
            seterr(err.message || "internal server error");
        } finally {
            setloading(false);
        }
    }

    return (
        <div className={styles.main}>
            {err && <p className={styles.error}>{err}</p>}
            {info && <p className={styles.success}>{info}</p>}
            {loading && <p className={styles.loading}>Loading...</p>}

            <div className={styles.head}>Forgot Password</div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    type="email"
                    placeholder="Enter your Email"
                    className={styles.input}
                    value={data}
                    onChange={(e) => setdata(e.target.value)}
                />

                <button className={styles.button} disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <div className={styles.link}>
                    <Link to="/login">Login</Link>
                    <Link to="/signup">Signup</Link>
                </div>
            </form>
        </div>
    )
}

export default ForgotPass