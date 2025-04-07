import React from "react";
import {
    FaComments,     // Icon Tin nhắn
    FaUserFriends,  // Icon Danh bạ
    FaSignOutAlt,   // Icon Đăng xuất
    FaCloudUploadAlt,
    FaCloud,
    FaMobileAlt,
    FaBriefcase,
    FaCog
} from "react-icons/fa";

const NavigationPanel = ({ activeTab, setActiveTab, navigate }) => {
    // Mảng chứa các icon và chức năng tương ứng
    const navItems = [
        { key: "chat", icon: <FaComments />, action: () => setActiveTab("chat") },
        { key: "contacts", icon: <FaUserFriends />, action: () => setActiveTab("contacts") },
        { key: "upload", icon: <FaCloudUploadAlt /> },
        { key: "cloud", icon: <FaCloud /> },
        { key: "mobile", icon: <FaMobileAlt /> },
        { key: "work", icon: <FaBriefcase /> },
        { key: "settings", icon: <FaCog /> },
        {
            key: "logout",
            icon: <FaSignOutAlt />,
            section: true, // đánh dấu icon này thuộc phần cuối
            action: () => {
                localStorage.clear();
                navigate("/login");
            },
        },
    ];

    return (
        <div
            className="d-flex flex-column align-items-center bg-primary text-white"
            style={{ width: "80px", height: "100vh", paddingTop: "10px" }}
        >
            {/* Avatar trên cùng */}
            <div className="mb-4">
                <img
                    src="/your-avatar.jpg" // ← đổi thành avatar người dùng
                    alt="Avatar"
                    className="rounded-circle"
                    style={{ width: "40px", height: "40px", objectFit: "cover" }}
                />
            </div>

            {/* Danh sách icon chức năng */}
            {navItems.map((item, index) => (
                <React.Fragment key={index}>
                    {/* Nếu có section (logout), thì thêm đường kẻ phân cách */}
                    {item.section && <hr className="text-white w-75 my-3" />}

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
                </React.Fragment>
            ))}
        </div>
    );
};

export default NavigationPanel;
