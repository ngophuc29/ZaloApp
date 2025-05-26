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
    setMessages,
    handleDeleteMessage,
    handleChooseEmotion,
    activeEmotionMsgId,
    setActiveEmotionMsgId,
    emotions,
    getMessageId,
    onGetGroupDetails,
    friends,
    requestedFriends,
    friendRequests, // <-- thêm prop này
    handleAddFriend,
    activeChats,
    setRequestedFriends,
}) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showImageUploader, setShowImageUploader] = useState(false);
    // Thêm state mới
    const [showFileUploader, setShowFileUploader] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardMessageObj, setForwardMessageObj] = useState(null);
    const [showDetailPanel, setShowDetailPanel] = useState(false);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState("");

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
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const prevScrollHeightRef = useRef(0);
    const pendingScrollToId = useRef(null);
    const prevMessagesLength = useRef(messages.length);
    const prevScrollTopRef = useRef(0);
    const [justJoinedRoom, setJustJoinedRoom] = useState(false);
    const prevLastMsgId = useRef();
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
    const messageRefs = useRef({});

    // useEffect(() => {
    //     if (messageContainerRef.current) {
    //         messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    //     }
    // }, [messages]);




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
    // Xác định trạng thái lời mời kết bạn
    let friendRequestStatus = null;
    let friendRequestObj = null;
    if (isPrivateChat(currentRoom) && partnerName && !friends.includes(partnerName)) {
        if (requestedFriends && requestedFriends.includes(partnerName)) {
            friendRequestStatus = 'sent';
        } else if (friendRequests && friendRequests.some(r => r.from === partnerName && r.to === myname)) {
            friendRequestStatus = 'received';
            friendRequestObj = friendRequests.find(r => r.from === partnerName && r.to === myname);
        } else {
            friendRequestStatus = null; // Người lạ - Gửi lời mời
        }
    }
    const isStranger = isPrivateChat(currentRoom) && partnerName && !friends.includes(partnerName);
    const isRequested = isPrivateChat(currentRoom) && partnerName && requestedFriends && requestedFriends.includes(partnerName);

    const scrollToMessage = (msgId) => {
        const el = messageRefs.current[msgId];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("highlight-reply");
            setTimeout(() => {
                el.classList.remove("highlight-reply");
            }, 1500);
        }
    };

    const scrollToMessageOrLoad = (msgId) => {
        const el = messageRefs.current[msgId];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("highlight-reply");
            setTimeout(() => el.classList.remove("highlight-reply"), 1500);
            pendingScrollToId.current = null;
        } else if (hasMore && !loadingMore) {
            pendingScrollToId.current = msgId;
            handleLoadMore();
        }
    };
    const handleLoadMore = () => {
        if (!loadingMore && hasMore && messages.length > 0) {
            const container = messageContainerRef.current;
            if (container) {
                prevScrollHeightRef.current = container.scrollHeight;
                prevScrollTopRef.current = container.scrollTop;
            }
            const oldest = messages[0];
            socket.emit('loadMoreMessages', {
                room: currentRoom,
                before: oldest.createdAt // ISO string
            });
            setLoadingMore(true);
        }
    };

    useEffect(() => {
        if (pendingScrollToId.current) {
            const el = messageRefs.current[pendingScrollToId.current];
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("highlight-reply");
                setTimeout(() => el.classList.remove("highlight-reply"), 1500);
                pendingScrollToId.current = null;
            } else if (hasMore && !loadingMore) {
                handleLoadMore();
            }
        }
    }, [messages.length, loadingMore]);


    useEffect(() => {
        if (!loadingMore) return;
        const container = messageContainerRef.current;
        if (!container) return;
        if (prevScrollHeightRef.current && typeof prevScrollTopRef.current === 'number') {
            setTimeout(() => {
                const newScrollHeight = container.scrollHeight;
                container.scrollTop = prevScrollTopRef.current + (newScrollHeight - prevScrollHeightRef.current);
                prevScrollHeightRef.current = 0;
                prevScrollTopRef.current = 0;
                prevMessagesLength.current = messages.length;
            }, 120);
        } else {
            prevScrollHeightRef.current = 0;
            prevScrollTopRef.current = 0;
            prevMessagesLength.current = messages.length;
        }
    }, [messages.length, loadingMore]);

    useEffect(() => {
        const container = messageContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (
                container.scrollTop <= 10 && // <-- nới điều kiện
                !loadingMore &&
                hasMore &&
                messages.length > 0
            ) {
                prevScrollHeightRef.current = container.scrollHeight;
                handleLoadMore();
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [loadingMore, hasMore, messages.length, currentRoom]);

    useEffect(() => {
        const onMoreMessages = ({ room, messages: more }) => {
            if (room === currentRoom) {
                if (more.length === 0) setHasMore(false);
                setMessages(prev => {
                    // Gộp, loại trùng
                    const all = [...more, ...prev];
                    const unique = [];
                    const seen = new Set();
                    for (const m of all) {
                        const id = m._id?.toString() || m.id?.toString();
                        if (!seen.has(id)) {
                            unique.push(m);
                            seen.add(id);
                        }
                    }
                    unique.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    return unique;
                });
                setLoadingMore(false); // <-- Dòng này rất quan trọng!
            }
        };
        socket.on('moreMessages', onMoreMessages);
        return () => socket.off('moreMessages', onMoreMessages);
    }, [currentRoom, socket, hasMore]);

    useEffect(() => {
        setJustJoinedRoom(true);
    }, [currentRoom]);
    useEffect(() => {
        if (justJoinedRoom) {
            const container = messageContainerRef.current;
            if (container && messages.length > 0) {
                setTimeout(() => {
                    container.scrollTop = container.scrollHeight;
                    setJustJoinedRoom(false);
                }, 0);
            }
        }
        // eslint-disable-next-line
    }, [justJoinedRoom, messages.length]);
    useEffect(() => {
        if (!messages.length) return;
        const lastMsgId = messages[messages.length - 1]._id || messages[messages.length - 1].id;
        // Nếu có tin nhắn mới ở cuối (khác với lần trước)
        if (prevLastMsgId.current && lastMsgId !== prevLastMsgId.current) {
            const container = messageContainerRef.current;
            if (container) {
                setTimeout(() => {
                    container.scrollTop = container.scrollHeight;
                }, 0);
            }
        }
        prevLastMsgId.current = lastMsgId;
    }, [messages.length]);

    useEffect(() => {
        if (!socket || !setRequestedFriends) return;
        const handleWithdraw = ({ to, from }) => {
            setRequestedFriends(prev => prev.filter(username => username !== partnerName));
        };
        socket.on('friendRequestWithdrawn', handleWithdraw);
        return () => socket.off('friendRequestWithdrawn', handleWithdraw);
    }, [socket, setRequestedFriends, partnerName]);

    useEffect(() => {
        if (!socket || !setRequestedFriends) return;
        const handleAccept = ({ friend }) => {
            setRequestedFriends(prev => prev.filter(username => username !== friend));
        };
        socket.on('friendAccepted', handleAccept);
        return () => socket.off('friendAccepted', handleAccept);
    }, [socket, setRequestedFriends]);

    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeout = useRef();

    useEffect(() => {
        const container = messageContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setIsScrolling(true);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => setIsScrolling(false), 1000);
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        };
    }, []);

    // Hàm lấy tên hiển thị phòng chat (giống mobile)
    const getDisplayName = (roomName, myname) => {
        if (!roomName) return '';
        if (roomName.includes('-')) {
            const names = roomName.split('-');
            return names.find(n => n !== myname) || names[0];
        } else if (roomName.includes('_')) {
            return roomName.split('_')[0];
        } else {
            return roomName;
        }
    };

    // Hàm lấy avatar cho header
    const getHeaderAvatar = () => {
        if (!currentRoom) return null;
        if (isGroupChat(currentRoom)) {
            // Avatar nhóm: icon nhóm
            return <i className="fa-solid fa-users" style={{ fontSize: 32, color: '#007bff', marginRight: 10 }}></i>;
        } else if (isPrivateChat(currentRoom)) {
            // Avatar user đối phương
            const partner = getDisplayName(currentRoom, myname);
            const avatarUrl = getAvatarByName(partner);
            return <img src={avatarUrl} alt={partner} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 10 }} />;
        }
        return null;
    };

    // Lấy danh sách file đã gửi trong đoạn chat
    const sentFiles = messages.filter(msg => msg.fileUrl);
    const sentImagesVideos = sentFiles.filter(msg =>
        msg.fileType === 'image' ||
        /\.(jpe?g|png|gif|webp)$/i.test(msg.fileUrl) ||
        msg.fileType === 'video' ||
        /\.(mp4|webm|ogg)$/i.test(msg.fileUrl)
    );
    const sentOtherFiles = sentFiles.filter(msg =>
        !(
            msg.fileType === 'image' ||
            /\.(jpe?g|png|gif|webp)$/i.test(msg.fileUrl) ||
            msg.fileType === 'video' ||
            /\.(mp4|webm|ogg)$/i.test(msg.fileUrl)
        )
    );

    return (
        <div className="col-9" style={{ padding: "10px", position: "relative", height: "100vh" }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {getHeaderAvatar()}
                    <h3 style={{ textAlign: 'left', margin: 0 }}>{getDisplayName(currentRoom, myname)}</h3>
                </div>
                <button
                    className="btn btn-outline-info btn-sm"
                    style={{ marginLeft: 10 }}
                    onClick={() => setShowDetailPanel(true)}
                    title="Xem chi tiết đoạn chat"
                >
                    <i className="fa-solid fa-info-circle"></i>
                </button>
            </div>
            {/* Panel chi tiết đoạn chat */}
            {showDetailPanel && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: 350,
                    height: '100vh',
                    background: '#fff',
                    boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
                    zIndex: 2000,
                    transition: 'transform 0.3s',
                    transform: showDetailPanel ? 'translateX(0)' : 'translateX(100%)',
                    padding: 0,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <div style={{
                        padding: 24,
                        borderBottom: '1px solid #eee',
                        textAlign: 'center',
                        position: 'relative',
                        background: '#f7f7f7',
                    }}>
                        <button
                            className="btn btn-sm btn-danger"
                            style={{ position: 'absolute', top: 16, right: 16 }}
                            onClick={() => setShowDetailPanel(false)}
                        >
                            Đóng
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            {getHeaderAvatar()}
                            <div style={{ fontWeight: 'bold', fontSize: 20, marginTop: 8 }}>{getDisplayName(currentRoom, myname)}</div>
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                        <div style={{ marginBottom: 32 }}>
                            <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 4 }}>Ảnh/Video</div>
                            {sentImagesVideos.length === 0 && <div style={{ color: '#888', fontSize: 13 }}>Chưa có ảnh hoặc video nào</div>}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {sentImagesVideos.map((msg, idx) => (
                                    <div key={msg._id || msg.id || idx} style={{ width: 90, height: 90, borderRadius: 8, overflow: 'hidden', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: msg.fileType === 'image' || /\.(jpe?g|png|gif|webp)$/i.test(msg.fileUrl) ? 'pointer' : 'default' }}
                                        onClick={() => {
                                            if (msg.fileType === 'image' || /\.(jpe?g|png|gif|webp)$/i.test(msg.fileUrl)) {
                                                setPreviewImageUrl(msg.fileUrl);
                                                setShowImagePreview(true);
                                            }
                                        }}
                                    >
                                        {msg.fileType === 'image' || /\.(jpe?g|png|gif|webp)$/i.test(msg.fileUrl) ? (
                                            <img src={msg.fileUrl} alt="img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <video src={msg.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 4 }}>File</div>
                            {sentOtherFiles.length === 0 && <div style={{ color: '#888', fontSize: 13 }}>Chưa có file nào</div>}
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {sentOtherFiles.map((msg, idx) => (
                                    <li key={msg._id || msg.id || idx} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <i className="fa-solid fa-file" style={{ fontSize: 22, color: '#007bff' }}></i>
                                        <div style={{ flex: 1 }}>
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', fontWeight: 500, fontSize: 15, wordBreak: 'break-all' }}>
                                                {msg.fileName || 'File'}
                                            </a>
                                            <div style={{ fontSize: 12, color: '#888' }}>{msg.fileName}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            {showImagePreview && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 3000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                    onClick={() => setShowImagePreview(false)}
                >
                    <img src={previewImageUrl} alt="preview" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 2px 16px #0008' }} />
                    <button
                        onClick={e => { e.stopPropagation(); setShowImagePreview(false); }}
                        style={{ position: 'fixed', top: 30, right: 40, zIndex: 3100, background: '#fff', border: 'none', borderRadius: 20, padding: '6px 16px', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}
                    >
                        Đóng
                    </button>
                </div>
            )}
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

            {/* Nếu là người lạ thì hiện thông báo và nút gửi lời mời hoặc chấp nhận/thu hồi */}
            {isStranger && (
                <div style={{ marginBottom: 10 }}>
                    <span style={{ color: 'red', fontWeight: 'bold', marginRight: 8 }}>Người lạ</span>
                    {friendRequestStatus === 'sent' ? (
                        <button className="btn btn-secondary btn-sm" disabled>Đã gửi</button>
                    ) : friendRequestStatus === 'received' ? (
                        <>
                            <button className="btn btn-success btn-sm" style={{ marginRight: 8 }} onClick={() => {
                                if (socket && friendRequestObj) {
                                    socket.emit('respondFriendRequest', { requestId: friendRequestObj._id || friendRequestObj.id, action: 'accepted' });
                                }
                            }}>Chấp nhận</button>
                            <button className="btn btn-danger btn-sm" onClick={() => {
                                if (socket && friendRequestObj) {
                                    socket.emit('respondFriendRequest', { requestId: friendRequestObj._id || friendRequestObj.id, action: 'rejected' });
                                }
                            }}>Từ chối</button>
                        </>
                    ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => {
                            if (handleAddFriend) handleAddFriend(partnerName);
                            if (typeof setRequestedFriends === 'function') setRequestedFriends(prev => prev.includes(partnerName) ? prev : [...prev, partnerName]);
                        }}>Gửi lời mời kết bạn</button>
                    )}
                </div>
            )}

            <ul
                id="ul_message"
                ref={messageContainerRef}
                className={`list-group mb-2${isScrolling ? " scrolling" : ""}`}
                style={{ maxHeight: "83vh", overflowY: "auto" }}
            >
                {messages.map((msg, idx) => {
                    const isMine = msg.name === myname;
                    const prevMsg = messages[idx - 1];
                    const msgDate = new Date(msg.createdAt);
                    const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt) : null;
                    const showDate =
                        !prevMsg ||
                        msgDate.toDateString() !== prevMsgDate?.toDateString();

                    return (
                        <React.Fragment key={getMessageId(msg)}>
                            {showDate && (
                                <li
                                    className="message-date-separator"
                                    style={{
                                        textAlign: "center",
                                        color: "#888",
                                        fontSize: "13px",
                                        margin: "10px 0",
                                        fontWeight: "bold",
                                        background: "#f5f5f5",
                                        borderRadius: "8px",
                                        padding: "4px 0"
                                    }}
                                >
                                    {msgDate.toLocaleDateString("vi-VN", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit"
                                    })}
                                </li>
                            )}
                            <li
                                ref={el => {
                                    if (el) messageRefs.current[getMessageId(msg)] = el;
                                }}
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
                                        const originalExists = messages.some(m => (m._id || m.id) === msg.replyTo.id);
                                        const replyPreviewContent = (
                                            <div
                                                className="reply-preview"
                                                style={{
                                                    ...styles.replyPreview,
                                                    fontStyle: !originalExists ? 'italic' : undefined,
                                                    color: !originalExists ? '#888' : undefined
                                                }}
                                            >
                                                <span className="reply-to">Replying to {msg.replyTo.name}</span>
                                                {msg.replyTo.message ? (
                                                    <span className="reply-message">
                                                        {originalExists ? msg.replyTo.message : 'Tin nhắn đã bị xóa'}
                                                    </span>
                                                ) : msg.replyTo.fileUrl ? (
                                                    <span className="reply-file">
                                                        {msg.replyTo.fileType?.startsWith('image') ? (
                                                            <img
                                                                src={msg.replyTo.fileUrl}
                                                                alt="reply-img"
                                                                style={{ maxWidth: 60, maxHeight: 60, borderRadius: 4, marginRight: 6 }}
                                                            />
                                                        ) : (
                                                            <a href={msg.replyTo.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                {msg.replyTo.fileName || 'Tệp đính kèm'}
                                                            </a>
                                                        )}
                                                    </span>
                                                ) : null}
                                            </div>
                                        );
                                        return originalExists ? (
                                            <div onClick={() => scrollToMessageOrLoad(msg.replyTo.id)} style={{ cursor: 'pointer' }}>
                                                {replyPreviewContent}
                                            </div>
                                        ) : (
                                            replyPreviewContent
                                        );
                                    })()}

                                    {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}

                                    {msg.fileUrl && (
                                        <div style={{ marginTop: "5px" }}>
                                            {msg.fileType === 'image' || /\.(jpe?g|png|gif|webp)$/i.test(msg.fileUrl) ? (
                                                <img
                                                    src={msg.fileUrl}
                                                    alt="uploaded"
                                                    style={{ maxWidth: "200px", borderRadius: "5px", cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setPreviewImageUrl(msg.fileUrl);
                                                        setShowImagePreview(true);
                                                    }}
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
                        </React.Fragment>
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

