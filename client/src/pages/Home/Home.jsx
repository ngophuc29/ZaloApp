import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Contacts from "./Contacts"; // Nếu cần sử dụng component Contacts cho mục khác
import { useNavigate } from "react-router-dom";

// Kết nối tới backend (điều chỉnh URL nếu cần)
const socket = io("https://sockettubuild.onrender.com");

const emotions = [
  { id: 1, icon: <i className="fa-solid fa-heart"></i>, html: `<i class="fa-solid fa-heart"></i>` },
  { id: 2, icon: <i className="fa-solid fa-face-laugh-wink"></i>, html: `<i class="fa-solid fa-face-laugh-wink"></i>` },
  { id: 3, icon: <i className="fa-regular fa-face-surprise"></i>, html: `<i class="fa-regular fa-face-surprise"></i>` },
  { id: 4, icon: <i className="fa-regular fa-face-rolling-eyes"></i>, html: `<i class="fa-regular fa-face-rolling-eyes"></i>` },
  { id: 5, icon: <i className="fa-solid fa-face-angry"></i>, html: `<i class="fa-solid fa-face-angry"></i>` },
];

// Helper: ép id của message về dạng string (dù là _id hay id)
const getMessageId = (msg) => {
  if (msg._id) return msg._id.toString();
  if (msg.id) return msg.id.toString();
  return null;
};

