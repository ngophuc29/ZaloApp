import React, { useState } from "react";

const FileUploader = ({ onUploadSuccess, fileTypes }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            if (file.size > 20 * 1024 * 1024) {
                setError("File không được vượt quá 20MB");
                return;
            }

            setSelectedFile(file);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", "unsigned_upload");

        try {
            let resourceType = "auto";
            let endpoint = "auto/upload";

            if (selectedFile.type.startsWith("image/")) {
                resourceType = "image";
                endpoint = "image/upload";
            } else if (selectedFile.type.startsWith("video/")) {
                resourceType = "video";
                endpoint = "video/upload";
            } else {
                resourceType = "raw";
                endpoint = "raw/upload";
            }

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/dxm8pqql5/${endpoint}`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await res.json();
            if (data.secure_url) {
                // onUploadSuccess({
                //     url: data.secure_url,
                //     type: getFileType(resourceType, selectedFile.type),
                //     name: selectedFile.name,
                //     size: data.bytes,
                //     publicId: data.public_id,
                //     resourceType: resourceType,
                //     ...(data.width && { width: data.width }),
                //     ...(data.height && { height: data.height }),
                //     ...(data.duration && { duration: data.duration }),
                //     ...(data.eager && data.eager[0] && { thumbnail: data.eager[0].secure_url })
                // });
                onUploadSuccess({
                    url: data.secure_url,
                    type: getFileType(resourceType, selectedFile.type), // <- đảm bảo đúng type
                    name: selectedFile.name,
                    size: data.bytes,
                    publicId: data.public_id,
                    resourceType: resourceType,
                    fileType: getFileType(resourceType, selectedFile.type), // 👈 thêm dòng này để lưu đúng `msg.fileType`
                    ...(data.width && { width: data.width }),
                    ...(data.height && { height: data.height }),
                    ...(data.duration && { duration: data.duration }),
                    ...(data.eager && data.eager[0] && { thumbnail: data.eager[0].secure_url })
                });

            } else {
                setError("Upload không thành công: " + (data.error?.message || "Lỗi không xác định"));
            }
        } catch (err) {
            setError("Lỗi khi upload: " + err.message);
        } finally {
            setUploading(false);
            setSelectedFile(null);
        }
    };


    const getFileType = (resourceType, mimeType) => {
        if (resourceType === 'image') return 'image';
        if (resourceType === 'video') return 'video';
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.includes('word')) return 'word';
        if (mimeType.includes('spreadsheet')) return 'excel';
        if (mimeType.includes('presentation')) return 'powerpoint';
        return 'other';
    };

    const formatFileSize = (size) => {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
        return (size / (1024 * 1024)).toFixed(1) + " MB";
    };

    return (
        <div className="file-uploader" style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", maxWidth: "400px" }}>
            <input
                type="file"
                accept={fileTypes}
                onChange={handleFileChange}
                style={{ marginBottom: "1rem" }}
            />

            {selectedFile && (
                <div style={{ marginBottom: "1rem" }}>
                    <p><strong>File đã chọn:</strong> {selectedFile.name}</p>
                    <p><strong>Kích thước:</strong> {formatFileSize(selectedFile.size)}</p>

                    {selectedFile.type.startsWith("image/") && (
                        <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview"
                            style={{ width: "100%", maxHeight: "200px", objectFit: "contain", marginBottom: "1rem", borderRadius: "4px" }}
                        />
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="btn btn-primary"
                    >
                        {uploading ? "Đang upload..." : "Upload File"}
                    </button>
                </div>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default FileUploader;
