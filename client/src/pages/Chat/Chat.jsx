import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import NavigationPanel from "../../components/NavigationPanel";
import UserPanel from "../../components/UserPanel";
import ChatList from "../../components/ChatList";
import ChatContainer from "../../components/ChatContainer";
import GroupChatModal from "../../components/GroupChatModal";
import GroupDetailsModal from "../../components/GroupDetailsModal";
import FriendModal from "../../components/FriendModal";
import Contacts from "./Contacts"; // Sử dụng Contacts component đã tạo
import LeftPanel from "../../components/LeftPanel";

// Khởi tạo socket (điều chỉnh URL nếu cần)
const socket = io("http://localhost:5000");

// Mảng cảm xúc
const emotions = [
    { id: 1, icon: <i className="fa-solid fa-heart"></i>, html: `<i class="fa-solid fa-heart"></i>` },
    { id: 2, icon: <i className="fa-solid fa-face-laugh-wink"></i>, html: `<i class="fa-solid fa-face-laugh-wink"></i>` },
    { id: 3, icon: <i className="fa-regular fa-face-surprise"></i>, html: `<i class="fa-regular fa-face-surprise"></i>` },
    { id: 4, icon: <i className="fa-regular fa-face-rolling-eyes"></i>, html: `<i class="fa-regular fa-face-rolling-eyes"></i>` },
    { id: 5, icon: <i className="fa-solid fa-face-angry"></i>, html: `<i class="fa-solid fa-face-angry"></i>` },
];

// Helper: Lấy id của message dưới dạng string
const getMessageId = (msg) => {
    if (msg._id) return msg._id.toString();
    if (msg.id) return msg.id.toString();
    return null;
};

