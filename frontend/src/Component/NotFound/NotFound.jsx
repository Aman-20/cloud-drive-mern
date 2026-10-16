import React from 'react'
import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

const NotFound = () => {
    return (
        <div className={styles.main}>
            <div className={styles.card}>
                <div className={styles.code}>404</div>
                <h1 className={styles.title}>Page Not Found</h1>
                <p className={styles.text}>
                    Oops! The page you're looking for doesn't exist or may have been moved.
                </p>
                <Link to="/" className={styles.button}>Back To Home Page</Link>
            </div>
        </div>
    )
}

export default NotFound