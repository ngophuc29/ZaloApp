import React, { useState } from "react";

const ImageUploader = ({ onUploadSuccess }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Khi người dùng chọn file, lưu file vào state
    const handleImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedImage(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedImage) return;
        setUploading(true);

        const formData = new FormData();
        formData.append("file", selectedImage);
        // Sử dụng unsigned preset đã được cấu hình trên Cloudinary
        // Ở đây mình dùng "dxm8pqql5" làm preset (bạn cần đảm bảo preset này đã được tạo và bật unsigned upload trên Cloudinary)
        formData.append("upload_preset", "unsigned_upload");
        formData.append("cloud_name", "dxm8pqql5");

        try {
            const res = await fetch(
                "https://api.cloudinary.com/v1_1/dxm8pqql5/image/upload",
                {
                    method: "POST",
                    body: formData,
                }
            );
            const data = await res.json();
            if (data.secure_url) {
                // Sau khi upload thành công, trả về URL hình ảnh cho callback
                onUploadSuccess(data.secure_url);
            } else {
                console.error("Upload error:", data);
            }
        } catch (err) {
            console.error("Error during upload:", err);
        } finally {
            setUploading(false);
            setSelectedImage(null);
        }
    };

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Image"}
            </button>
        </div>
    );
};

export default ImageUploader;