const Chat = () => {
  const navigate = useNavigate();
  // State chuyển đổi giữa Chat và Contacts (nếu cần)
  const [activeTab, setActiveTab] = useState("chat");

  // State chat hiện tại
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
  const inputRef = useRef(null);
  const myname = localStorage.getItem("username") || "Guest";

  const [activeEmotionMsgId, setActiveEmotionMsgId] = useState(null);

  // ---- State cho modal "Kết bạn" ----
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  // friendInput dùng để lọc danh sách user trong modal
  const [friendInput, setFriendInput] = useState("");
  // State lưu danh sách bạn bè của user hiện tại (mảng username)
  const [friends, setFriends] = useState([]);

  // Ref để giữ currentRoom mới nhất
  const currentRoomRef = useRef(currentRoom);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Ref để lưu danh sách tin nhắn hiện tại
  const messagesRef = useRef([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Set lưu các message id đã được xử lý tăng unread
  const processedUnreadMessagesRef = useRef(new Set());
  // Ref lưu danh sách các room đã join bởi client
  const joinedRoomsRef = useRef(new Set());
  // Guard đăng ký listener socket chỉ một lần
  const didRegisterRef = useRef(false);

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
    socket.on("friendsList", (data) => {
      setFriends(data);
    });

    // Các handler socket (history, reactionHistory, thread, v.v.)
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

    // Đăng ký các event listener socket
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

    // Listener cho kết bạn (friend functionality)
    socket.on("addFriendResult", (data) => {
      alert(data.message);
    });

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
  }, []);

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
    // alert("Chat với " + targetUser);
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

  // ---- Hàm xử lý gửi lời mời kết bạn từ modal ----
  // Trong modal này, danh sách user được lọc theo friendInput
  const handleAddFriend = (friendUsername) => {
    socket.emit("addFriend", { myUsername: myname, friendUsername });
  };

  const renderChatList = () => {
    return Object.keys(activeChats).map((room) => (
      <li
        key={room}
        style={{ cursor: "pointer", padding: "5px", borderBottom: "1px solid #ddd" }}
        onClick={() => handleRoomClick(room)}
      >
        {activeChats[room].partner}
        {activeChats[room].unread > 0 && (
          <span
            style={{
              backgroundColor: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 5px",
              marginLeft: "5px",
            }}
          >
            {Math.ceil(activeChats[room].unread)}
          </span>
        )}
      </li>
    ));
  };

  const filteredAccounts = accounts.filter((acc) =>
    acc.username.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Navigation Panel */}
        <div className="col-2 border-end" style={{ padding: "10px" }}>
          <ul className="list-unstyled">
            <li style={{ cursor: "pointer", padding: "10px", borderBottom: "1px solid #ddd" }} onClick={() => setActiveTab("chat")}>
              Tin Nhắn
            </li>
            <li style={{ cursor: "pointer", padding: "10px" }} onClick={() => setActiveTab("contacts")}>
              Danh bạ
            </li>
            <li style={{ cursor: "pointer", padding: "10px" }} onClick={() => 
            {
              navigate('/login')
              localStorage.clear();
              }
            }>
              Đăng xuất
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="col-10">
          {activeTab === "chat" ? (
            <div className="row">
              {/* User Panel */}
              <div className="col-3 border-end" style={{ padding: "10px" }}>
                <div className="mb-3 d-flex">
                  <input
                    type="text"
                    id="search_user"
                    className="form-control"
                    placeholder="Search user by name"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                  <button className="btn btn-success ms-2" onClick={() => setFriendModalVisible(true)}>
                    Kết bạn
                  </button>
                </div>
                <ul className="list-unstyled">
                  {filteredAccounts.map((account, idx) => (
                    <li key={idx} style={{ cursor: "pointer", marginBottom: "10px" }} onClick={() => handleUserClick(account.username)}>
                      <div className="d-flex">
                        <span>UserName: </span>
                        <p className="ms-2">{account.username}</p>
                      </div>
                      <div className="d-flex">
                        <span>FullName: </span>
                        <p className="ms-2">{account.fullname}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chat List */}
              <div className="col-3 border-end" style={{ padding: "10px" }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h3>Chats</h3>
                  <button className="btn btn-primary" onClick={() => setGroupModalVisible(true)}>
                    +
                  </button>
                </div>
                <ul id="chat_list_ul" className="list-group">
                  {renderChatList()}
                </ul>
              </div>

              {/* Chat Container */}
              <div className="col-6" style={{ padding: "10px" }}>
                <button
                  className="btn btn-secondary mb-2"
                  onClick={() => {
                    if (!currentRoom || !activeChats[currentRoom] || !activeChats[currentRoom].isGroup) {
                      alert("This is not a group chat.");
                      return;
                    }
                    socket.emit("getGroupDetails", { roomId: currentRoom });
                  }}
                >
                  Group Details
                </button>
                <ul id="ul_message" className="list-group mb-2" style={{ maxHeight: "50vh", overflowY: "auto" }}>
                  {messages.map((msg) => (
                    <li key={getMessageId(msg)} className={`list-group-item ${msg.name === myname ? "text-end" : ""}`}>
                      <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{msg.name}</div>
                      <span id={getMessageId(msg)} style={{ position: "relative" }}>
                        <p>{msg.message}</p>
                        {msg.reaction && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: "-7px",
                              right: "4px",
                              backgroundColor: "blue",
                              borderRadius: "10px",
                              padding: "3px",
                            }}
                          >
                            {emotions[msg.reaction - 1].icon}
                          </span>
                        )}
                      </span>
                      <div className="" style={{ display: "flex", alignItems: "center" }}>
                        <i
                          className="choose_emotion fa-regular fa-face-smile"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            setActiveEmotionMsgId(
                              getMessageId(msg) === activeEmotionMsgId ? null : getMessageId(msg)
                            )
                          }
                        ></i>
                        {msg.name === myname && (
                          <button className="btn_delete" onClick={() => handleDeleteMessage(getMessageId(msg), msg.room)}>
                            X
                          </button>
                        )}
                        {activeEmotionMsgId === getMessageId(msg) && (
                          <div>
                            {[1, 2, 3, 4, 5].map((em) => (
                              <i
                                key={em}
                                onClick={() => {
                                  handleChooseEmotion(getMessageId(msg), em);
                                  setActiveEmotionMsgId(null);
                                }}
                                style={{ margin: "0 2px", cursor: "pointer" }}
                              >
                                {emotions[em - 1].icon}
                              </i>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="input-group">
                  <input
                    type="text"
                    id="message"
                    className="form-control"
                    placeholder="Enter your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                  />
                  <button id="btn_send" className="btn btn-primary" onClick={sendMessage}>
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Nếu activeTab là "contacts", render component Contacts
            <Contacts />
          )}
        </div>
      </div>

      {/* Modal Tạo Nhóm Chat */}
      {groupModalVisible && (
        <div
          className="modal"
          style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target.className.includes("modal")) setGroupModalVisible(false);
          }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tạo Nhóm Chat</h5>
                <button type="button" className="btn-close" onClick={() => setGroupModalVisible(false)}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  id="groupName"
                  className="form-control mb-3"
                  placeholder="Tên nhóm chat"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <h6>Chọn thành viên:</h6>
                <div style={{ maxHeight: "200px", overflowY: "scroll", border: "1px solid #ccc", padding: "5px" }}>
                  {accounts
                    .filter((acc) => acc.username !== myname)
                    .map((account, idx) => (
                      <div key={idx} className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          value={account.username}
                          id={`member-${idx}`}
                          checked={selectedMembers.includes(account.username)}
                          onChange={() => {
                            const username = account.username;
                            setSelectedMembers((prev) =>
                              prev.includes(username)
                                ? prev.filter((u) => u !== username)
                                : [...prev, username]
                            );
                          }}
                        />
                        <label className="form-check-label" htmlFor={`member-${idx}`}>
                          {account.username}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleCreateGroup}>
                  Tạo Nhóm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Group Details */}
      {groupDetailsVisible && groupInfo && (
        <div
          className="modal"
          style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target.className.includes("modal")) setGroupDetailsVisible(false);
          }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Group Details</h5>
                <button type="button" className="btn-close" onClick={() => setGroupDetailsVisible(false)}></button>
              </div>
              <div className="modal-body">
                <div id="groupInfo">
                  <p>
                    <strong>Group Name:</strong> {groupInfo.groupName}
                  </p>
                  <p>
                    <strong>Owner:</strong> {groupInfo.owner}
                  </p>
                  <p>
                    <strong>Deputies:</strong> {groupInfo.deputies.join(", ")}
                  </p>
                  <p>
                    <strong>Members:</strong> {groupInfo.members.join(", ")}
                  </p>
                  <ul>
                    {groupInfo.members
                      .filter((member) => member !== myname)
                      .map((member, idx) => (
                        <li key={idx}>
                          {member}{" "}
                          {(groupInfo.owner === myname ||
                            (groupInfo.deputies && groupInfo.deputies.includes(myname))) &&
                            member !== groupInfo.owner && (
                              <button onClick={() => handleRemoveGroupMember(groupInfo.roomId, member)}>
                                Remove
                              </button>
                            )}
                          {groupInfo.owner === myname && member !== groupInfo.owner && (
                            <button onClick={() => handleTransferGroupOwner(groupInfo.roomId, member)}>
                              Transfer Ownership
                            </button>
                          )}
                          {groupInfo.owner === myname && !groupInfo.deputies.includes(member) && (
                            <button onClick={() => handleAssignDeputy(groupInfo.roomId, member)}>
                              Assign Deputy
                            </button>
                          )}
                          {groupInfo.owner === myname && groupInfo.deputies.includes(member) && (
                            <button onClick={() => handleCancelDeputy(groupInfo.roomId, member)}>
                              Cancel Deputy
                            </button>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
                <div id="groupActions" className="mt-3">
                  <input
                    type="text"
                    id="newMemberInput"
                    className="form-control"
                    placeholder="New member username"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddGroupMember(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  />
                  <button
                    className="btn btn-primary mb-2"
                    onClick={() => {
                      const input = document.getElementById("newMemberInput");
                      handleAddGroupMember(input.value);
                      input.value = "";
                    }}
                  >
                    Add Member
                  </button>
                  <button className="btn btn-warning mb-2" onClick={handleLeaveGroup}>
                    Leave Group
                  </button>
                  <button className="btn btn-danger" onClick={handleDisbandGroup}>
                    Disband Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Modal "Kết bạn" hiển thị danh sách user ---- */}
      {friendModalVisible && (
        <div
          className="modal"
          style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target.className.includes("modal")) setFriendModalVisible(false);
          }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Kết bạn</h5>
                <button type="button" className="btn-close" onClick={() => setFriendModalVisible(false)}></button>
              </div>
              <div className="modal-body">
                {/* Ô tìm kiếm để lọc danh sách user */}
                <input
                  type="text"
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  className="form-control mb-3"
                  placeholder="Tìm kiếm user..."
                />
                {/* Hiển thị danh sách user được lọc */}
                <ul className="list-unstyled" style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {accounts
                    .filter(
                      (acc) =>
                        acc.username.toLowerCase().includes(friendInput.toLowerCase()) &&
                        acc.username !== myname &&
                        !friends.includes(acc.username)
                    )
                    .map((acc) => (
                      <li
                        key={acc.username}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        <div>
                          <strong>{acc.username}</strong> - {acc.fullname}
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAddFriend(acc.username)}
                        >
                          Kết bạn
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Chat;