const Chat = () => {
    const navigate = useNavigate();
    // State quản lý các tab và dữ liệu chat
    const [activeTab, setActiveTab] = useState("chat"); // "chat" hoặc "contacts"
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(localStorage.getItem("currentRoom") || null);
    const [activeChats, setActiveChats] = useState(JSON.parse(localStorage.getItem("activeChats")) || {});
    const [accounts, setAccounts] = useState([]);
    const [groupModalVisible, setGroupModalVisible] = useState(false);
    const [groupDetailsVisible, setGroupDetailsVisible] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupInfo, setGroupInfo] = useState(null);
    const [searchFilter, setSearchFilter] = useState("");
    const [activeEmotionMsgId, setActiveEmotionMsgId] = useState(null);
    const [friendModalVisible, setFriendModalVisible] = useState(false);
    const [friendInput, setFriendInput] = useState("");
    const [friends, setFriends] = useState([]);

    const [requestedFriends, setRequestedFriends] = useState([]);
    
    const inputRef = useRef(null);
    const myname = localStorage.getItem("username") || "Guest";

    // Các ref để lưu giá trị thay đổi
    const currentRoomRef = useRef(currentRoom);
    useEffect(() => {
        currentRoomRef.current = currentRoom;
    }, [currentRoom]);
    const messagesRef = useRef([]);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);
    const processedUnreadMessagesRef = useRef(new Set());
    const joinedRoomsRef = useRef(new Set());
    const didRegisterRef = useRef(false);

    useEffect(() => {
        // Đăng ký người dùng chỉ 1 lần khi component mount
        if (!didRegisterRef.current) {
            didRegisterRef.current = true;
            socket.emit("registerUser", myname);
            if (currentRoom) {
                socket.emit("join", currentRoom);
                joinedRoomsRef.current.add(currentRoom);
            }
            socket.emit("getUserConversations", myname);
        }

        // Lấy danh sách tài khoản
        fetch("/api/accounts")
            .then((res) => res.json())
            .then((data) => setAccounts(data))
            .catch((err) => console.error("Error fetching accounts:", err));

        // Lấy danh sách bạn bè của user hiện tại
        socket.emit("getFriends", myname);
        socket.on("friendsList", (data) => setFriends(data));
        socket.on("friendsListUpdated", (updatedFriends) => {
            setFriends(updatedFriends);
        });
        // Các handler sự kiện từ socket
        const handleHistory = (data) => {
            const history = JSON.parse(data);
            setMessages(history);
            localStorage.setItem("chat_" + currentRoomRef.current, JSON.stringify(history));
        };

        const handleReactionHistory = (data) => {
            const reactions = JSON.parse(data);
            setMessages((prev) => {
                const updated = [...prev];
                reactions.forEach((reaction) => {
                    const idx = updated.findIndex((msg) => getMessageId(msg) === reaction.messageId);
                    if (idx !== -1) {
                        updated[idx].reaction = reaction.emotion;
                    }
                });
                return updated;
            });
        };

        const handleThread = (data) => {
            const obj = JSON.parse(data);
            const msgId = getMessageId(obj);
            setMessages((prev) => {
                if (prev.find((msg) => getMessageId(msg) === msgId)) return prev;
                return [...prev, obj];
            });
            // Nếu message đến từ một phòng không phải phòng đang active thì cập nhật unread
            if (obj.room !== currentRoomRef.current && msgId && !processedUnreadMessagesRef.current.has(msgId)) {
                processedUnreadMessagesRef.current.add(msgId);
                setActiveChats((prev) => {
                    const updated = { ...prev };
                    if (updated[obj.room]) {
                        updated[obj.room].unread = (updated[obj.room].unread || 0) + 0.5;
                    } else {
                        updated[obj.room] = {
                            partner: obj.room.includes("_") ? (obj.groupName || "Group Chat") : obj.name,
                            unread: 0.5,
                            isGroup: obj.room.includes("_"),
                        };
                    }
                    localStorage.setItem("activeChats", JSON.stringify(updated));
                    return updated;
                });
            }
        };

        const handleMessageDeleted = (data) => {
            const obj = JSON.parse(data);
            setMessages((prev) => prev.filter((msg) => getMessageId(msg) !== obj.messageId));
        };

        const handleDeleteMessageResult = (data) => {
            alert(data.message);
        };

        const handleEmotion = (data) => {
            const obj = JSON.parse(data);
            setMessages((prev) =>
                prev.map((msg) =>
                    getMessageId(msg) === obj.messageId ? { ...msg, reaction: obj.emotion } : msg
                )
            );
        };

        const handleNotification = (data) => {
            const obj = JSON.parse(data.message);
            const roomNotified = data.room;
            const msgId = getMessageId(obj);
            if (roomNotified.includes("_") && joinedRoomsRef.current.has(roomNotified)) return;
            if (roomNotified !== currentRoomRef.current && msgId && !processedUnreadMessagesRef.current.has(msgId)) {
                processedUnreadMessagesRef.current.add(msgId);
                setActiveChats((prev) => {
                    const updated = { ...prev };
                    if (updated[roomNotified]) {
                        updated[roomNotified].unread = (updated[roomNotified].unread || 0) + 0.5;
                    } else {
                        const partnerName = roomNotified.includes("_") ? (obj.groupName || "Group Chat") : obj.name;
                        updated[roomNotified] = { partner: partnerName, unread: 0.5, isGroup: roomNotified.includes("_") };
                    }
                    localStorage.setItem("activeChats", JSON.stringify(updated));
                    return updated;
                });
            }
        };

        const handleUserConversations = (data) => {
            const conversations = JSON.parse(data);
            setActiveChats((prev) => {
                const updated = { ...prev };
                if (conversations.groupChats && conversations.groupChats.length > 0) {
                    conversations.groupChats.forEach((group) => {
                        if (!updated[group.roomId]) {
                            updated[group.roomId] = { partner: group.groupName, unread: group.unread || 0, isGroup: true };
                        } else {
                            updated[group.roomId].unread = group.unread || updated[group.roomId].unread;
                        }
                    });
                }
                if (conversations.privateChats && conversations.privateChats.length > 0) {
                    conversations.privateChats.forEach((chat) => {
                        const roomId = chat.roomId || chat.room;
                        if (!updated[roomId]) {
                            updated[roomId] = { partner: chat.friend, unread: chat.unread || 0, isGroup: false };
                        } else {
                            updated[roomId].unread = chat.unread || updated[roomId].unread;
                        }
                    });
                }
                localStorage.setItem("activeChats", JSON.stringify(updated));
                return updated;
            });
        };

        const handleNewGroupChat = (data) => {
            const groupChat = JSON.parse(data);
            setActiveChats((prev) => {
                const updated = { ...prev };
                if (!updated[groupChat.roomId]) {
                    updated[groupChat.roomId] = { partner: groupChat.groupName, unread: 0, isGroup: true };
                }
                localStorage.setItem("activeChats", JSON.stringify(updated));
                return updated;
            });
            alert("Đã tạo nhóm chat: " + groupChat.groupName);
        };

        const handleGroupDetailsResult = (data) => {
            if (!data.success) {
                alert(data.message);
                return;
            }
            setGroupInfo(data.group);
            setGroupDetailsVisible(true);
        };

        const handleGroupManagementResult = (data) => {
            alert(data.message);
            if (data.success && currentRoomRef.current) {
                socket.emit("getGroupDetails", { roomId: currentRoomRef.current });
            }
        };

        const handleGroupUpdated = (data) => {
            if (groupDetailsVisible && currentRoomRef.current) {
                socket.emit("getGroupDetails", { roomId: currentRoomRef.current });
            }
        };

        const handleKickedFromGroup = (data) => {
            alert(data.message);
            if (currentRoomRef.current === data.roomId) {
                setCurrentRoom(null);
                localStorage.removeItem("currentRoom");
                setMessages([]);
            }
            setActiveChats((prev) => {
                const updated = { ...prev };
                delete updated[data.roomId];
                localStorage.setItem("activeChats", JSON.stringify(updated));
                return updated;
            });
            localStorage.removeItem("chat_" + data.roomId);
        };

        const handleAddedToGroup = (data) => {
            alert(data.message);
            setActiveChats((prev) => {
                const updated = { ...prev };
                updated[data.roomId] = { partner: data.group.groupName, unread: 0, isGroup: true };
                localStorage.setItem("activeChats", JSON.stringify(updated));
                return updated;
            });
            socket.emit("join", data.roomId);
            joinedRoomsRef.current.add(data.roomId);
        };

        const handleLeftGroup = (data) => {
            alert(data.message);
            if (currentRoomRef.current === data.roomId) {
                setCurrentRoom(null);
                localStorage.removeItem("currentRoom");
                setMessages([]);
            }
            setActiveChats((prev) => {
                const updated = { ...prev };
                delete updated[data.roomId];
                localStorage.setItem("activeChats", JSON.stringify(updated));
                return updated;
            });
            localStorage.removeItem("chat_" + data.roomId);
        };

        const handleGroupDisbanded = (data) => {
            alert(data.message);
            if (currentRoomRef.current === data.roomId) {
                setCurrentRoom(null);
                localStorage.removeItem("currentRoom");
                setMessages([]);
            }
            setActiveChats((prev) => {
                const updated = { ...prev };
                delete updated[data.roomId];
                localStorage.setItem("activeChats", JSON.stringify(updated));
                return updated;
            });
            localStorage.removeItem("chat_" + data.roomId);
        };


        // Lắng nghe sự kiện userJoined từ server
        socket.on("userJoined", (data) => {
            console.log("User joined:", data.username);
            // Cập nhật danh sách accounts nếu user mới chưa có
            setAccounts((prev) => {
                const exists = prev.find((acc) => acc.username === data.username);
                if (!exists) {
                    // Ví dụ bạn chỉ lưu username ở đây, nếu API trả về các trường khác thì cần cập nhật thêm
                    return [...prev, { username: data.username }];
                }
                return prev;
            });
        });

        // --- Sự kiện realtime friendAccepted ---
        socket.on("friendAccepted", ({ friend, roomId }) => {
            setActiveChats((prev) => {
                const updated = { ...prev };
                if (!updated[roomId]) {
                    updated[roomId] = { partner: friend, unread: 0, isGroup: false };
                }
                localStorage.setItem("activeChats", JSON.stringify(updated));
                return updated;
            });
            socket.emit("join", roomId);
            joinedRoomsRef.current.add(roomId);
            setCurrentRoom(roomId);
            localStorage.setItem("currentRoom", roomId);
            alert(`Bạn đã kết bạn với ${friend} `);
        });

        // --- Sự kiện realtime newFriendRequest cho người nhận ---
        socket.on("newFriendRequest", (data) => {
            console.log("newFriendRequest received:", data);
            alert(`Bạn có lời mời kết bạn từ ${data.from}`);
        });

        // --- Lắng nghe sự kiện trả về khi thu hồi lời mời ---
        const handleWithdrawFriendRequestResult = (data) => {
            alert(data.message);
        };

        // Hàm này cần được implement trên server
        socket.emit('getSentFriendRequests', myname);

        // Xử lý response từ server
        socket.on('sentFriendRequests', (requests) => {
            const sentRequests = requests.map(req => req.to);
            setRequestedFriends(sentRequests);
        });

        // Xử lý khi có lời mời mới được gửi
        socket.on('friendRequestSent', ({ to }) => {
            setRequestedFriends(prev => [...prev, to]);
        });

        // Xử lý khi thu hồi lời mời
        socket.on('friendRequestWithdrawn', ({ to }) => {
            setRequestedFriends(prev => prev.filter(username => username !== to));
        });

        // Đăng ký các sự kiện từ server
        socket.on("history", handleHistory);
        socket.on("reactionHistory", handleReactionHistory);
        socket.on("thread", handleThread);
        socket.on("messageDeleted", handleMessageDeleted);
        socket.on("deleteMessageResult", handleDeleteMessageResult);
        socket.on("emotion", handleEmotion);
        socket.on("notification", handleNotification);
        socket.on("userConversations", handleUserConversations);
        socket.on("newGroupChat", handleNewGroupChat);
        socket.on("groupDetailsResult", handleGroupDetailsResult);
        socket.on("groupManagementResult", handleGroupManagementResult);
        socket.on("groupUpdated", handleGroupUpdated);
        socket.on("kickedFromGroup", handleKickedFromGroup);
        socket.on("addedToGroup", handleAddedToGroup);
        socket.on("leftGroup", handleLeftGroup);
        socket.on("groupDisbanded", handleGroupDisbanded);
        socket.on("withdrawFriendRequestResult", handleWithdrawFriendRequestResult);
        socket.on("addFriendResult", (data) => alert(data.message));

        return () => {
            // Off tất cả các event khi component unmount
            socket.off("history", handleHistory);
            socket.off("reactionHistory", handleReactionHistory);
            socket.off("thread", handleThread);
            socket.off("messageDeleted", handleMessageDeleted);
            socket.off("deleteMessageResult", handleDeleteMessageResult);
            socket.off("emotion", handleEmotion);
            socket.off("notification", handleNotification);
            socket.off("userConversations", handleUserConversations);
            socket.off("newGroupChat", handleNewGroupChat);
            socket.off("groupDetailsResult", handleGroupDetailsResult);
            socket.off("groupManagementResult", handleGroupManagementResult);
            socket.off("groupUpdated", handleGroupUpdated);
            socket.off("kickedFromGroup", handleKickedFromGroup);
            socket.off("addedToGroup", handleAddedToGroup);
            socket.off("leftGroup", handleLeftGroup);
            socket.off("groupDisbanded", handleGroupDisbanded);
            socket.off("withdrawFriendRequestResult", handleWithdrawFriendRequestResult);
            socket.off("friendsList");
            socket.off("addFriendResult");
            socket.off("friendAccepted");
            socket.off("newFriendRequest");

            socket.off('sentFriendRequests');
            socket.off('friendRequestSent');
            socket.off('friendRequestWithdrawn');

            // Off sự kiện mới đăng ký
            socket.off("userJoined");

             socket.off("friendsList");
             socket.off("friendsListUpdated");
        };
    }, [groupDetailsVisible, myname]);

    useEffect(() => {
        if (friendModalVisible) {
            // 1) Reload danh sách bạn bè
            socket.emit("getFriends", myname);

            // 2) Reload danh sách lời mời đã gửi
            socket.emit("getSentFriendRequests", myname);

            // 3) Reset input tìm kiếm
            setFriendInput("");
        }
    }, [friendModalVisible]);
    // Hàm gửi tin nhắn
    const sendMessage = () => {
        if (!currentRoom) {
            alert("Vui lòng chọn user hoặc cuộc chat để chat.");
            return;
        }
        if (message.trim() === "") return;
        const obj = {
            id: Date.now(),
            name: myname,
            message: message,
            room: currentRoom,
        };
        socket.emit("message", JSON.stringify(obj));
        setMessage("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") sendMessage();
    };

    const handleDeleteMessage = (msgId, room) => {
        if (window.confirm("Bạn có chắc muốn xóa tin nhắn này không?")) {
            socket.emit("deleteMessage", { messageId: msgId, room });
        }
    };

    const handleChooseEmotion = (msgId, id_emotion) => {
        const reactionData = {
            messageId: msgId,
            user: myname,
            emotion: id_emotion,
            room: currentRoom,
        };
        socket.emit("emotion", JSON.stringify(reactionData));
    };

    const joinRoom = (room) => {
        socket.emit("join", room);
        joinedRoomsRef.current.add(room);
    };

    const leaveRoom = (room) => {
        socket.emit("leave", room);
        joinedRoomsRef.current.delete(room);
    };

    // --- Hàm thu hồi lời mời kết bạn ---
    const handleWithdrawFriendRequest = (friendUsername) => {
        if (window.confirm(`Bạn có chắc muốn thu hồi lời mời kết bạn gửi đến ${friendUsername}?`)) {
            socket.emit("withdrawFriendRequest", { myUsername: myname, friendUsername });
        }
    };

    // Xử lý private chat
    const handleUserClick = (targetUser) => {
        if (targetUser === myname) return;
        const roomId = [myname, targetUser].sort().join("-");
        if (currentRoom && currentRoom !== roomId) leaveRoom(currentRoom);
        setCurrentRoom(roomId);
        joinRoom(roomId);
        setMessages([]);
        setActiveChats((prev) => {
            const updated = { ...prev };
            updated[roomId] = { partner: targetUser, unread: 0, isGroup: false };
            localStorage.setItem("activeChats", JSON.stringify(updated));
            return updated;
        });
        localStorage.setItem("currentRoom", roomId);
        alert("Chat với " + targetUser);
    };

    const handleRoomClick = (room) => {
        if (currentRoom !== room) {
            if (currentRoom) leaveRoom(currentRoom);
            setCurrentRoom(room);
            joinRoom(room);
            setMessages([]);
            setActiveChats((prev) => {
                const updated = { ...prev };
                if (updated[room]) updated[room].unread = 0;
                localStorage.setItem("activeChats", JSON.stringify(updated));
                return updated;
            });
            localStorage.setItem("currentRoom", room);
        }
    };

    const handleCreateGroup = () => {
        if (!groupName) {
            alert("Vui lòng nhập tên nhóm");
            return;
        }
        if (selectedMembers.length === 0) {
            alert("Chọn ít nhất 1 thành viên");
            return;
        }
        socket.emit("createGroupChat", { groupName, members: selectedMembers });
        setGroupModalVisible(false);
        setGroupName("");
        setSelectedMembers([]);
    };

    const handleRemoveGroupMember = (roomId, member) => {
        if (window.confirm(`Are you sure you want to remove ${member}?`)) {
            socket.emit("removeGroupMember", { roomId, memberToRemove: member });
        }
    };

    const handleTransferGroupOwner = (roomId, newOwner) => {
        if (window.confirm(`Are you sure you want to transfer ownership to ${newOwner}?`)) {
            socket.emit("transferGroupOwner", { roomId, newOwner });
        }
    };

    const handleAssignDeputy = (roomId, member) => {
        if (window.confirm(`Assign deputy role to ${member}?`)) {
            socket.emit("assignDeputy", { roomId, member });
        }
    };

    const handleCancelDeputy = (roomId, member) => {
        if (window.confirm(`Cancel deputy role for ${member}?`)) {
            socket.emit("cancelDeputy", { roomId, member });
        }
    };

    const handleAddGroupMember = (newMember) => {
        if (newMember.trim() === "") {
            alert("Vui lòng nhập username của thành viên cần thêm");
            return;
        }
        socket.emit("addGroupMember", { roomId: currentRoom, newMember });
    };

    const handleLeaveGroup = (newOwner) => {
        if (window.confirm(
            newOwner
                ? `Bạn có chắc muốn chuyển quyền cho ${newOwner} và rời khỏi nhóm này?`
                : "Bạn phải chọn người nhận quyền trước khi rời nhóm"
        )) {
            socket.emit("leaveGroup", { roomId: currentRoom, newOwner });
            setGroupDetailsVisible(false);
        }
    }

    const handleDisbandGroup = () => {
        if (window.confirm("Bạn có chắc muốn giải tán nhóm này?")) {
            socket.emit("disbandGroup", { roomId: currentRoom });
            setGroupDetailsVisible(false);
        }
    };

    const handleAddFriend = (friendUsername) => {
        socket.emit("addFriend", { myUsername: myname, friendUsername });
    };

    const filteredAccounts = accounts.filter(
        (acc) =>
            acc.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
            acc.phone.toLowerCase().includes(searchFilter.toLowerCase()) ||
            acc.fullname.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const sendMessageHandler = (msg) => {
        if (!currentRoom) {
            alert("Vui lòng chọn user hoặc cuộc chat để chat.");
            return;
        }
        let messageObj;
        if (msg && typeof msg === "object") {
            messageObj = msg;
        } else {
            if (message.trim() === "") return;
            messageObj = {
                id: Date.now(),
                name: myname,
                message: message,
                room: currentRoom,
            };
            setMessage("");
        }
        socket.emit("message", JSON.stringify(messageObj));
    };

    // Add searchUsers function
    const searchUsers = async (query) => {
        return accounts.filter(acc => 
            acc.username.toLowerCase().includes(query.toLowerCase()) ||
            (acc.fullname && acc.fullname.toLowerCase().includes(query.toLowerCase())) ||
            (acc.phone && acc.phone.toLowerCase().includes(query.toLowerCase()))
        );
    };

    return (
        <div className="container-fluid">
            <div className="row">
                <NavigationPanel
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    navigate={navigate}
                    myname={myname}
                />
                <div className="col-11">
                    {activeTab === "chat" ? (
                        <div className="row">
                            <LeftPanel
                                searchFilter={searchFilter}
                                setSearchFilter={setSearchFilter}
                                filteredAccounts={filteredAccounts}
                                activeChats={activeChats}
                                handleUserClick={handleUserClick} // Khi bấm vào user ở danh sách search
                                handleRoomClick={handleRoomClick} // Khi bấm vào 1 chat trong chat list
                                activeRoom={currentRoom}
                                setFriendModalVisible={setFriendModalVisible}
                                onOpenGroupModal={() => setGroupModalVisible(true)}
                            />
                            <ChatContainer
                                currentRoom={currentRoom}
                                activeChats={activeChats}
                                messages={messages}
                                myname={myname}
                                sendMessage={sendMessageHandler}
                                handleKeyDown={handleKeyDown}
                                inputRef={inputRef}
                                message={message}
                                setMessage={setMessage}
                                handleDeleteMessage={handleDeleteMessage}
                                handleChooseEmotion={handleChooseEmotion}
                                activeEmotionMsgId={activeEmotionMsgId}
                                setActiveEmotionMsgId={setActiveEmotionMsgId}
                                emotions={emotions}
                                getMessageId={getMessageId}
                                onGetGroupDetails={() => {
                                    if (!currentRoom || !activeChats[currentRoom] || !activeChats[currentRoom].isGroup) {
                                        alert("This is not a group chat.");
                                        return;
                                    }
                                    socket.emit("getGroupDetails", { roomId: currentRoom });
                                }}
                                socket={socket}
                            />
                        </div>
                    ) : (
                        <Contacts />
                    )}
                </div>
            </div>
            {groupModalVisible && (
                <GroupChatModal
                    groupName={groupName}
                    setGroupName={setGroupName}
                    accounts={accounts}
                    selectedMembers={selectedMembers}
                    setSelectedMembers={setSelectedMembers}
                    myname={myname}
                    setGroupModalVisible={setGroupModalVisible}
                    handleCreateGroup={handleCreateGroup}
                />
            )}
            {groupDetailsVisible && groupInfo && (
                <GroupDetailsModal
                    groupInfo={groupInfo}
                    setGroupDetailsVisible={setGroupDetailsVisible}
                    myname={myname}
                    handleRemoveGroupMember={handleRemoveGroupMember}
                    handleTransferGroupOwner={handleTransferGroupOwner}
                    handleAssignDeputy={handleAssignDeputy}
                    handleCancelDeputy={handleCancelDeputy}
                    handleAddGroupMember={handleAddGroupMember}
                    handleLeaveGroup={(selectedNewOwner) => handleLeaveGroup(selectedNewOwner)}
                    handleDisbandGroup={handleDisbandGroup}
                    searchUsers={searchUsers}
                />
            )}
            {friendModalVisible && (
                <FriendModal
                    friendInput={friendInput}
                    setFriendInput={setFriendInput}
                    accounts={accounts}
                    myname={myname}
                    friends={friends}
                    setFriendModalVisible={setFriendModalVisible}
                    handleAddFriend={handleAddFriend}
                    handleWithdrawFriendRequest={handleWithdrawFriendRequest}
                    requestedFriends={requestedFriends}               // THÊM
                    setRequestedFriends={setRequestedFriends}  
                />
            )}
        </div>
    );
};

export default Chat;
