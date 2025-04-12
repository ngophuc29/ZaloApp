import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import {
    FaSearch,
    FaUserFriends,
    FaUsers,
    FaUserPlus,
    FaEnvelopeOpenText,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

// Khởi tạo socket (nếu bạn dùng singleton, hãy đảm bảo đây là instance chung)
const socket = io("http://localhost:5000");

const menuItems = [
    { icon: <FaUserFriends />, label: "Danh sách bạn bè" },
    { icon: <FaUsers />, label: "Danh sách nhóm và cộng đồng" },
    { icon: <FaUserPlus />, label: "Lời mời kết bạn" },
    { icon: <FaEnvelopeOpenText />, label: "Lời mời vào nhóm và cộng đồng" },
];

const Contacts = () => {
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeMenu, setActiveMenu] = useState("Danh sách bạn bè");

    const myUsername = localStorage.getItem("username") || "Guest";

    // useEffect ban đầu để đăng ký các sự kiện socket và lấy dữ liệu khởi tạo
    useEffect(() => {
        socket.emit("getFriends", myUsername);
        socket.emit("getFriendRequests", myUsername);

        socket.on("friendsList", (data) => setFriends(data));
        socket.on("friendRequests", (data) => setFriendRequests(data));

        socket.on("respondFriendRequestResult", (data) => {
            toast.info(data.message);
            socket.emit("getFriendRequests", myUsername);
            socket.emit("getFriends", myUsername);
        });

        socket.on("cancelFriendResult", (data) => {
            toast.info(data.message);
            socket.emit("getFriends", myUsername);
        });

        return () => {
            socket.off("friendsList");
            socket.off("friendRequests");
            socket.off("respondFriendRequestResult");
            socket.off("cancelFriendResult");
        };
    }, [myUsername]);

    // useEffect để refresh dữ liệu khi activeMenu thay đổi
    useEffect(() => {
        if (activeMenu === "Danh sách bạn bè") {
            socket.emit("getFriends", myUsername);
        } else if (activeMenu === "Lời mời kết bạn") {
            socket.emit("getFriendRequests", myUsername);
        }
        // Có thể thêm các emit khác nếu có các tab khác cần refresh data
    }, [activeMenu, myUsername]);

    const handleRemoveFriend = (friendUsername) => {
        if (
            window.confirm(
                `Bạn có chắc muốn xóa ${friendUsername} khỏi danh sách bạn bè không?`
            )
        ) {
            socket.emit("cancelFriend", { myUsername, friendUsername });
        }
    };

    const handleRespond = (requestId, action) => {
        socket.emit("respondFriendRequest", { requestId, action });
    };

    // Tính toán danh sách bạn bè theo bộ lọc tìm kiếm
    const filteredFriends = friends
        .filter((friend) =>
            friend.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.localeCompare(b));

    // Nhóm bạn bè theo chữ cái đầu
    const groupedFriends = filteredFriends.reduce((acc, friend) => {
        const firstLetter = friend.charAt(0).toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(friend);
        return acc;
    }, {});

    const sortedLetters = Object.keys(groupedFriends).sort();

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                fontFamily: "Segoe UI, sans-serif",
            }}
        >
            {/* Toast container hiển thị thông báo */}
            <ToastContainer />

            {/* Sidebar */}
            <aside
                style={{
                    width: "300px",
                    background: "#f1f4f9",
                    borderRight: "1px solid #ddd",
                }}
            >
                <div style={{ padding: "20px" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#fff",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            padding: "6px 10px",
                            marginBottom: "20px",
                        }}
                    >
                        <FaSearch style={{ color: "#888", marginRight: "8px" }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: "none",
                                outline: "none",
                                width: "100%",
                                fontSize: "14px",
                                background: "transparent",
                            }}
                        />
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                        }}
                    >
                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => setActiveMenu(item.label)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "10px 12px",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    background:
                                        activeMenu === item.label
                                            ? "#e6f4ff"
                                            : "transparent",
                                    color:
                                        activeMenu === item.label
                                            ? "#007aff"
                                            : "#333",
                                    fontWeight:
                                        activeMenu === item.label
                                            ? "600"
                                            : "400",
                                }}
                            >
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: "30px 40px", background: "#fafafa" }}>
                {activeMenu === "Danh sách bạn bè" && (
                    <>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <h2 style={{ margin: 0 }}>Danh sách bạn bè</h2>
                            <span style={{ color: "#555" }}>
                                Tổng: {filteredFriends.length}
                            </span>
                        </div>

                        <div
                            style={{
                                background: "#fff",
                                borderRadius: "10px",
                                padding: "20px",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                            }}
                        >
                            {sortedLetters.map((letter) => (
                                <div key={letter} style={{ marginBottom: "20px" }}>
                                    <h4
                                        style={{
                                            color: "#333",
                                            borderBottom: "1px solid #eee",
                                            paddingBottom: "6px",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        {letter}
                                    </h4>
                                    {groupedFriends[letter].map((friend, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "8px 0",
                                                borderBottom: "1px solid #f3f3f3",
                                            }}
                                        >
                                            <span style={{ fontWeight: "500", color: "#333" }}>
                                                {friend}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveFriend(friend)}
                                                style={{
                                                    background: "#f44336",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "6px 12px",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Xóa bạn
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeMenu === "Lời mời kết bạn" && (
                    <>
                        <h2 style={{ marginBottom: "20px" }}>Lời mời kết bạn</h2>
                        <div
                            style={{
                                background: "#fff",
                                borderRadius: "10px",
                                padding: "20px",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                            }}
                        >
                            {friendRequests.length === 0 ? (
                                <p style={{ fontStyle: "italic", color: "#888" }}>
                                    Không có lời mời kết bạn.
                                </p>
                            ) : (
                                friendRequests.map((req) => (
                                    <div
                                        key={req._id || req.id}
                                        style={{
                                            padding: "10px",
                                            marginBottom: "15px",
                                            borderRadius: "8px",
                                            backgroundColor: "#f8f9fa",
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <span style={{ fontWeight: "500", color: "#444" }}>
                                            Từ: {req.from}
                                        </span>
                                        <div
                                            style={{
                                                marginTop: "10px",
                                                display: "flex",
                                                gap: "10px",
                                            }}
                                        >
                                            <button
                                                onClick={() =>
                                                    handleRespond(req._id || req.id, "accepted")
                                                }
                                                style={{
                                                    flex: 1,
                                                    background: "#28a745",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "8px",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Chấp nhận
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleRespond(req._id || req.id, "rejected")
                                                }
                                                style={{
                                                    flex: 1,
                                                    background: "#dc3545",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "8px",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Từ chối
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Contacts;
