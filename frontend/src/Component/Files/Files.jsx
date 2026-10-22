import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Files.module.css";
import { API_URL } from "../../config";

const LIMIT = 12;

const formatBytes = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const isImage = (f) => f.mimeType?.startsWith("image/");

const Files = () => {
    const [files, setFiles] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const load = useCallback(async (pageNo) => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch(`${API_URL}/file/my-files?page=${pageNo}&limit=${LIMIT}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.msg || "Could not load files");

            // deleted everything on the last page -> step back one page
            if (data.files.length === 0 && pageNo > 1) {
                setPage(pageNo - 1);
                return;
            }

            setFiles(data.files);
            setTotal(data.total);
            setPages(data.pages || 1);
            setSelected(new Set());
        } catch (err) {
            setError(err.message || "Could not load files");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(page);
    }, [page, load]);

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const allSelected = files.length > 0 && selected.size === files.length;
    const toggleAll = () => {
        setSelected(allSelected ? new Set() : new Set(files.map((f) => f._id)));
    };

    const deleteOne = async (file) => {
        if (!window.confirm(`Delete "${file.originalName}"? This can't be undone.`)) return;

        try {
            setDeleting(true);
            setNotice("");
            setError("");
            const res = await fetch(`${API_URL}/file/${file._id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.msg || "Delete failed");

            setNotice(`Deleted ${file.originalName}`);
            await load(page);
        } catch (err) {
            setError(err.message || "Delete failed");
        } finally {
            setDeleting(false);
        }
    };

    const deleteSelected = async () => {
        const ids = [...selected];
        if (ids.length === 0) return;
        if (!window.confirm(`Delete ${ids.length} selected file(s)? This can't be undone.`)) return;

        try {
            setDeleting(true);
            setNotice("");
            setError("");
            const res = await fetch(`${API_URL}/file/delete-multiple`, {
                method: "POST",
                credentials: "include",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ ids }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.msg || "Delete failed");

            if (data.failed > 0) {
                setError(`${data.failed} file(s) could not be deleted, try again`);
            }
            setNotice(`Deleted ${data.deleted} file(s)`);
            await load(page);
        } catch (err) {
            setError(err.message || "Delete failed");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Files</h1>
            </div>

            <div className={styles.panel}>
                <div className={styles.toolbar}>
                    <label className={styles.selectAll}>
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            disabled={files.length === 0 || deleting}
                        />
                        <span>
                            {selected.size > 0 ? `${selected.size} selected` : `${total} file${total === 1 ? "" : "s"}`}
                        </span>
                    </label>

                    <button
                        className={styles.deleteSelected}
                        onClick={deleteSelected}
                        disabled={selected.size === 0 || deleting}
                    >
                        {deleting ? "Deleting..." : "Delete selected"}
                    </button>
                </div>

                {error && <p className={`${styles.msg} ${styles.error}`} role="alert">{error}</p>}
                {notice && <p className={`${styles.msg} ${styles.notice}`} role="status">{notice}</p>}

                {loading ? (
                    <p className={styles.empty}>Loading your files...</p>
                ) : files.length === 0 ? (
                    <p className={styles.empty}>
                        No files yet. <Link to="/upload">Upload your first file</Link>
                    </p>
                ) : (
                    <ul className={styles.grid}>
                        {files.map((file) => (
                            <li
                                key={file._id}
                                className={`${styles.item} ${selected.has(file._id) ? styles.itemSelected : ""}`}
                            >
                                <input
                                    className={styles.check}
                                    type="checkbox"
                                    checked={selected.has(file._id)}
                                    onChange={() => toggle(file._id)}
                                    disabled={deleting}
                                    aria-label={`Select ${file.originalName}`}
                                />

                                <a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.thumb}>
                                    {isImage(file) ? (
                                        <img src={file.url} alt={file.originalName} loading="lazy" />
                                    ) : (
                                        <span className={styles.badge}>{(file.format || "file").toUpperCase()}</span>
                                    )}
                                </a>

                                <div className={styles.info}>
                                    <p className={styles.name} title={file.originalName}>{file.originalName}</p>
                                    <p className={styles.meta}>
                                        {formatBytes(file.bytes)}, {formatDate(file.createdAt)}
                                    </p>
                                </div>

                                <div className={styles.actions}>
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.open}>
                                        Open
                                    </a>
                                    <button className={styles.delete} onClick={() => deleteOne(file)} disabled={deleting}>
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {pages > 1 && (
                    <div className={styles.pager}>
                        <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1 || loading}>
                            Previous
                        </button>
                        <span>Page {page} of {pages}</span>
                        <button onClick={() => setPage((p) => p + 1)} disabled={page >= pages || loading}>
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Files;