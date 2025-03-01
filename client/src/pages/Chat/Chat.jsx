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
// import Contacts from "./Contacts"; // Giả sử bạn đã có file này

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
    const [activeTab, setActiveTab] = useState("chat");
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
    const inputRef = useRef(null);
    const myname = localStorage.getItem("username") || "Guest";

    // Các ref để lưu giá trị thay đổi
    const currentRoomRef = useRef(currentRoom);
    useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);
    const messagesRef = useRef([]);
    useEffect(() => { messagesRef.current = messages; }, [messages]);
    const processedUnreadMessagesRef = useRef(new Set());
    const joinedRoomsRef = useRef(new Set());
    const didRegisterRef = useRef(false);

    // Đăng ký các event của socket và lấy dữ liệu ban đầu
    useEffect(() => {
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

        // Các handler của socket
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
                alert(`Có tin nhắn mới từ ${obj.name}: ${obj.message}`);
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
            const msgId = getMessageId(obj);
            const roomNotified = data.room;
            if (joinedRoomsRef.current.has(roomNotified)) return;
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
                            updated[roomId] = { partner: chat.friend, unread: chat.unread || 0 };
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

        // Đăng ký các sự kiện socket
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
        socket.on("addFriendResult", (data) => alert(data.message));

        return () => {
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
            socket.off("friendsList");
            socket.off("addFriendResult");
        };
    }, [groupDetailsVisible, myname]);

    // Các hàm xử lý
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

    const handleRoomClick = (room) => {
        if (currentRoom !== room) {
            if (currentRoom) {
                leaveRoom(currentRoom);
            }
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

    const handleUserClick = (targetUser) => {
        if (targetUser === myname) return;
        const room = [myname, targetUser].sort().join("-");
        if (currentRoom && currentRoom !== room) {
            leaveRoom(currentRoom);
        }
        setCurrentRoom(room);
        joinRoom(room);
        setMessages([]);
        setActiveChats((prev) => {
            const updated = { ...prev };
            updated[room] = { partner: targetUser, unread: 0 };
            localStorage.setItem("activeChats", JSON.stringify(updated));
            return updated;
        });
        localStorage.setItem("currentRoom", room);
        alert("Chat với " + targetUser);
    };

    // const handleCreateGroup = () => {
    //     if (!groupName) {
    //         alert("Vui lòng nhập tên nhóm");
    //         return;
    //     }
    //     if (selectedMembers.length === 0) {
    //         alert("Chọn ít nhất 1 thành viên");
    //         return;
    //     }
    //     socket.emit("createGroupChat", { groupName, members: selectedMembers });
    //     setGroupModalVisible(false);
    //     setGroupName("");
    //     setSelectedMembers([]);
    // };
    const handleCreateGroup = () => {
        console.log("handleCreateGroup được gọi với:", { groupName, selectedMembers });
        if (!groupName) {
            alert("Vui lòng nhập tên nhóm");
            return;
        }
        if (selectedMembers.length === 0) {
            alert("Chọn ít nhất 1 thành viên");
            return;
        }
        // Giả sử socket đã được khởi tạo và truyền qua context hoặc biến toàn cục
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

    const handleLeaveGroup = () => {
        if (window.confirm("Bạn có chắc muốn rời khỏi nhóm này?")) {
            socket.emit("leaveGroup", { roomId: currentRoom });
            setGroupDetailsVisible(false);
        }
    };

    const handleDisbandGroup = () => {
        if (window.confirm("Bạn có chắc muốn giải tán nhóm này?")) {
            socket.emit("disbandGroup", { roomId: currentRoom });
            setGroupDetailsVisible(false);
        }
    };

    const handleAddFriend = (friendUsername) => {
        socket.emit("addFriend", { myUsername: myname, friendUsername });
    };

    // Lọc danh sách tài khoản cho UserPanel
    const filteredAccounts = accounts.filter((acc) =>
        acc.username.toLowerCase().includes(searchFilter.toLowerCase())
    );
    const sendMessageHandler = (msg) => {
        if (!currentRoom) {
            alert("Vui lòng chọn user hoặc cuộc chat để chat.");
            return;
        }

        let messageObj;
        // Nếu msg được truyền vào là một đối tượng, dùng nó luôn (ví dụ tin nhắn file)
        if (msg && typeof msg === "object") {
            messageObj = msg;
        } else {
            // Nếu không có đối số thì dùng state message (text)
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

    return (
        <div className="container-fluid">
            <div className="row">
                <NavigationPanel
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    navigate={navigate}
                />
                <div className="col-10">
                    {activeTab === "chat" ? (
                        <div className="row">
                            <UserPanel
                                searchFilter={searchFilter}
                                setSearchFilter={setSearchFilter}
                                filteredAccounts={filteredAccounts}
                                handleUserClick={handleUserClick}
                                myname={myname}
                                setFriendModalVisible={setFriendModalVisible}
                            />
                            <ChatList activeChats={activeChats} handleRoomClick={handleRoomClick}
                                onOpenGroupModal={() => setGroupModalVisible(true)}
                            />
                            <ChatContainer
                                currentRoom={currentRoom}
                                activeChats={activeChats}
                                messages={messages}
                                myname={myname}
                                sendMessage={sendMessageHandler}  // Sửa ở đây
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
                    handleLeaveGroup={handleLeaveGroup}
                    handleDisbandGroup={handleDisbandGroup}
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
                />
            )}
        </div>
    );
};

export default Chat;
