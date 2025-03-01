import React from "react";

const NavigationPanel = ({ activeTab, setActiveTab, navigate }) => {
    return (
        <div className="col-2 border-end" style={{ padding: "10px" }}>
            <ul className="list-unstyled">
                <li
                    style={{ cursor: "pointer", padding: "10px", borderBottom: "1px solid #ddd" }}
                    onClick={() => setActiveTab("chat")}
                >
                    Tin Nhắn
                </li>
                <li
                    style={{ cursor: "pointer", padding: "10px" }}
                    onClick={() => setActiveTab("contacts")}
                >
                    Danh bạ
                </li>
                <li
                    style={{ cursor: "pointer", padding: "10px" }}
                    onClick={() => {
                        navigate("/login");
                        localStorage.clear();
                    }}
                >
                    Đăng xuất
                </li>
            </ul>
        </div>
    );
};

export default NavigationPanel;
