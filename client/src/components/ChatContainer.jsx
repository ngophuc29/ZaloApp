import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import ImageUploader from "./ImageUploader"; // Component upload ảnh
import Peer from "simple-peer/simplepeer.min.js";
import './video.css';
import './message-actions.css';
import FileUploader from "./FileUploader";
import FriendModal from "./FriendModal";
import ForwardModal from "./ForwardModal";

// Add CSS styles for reply functionality
const styles = {
    replyPreview: {
        backgroundColor: '#f0f0f0',
        padding: '5px 10px',
        margin: '5px 0',
        borderRadius: '5px',
        borderLeft: '3px solid #007bff',
    },
    replyIndicator: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 10px',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px',
        marginBottom: '10px',
    },
    messageActions: {
        display: 'flex',
        gap: '5px',
        marginTop: '5px',
    },
    actionButton: {
        padding: '2px 5px',
        fontSize: '12px',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
        backgroundColor: '#e0e0e0',
    }, replyPreview: {
        backgroundColor: '#f0f0f0',
        padding: '8px',
        borderRadius: '8px',
        borderLeft: '3px solid #007bff',
        marginBottom: '8px',
        fontSize: '0.9em'
    },
    replyIndicator: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: '8px',
        borderRadius: '8px',
        marginBottom: '8px',
        fontSize: '0.9em'
    },
    actionButton: {
        background: 'none',
        border: 'none',
        color: '#007bff',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        '&:hover': {
            backgroundColor: '#e0e0e0'
        }
    }
};

