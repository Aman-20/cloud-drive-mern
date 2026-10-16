import React, { useState } from 'react'
import styles from "./ResetPass.module.css";
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { API_URL } from "../../config"

const ResestPass = () => {
    const navigate = useNavigate();

    const { token } = useParams();


    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");

    const [err, seterr] = useState("");
    const [info, setinfo] = useState("");
    const [loading, setloading] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();

        seterr("");
        setinfo("");

        if (confirmPass != newPass) {
            seterr("Password Does not match");
            return;
        }

        if (newPass.length < 6) {
            seterr("Password must be at least 6 characters");
            return;
        }

        try {
            setloading(true);
            const changePass = await fetch(`${API_URL}/user/reset-password`, {
                credentials: "include",
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ token, newPass }),
            });

            const result = await changePass.json();

            if (result.success) {
                setinfo(result.msg);
                setTimeout(() => { navigate("/login") }, 2000);
            } else {
                seterr(result.msg);
            }
        } catch (err) {
            seterr(err.message || "something went wrong! Please try again");
        } finally {
            setloading(false);
        }
    }


    if (!token) {
        return <p>Invalid or incomplete reset link. Please request a new one.</p>;
    }

    return (
        <div className={styles.main}>
            {info && <p className={styles.success}>{info}</p>}
            {err && <p className={styles.error}>{err}</p>}
            {loading && <p className={styles.loading}>Loading...</p>}

            <div className={styles.head}>Reset Password</div>

            <div className={styles.formPage}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="password"
                        placeholder="Enter your new Password"
                        className={styles.input}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Confirm your new Password"
                        className={styles.input}
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                    />

                    <button className={styles.button} disabled={loading}>Change Password</button>
                </form>
            </div>
        </div>
    )
}

export default ResestPass