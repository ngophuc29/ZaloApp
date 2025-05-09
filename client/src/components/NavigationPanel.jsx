// NavigationPanel.js
import React, { useState, useEffect } from "react";
import {
    FaComments,
    FaUserFriends,
    FaSignOutAlt,
    FaCloudUploadAlt,
    FaCloud,
    FaMobileAlt,
    FaBriefcase,
    FaCog
} from "react-icons/fa";
import { Avatar, Button, Popover, Tooltip, Modal, Input, message } from 'antd';
import moment from "moment";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NavigationPanel = ({ activeTab, setActiveTab, navigate, myname, refreshContent }) => {
    const [isModalVisible, setIsModalVisible] = useState(false); // Modal thông tin cá nhân
    const [isEditMode, setIsEditMode] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const [popoverVisible, setPopoverVisible] = useState(false);
    const [formData, setFormData] = useState({
        fullname: "",
        birthday: "",
        image: ""
    });

    // State cho modal đổi mật khẩu
    const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
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

    // Sửa hàm xử lý click của navItem: Sau khi chuyển tab, sẽ refresh nội dung.
    const handleNavItemClick = (item) => {
        // Với các navItem có action, gọi luôn action của nó, nếu không có thì tự chuyển tab.
        if (item.action) {
            item.action();
        } else {
            setActiveTab(item.key);
        }
        // Nếu không phải trường hợp logout thì refresh content.
        if (item.key !== "logout") {
            // --- Cách 1: Nếu component cha có quản lý refreshKey, bạn gọi hàm trigger refresh truyền từ props
            if (refreshContent) {
                refreshContent();
            } else {
                // --- Cách 2: Reload toàn trang (không khuyến khích nếu không thực sự cần thiết)
                // window.location.reload();
            }
        }
    };

    const navItems = [
        { key: "chat", icon: <FaComments />, label: "Tin nhắn", action: () => setActiveTab("chat") },
        { key: "contacts", icon: <FaUserFriends />, label: "Danh bạ", action: () => setActiveTab("contacts") },
        { key: "upload", icon: <FaCloudUploadAlt />, label: "Tải lên" },
        { key: "cloud", icon: <FaCloud />, label: "Cloud", action: () => setActiveTab("cloud") },
        { key: "mobile", icon: <FaMobileAlt />, label: "Mobile", action: () => setActiveTab("mobile") },
        { key: "work", icon: <FaBriefcase />, label: "Công việc", action: () => setActiveTab("work") },
        { key: "settings", icon: <FaCog />, label: "Cài đặt", action: () => setActiveTab("settings") },
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

    // Hiển thị modal thông tin cá nhân
    const showModal = () => {
        setIsModalVisible(true);
        setPopoverVisible(false);
        setIsEditMode(false);
    };

    // Hiển thị modal đổi mật khẩu
    const showChangePasswordModal = () => {
        setIsChangePasswordVisible(true);
        setPopoverVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setIsEditMode(false);
    };

    // Xử lý đổi mật khẩu
    const handleChangePassword = async () => {
        const { oldPassword, newPassword, confirmPassword } = passwordData;

        if (!oldPassword || !newPassword || !confirmPassword) {
            message.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if (newPassword !== confirmPassword) {
            message.error("Mật khẩu mới không trùng khớp");
            return;
        }

        try {
            const res = await axios.put(`http://localhost:5000/api/accounts/change-password/${userInfo.username}`, {
                oldPassword,
                newPassword,
            });
            console.log(res.data);

            if (res.status === 200 && res.data.message === "Password updated") {
                toast.success("Đổi mật khẩu thành công!");
                setIsChangePasswordVisible(false);
                setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                message.error(res.data.message || "Đổi mật khẩu thất bại");
            }
        } catch (error) {
            console.error("Lỗi đổi mật khẩu:", error);
            message.error(error.response?.data?.message || "Lỗi khi đổi mật khẩu");
        }
    };

    // Save thông tin người dùng
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
                toast.success("Cập nhật thành công!");

                // Đóng modal & tắt edit mode ngay
                setIsEditMode(false);
                setIsModalVisible(false);

                // Cập nhật lại dữ liệu
                const updatedRes = await fetch(`http://localhost:5000/api/accounts/username/${userInfo.username}`);
                const updatedData = await updatedRes.json();

                if (updatedData && !updatedData.message) {
                    setUserInfo(updatedData);
                    localStorage.setItem("user", JSON.stringify(updatedData));
                }
            } else {
                toast.error("Cập nhật thất bại.");
            }
        } catch (error) {
            toast.error("Lỗi khi cập nhật thông tin.");
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
                                <Button type="link" onClick={showChangePasswordModal}>Đổi mật khẩu</Button><br />
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
                            src={userInfo.image || "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/2048px-User-avatar.svg.png"}
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
                                onClick={() => handleNavItemClick(item)}
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

            {/* Modal thông tin người dùng */}
            <Modal
                title="Thông tin người dùng"
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
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    setFormData({ ...formData, image: event.target.result });
                                };
                                reader.readAsDataURL(file);
                            }}
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
                            <Avatar size={64} src={userInfo.image || "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/2048px-User-avatar.svg.png"} />
                    </>
                )}
            </Modal>

            {/* Modal Đổi mật khẩu */}
            <Modal
                title="Đổi mật khẩu"
                visible={isChangePasswordVisible}
                onCancel={() => setIsChangePasswordVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsChangePasswordVisible(false)}>Hủy</Button>,
                    <Button key="submit" type="primary" onClick={handleChangePassword}>Lưu</Button>
                ]}
            >
                <label>Mật khẩu cũ:</label>
                <Input.Password
                    placeholder="Nhập mật khẩu cũ"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                />
                <label className="mt-2">Mật khẩu mới:</label>
                <Input.Password
                    placeholder="Nhập mật khẩu mới"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <label className="mt-2">Xác nhận mật khẩu mới:</label>
                <Input.Password
                    placeholder="Xác nhận mật khẩu mới"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
            </Modal>
        </>
    );
};

export default NavigationPanel;
