import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const Contacts = () => {
    const [friendRequests, setFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const myUsername = localStorage.getItem("username") || "Guest";

    useEffect(() => {
        socket.emit("getFriendRequests", myUsername);
        socket.emit("getFriends", myUsername);

        socket.on("friendRequests", (data) => setFriendRequests(data));
        socket.on("friendsList", (data) => setFriends(data));

        socket.on("respondFriendRequestResult", (data) => {
            alert(data.message);
            socket.emit("getFriendRequests", myUsername);
            socket.emit("getFriends", myUsername);
        });

        socket.on("cancelFriendResult", (data) => {
            alert(data.message);
            socket.emit("getFriends", myUsername);
        });

        return () => {
            socket.off("friendRequests");
            socket.off("friendsList");
            socket.off("respondFriendRequestResult");
            socket.off("cancelFriendResult");
        };
    }, [myUsername]);

    const handleRespond = (requestId, action) => {
        socket.emit("respondFriendRequest", { requestId, action });
    };

    const handleRemoveFriend = (friendUsername) => {
        if (window.confirm(`Bạn có chắc muốn xóa ${friendUsername} khỏi danh sách bạn bè không?`)) {
            socket.emit("cancelFriend", { myUsername, friendUsername });
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "500px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
            <h2 style={{ textAlign: "center", color: "#333" }}>Danh Bạ</h2>

            {/* Lời mời kết bạn */}
            <section style={{ marginBottom: "30px", padding: "15px", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
                <h3 style={{ marginBottom: "10px", color: "#555" }}>Lời mời kết bạn</h3>
                {friendRequests.length === 0 ? (
                    <p style={{ fontStyle: "italic", color: "#888" }}>Không có lời mời kết bạn.</p>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {friendRequests.map((req) => (
                            <li
                                key={req._id || req.id}
                                style={{
                                    padding: "10px",
                                    marginBottom: "10px",
                                    borderRadius: "6px",
                                    backgroundColor: "#fff",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                }}
                            >
                                <strong style={{ color: "#444" }}>Từ:</strong> {req.from}
                                <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                                    <button
                                        style={{
                                            flex: 1,
                                            backgroundColor: "#28a745",
                                            color: "#fff",
                                            border: "none",
                                            padding: "8px",
                                            borderRadius: "4px",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => handleRespond(req._id || req.id, "accepted")}
                                    >
                                        Chấp nhận
                                    </button>
                                    <button
                                        style={{
                                            flex: 1,
                                            backgroundColor: "#dc3545",
                                            color: "#fff",
                                            border: "none",
                                            padding: "8px",
                                            borderRadius: "4px",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => handleRespond(req._id || req.id, "rejected")}
                                    >
                                        Từ chối
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Danh sách bạn bè */}
            <section style={{ padding: "15px", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
                <h3 style={{ marginBottom: "10px", color: "#555" }}>Danh sách bạn bè</h3>
                {friends.length === 0 ? (
                    <p style={{ fontStyle: "italic", color: "#888" }}>Chưa có bạn bè.</p>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {friends.map((friend, index) => (
                            <li
                                key={index}
                                style={{
                                    padding: "10px",
                                    marginBottom: "10px",
                                    borderRadius: "6px",
                                    backgroundColor: "#fff",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                <span style={{ fontWeight: "bold", color: "#333" }}>{friend}</span>
                                <button
                                    style={{
                                        backgroundColor: "#ff6b6b",
                                        color: "#fff",
                                        border: "none",
                                        padding: "6px 10px",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                    }}
                                    onClick={() => handleRemoveFriend(friend)}
                                >
                                    Xóa bạn
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default Contacts;
