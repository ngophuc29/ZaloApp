import React, { useState, useEffect } from "react";
import io from "socket.io-client";

// Kết nối đến backend (điều chỉnh URL nếu cần)
const socket = io("http://localhost:5000");

const Contacts = () => {
    const myUsername = localStorage.getItem("username") || "Guest";
    const [friendList, setFriendList] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [newFriend, setNewFriend] = useState("");
    const [resultMessage, setResultMessage] = useState("");

    useEffect(() => {
        // Yêu cầu lấy danh sách bạn bè và lời mời kết bạn
        socket.emit("getFriends", myUsername);
        socket.emit("getFriendRequests", myUsername);

        // Lắng nghe sự kiện trả về từ server
        socket.on("friendsList", (data) => {
            // data là danh sách bạn bè (mảng username)
            setFriendList(data);
        });

        socket.on("friendRequests", (data) => {
            // data là mảng các lời mời kết bạn (object chứa _id, from, to,...)
            setFriendRequests(data);
        });

        socket.on("addFriendResult", (data) => {
            setResultMessage(data.message);
            // Refresh lại danh sách bạn bè và lời mời
            socket.emit("getFriends", myUsername);
            socket.emit("getFriendRequests", myUsername);
        });

        socket.on("cancelFriendResult", (data) => {
            setResultMessage(data.message);
            socket.emit("getFriends", myUsername);
        });

        socket.on("respondFriendRequestResult", (data) => {
            setResultMessage(data.message);
            socket.emit("getFriends", myUsername);
            socket.emit("getFriendRequests", myUsername);
        });

        // Cleanup listeners khi component unmount
        return () => {
            socket.off("friendsList");
            socket.off("friendRequests");
            socket.off("addFriendResult");
            socket.off("cancelFriendResult");
            socket.off("respondFriendRequestResult");
        };
    }, [myUsername]);

    const handleAddFriend = () => {
        if (newFriend.trim() === "") return;
        socket.emit("addFriend", { myUsername, friendUsername: newFriend });
        setNewFriend("");
    };

    const handleCancelFriend = (friendUsername) => {
        socket.emit("cancelFriend", { myUsername, friendUsername });
    };

    const handleRespondFriendRequest = (requestId, action) => {
        // action: 'accepted' hoặc 'rejected'
        socket.emit("respondFriendRequest", { requestId, action });
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Danh Bạ</h2>

            {/* Phần thêm bạn mới */}
            <div style={{ marginBottom: "20px" }}>
                <h3>Thêm bạn mới</h3>
                <input
                    type="text"
                    value={newFriend}
                    onChange={(e) => setNewFriend(e.target.value)}
                    placeholder="Nhập username bạn cần kết bạn"
                />
                <button onClick={handleAddFriend} style={{ marginLeft: "10px" }}>
                    Gửi lời mời
                </button>
            </div>

            {resultMessage && <p>{resultMessage}</p>}

            {/* Danh sách bạn bè */}
            <div style={{ marginBottom: "20px" }}>
                <h3>Danh sách bạn bè</h3>
                {friendList.length === 0 ? (
                    <p>Chưa có bạn bè nào</p>
                ) : (
                    <ul>
                        {friendList.map((friend, idx) => (
                            <li key={idx}>
                                {friend}{" "}
                                <button onClick={() => handleCancelFriend(friend)}>
                                    Hủy kết bạn
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Lời mời kết bạn */}
            <div>
                <h3>Lời mời kết bạn</h3>
                {friendRequests.length === 0 ? (
                    <p>Không có lời mời nào</p>
                ) : (
                    <ul>
                        {friendRequests.map((req, idx) => (
                            <li key={idx}>
                                <span>
                                    <strong>{req.from}</strong> đã gửi lời mời kết bạn.
                                </span>{" "}
                                <button onClick={() => handleRespondFriendRequest(req._id, "accepted")}>
                                    Chấp nhận
                                </button>{" "}
                                <button onClick={() => handleRespondFriendRequest(req._id, "rejected")}>
                                    Từ chối
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Contacts;
