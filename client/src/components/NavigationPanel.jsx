import React, { useState, useEffect } from "react";
import {
    FaComments, FaUserFriends, FaSignOutAlt, FaCloudUploadAlt,
    FaCloud, FaMobileAlt, FaBriefcase, FaCog
} from "react-icons/fa";
import {
    Avatar, Button, Popover, Tooltip, Modal, Input, DatePicker, message
} from 'antd';
import moment from "moment";

const NavigationPanel = ({ activeTab, setActiveTab, navigate, myname }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const [popoverVisible, setPopoverVisible] = useState(false);
    const [formData, setFormData] = useState({
        fullname: "",
        birthday: "",
        image: ""
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user")) || {};
        setUserInfo(storedUser);

        const usernameToFetch = myname || storedUser.username;
        if (usernameToFetch) {
            fetch(`http://localhost:5000/api/accounts/username/${usernameToFetch}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.message) {
                        setUserInfo(data);
                    }
                })
                .catch(err => {
                    console.error("Lỗi khi lấy thông tin người dùng:", err);
                });
        }
    }, [myname]);

    useEffect(() => {
        if (isModalVisible && userInfo) {
            setFormData({
                fullname: userInfo.fullname || "",
                birthday: userInfo.birthday ? userInfo.birthday.split("T")[0] : "",
                image: userInfo.image || ""
            });
        }
    }, [isModalVisible, userInfo]);

    const navItems = [
        { key: "chat", icon: <FaComments />, label: "Tin nhắn", action: () => setActiveTab("chat") },
        { key: "contacts", icon: <FaUserFriends />, label: "Danh bạ", action: () => setActiveTab("contacts") },
        { key: "upload", icon: <FaCloudUploadAlt />, label: "Tải lên" },
        { key: "cloud", icon: <FaCloud />, label: "Cloud" },
        { key: "mobile", icon: <FaMobileAlt />, label: "Mobile" },
        { key: "work", icon: <FaBriefcase />, label: "Công việc" },
        { key: "settings", icon: <FaCog />, label: "Cài đặt" },
        {
            key: "logout",
            icon: <FaSignOutAlt />,
            label: "Đăng xuất",
            section: true,
            action: () => {
                localStorage.clear();
                navigate("/login");
            },
        },
    ];

    const showModal = () => {
        setIsModalVisible(true);
        setPopoverVisible(false);
        setIsEditMode(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setIsEditMode(false);
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = async () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);

                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.1); // chất lượng thấp nhất
                setFormData({ ...formData, image: compressedBase64 });
            };
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/accounts/${userInfo.username}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fullname: formData.fullname,
                    birthday: formData.birthday,
                    image: formData.image
                })
            });

            const result = await res.json();
            if (result.message === "Update successful") {
                message.success("Cập nhật thành công!");

                // 👉 Đóng modal & tắt edit mode ngay
                setIsEditMode(false);
                setIsModalVisible(false);

                // 👉 Gọi lại API để cập nhật dữ liệu
                const updatedRes = await fetch(`http://localhost:5000/api/accounts/username/${userInfo.username}`);
                const updatedData = await updatedRes.json();

                if (updatedData && !updatedData.message) {
                    setUserInfo(updatedData);
                    localStorage.setItem("user", JSON.stringify(updatedData));
                }
            } else {
                message.error("Cập nhật thất bại.");
            }
        } catch (error) {
            message.error("Lỗi khi cập nhật thông tin.");
        }
    };



    return (
        <>
            <div className="d-flex flex-column align-items-center bg-primary text-white" style={{ width: "80px", height: "100vh", paddingTop: "10px" }}>
                <div className="mb-4">
                    <Popover
                        content={
                            <div style={{ textAlign: "center" }}>
                                <Button type="link" onClick={showModal}>Thông tin cá nhân</Button><br />
                                <Button type="link" danger onClick={() => {
                                    localStorage.clear();
                                    navigate("/login");
                                }}>
                                    Đăng xuất
                                </Button>
                            </div>
                        }
                        trigger="click"
                        visible={popoverVisible}
                        onVisibleChange={setPopoverVisible}
                        placement="right"
                    >
                        <img
                            src={userInfo.image || "/your-avatar.jpg"}
                            alt="Avatar"
                            className="rounded-circle"
                            style={{ width: "40px", height: "40px", objectFit: "cover", cursor: "pointer" }}
                        />
                    </Popover>
                </div>

                {navItems.map((item, index) => (
                    <React.Fragment key={index}>
                        {item.section && <hr className="text-white w-75 my-3" />}
                        <Tooltip title={item.label} placement="right">
                            <div
                                onClick={item.action}
                                style={{
                                    backgroundColor: activeTab === item.key ? "#004bb5" : "transparent",
                                    borderRadius: "10px",
                                    padding: "10px",
                                    marginBottom: "10px",
                                    cursor: "pointer"
                                }}
                            >
                                {item.icon}
                            </div>
                        </Tooltip>
                    </React.Fragment>
                ))}
            </div>

            <Modal
                title="Thông tin người dùng"
                // open={isModalVisible}
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={isEditMode ? (
                    <>
                        <Button onClick={() => setIsEditMode(false)}>Hủy</Button>
                        <Button type="primary" onClick={handleSave}>Lưu</Button>
                    </>
                ) : (
                    <Button type="primary" onClick={() => setIsEditMode(true)}>Cập nhật</Button>
                )}
            >
                {isEditMode ? (
                    <>
                        <label>Họ và tên:</label>
                        <Input
                            value={formData.fullname}
                            onChange={e => setFormData({ ...formData, fullname: e.target.value })}
                        />

                        <label className="mt-2">Ngày sinh:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData.birthday}
                            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                        />

                        <label className="mt-2">Avatar:</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {formData.image && <Avatar size={64} src={formData.image} className="mt-2" />}
                    </>
                ) : (
                    <>
                        <p><strong>Họ và tên:</strong> {userInfo.fullname || 'Không có thông tin'}</p>
                        <p><strong>Email:</strong> {userInfo.email || 'Không có thông tin'}</p>
                        <p><strong>Số điện thoại:</strong> {userInfo.phone || 'Không có thông tin'}</p>
                        <p><strong>Ngày sinh:</strong> {userInfo.birthday ? new Date(userInfo.birthday).toLocaleDateString('vi-VN') : 'Không có thông tin'}</p>
                        <p><strong>Avatar:</strong></p>
                        <Avatar size={64} src={userInfo.image || "/your-avatar.jpg"} />
                    </>
                )}

            </Modal>
        </>
    );
};

export default NavigationPanel;