const ChatContainer = ({
    socket,
    currentRoom,
    messages,
    myname,
    sendMessage, // Hàm gửi tin nhắn; lưu ý: phải truyền đối tượng tin nhắn (đã JSON.stringify ở Chat.js)
    handleKeyDown,
    inputRef,
    message,
    setMessage,
    handleDeleteMessage,
    handleChooseEmotion,
    activeEmotionMsgId,
    setActiveEmotionMsgId,
    emotions,
    getMessageId,
    onGetGroupDetails,
    friends ,
    requestedFriends ,
    handleAddFriend,
    activeChats,
}) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showImageUploader, setShowImageUploader] = useState(false);
    // Thêm state mới
    const [showFileUploader, setShowFileUploader] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardMessageObj, setForwardMessageObj] = useState(null);

    // State quản lý cuộc gọi
    const [calling, setCalling] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peer, setPeer] = useState(null);
    const [facingMode, setFacingMode] = useState("user");
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const [userInfo, setUserInfo] = useState({});
    const [userList, setUserList] = useState([]);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user")) || {};
        setUserInfo(storedUser);

        const usernameToFetch = myname || storedUser.username;
        if (usernameToFetch) {
            fetch(`http://localhost:5000/api/accounts/username/${usernameToFetch}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.message) {
                        setUserInfo(data);
                    }
                })
                .catch(err => {
                    console.error("Lỗi khi lấy thông tin người dùng:", err);
                });
        }
    }, [myname]);

    // Khi chọn emoji, thêm emoji vào tin nhắn hiện tại
    const onEmojiClick = (emojiData, event) => {
        setMessage((prev) => prev + emojiData.emoji);
    };

    // Gửi tin nhắn text (nếu message là string và không rỗng)
    const handleSend = () => {
        if (typeof message === "string" && message.trim() !== "") {
            const msgObj = {
                id: Date.now(),
                name: myname,
                message: message,
                room: currentRoom,
                createdAt: new Date().toISOString(),
            };

            if (replyingTo) {
                msgObj.replyTo = {
                    id: replyingTo.id,
                    name: replyingTo.name,
                    message: replyingTo.message,
                    fileUrl: replyingTo.fileUrl,
                    fileName: replyingTo.fileName,
                    fileType: replyingTo.fileType
                };
            }

            sendMessage(msgObj);
            setMessage("");
            setReplyingTo(null);
        }
        setShowEmojiPicker(false);
    };


    // Khi nhấn Enter, gọi handleSend
    const onInputKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSend();
        } else {
            handleKeyDown(e);
        }
    };

    // Callback khi upload ảnh thành công, nhận được imageUrl từ Cloudinary
    const handleImageUploadSuccess = (imageUrl) => {
        const fileMessage = {
            id: Date.now(),
            name: myname,
            message: "", // Bạn có thể cho phép kết hợp text nếu cần
            room: currentRoom,
            fileUrl: imageUrl,
        };
        sendMessage(fileMessage);
        setShowImageUploader(false);
    };

    const messageContainerRef = useRef(null);

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);




    // Chuyển đổi camera trước/sau






    useEffect(() => {

        fetch("http://localhost:5000/api/accounts")
            .then((res) => res.json())
            .then((data) => {
                setUserList(data)
                console.log(data);

            })
            .catch((err) => console.error("Error fetching accounts:", err));
    }, [])

    const getAvatarByName = (name) => {
        const user = userList.find((u) => u.username === name);
        return user?.image || "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/2048px-User-avatar.svg.png";
    };

    const handleFileUploadSuccess = (fileData) => {
        const fileMessage = {
            id: Date.now(),
            name: myname,
            message: "",
            room: currentRoom,
            fileUrl: fileData.url,
            fileType: fileData.type,
            fileName: fileData.name,
            fileSize: fileData.size,
            createdAt: new Date().toISOString()
        };

        if (replyingTo) {
            fileMessage.replyTo = {
                id: replyingTo.id,
                name: replyingTo.name,
                message: replyingTo.message,
                fileUrl: replyingTo.fileUrl,
                fileName: replyingTo.fileName,
                fileType: replyingTo.fileType
            };
        }

        sendMessage(fileMessage);
        setShowFileUploader(false);
        setReplyingTo(null);
    };
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    };
    const handleReply = (msg) => {
        setReplyingTo({
            id: msg._id || msg.id,
            name: msg.name,
            message: msg.message,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileType: msg.fileType
        });
        inputRef.current?.focus();
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
    };

    // Thêm hàm kiểm tra group chat
    const isGroupChat = (roomName) => {
        return roomName && !roomName.includes('-');
    };

    // Hàm kiểm tra chat cá nhân
    const isPrivateChat = (roomName) => roomName && roomName.includes('-');
    // Lấy tên đối phương
    const getPartnerName = () => {
        if (!isPrivateChat(currentRoom)) return null;
        const [u1, u2] = currentRoom.split('-');
        return u1 === myname ? u2 : u1;
    };
    const partnerName = getPartnerName();
    const isStranger = isPrivateChat(currentRoom) && partnerName && !friends.includes(partnerName);
    const isRequested = isPrivateChat(currentRoom) && partnerName && requestedFriends && requestedFriends.includes(partnerName);

    return (
        <div className="col-9" style={{ padding: "10px", position: "relative", height: "100vh" }}>
            <h3 style={{ textAlign: 'left' }}>Chat Room: {currentRoom}</h3>
            {/* Chỉ hiện Group Details nếu là group chat */}
            {isGroupChat(currentRoom) && (
                <button className="btn btn-secondary mb-2" onClick={onGetGroupDetails}>
                    Group Details
                </button>
            )}
            {mediaError && (
                <div className="alert alert-danger">
                    {mediaError}
                    <button className="btn btn-sm btn-link" onClick={() => setMediaError(null)}>
                        Đóng
                    </button>
                </div>
            )}

            {/* Nếu là người lạ thì hiện thông báo và nút gửi lời mời */}
            {isStranger && (
                <div style={{ marginBottom: 10 }}>
                    <span style={{ color: 'red', fontWeight: 'bold', marginRight: 8 }}>Người lạ</span>
                    {isRequested ? (
                        <button className="btn btn-secondary btn-sm" disabled>Đã gửi</button>
                    ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => handleAddFriend && handleAddFriend(partnerName)}>
                            Gửi lời mời kết bạn
                        </button>
                    )}
                </div>
            )}

            <ul
                id="ul_message"
                ref={messageContainerRef}
                className="list-group mb-2"
                style={{ maxHeight: "83vh", overflowY: "auto" }}
            >
                {messages.map((msg) => {
                    const isMine = msg.name === myname;
                    return (
                        <li
                            key={getMessageId(msg)}
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: isMine ? "flex-end" : "flex-start",
                                marginBottom: "10px",
                                position: "relative",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            {/* Action bên trái (tin nhắn của mình) */}
                            {isMine && (
                                <div className="message-actions-container message-actions-left">
                                    <i className="action-icon fa-solid fa-reply"
                                        onClick={() => handleReply(msg)}
                                        title="Reply"></i>
                                    <i className="action-icon fa-regular fa-face-smile"
                                        onClick={() => setActiveEmotionMsgId(
                                            getMessageId(msg) === activeEmotionMsgId ? null : getMessageId(msg)
                                        )}
                                        title="Add reaction"></i>
                                    <i className="action-icon fa-solid fa-trash"
                                        onClick={() => handleDeleteMessage(getMessageId(msg), msg.room)}
                                        title="Delete"></i>
                                    <i className="action-icon fa-solid fa-share"
                                        onClick={() => {
                                            setForwardMessageObj(msg);
                                            setShowForwardModal(true);
                                        }}
                                        title="Chuyển tiếp"
                                        style={{ marginLeft: 4 }}
                                    ></i>
                                    {activeEmotionMsgId === getMessageId(msg) && (
                                        <div className="emotion-picker" style={{
                                            display: "flex",
                                            position: "absolute",
                                            top: "-36px",
                                            left: "0",
                                            backgroundColor: "#fff",
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                            zIndex: 10
                                        }}>
                                            {[1, 2, 3, 4, 5].map((em) => (
                                                <i
                                                    key={em}
                                                    onClick={() => {
                                                        handleChooseEmotion(getMessageId(msg), em);
                                                        setActiveEmotionMsgId(null);
                                                    }}
                                                    style={{ margin: "0 2px", cursor: "pointer", fontSize: "16px" }}
                                                >
                                                    {emotions[em - 1].icon}
                                                </i>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Action bên phải (tin nhắn của người khác) */}
                            {!isMine && (
                                <div className="message-actions-container message-actions-right" style={{ order: 2 }}>
                                    <i className="action-icon fa-solid fa-reply"
                                        onClick={() => handleReply(msg)}
                                        title="Reply"></i>
                                    <i className="action-icon fa-regular fa-face-smile"
                                        onClick={() => setActiveEmotionMsgId(
                                            getMessageId(msg) === activeEmotionMsgId ? null : getMessageId(msg)
                                        )}
                                        title="Add reaction"></i>
                                    <i className="action-icon fa-solid fa-share"
                                        onClick={() => {
                                            setForwardMessageObj(msg);
                                            setShowForwardModal(true);
                                        }}
                                        title="Chuyển tiếp"
                                        style={{ marginLeft: 4 }}
                                    ></i>
                                    {activeEmotionMsgId === getMessageId(msg) && (
                                        <div className="emotion-picker" style={{
                                            display: "flex",
                                            position: "absolute",
                                            top: "-36px",
                                            right: "0",
                                            backgroundColor: "#fff",
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                            zIndex: 10
                                        }}>
                                            {[1, 2, 3, 4, 5].map((em) => (
                                                <i
                                                    key={em}
                                                    onClick={() => {
                                                        handleChooseEmotion(getMessageId(msg), em);
                                                        setActiveEmotionMsgId(null);
                                                    }}
                                                    style={{ margin: "0 2px", cursor: "pointer", fontSize: "16px" }}
                                                >
                                                    {emotions[em - 1].icon}
                                                </i>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div
                                style={{
                                    background: isMine ? "#dcf8c6" : "#fff",
                                    padding: "10px",
                                    borderRadius: "10px",
                                    maxWidth: "70%",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                                    position: "relative",
                                    order: isMine ? 2 : 1
                                }}
                            >
                                {msg.name !== myname && (
                                    <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                                        <img
                                            src={getAvatarByName(msg.name)}
                                            alt="avatar"
                                            style={{
                                                width: "24px",
                                                height: "24px",
                                                borderRadius: "50%",
                                                marginRight: "6px",
                                                objectFit: "cover"
                                            }}
                                        />
                                        <span style={{ fontWeight: "bold" }}>{msg.name}</span>
                                    </div>
                                )}
                                {msg.replyTo && msg.replyTo.id && (msg.replyTo.message || msg.replyTo.fileUrl) && (() => {
                                    // Kiểm tra xem tin nhắn gốc có còn trong messages không
                                    const originalExists = messages.some(m =>
                                        (m._id === msg.replyTo.id || m.id === msg.replyTo.id)
                                    );

                                    return (
                                        <div className="reply-preview" style={styles.replyPreview}>
                                            <span className="reply-to">Replying to {msg.replyTo.name}</span>

                                            {/* Nếu là text */}
                                            {msg.replyTo.message ? (
                                                <span
                                                    className="reply-message"
                                                    style={{
                                                        fontStyle: originalExists ? 'normal' : 'italic',
                                                        color: originalExists ? '#666' : '#888'
                                                    }}
                                                >
                                                    {originalExists ? msg.replyTo.message : "Tin nhắn đã bị xóa"}
                                                </span>

                                            ) : /* Nếu là file */
                                                msg.replyTo.fileUrl ? (
                                                    !originalExists ? (
                                                        // File gốc đã bị xóa
                                                        <span style={{ fontStyle: 'italic', color: '#888' }}>
                                                            Tin nhắn đã bị xóa
                                                        </span>
                                                    ) : (
                                                        // File gốc còn, render preview file
                                                        <div className="reply-file-preview" style={{ marginTop: 4 }}>
                                                            {/* Ảnh */}
                                                            {( /\.(jpe?g|png|gif|webp)$/i ).test(msg.replyTo.fileUrl) ? (
                                                                <img
                                                                    src={msg.replyTo.fileUrl}
                                                                    alt="reply-img"
                                                                    style={{ width: 60, height: 60, borderRadius: 4 }}
                                                                />
                                                            )
                        /* Video */ : ( /\.(mp4|webm|ogg)$/i ).test(msg.replyTo.fileUrl) ? (
                                                                    <div className="reply-video-container" style={styles.replyVideoContainer}>
                                                                        <video
                                                                            src={msg.replyTo.fileUrl}
                                                                            style={{ width: '100%', height: '100%', borderRadius: 4 }}
                                                                            muted
                                                                        />
                                                                    </div>
                                                                )
                        /* Tài liệu khác */ : (
                                                                        <span className="reply-file-text" style={styles.replyFileText}>
                                                                            📄 {msg.replyTo.fileName || 'Tệp đính kèm'}
                                                                        </span>
                                                                    )}
                                                        </div>
                                                    )
                                                ) : null}
                                        </div>
                                    );
                                })()}


                                {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}

                                {msg.fileUrl && (
                                    <div style={{ marginTop: "5px" }}>
                                        {msg.fileType === 'image' || /\.(jpe?g|png|gif|webp)$/i.test(msg.fileUrl) ? (
                                            <img
                                                src={msg.fileUrl}
                                                alt="uploaded"
                                                style={{ maxWidth: "200px", borderRadius: "5px" }}
                                            />
                                        ) : msg.fileType === 'video' || /\.(mp4|webm|ogg)$/i.test(msg.fileUrl) ? (
                                            <video
                                                controls
                                                style={{ maxWidth: "200px", borderRadius: "5px" }}
                                            >
                                                <source src={msg.fileUrl} />
                                            </video>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                {/\.pdf$/i.test(msg.fileUrl) && <i className="fas fa-file-pdf" style={{ marginRight: 5, color: 'red' }}></i>}
                                                {/\.(doc|docx)$/i.test(msg.fileUrl) && <i className="fas fa-file-word" style={{ marginRight: 5, color: 'blue' }}></i>}
                                                {/\.(xls|xlsx)$/i.test(msg.fileUrl) && <i className="fas fa-file-excel" style={{ marginRight: 5, color: 'green' }}></i>}
                                                {/\.(ppt|pptx)$/i.test(msg.fileUrl) && <i className="fas fa-file-powerpoint" style={{ marginRight: 5, color: 'orange' }}></i>}
                                                {!/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(msg.fileUrl) && <i className="fas fa-file" style={{ marginRight: 5 }}></i>}
                                                <a
                                                    href={msg.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#007bff' }}
                                                >
                                                            {msg.fileName || 'Tải xuống'}
                                                            <span>

                                                            {msg.fileSize ? `(${(msg.fileSize / 1024).toFixed(2)} KB)` : ''}
                                                            </span>

                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {msg.reaction && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            bottom: "-7px",
                                            right: "4px",
                                            backgroundColor: "blue",
                                            borderRadius: "10px",
                                            padding: "3px",
                                            color: "#fff",
                                        }}
                                    >
                                        {emotions[msg.reaction - 1].icon}
                                    </span>
                                )}

                                {/* ✅ Thời gian gửi tin nhắn */}
                                <div style={{ textAlign: "right", fontSize: "10px", color: "#888", marginTop: "4px" }}>
                                    {formatTime(msg.createdAt)}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <div className="chat-control-container">
                {/* Row for action buttons */}
                <div className="action-buttons">
                    <button
                        className="btn btn-secondary btn-action"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        title="Biểu tượng cảm xúc"
                    >
                        <i className="far fa-smile"></i> Emoji
                    </button>

                    <button
                        className="btn btn-secondary btn-action"
                        onClick={() => setShowFileUploader((prev) => !prev)}
                        title="Gửi tệp"
                    >
                        <i className="fas fa-paperclip"></i> File
                    </button>


                </div>

                {/* Row for input and send */}
                <div className="input-group message-input-group">
                    {replyingTo && (
                        <div className="reply-indicator" style={styles.replyIndicator}>
                            <span>
                                Replying to {replyingTo.name}:
                                {replyingTo.message
                                    ? ` ${replyingTo.message.substring(0, 20)}${replyingTo.message.length > 20 ? '...' : ''}`
                                    : replyingTo.fileUrl
                                        ? ` [${replyingTo.fileType?.startsWith('image') ? 'Hình ảnh' :
                                            replyingTo.fileType?.startsWith('video') ? 'Video' : 'File'}]`
                                        : ''}
                            </span>
                            <button onClick={handleCancelReply} style={styles.actionButton}>Cancel</button>
                        </div>
                    )}
                    <input
                        type="text"
                        id="message"
                        className="form-control message-input"
                        placeholder="Nhập tin nhắn của bạn..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={onInputKeyDown}
                        ref={inputRef}
                    />
                    <button
                        id="btn_send"
                        className="btn btn-primary btn-send"
                        onClick={handleSend}
                        disabled={!message.trim()}
                    >
                        <i className="fas fa-paper-plane"></i> Gửi
                    </button>
                </div>

                {/* File uploader popup */}
                {showFileUploader && (
                    <div className="file-uploader-popup">
                        <FileUploader
                            onUploadSuccess={handleFileUploadSuccess}
                            fileTypes="image/*, video/*, .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx"
                        />
                    </div>
                )}
            </div>
            {showEmojiPicker && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "60px",
                        right: "20px",
                        zIndex: 1000,
                    }}
                >
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
            )}
            {showImageUploader && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "60px",
                        left: "20px",
                        zIndex: 1000,
                    }}
                >
                    <ImageUploader onUploadSuccess={handleImageUploadSuccess} />
                </div>
            )}

            {/* Modal chuyển tiếp tin nhắn */}
            {showForwardModal && (
                <ForwardModal
                    visible={showForwardModal}
                    onClose={() => setShowForwardModal(false)}
                    onForward={(selectedRooms) => {
                        if (typeof window !== 'undefined' && window.onForwardMessage) {
                            window.onForwardMessage(forwardMessageObj, selectedRooms);
                        }
                        setShowForwardModal(false);
                    }}
                    activeChats={typeof activeChats !== 'undefined' ? activeChats : {}}
                    currentRoom={currentRoom}
                    forwardMessageObj={forwardMessageObj}
                />
            )}
        </div>
    );
};
// Component phụ cho UI trạng thái cuộc gọi



export default ChatContainer;


