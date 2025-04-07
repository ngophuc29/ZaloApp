import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import ImageUploader from "./ImageUploader"; // Component upload ảnh
import Peer from "simple-peer/simplepeer.min.js";
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
}) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showImageUploader, setShowImageUploader] = useState(false);


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


    // logic call
    // Refs cho video elements
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const retryCountRef = useRef(0);

    // Hàm dừng các track media
    const stopMediaTracks = (stream) => {
        if (!stream) return;
        stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
        });
    };

    // Xóa video streams khỏi elements
    const cleanVideoElements = () => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    };
    // Khởi tạo stream với xử lý lỗi nâng cao
    const initLocalStream = async (mode = "user") => {
        try {
            setIsLoadingMedia(true);
            setMediaError(null);

            // Giải phóng tài nguyên trước
            if (localStream) {
                stopMediaTracks(localStream);
                await new Promise(resolve => {
                    localStream.oninactive = resolve;
                    setTimeout(resolve, 500);
                });
            }

            cleanVideoElements();

            // Chờ thiết bị giải phóng hoàn toàn
            await new Promise(resolve => setTimeout(resolve, 1000));

            const constraints = {
                video: {
                    facingMode: mode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            };

            // Thử truy cập thiết bị với timeout
            const stream = await Promise.race([
                navigator.mediaDevices.getUserMedia(constraints),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout truy cập thiết bị")), 5000)
                )
            ]);

            // Kiểm tra stream hoạt động
            if (!stream.active) {
                throw new Error("Stream không hoạt động");
            }

            // Thiết lập sự kiện kết thúc track
            stream.getTracks().forEach(track => {
                track.onended = () => console.log(`${track.kind} track đã kết thúc`);
            });

            setLocalStream(stream);
            setFacingMode(mode);
            retryCountRef.current = 0;
            return stream;
        } catch (err) {
            console.error("Khởi tạo stream thất bại:", err);

            // Xử lý đặc biệt cho lỗi thiết bị bận
            if (err.name === 'NotReadableError' || err.message.includes('in use')) {
                retryCountRef.current += 1;

                if (retryCountRef.current <= 3) {
                    console.log(`Thử lại lần ${retryCountRef.current}`);
                    await new Promise(resolve => setTimeout(resolve, 500 * retryCountRef.current));
                    return initLocalStream(mode);
                }

                setMediaError("Thiết bị đang bận. Hãy đóng các ứng dụng khác sử dụng camera/mic và thử lại.");
            } else {
                setMediaError(`Không thể truy cập thiết bị: ${err.message}`);
            }

            throw err;
        } finally {
            setIsLoadingMedia(false);
        }
    };
    // Gán stream cho video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);
    // Lấy tên peer từ room (định dạng "A-B")
    const getPeerNameFromRoom = () => {
        if (!currentRoom) return null;
        const [a, b] = currentRoom.split("-");
        return a === myname ? b : a;
    };

    // Xử lý sự kiện signaling từ server
    useEffect(() => {
        if (!socket) return;

        const handleCallIncoming = ({ from, signal }) => {
            setIncomingCall({ from, signal });
        };

        const handleCallAccepted = ({ signal }) => {
            peer?.signal(signal);
            setCallAccepted(true);
        };

        const handleCallRejected = () => {
            cleanupCall();
            alert(`${getPeerNameFromRoom()} đã từ chối cuộc gọi`);
        };

        const handleCallEnded = () => {
            cleanupCall();
            alert("Cuộc gọi đã kết thúc");
        };

        socket.on("callIncoming", handleCallIncoming);
        socket.on("callAccepted", handleCallAccepted);
        socket.on("callRejected", handleCallRejected);
        socket.on("callEnded", handleCallEnded);

        return () => {
            socket.off("callIncoming", handleCallIncoming);
            socket.off("callAccepted", handleCallAccepted);
            socket.off("callRejected", handleCallRejected);
            socket.off("callEnded", handleCallEnded);
        };
    }, [socket, peer]);
    // Chuyển đổi camera trước/sau
    const switchCamera = async () => {
        try {
            const newMode = facingMode === "user" ? "environment" : "user";
            const stream = await initLocalStream(newMode);

            if (callAccepted && peer) {
                const videoTrack = stream.getVideoTracks()[0];
                peer.replaceTrack(
                    localStream.getVideoTracks()[0],
                    videoTrack,
                    localStream
                );
            }
        } catch (err) {
            console.error("Chuyển camera thất bại:", err);
            alert(`Không thể chuyển camera: ${err.message}`);
        }
    };
    // Bắt đầu cuộc gọi
    const initiateCall = async () => {
        const peerName = getPeerNameFromRoom();
        if (!peerName) {
            alert("Vui lòng chọn người để gọi");
            return;
        }

        try {
            const stream = await initLocalStream();
            setCalling(true);

            const p = new Peer({
                initiator: true,
                trickle: false,
                stream
            });

            // CẢI THIỆN PHẦN XỬ LÝ REMOTE STREAM
            p.on('stream', (remoteStream) => {
                // Thêm kiểm tra trùng lặp stream
                if (!remoteStream || (remoteVideoRef.current.srcObject &&
                    remoteVideoRef.current.srcObject.id === remoteStream.id)) {
                    return;
                }

                setRemoteStream(remoteStream);

                // Force update nếu cần
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = null;
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            });

            p.on("signal", (signalData) => {
                socket.emit("callUser", {
                    userToCall: peerName,
                    from: myname,
                    signalData
                });
            });

            p.on("error", (err) => {
                console.error("Peer error:", err);
                cleanupCall();
                alert(`Lỗi kết nối: ${err.message}`);
            });

            setPeer(p);

            // THÊM TIMEOUT KIỂM TRA
            setTimeout(() => {
                if (!remoteStream) {
                    console.log("Đang chờ stream từ bên kia...");
                }
            }, 5000);

        } catch (err) {
            console.error("Bắt đầu cuộc gọi thất bại:", err);
            cleanupCall();
        }
    };
    useEffect(() => {
        const checkStream = setInterval(() => {
            if (callAccepted && peer && !remoteStream) {
                console.log("Kiểm tra lại stream từ peer...");
                peer.emit('request-stream');
            }
        }, 3000);

        return () => clearInterval(checkStream);
    }, [callAccepted, peer, remoteStream]);

    // Chấp nhận cuộc gọi
    // const answerCall = async () => {
    //     try {
    //         const stream = await initLocalStream();
    //         setCallAccepted(true);

    //         const p = new Peer({
    //             initiator: false,
    //             trickle: false,
    //             stream
    //         });

    //         // THÊM PHẦN NÀY ĐỂ ĐẢM BẢO NHẬN REMOTE STREAM
    //         p.on('stream', (remoteStream) => {
    //             // KIỂM TRA TRÁNH CẬP NHẬT LIÊN TỤC
    //             if (!remoteVideoRef.current.srcObject ||
    //                 remoteVideoRef.current.srcObject.id !== remoteStream.id) {
    //                 setRemoteStream(remoteStream);

    //                 // FIX: Đảm bảo video element được cập nhật
    //                 setTimeout(() => {
    //                     if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
    //                         remoteVideoRef.current.srcObject = remoteStream;
    //                     }
    //                 }, 100);
    //             }
    //         });

    //         p.on("signal", (signalData) => {
    //             socket.emit("acceptCall", {
    //                 to: incomingCall.from,
    //                 signal: signalData
    //             });
    //         });

    //         p.on("error", (err) => {
    //             console.error("Peer error:", err);
    //             cleanupCall();
    //             alert(`Lỗi kết nối: ${err.message}`);
    //         });

    //         p.signal(incomingCall.signal);
    //         setPeer(p);
    //         setIncomingCall(null);

    //         // THÊM TIMEOUT DỰ PHÒNG
    //         setTimeout(() => {
    //             if (!remoteStream && peer) {
    //                 peer.emit('stream', stream); // Fallback
    //             }
    //         }, 2000);

    //     } catch (err) {
    //         console.error("Call acceptance failed:", err);
    //         cleanupCall();
    //         socket.emit("rejectCall", { to: incomingCall.from });
    //         setIncomingCall(null);
    //     }
    // };
    const answerCall = async () => {
        try {
            const stream = await initLocalStream();
            setCallAccepted(true);

            // Gán local stream vào video element ngay lập tức
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const p = new Peer({
                initiator: false,
                trickle: false,
                stream
            });

            p.on('stream', (remoteStream) => {
                if (!remoteVideoRef.current.srcObject ||
                    remoteVideoRef.current.srcObject.id !== remoteStream.id) {
                    setRemoteStream(remoteStream);

                    // Đảm bảo video element được cập nhật
                    setTimeout(() => {
                        if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
                            remoteVideoRef.current.srcObject = remoteStream;
                        }
                    }, 100);
                }
            });

            p.on("signal", (signalData) => {
                socket.emit("acceptCall", {
                    to: incomingCall.from,
                    signal: signalData
                });
            });

            p.on("error", (err) => {
                console.error("Peer error:", err);
                cleanupCall();
                alert(`Lỗi kết nối: ${err.message}`);
            });

            p.signal(incomingCall.signal);
            setPeer(p);
            setIncomingCall(null);

            setTimeout(() => {
                if (!remoteStream && peer) {
                    peer.emit('stream', stream);
                }
            }, 2000);

        } catch (err) {
            console.error("Call acceptance failed:", err);
            cleanupCall();
            socket.emit("rejectCall", { to: incomingCall.from });
            setIncomingCall(null);
        }
    };

    // Từ chối cuộc gọi
    const rejectCall = () => {
        socket.emit("rejectCall", { to: incomingCall.from });
        setIncomingCall(null);
    };
    // Kết thúc cuộc gọi
    const endCall = () => {
        const peerName = getPeerNameFromRoom();
        if (peerName) {
            socket.emit("endCall", { to: peerName });
        }
        cleanupCall();
    };

    // Dọn dẹp tài nguyên cuộc gọi
    const cleanupCall = () => {
        setCalling(false);
        setCallAccepted(false);
        setIncomingCall(null);

        if (peer) {
            peer.destroy();
            setPeer(null);
        }

        stopMediaTracks(localStream);
        stopMediaTracks(remoteStream);
        setLocalStream(null);
        setRemoteStream(null);
        cleanVideoElements();
    };

    // Dọn dẹp khi component unmount
    useEffect(() => {
        return () => {
            cleanupCall();
        };
    }, []);
    return (
        <div className="col-9" style={{ padding: "10px", position: "relative" }}>
            <h3 style={{ textAlign: 'left' }}>Chat Room: {currentRoom}</h3>
            <button className="btn btn-secondary mb-2" onClick={onGetGroupDetails}>
                Group Details
            </button>
            {mediaError && (
                <div className="alert alert-danger">
                    {mediaError}
                    <button className="btn btn-sm btn-link" onClick={() => setMediaError(null)}>
                        Đóng
                    </button>
                </div>
            )}

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
                                <div style={{ fontWeight: "bold", marginBottom: "2px", textAlign: 'left' }}>
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
                <button
                    className="btn btn-warning"
                    onClick={initiateCall}
                    disabled={isLoadingMedia || calling || callAccepted}
                >
                    {isLoadingMedia ? "Đang chuẩn bị..." : "Gọi Video"}
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

            {/* UI Đang gọi */}
            {calling && !callAccepted && (
                <CallStatusUI
                    message={`Đang gọi tới ${getPeerNameFromRoom()}...`}
                    buttons={[
                        { text: "Hủy cuộc gọi", onClick: endCall, variant: "danger" }
                    ]}
                />
            )}

            {/* UI Cuộc gọi đến */}
            {incomingCall && !callAccepted && (
                <CallStatusUI
                    message={`${incomingCall.from} đang gọi...`}
                    buttons={[
                        { text: "Chấp nhận", onClick: answerCall, variant: "success" },
                        { text: "Từ chối", onClick: rejectCall, variant: "secondary" }
                    ]}
                />
            )}

            {/* UI Đang trong cuộc gọi */}
            {(calling || callAccepted) && (
                <div className="call-container">
                    <div className="video-container">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="video-self"
                        />
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="video-remote"
                        />
                    </div>
                    <div className="call-controls">
                        <button
                            className="btn btn-danger"
                            onClick={endCall}
                        >
                            Kết thúc
                        </button>
                        <button
                            className="btn btn-info"
                            onClick={switchCamera}
                            disabled={isLoadingMedia}
                        >
                            Chuyển Camera ({facingMode === "user" ? "Trước" : "Sau"})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
// Component phụ cho UI trạng thái cuộc gọi
const CallStatusUI = ({ message, buttons }) => (
    <div className="call-status-ui">
        <p>{message}</p>
        <div className="call-buttons">
            {buttons.map((btn, index) => (
                <button
                    key={index}
                    className={`btn btn-${btn.variant}`}
                    onClick={btn.onClick}
                >
                    {btn.text}
                </button>
            ))}
        </div>
    </div>
);
export default ChatContainer;
