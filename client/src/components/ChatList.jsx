import React from "react";
import "./ChatList.css";


const ChatList = ({ activeChats, handleRoomClick, onOpenGroupModal, activeRoom }) => {
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
        if (!chat.lastMessage) return "";
        const { content, senderId } = chat.lastMessage;
        const messagePreview = content.length > 30 ? content.substring(0, 30) + "..." : content;
        
        if (senderId === localStorage.getItem("username")) {
            return `Bạn: ${messagePreview}`;
        }
        return messagePreview;
    };

    return (
        <div className="chat-list-container">
            <div className="chat-list-header">
                <h3>Trò chuyện</h3>
                <button className="btn-create-group" onClick={onOpenGroupModal}>
                    <i className="fas fa-plus"></i>
                </button>
            </div>
            
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
                                        <i className="fas fa-users"></i>
                                    </div>
                                ) : (
                                    <img
                                        src={chat.partnerAvatar}
                                        alt={chat.partner}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://api.dicebear.com/7.x/initials/svg?seed=" + chat.partner;
                                        }}
                                    />
                                )}
                            </div>
                            
                            <div className="chat-info">
                                <div className="chat-header">
                                    <span className="chat-name">
                                        {chat.isGroup ? chat.groupName || "Nhóm chat" : chat.partner}
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
        </div>
    );
};

export default ChatList;
