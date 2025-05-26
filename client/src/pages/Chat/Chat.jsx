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
import ForwardModal from "../../components/ForwardModal";
import { ToastContainer, toast } from 'react-toastify';

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
    const [friendRequests, setFriendRequests] = useState([]);

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


    useEffect(() => {
        const roomIds = Object.keys(activeChats);
        roomIds.forEach(roomId => {
            socket.emit("getLastMessage", roomId);
        });
    }, [Object.keys(activeChats).length]);


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
                // Nếu là tin nhắn từ người khác
                if (obj.name !== myname) {
                    if (prev.find((msg) => getMessageId(msg) === msgId)) return prev;
                    return [...prev, obj];
                }

                // Nếu là tin nhắn của mình, cập nhật id từ server
                return prev.map(msg => {
                    if (msg.message === obj.message && msg.name === obj.name && !msg._id) {
                        return { ...msg, _id: obj._id };
                    }
                    return msg;
                });
            });

            // Luôn cập nhật lastMessage cho phòng chat
            setActiveChats((prev) => {
                const updated = { ...prev };
                if (updated[obj.room]) {
                    updated[obj.room].lastMessage = {
                        content: obj.message,
                        senderId: obj.name,
                        timestamp: new Date().toISOString()
                    };
                    // KHÔNG tăng unread ở đây!
                } else {
                    updated[obj.room] = {
                        partner: obj.room.includes("_") ? (obj.groupName || "Group Chat") : obj.name,
                        unread: 0, // KHÔNG tăng unread ở đây!
                        isGroup: obj.room.includes("_"),
                        lastMessage: {
                            content: obj.message,
                            senderId: obj.name,
                            timestamp: new Date().toISOString()
                        }
                    };
                }
                localStorage.setItem("activeChats", JSON.stringify(updated));
                return updated;
            });
        };

        // const handleMessageDeleted = (data) => {
        //     const obj = JSON.parse(data);
        //     setMessages((prev) => prev.filter((msg) => getMessageId(msg) !== obj.messageId));
        // };
        // Trong Chat.jsx - handleMessageDeleted function
        const handleMessageDeleted = (data) => {
            const { messageId, room } = typeof data === 'string' ? JSON.parse(data) : data;

            // Cập nhật danh sách tin nhắn
            setMessages((prev) => prev.filter((msg) => getMessageId(msg) !== messageId));

            // Cập nhật activeChats cho lastMessage
            setActiveChats((prev) => {
                const updated = { ...prev };
                if (updated[room]) {
                    const remainingMessages = messages.filter(msg => getMessageId(msg) !== messageId);
                    if (remainingMessages.length > 0) {
                        updated[room].lastMessage = {
                            senderId: remainingMessages[remainingMessages.length - 1].name,
                            content: remainingMessages[remainingMessages.length - 1].message,
                            timestamp: remainingMessages[remainingMessages.length - 1].createdAt
                        };
                    } else {
                        delete updated[room].lastMessage;
                    }
                }
                localStorage.setItem("activeChats", JSON.stringify(updated));
                return updated;
            });
        };
        const handleDeleteMessageResult = (data) => {
            toast.info(data.message);
        }; const handleEmotion = (data) => {
            const obj = JSON.parse(data);
            setMessages((prev) =>
                prev.map((msg) => {
                    // Kiểm tra bằng id nếu có
                    if (getMessageId(msg) === obj.messageId) {
                        return { ...msg, reaction: obj.emotion };
                    }
                    // Hoặc kiểm tra bằng nội dung và người gửi nếu là tin nhắn mới
                    if (!msg._id && msg.message === obj.message && msg.name === obj.sender) {
                        return { ...msg, reaction: obj.emotion };
                    }
                    return msg;
                })
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
                        // Cập nhật lastMessage

                        updated[roomNotified].lastMessage = {
                            content: obj.message,
                            senderId: obj.name,
                            timestamp: obj.createdAt || new Date().toISOString()
                        };
                    } else {
                        const partnerName = roomNotified.includes("_") ? (obj.groupName || "Group Chat") : obj.name;
                        updated[roomNotified] = {
                            partner: partnerName,
                            unread: 1,
                            isGroup: roomNotified.includes("_"),
                            lastMessage: {
                                content: obj.message,
                                senderId: obj.name,
                                timestamp: obj.createdAt || new Date().toISOString()
                            }
                        };
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

                // Xử lý group chats
                if (conversations.groupChats && conversations.groupChats.length > 0) {
                    conversations.groupChats.forEach((group) => {
                        if (!updated[group.roomId]) {
                            updated[group.roomId] = {
                                partner: group.groupName,
                                unread: group.unread || 0,
                                isGroup: true,
                                groupName: group.groupName,
                                lastMessage: group.lastMessage || null
                            };
                        } else {
                            updated[group.roomId].unread = group.unread || updated[group.roomId].unread;
                            // Chỉ cập nhật lastMessage nếu có và mới hơn
                            if (group.lastMessage && (!updated[group.roomId].lastMessage ||
                                new Date(group.lastMessage.timestamp) > new Date(updated[group.roomId].lastMessage.timestamp))) {
                                updated[group.roomId].lastMessage = group.lastMessage;
                            }
                        }
                    });
                }

                // Xử lý private chats
                if (conversations.privateChats && conversations.privateChats.length > 0) {
                    conversations.privateChats.forEach((chat) => {
                        const roomId = chat.roomId || chat.room;
                        if (!updated[roomId]) {
                            updated[roomId] = {
                                partner: chat.friend,
                                unread: chat.unread || 0,
                                isGroup: false,
                                partnerAvatar: chat.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.friend}`,
                                lastMessage: chat.lastMessage || null
                            };
                        } else {
                            updated[roomId].unread = chat.unread || updated[roomId].unread;
                            // Chỉ cập nhật lastMessage nếu có và mới hơn
                            if (chat.lastMessage && (!updated[roomId].lastMessage ||
                                new Date(chat.lastMessage.timestamp) > new Date(updated[roomId].lastMessage.timestamp))) {
                                updated[roomId].lastMessage = chat.lastMessage;
                            }
                        }
                    });
                }

                // Lưu vào localStorage
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
            toast.success("Đã tạo nhóm chat: " + groupChat.groupName);
        };

        const handleGroupDetailsResult = (data) => {
            if (!data.success) {
                toast.info(data.message);
                return;
            }
            setGroupInfo(data.group);
            setGroupDetailsVisible(true);
        };

        const handleGroupManagementResult = (data) => {
            // alert(data.message);
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
            // alert(data.message);
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
            // alert(data.message);
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
            // alert(data.message);
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
            // alert(data.message);
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
            toast.success(`Bạn đã kết bạn với ${friend} `);
        });

        // --- Sự kiện realtime newFriendRequest cho người nhận ---
        socket.on("newFriendRequest", (data) => {
            console.log("newFriendRequest received:", data);
            toast.info(`Bạn có lời mời kết bạn từ ${data.from}`);
            // Cập nhật lại danh sách lời mời kết bạn ngay lập tức
            socket.emit("getFriendRequests", myname);
        });

        // --- Lắng nghe sự kiện trả về khi thu hồi lời mời ---
        const handleWithdrawFriendRequestResult = (data) => {
            toast.info(data.message);
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

        // Lắng nghe sự kiện bị hủy kết bạn để đồng bộ lại friends, friendRequests, requestedFriends
        socket.on('friendRemoved', () => {
            socket.emit('getFriends', myname);
            socket.emit('getFriendRequests', myname);
            socket.emit('getSentFriendRequests', myname);
            setForceUpdate(Date.now()); // Force re-render để cập nhật UI
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
        socket.on("addFriendResult", (data) => toast.success(data.message));



        socket.on("lastMessage", (msgDoc) => {
            // nếu server trả về null (room chưa có tin nhắn) thì bỏ qua luôn
            if (!msgDoc || !msgDoc.room) return;

            setActiveChats(prev => {
                // chỉ cập nhật khi room đã tồn tại trong activeChats
                if (!prev[msgDoc.room]) return prev;
                return {
                    ...prev,
                    [msgDoc.room]: {
                        ...prev[msgDoc.room],
                        lastMessage: {
                            senderId: msgDoc.name,
                            content: msgDoc.message,
                            timestamp: msgDoc.createdAt
                        }
                    }
                };
            });
        });

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

            socket.off("lastMessage");
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

    // Thêm useEffect để đảm bảo activeChats được lưu khi thay đổi
    useEffect(() => {
        localStorage.setItem("activeChats", JSON.stringify(activeChats));
    }, [activeChats]);

    // Hàm gửi tin nhắn
    const sendMessage = () => {
        if (!currentRoom) {
            toast.error("Vui lòng chọn user hoặc cuộc chat để chat.");
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
        // alert("Chat với " + targetUser);
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
            toast.info("Vui lòng nhập tên nhóm");
            return;
        }
        if (selectedMembers.length === 0) {
            toast.info("Chọn ít nhất 1 thành viên");
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
            toast.info("Vui lòng nhập username của thành viên cần thêm");
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
            toast.info("Vui lòng chọn user hoặc cuộc chat để chat.");
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
                createdAt: new Date().toISOString()
            };
            setMessage("");
        }

        // Chỉ thêm vào state nếu là phòng hiện tại
        if (messageObj.room === currentRoom) {
            setMessages(prev => [...prev, messageObj]);
        }
        // Luôn cập nhật activeChats với lastMessage cho phòng nhận tin nhắn
        setActiveChats(prev => {
            const updated = { ...prev };
            if (updated[messageObj.room]) {
                updated[messageObj.room].lastMessage = {
                    content: messageObj.message,
                    senderId: myname,
                    timestamp: messageObj.createdAt
                };
            }
            return updated;
        });
        // Gửi lên server
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

    useEffect(() => {
        window.onForwardMessage = (msg, selectedRooms) => {
            const filteredRooms = selectedRooms.filter(roomId => roomId !== currentRoom);
            filteredRooms.forEach(roomId => {
                // Tạo bản sao message, gán room mới và thêm trường forwardedFrom
                const forwardMsg = {
                    ...msg,
                    id: Date.now() + Math.floor(Math.random() * 10000),
                    room: roomId,
                    forwardedFrom: {
                        name: msg.name,
                        room: msg.room,
                        message: msg.message,
                        fileUrl: msg.fileUrl,
                        fileType: msg.fileType,
                        fileName: msg.fileName
                    },
                    name: myname,
                    createdAt: new Date().toISOString()
                };
                sendMessageHandler(forwardMsg);
            });
        };
        return () => { window.onForwardMessage = null; };
    }, [myname, sendMessageHandler, currentRoom]);

    useEffect(() => {
        if (!socket || !myname) return;
        const handleRespondResult = (data) => {
            // Nếu mình là người gửi và bị từ chối thì xóa khỏi requestedFriends
            if (data.action === 'rejected' && data.from && data.to && data.from === myname) {
                setRequestedFriends(prev => prev.filter(u => u !== data.to));
            }
        };
        socket.on('respondFriendRequestResult', handleRespondResult);
        return () => {
            socket.off('respondFriendRequestResult', handleRespondResult);
        };
    }, [socket, myname]);

    useEffect(() => {
        if (!socket || !myname || !currentRoom) return;
        // Nếu là chat cá nhân thì luôn đồng bộ lại lời mời
        if (currentRoom && currentRoom.includes('-')) {
            socket.emit('getFriendRequests', myname);
            socket.emit('getSentFriendRequests', myname);
        }
    }, [currentRoom, myname]);

    useEffect(() => {
        const onFriendRequests = (requests) => {
            // Đảm bảo requests là mảng object {from, to}
            setFriendRequests(requests);
            if (typeof window !== 'undefined') window.friendRequests = requests;
        };
        socket.on("friendRequests", onFriendRequests);
        return () => {
            socket.off("friendRequests", onFriendRequests);
        };
    }, []);

    const [forceUpdate, setForceUpdate] = useState(0);

    return (
        <div className="container-fluid">
            <div className="row">
                <NavigationPanel
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    navigate={navigate}
                    myname={myname}
                    setActiveChats={setActiveChats}
                    socket={socket}
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
                                setMessages={setMessages}
                                setMessage={setMessage}
                                handleDeleteMessage={handleDeleteMessage}
                                handleChooseEmotion={handleChooseEmotion}
                                activeEmotionMsgId={activeEmotionMsgId}
                                setActiveEmotionMsgId={setActiveEmotionMsgId}
                                emotions={emotions}
                                getMessageId={getMessageId}
                                onGetGroupDetails={() => {
                                    if (!currentRoom || !activeChats[currentRoom] || !activeChats[currentRoom].isGroup) {
                                        toast.info("This is not a group chat.");
                                        return;
                                    }
                                    socket.emit("getGroupDetails", { roomId: currentRoom });
                                }}
                                socket={socket}
                                handleAddFriend={handleAddFriend}
                                friends={friends}
                                requestedFriends={requestedFriends}
                                setRequestedFriends={setRequestedFriends}
                                friendRequests={friendRequests} // Truyền đúng prop này
                                forceUpdate={forceUpdate} // Truyền prop forceUpdate để re-render
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
                    friends={friends}
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
