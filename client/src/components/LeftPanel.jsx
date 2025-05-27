import React, { useState, useEffect } from "react";
import { FaSearch, FaUserPlus, FaUsers, FaEllipsisV, FaThumbtack } from "react-icons/fa";
import "./LeftPanel.css"; 

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
    const [inputValue, setInputValue] = useState("");
    const [chatOptionsVisible, setChatOptionsVisible] = useState(null);
    const [pinnedRooms, setPinnedRooms] = useState(() => {
        const saved = localStorage.getItem("pinnedRooms");
        return saved ? JSON.parse(saved) : [];
    });
    const isSearching = inputValue.trim().length > 0;

    useEffect(() => {
        fetch("https://sockettubuild.onrender.com/api/accounts")
            .then((res) => res.json())
            .then((data) => {
                setUserList(data);
            })
            .catch((err) => console.error("Error fetching accounts:", err));
    }, []);

    useEffect(() => {
        localStorage.setItem("pinnedRooms", JSON.stringify(pinnedRooms));
    }, [pinnedRooms]);

 
    useEffect(() => {
        const handleDocumentClick = (event) => {
            if (!event.target.closest('.chat-options') && !event.target.closest('.chat-menu')) {
                setChatOptionsVisible(null);
            }
        };

        document.addEventListener('click', handleDocumentClick);

        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, [chatOptionsVisible]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        if (value === "") {
            setSearchFilter("");
        } else if (/^\d{10}$/.test(value)) {
            setSearchFilter(value);
        } else if (searchFilter !== "") {
            setSearchFilter("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            setSearchFilter(inputValue);
        }
    };

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

    const getGroupName = (room) => {
        return room.includes("_") ? room.split("_")[0] : room;
    };

    const handlePinToggle = (room) => {
        setPinnedRooms(prev => {
            if (prev.includes(room)) {
                const updated = prev.filter(r => r !== room);
                setTimeout(() => setChatOptionsVisible(null), 0); 
                return updated;
            } else {
                if (prev.length < 5) {
                    const updated = [room, ...prev];
                     setTimeout(() => setChatOptionsVisible(null), 0); 
                    return updated;
                } else {
                  
                    alert('Bạn chỉ có thể ghim tối đa 5 cuộc hội thoại.'); 
                     setTimeout(() => setChatOptionsVisible(null), 0); // Ensure menu closes
                    return prev; // Return the previous state without adding
                }
            }
        });
    };



    return (
        <div className="col-3 border-end left-panel" style={{ padding: "10px" }}>
            {/* Search Bar & Buttons */}
            <div className="mb-3 d-flex align-items-center">
                <div className="input-group">
                    <span className="input-group-text bg-white">
                        <FaSearch />
                    </span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Nhập đủ số điện thoại hoặc nhấn Enter"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {isSearching ? (
                    <button
                        className="btn btn-danger ms-2"
                        onClick={() => {
                            setSearchFilter("");
                            setInputValue("");
                        }}
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
                    {(() => {
                        // Get all room keys
                        const allRooms = Object.keys(activeChats);

                        // Separate pinned and unpinned rooms
                        const pinned = allRooms.filter(room => pinnedRooms.includes(room));
                        const unpinned = allRooms.filter(room => !pinnedRooms.includes(room));

                        const sortedUnpinned = unpinned.sort((roomA, roomB) => {
                            const chatA = activeChats[roomA];
                            const chatB = activeChats[roomB];

                            const isNewGroupA = chatA?.isGroup && (!chatA?.lastMessage || !chatA?.lastMessage?.timestamp);
                            const isNewGroupB = chatB?.isGroup && (!chatB?.lastMessage || !chatB?.lastMessage?.timestamp);

                          
                            if (isNewGroupA && isNewGroupB) return 0;
                            
                        
                            if (isNewGroupA) return -1;
                            if (isNewGroupB) return 1;

                        
                            const timeA = chatA?.lastMessage?.timestamp ? new Date(chatA.lastMessage.timestamp).getTime() : 0;
                            const timeB = chatB?.lastMessage?.timestamp ? new Date(chatB.lastMessage.timestamp).getTime() : 0;
                            return timeB - timeA;
                        });
                        // Combine pinned and sorted unpinned rooms
                        return [...pinned, ...sortedUnpinned];
                    })().map(room => {
                        const chat = activeChats[room];
                        const isActive = room === activeRoom;
                        const isOptionsVisible = chatOptionsVisible === room;
                        if (!chat) return null;
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
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span className="chat-name">
                                                {chat.isGroup ? getGroupName(room) : chat.partner}
                                            </span>
                                        </div>
                                        {chat.lastMessage && (
                                            <span className="chat-time">
                                                {formatTime(chat.lastMessage.timestamp)}
                                            </span>
                                        )}
                                        <div
                                            className="chat-options"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setChatOptionsVisible(prev => prev === room ? null : room);
                                            }}
                                            style={{ position: 'relative' }}
                                        >
                                            <FaEllipsisV className="chat-options-icon" style={{ fontSize: '10px', color: '#aaa' }} />
                                            {isOptionsVisible && (
                                                <div className="chat-menu" style={{ position: 'absolute', right: 0, zIndex: 100 }}>
                                                    <button className="chat-menu-item" onClick={() => handlePinToggle(room)}>
                                                        {pinnedRooms.includes(room) ? 'Bỏ ghim' : 'Ghim hội thoại'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="chat-preview" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="last-message">{renderLastMessage(chat)}</span>
                                        {chat.unread > 0 && (
                                            <span className="unread-badge">
                                                {chat.unread}
                                            </span>
                                        )}
                                        {pinnedRooms.includes(room) && (
                                            <FaThumbtack className="pinned-icon" title="Đã ghim" />
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