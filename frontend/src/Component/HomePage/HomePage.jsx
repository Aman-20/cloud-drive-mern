import React from 'react'
import styles from './HomePage.module.css'

const HomePage = () => {
    return (
        <div className={styles.main}>
            <div className={styles.card}>
                <div className={styles.icon}>🚀</div>
                <span className={styles.badge}>Stay Tuned</span>
                <h1 className={styles.title}>Coming Soon</h1>
                <p className={styles.text}>
                    I'm working hard to bring something amazing.
                    Please check back again very soon!
                </p>
            </div>
        </div>
    )
}

export default HomePage