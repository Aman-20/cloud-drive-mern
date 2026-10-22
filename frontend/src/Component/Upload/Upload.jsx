import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Upload.module.css";
import { API_URL } from "../../config";

const MAX_SIZE = 5 * 1024 * 1024; // must match multer limit on the backend
const MAX_FILES = 5;

const Upload = () => {
  const [single, setSingle] = useState(null);
  const [multiple, setMultiple] = useState([]);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(false);

  const singleRef = useRef(null);
  const multipleRef = useRef(null);

  const fail = (text) => setStatus({ type: "error", text });

  const handleSingleUpload = async () => {
    if (!single) return fail("Choose a file first");
    if (single.size > MAX_SIZE) return fail(`${single.name} is larger than 5 MB`);

    const formData = new FormData();
    formData.append("avatar", single);
    await send(`${API_URL}/file/upload`, formData);
  };

  const handleMultipleUpload = async () => {
    if (multiple.length === 0) return fail("Choose at least one file");
    if (multiple.length > MAX_FILES) return fail(`You can upload up to ${MAX_FILES} files at once`);
    const tooBig = multiple.find((f) => f.size > MAX_SIZE);
    if (tooBig) return fail(`${tooBig.name} is larger than 5 MB`);

    const formData = new FormData();
    multiple.forEach((file) => formData.append("avatar", file));
    await send(`${API_URL}/file/upload-multiple`, formData);
  };

  const resetInputs = () => {
    setSingle(null);
    setMultiple([]);
    if (singleRef.current) singleRef.current.value = "";
    if (multipleRef.current) multipleRef.current.value = "";
  };

  const send = async (api, formData) => {
    try {
      setLoading(true);
      setFailures([]);
      setStatus({ type: "info", text: "Uploading..." });

      const response = await fetch(api, {
        method: "POST",
        credentials: "include", // sends the auth cookie
        body: formData,
      });
      const data = await response.json();

      // whole request failed (auth, multer error, nothing uploaded, ...)
      if (!response.ok || !data.success) {
        const failed = (data.results || []).filter((r) => !r.success);
        setFailures(failed);
        return fail(data.msg || "Upload failed");
      }

      // multiple upload: some files may have failed
      if (data.results) {
        setFailures(data.results.filter((r) => !r.success));
        setStatus({
          type: data.failed ? "info" : "success",
          text: `${data.count} uploaded${data.failed ? `, ${data.failed} failed` : ""}`,
        });
      } else {
        setStatus({ type: "success", text: `${data.file.originalName} uploaded` });
      }

      resetInputs();
    } catch (err) {
      console.log(err);
      fail(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>PersonalDrive</h1>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Upload Single</h3>
        <input
          ref={singleRef}
          className={styles.fileInput}
          type="file"
          onChange={(e) => setSingle(e.target.files[0] || null)}
        />
        <button className={styles.button} onClick={handleSingleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Upload Multiple</h3>
        <input
          ref={multipleRef}
          className={styles.fileInput}
          type="file"
          multiple
          onChange={(e) => setMultiple(Array.from(e.target.files))}
        />
        {multiple.length > 0 && (
          <ul className={styles.fileList}>
            {multiple.map((f) => (
              <li key={f.name + f.size + f.lastModified}>{f.name}</li>
            ))}
          </ul>
        )}
        <button className={styles.button} onClick={handleMultipleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {status.text && (
        <div className={`${styles.status} ${styles[status.type]}`} role="status">
          <p>{status.text}</p>
          {failures.length > 0 && (
            <ul className={styles.failList}>
              {failures.map((f) => (
                <li key={f.name}>
                  {f.name}: {f.error || f.msg}
                </li>
              ))}
            </ul>
          )}
          {status.type === "success" && (
            <Link to="/files" className={styles.link}>View my files</Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;