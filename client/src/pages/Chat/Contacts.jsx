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
import "react-toastify/dist/ReactToastify.css";

// Khởi tạo socket (đảm bảo chỉ tạo 1 instance chung nếu cần tái sử dụng)
// Bạn có thể chuyển khởi tạo này ra riêng thành utils/socket.js rồi import về
const socket = io("https://sockettubuild.onrender.com");

const menuItems = [
    { icon: <FaUserFriends />, label: "Danh sách bạn bè" },
    { icon: <FaUsers />, label: "Danh sách nhóm và cộng đồng" },
    { icon: <FaUserPlus />, label: "Lời mời kết bạn" },
  
];

const Contacts = () => {
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeMenu, setActiveMenu] = useState("Danh sách bạn bè");
    const [userList, setUserList] = useState([]);
    const [groupChats, setGroupChats] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [friendRequestsLoading, setFriendRequestsLoading] = useState(false);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const myUsername = localStorage.getItem("username") || "Guest";

    useEffect(() => {
        // 0) Đăng ký user với server để nhận các emit riêng
        socket.emit("registerUser", myUsername);

        // 1) Load danh sách tất cả account để show avatar, fullname...
        fetch("https://sockettubuild.onrender.com/api/accounts")
            .then((res) => res.json())
            .then((data) => setUserList(data))
            .catch((err) => console.error("Error fetching accounts:", err));

        // 2) Lấy dữ liệu ban đầu
        socket.emit("getFriends", myUsername);
        socket.emit("getFriendRequests", myUsername);

        // 3) Đăng ký listeners
        socket.on("friendsList", (data) => {
            setFriends(data);
            setFriendsLoading(false);
        });
        socket.on("friendsListUpdated", (updated) => {
            setFriends(updated);
            setFriendsLoading(false);
        });

        socket.on("friendRequests", (data) => {
            setFriendRequests(data);
            setFriendRequestsLoading(false);
        });

        socket.on("newFriendRequest", (data) => {
            toast.info(`Bạn có lời mời kết bạn từ ${data.from}`);
            setFriendRequests(data.requests || []);
        });

        socket.on("friendRequestUpdated", (data) => {
            if (data.to === myUsername) {
                socket.emit("getFriendRequests", myUsername);
            }
        });

        socket.on("respondFriendRequestResult", (data) => {
            toast.info(data.message);
            socket.emit("getFriendRequests", myUsername);
            socket.emit("getFriends", myUsername);
        });

        socket.on("cancelFriendResult", (data) => {
            toast.info(data.message);
            // server cũng emit friendsListUpdated → chúng ta sẽ nhận và cập nhật
        });

        socket.on("friendRequestWithdrawn", (data) => {
            toast.info(`${data.from} đã thu hồi lời mời kết bạn.`);
            socket.emit("getFriendRequests", myUsername);
        });

        // Khi accept, server emit 2 event: friendAccepted + friendsListUpdated
        socket.on("friendAccepted", ({ friend }) => {
            toast.success(`Bạn đã kết bạn với ${friend}`);
            socket.emit("getFriendRequests", myUsername);
        });

        // Lắng nghe danh sách nhóm từ socket
        socket.on("userConversations", (data) => {
            setGroupsLoading(false);
            try {
                const parsed = JSON.parse(data);
                setGroupChats(parsed.groupChats || []);
            } catch (e) {
                setGroupChats([]);
            }
        });

        return () => {
            // Cleanup tất cả listeners
            socket.off("registerUser");
            socket.off("friendsList");
            socket.off("friendsListUpdated");
            socket.off("friendRequests");
            socket.off("newFriendRequest");
            socket.off("friendRequestUpdated");
            socket.off("respondFriendRequestResult");
            socket.off("cancelFriendResult");
            socket.off("friendRequestWithdrawn");
            socket.off("friendAccepted");
            socket.off("userConversations");
        };
    }, [myUsername]);

    // Khi chuyển tab, reload data phù hợp
    useEffect(() => {
        if (activeMenu === "Danh sách bạn bè") {
            setFriendsLoading(true);
            socket.emit("getFriends", myUsername);
        } else if (activeMenu === "Lời mời kết bạn") {
            setFriendRequestsLoading(true);
            socket.emit("getFriendRequests", myUsername);
        } else if (activeMenu === "Danh sách nhóm và cộng đồng") {
            setGroupsLoading(true);
            socket.emit("getUserConversations", myUsername);
        }
    }, [activeMenu, myUsername]);

    // Xóa bạn
    const handleRemoveFriend = (friendUsername) => {
        if (window.confirm(`Xóa ${friendUsername} khỏi danh sách bạn bè?`)) {
            socket.emit("cancelFriend", { myUsername, friendUsername });
        }
    };

    // Phản hồi lời mời
    const handleRespond = (requestId, action) => {
        socket.emit("respondFriendRequest", { requestId, action });
    };

    // Lọc & nhóm bạn theo chữ cái đầu
    const filteredFriends = friends
        .filter((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.localeCompare(b));

    const groupedFriends = filteredFriends.reduce((acc, friend) => {
        const c = friend.charAt(0).toUpperCase();
        if (!acc[c]) acc[c] = [];
        acc[c].push(friend);
        return acc;
    }, {});

    const sortedLetters = Object.keys(groupedFriends).sort();

    return (
        <div style={{ display: "flex", height: "100vh", fontFamily: "Segoe UI, sans-serif" }}>
            <ToastContainer />
            {/* Sidebar */}
            <aside style={{ width: "300px", background: "#f1f4f9", borderRight: "1px solid #ddd" }}>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
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
                                        activeMenu === item.label ? "#e6f4ff" : "transparent",
                                    color:
                                        activeMenu === item.label ? "#007aff" : "#333",
                                    fontWeight:
                                        activeMenu === item.label ? "600" : "400",
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
                            <span style={{ color: "#555" }}>Tổng: {filteredFriends.length}</span>
                        </div>
                        <div
                            style={{
                                background: "#fff",
                                borderRadius: "10px",
                                padding: "20px",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                            }}
                        >
                            {friendsLoading ? (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 80 }}>
                                    <div className="spinner" style={{
                                        width: 36, height: 36, border: "4px solid #eee",
                                        borderTop: "4px solid #007aff", borderRadius: "50%",
                                        animation: "spin 1s linear infinite"
                                    }} />
                                    <style>
                                        {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
                                    </style>
                                </div>
                            ) : (
                                sortedLetters.map((letter) => (
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
                                        {groupedFriends[letter].map((friend, idx) => {
                                            const info = userList.find((u) => u.username === friend);
                                            return (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        padding: "8px 0",
                                                        borderBottom: "1px solid #f3f3f3",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <img
                                                            src={
                                                                info?.image ||
                                                                "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/2048px-User-avatar.svg.png"
                                                            }
                                                            alt={friend}
                                                            style={{
                                                                width: "40px",
                                                                height: "40px",
                                                                borderRadius: "50%",
                                                                objectFit: "cover",
                                                            }}
                                                        />
                                                        <span style={{ fontWeight: "500", color: "#333" }}>
                                                            {friend}
                                                        </span>
                                                    </div>
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
                                            );
                                        })}
                                    </div>
                                ))
                            )}
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
                            {friendRequestsLoading ? (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 80 }}>
                                    <div className="spinner" style={{
                                        width: 36, height: 36, border: "4px solid #eee",
                                        borderTop: "4px solid #007aff", borderRadius: "50%",
                                        animation: "spin 1s linear infinite"
                                    }} />
                                    <style>
                                        {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
                                    </style>
                                </div>
                            ) : friendRequests.length === 0 ? (
                                <p style={{ fontStyle: "italic", color: "#888" }}>
                                    Không có lời mời kết bạn.
                                </p>
                            ) : (
                                friendRequests.map((req) => {
                                    const fromUser = userList.find((u) => u.username === req.from);
                                    return (
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
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <img
                                                    src={
                                                        fromUser?.image ||
                                                        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/2048px-User-avatar.svg.png"
                                                    }
                                                    alt={req.from}
                                                    style={{
                                                        width: "40px",
                                                        height: "40px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                                <span style={{ fontWeight: "500", color: "#444" }}>
                                                    Từ: {req.from}
                                                </span>
                                            </div>
                                            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                                                <button
                                                    onClick={() => handleRespond(req._id || req.id, "accepted")}
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
                                                    onClick={() => handleRespond(req._id || req.id, "rejected")}
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
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                {activeMenu === "Danh sách nhóm và cộng đồng" && (
                    <>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <h2 style={{ margin: 0 }}>Danh sách nhóm và cộng đồng</h2>
                            <span style={{ color: "#555" }}>Tổng: {groupChats.length}</span>
                        </div>
                        <div
                            style={{
                                background: "#fff",
                                borderRadius: "10px",
                                padding: "20px",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                            }}
                        >
                            {groupsLoading ? (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 80 }}>
                                    <div className="spinner" style={{
                                        width: 36, height: 36, border: "4px solid #eee",
                                        borderTop: "4px solid #007aff", borderRadius: "50%",
                                        animation: "spin 1s linear infinite"
                                    }} />
                                    <style>
                                        {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
                                    </style>
                                </div>
                            ) : groupChats.length === 0 ? (
                                <p style={{ fontStyle: "italic", color: "#888" }}>
                                    Bạn chưa tham gia nhóm nào.
                                </p>
                            ) : (
                                // Sắp xếp theo tên nhóm và nhóm theo chữ cái đầu
                                (() => {
                                    const grouped = groupChats.reduce((acc, group) => {
                                        const name = group.groupName || group.name || group.roomId;
                                        const c = name.charAt(0).toUpperCase();
                                        if (!acc[c]) acc[c] = [];
                                        acc[c].push(group);
                                        return acc;
                                    }, {});
                                    const sortedLetters = Object.keys(grouped).sort();
                                    return sortedLetters.map((letter) => (
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
                                            {grouped[letter] 
                                                .sort((a, b) =>
                                                    (a.groupName || "").localeCompare(b.groupName || "")
                                                )
                                                .map((group) => (
                                                    <div
                                                        key={group.roomId}
                                                        style={{
                                                            padding: "12px 0",
                                                            borderBottom: "1px solid #f3f3f3",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "16px",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 48,
                                                                height: 48,
                                                                borderRadius: "50%",
                                                                background: "#e6f4ff",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontWeight: 700,
                                                                fontSize: 22,
                                                                color: "#007aff",
                                                            }}
                                                        >
                                                            {(group.groupName || "G").charAt(0).toUpperCase()}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 600, color: "#222" }}>
                                                                {group.groupName}
                                                            </div>
                                                            <div style={{ fontSize: 13, color: "#888" }}>
                                                                Thành viên: {group.members?.length || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ));
                                })()
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Contacts;
