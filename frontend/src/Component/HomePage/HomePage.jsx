import React from "react";
import { Link } from "react-router-dom";
import styles from "./HomePage.module.css";
import { useAuth } from "../Auth/Authcontext";

const fileTypes = ["Images", "Audio", "Video", "PDF", "Word", "Excel", "PowerPoint"];

const features = [
    {
        icon: "🔒",
        title: "Private to you",
        text: "Every file is tied to your account. Nobody else can see, open or delete what you upload.",
    },
    {
        icon: "📤",
        title: "Upload in bulk",
        text: "Drop in up to 5 files at once, 5 MB each. If one fails, the rest still go through.",
    },
    {
        icon: "🧹",
        title: "Clean up fast",
        text: "Select as many files as you like and delete them together, or remove one at a time.",
    },
];

const HomePage = () => {
    const { user } = useAuth();
    const firstName = user?.name?.split(" ")[0];

    return (
        <div className={styles.main}>
            <section className={styles.hero}>
                <h1 className={styles.title}>
                    {user ? `Welcome back, ${firstName}` : "Your files, all in one place"}
                </h1>
                <p className={styles.subtitle}>
                    {user
                        ? "Upload something new or tidy up what you already have."
                        : "PersonalDrive stores your images, documents, audio and video in the cloud, so you can open them from anywhere."}
                </p>

                <div className={styles.cta}>
                    {user ? (
                        <>
                            <Link to="/upload" className={`${styles.btn} ${styles.primary}`}>Upload files</Link>
                            <Link to="/files" className={`${styles.btn} ${styles.secondary}`}>My files</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/signup" className={`${styles.btn} ${styles.primary}`}>Create free account</Link>
                            <Link to="/login" className={`${styles.btn} ${styles.secondary}`}>Log in</Link>
                        </>
                    )}
                </div>
            </section>

            <section className={styles.types} aria-label="Supported file types">
                <p className={styles.typesLabel}>Works with</p>
                <ul className={styles.chips}>
                    {fileTypes.map((t) => (
                        <li key={t} className={styles.chip}>{t}</li>
                    ))}
                </ul>
            </section>

            <section className={styles.features}>
                {features.map((f) => (
                    <article key={f.title} className={styles.feature}>
                        <div className={styles.featureIcon} aria-hidden="true">{f.icon}</div>
                        <h3 className={styles.featureTitle}>{f.title}</h3>
                        <p className={styles.featureText}>{f.text}</p>
                    </article>
                ))}
            </section>
        </div>
    );
};

export default HomePage;