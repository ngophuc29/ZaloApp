import React, { useState, useEffect } from "react";
import { FaSearch, FaUserPlus, FaUsers } from "react-icons/fa";
import "./LeftPanel.css"; // We'll create this file next

const LeftPanel = ({
    searchFilter,
    setSearchFilter,
    filteredAccounts,
    handleUserClick,
    activeChats,
    handleRoomClick,
    activeRoom,
    setFriendModalVisible,
    onOpenGroupModal,
}) => {
    const [userList, setUserList] = useState([]);
    const isSearching = searchFilter.trim().length > 0;

    useEffect(() => {
        fetch("http://localhost:5000/api/accounts")
            .then((res) => res.json())
            .then((data) => {
                setUserList(data);
            })
            .catch((err) => console.error("Error fetching accounts:", err));
    }, []);

    const getAvatarByName = (name) => {
        const user = userList.find((u) => u.username === name);
        return user?.image || "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/2048px-User-avatar.svg.png";
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Nếu là hôm nay, chỉ hiện giờ:phút
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        // Nếu trong tuần này, hiện tên thứ
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        // Nếu quá 1 tuần, hiện ngày/tháng
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    };

    const renderLastMessage = (chat) => {
        const lm = chat.lastMessage;
        if (!lm) return "";

        const currentUser = localStorage.getItem("username");
        const sender = lm.senderId === currentUser ? "Bạn" : lm.senderId;

        // Nếu có nội dung text thì hiển thị text, ngược lại hiển thị tệp đính kèm
        const body = lm.content?.trim()
            ? lm.content.length > 30
                ? lm.content.substring(0, 30) + "..."
                : lm.content
            : "Đã gửi một tệp đính kèm";

        return `${sender}: ${body}`;
    };



    return (
        <div className="col-3 border-end" style={{ padding: "10px" }}>
            {/* Search Bar & Buttons */}
            <div className="mb-3 d-flex align-items-center">
                <div className="input-group">
                    <span className="input-group-text bg-white">
                        <FaSearch />
                    </span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm kiếm"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                    />
                </div>

                {isSearching ? (
                    <button
                        className="btn btn-danger ms-2"
                        onClick={() => setSearchFilter("")}
                    >
                        Đóng
                    </button>
                ) : (
                    <>
                        <button
                            className="btn btn-light ms-2"
                            onClick={() => setFriendModalVisible(true)}
                            title="Kết bạn"
                        >
                            <FaUserPlus />
                        </button>
                        <button
                            className="btn btn-light ms-2"
                            onClick={onOpenGroupModal}
                            title="Tạo nhóm"
                        >
                            <FaUsers />
                        </button>
                    </>
                )}
            </div>

            {/* Danh sách bên dưới */}
            {isSearching ? (
                <div className="search-results">
                    {filteredAccounts.map((account, idx) => (
                        <div
                            key={idx}
                            className="search-item"
                            style={{ cursor: "pointer", marginBottom: "10px" }}
                            onClick={() => handleUserClick(account.username)}
                        >
                            <img
                                src={account.image || "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/2048px-User-avatar.svg.png"}
                                alt={account.username}
                                className="chat-avatar"
                             
                            />
                            <div className="user-info">
                                <div className="username">  <span>UserName: </span> {account.username}</div>
                                <div className="fullname">  <span>FullName : </span> {account.fullname}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="chat-list">
                    {Object.keys(activeChats).map((room) => {
                        const chat = activeChats[room];
                        const isActive = room === activeRoom;

                        return (
                            <div
                                key={room}
                                className={`chat-item ${isActive ? 'active' : ''}`}
                                onClick={() => handleRoomClick(room)}
                            >
                                <div className="chat-avatar">
                                    {chat.isGroup ? (
                                        <div className="group-avatar">
                                            <FaUsers />
                                        </div>
                                    ) : (
                                        <img
                                            src={getAvatarByName(chat.partner)}
                                            alt={chat.partner}
                                            className="avatar"
                                        />
                                    )}
                                </div>

                                <div className="chat-info">
                                    <div className="chat-header">
                                        <span className="chat-name">
                                            {chat.isGroup ? room : chat.partner}
                                        </span>
                                        {chat.lastMessage && (
                                            <span className="chat-time">
                                                {formatTime(chat.lastMessage.timestamp)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="chat-preview">
                                        <span className="last-message">{renderLastMessage(chat)}</span>
                                        {chat.unread > 0 && (
                                            <span className="unread-badge">
                                                {Math.ceil(chat.unread)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LeftPanel;