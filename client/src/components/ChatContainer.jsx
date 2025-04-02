import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import ImageUploader from "./ImageUploader"; // Component upload ảnh

const ChatContainer = ({
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
}) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showImageUploader, setShowImageUploader] = useState(false);

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
            };
            sendMessage(msgObj);
            setMessage("");
        }
        // Ẩn emoji picker sau khi gửi
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
    return (
        <div className="col-9" style={{ padding: "10px", position: "relative" }}>
            <h3 style={{textAlign:'left'}}>Chat Room: {currentRoom}</h3>
            <button className="btn btn-secondary mb-2" onClick={onGetGroupDetails}>
                Group Details
            </button>
            <ul
                id="ul_message"
                ref={messageContainerRef}
                className="list-group mb-2"
                style={{ maxHeight: "50vh", overflowY: "auto" }}
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
                            }}
                        >
                            {/* Nếu tin nhắn của bạn, hiển thị action container bên trái */}
                            {isMine && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginRight: "5px",
                                        position: "relative"
                                    }}
                                >
                                    <i
                                        className="choose_emotion fa-regular fa-face-smile"
                                        style={{ cursor: "pointer", marginBottom: "5px" }}
                                        onClick={() =>
                                            setActiveEmotionMsgId(
                                                getMessageId(msg) === activeEmotionMsgId
                                                    ? null
                                                    : getMessageId(msg)
                                            )
                                        }
                                    ></i>
                                    {activeEmotionMsgId === getMessageId(msg) && (
                                        <div style={{

                                            display: "flex",
                                            top: '-22px',
                                            position: "absolute",
                                            right: "46px",
                                            bottom: "35px",
                                            backgroundColor: "aquamarine",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "9px",
                                            borderRadius: "20px",


                                        }}>
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
                                    <button
                                        className="btn_delete"
                                        onClick={() => handleDeleteMessage(getMessageId(msg), msg.room)}
                                    >
                                        X
                                    </button>
                                </div>
                            )}

                            {/* Chat Bubble */}
                            <div
                                style={{
                                    background: isMine ? "#dcf8c6" : "#fff",
                                    padding: "10px",
                                    borderRadius: "10px",
                                    maxWidth: "70%",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                                    position: "relative",
                                }}
                            >
                                <div style={{ fontWeight: "bold", marginBottom: "2px", textAlign:'left'}}>
                                    {/* {msg.name} */}
                                    {msg.name === myname ? "" : msg.name}
                                </div>
                                {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}
                                {msg.fileUrl && (
                                    <div style={{ marginTop: "5px" }}>
                                        {/\.(jpg|jpeg|png|gif)$/i.test(msg.fileUrl) ? (
                                            <img
                                                src={msg.fileUrl}
                                                alt="uploaded"
                                                style={{ maxWidth: "200px", borderRadius: "5px" }}
                                            />
                                        ) : (
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                                Download File
                                            </a>
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
                            </div>

                            {/* Nếu tin nhắn của người khác, bạn có thể đặt action container bên phải */}
                            {!isMine && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        alignItems: "flex-end",
                                        marginLeft: "5px",
                                        position: "relative",
                                    }}
                                >
                                    <i
                                        className="choose_emotion fa-regular fa-face-smile"
                                        style={{ cursor: "pointer", marginBottom: "5px" }}
                                        onClick={() =>
                                            setActiveEmotionMsgId(
                                                getMessageId(msg) === activeEmotionMsgId
                                                    ? null
                                                    : getMessageId(msg)
                                            )
                                        }
                                    ></i>
                                    {activeEmotionMsgId === getMessageId(msg) && (
                                        <div style={{
                                            display: "flex"
                                            ,
                                            top: "-36px",
                                            position: "absolute",
                                            right: 0,
                                            /* bottom: 35px, */
                                            backgroundColor: "aquamarine",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "-18px",
                                            borderRadius: "20px",
                                            left: "3px",
                                            height: '32px',
                                            width: "fit-content",
                                            padding: "9px",
                                        }}>
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
                            )}
                        </li>
                    );
                })}
            </ul>

            <div className="input-group">
                <input
                    type="text"
                    id="message"
                    className="form-control"
                    placeholder="Enter your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={onInputKeyDown}
                    ref={inputRef}
                />
                <button id="btn_send" className="btn btn-primary" onClick={handleSend}>
                    Send
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                >
                    Emoji
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowImageUploader((prev) => !prev)}
                >
                    Image
                </button>
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
        </div>
    );
};

export default ChatContainer;
