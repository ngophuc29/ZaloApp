import React, { useState } from "react";

const ForwardModal = ({ visible, onClose, onForward, activeChats, currentRoom, forwardMessageObj }) => {
    const [selectedRooms, setSelectedRooms] = useState([]);

    if (!visible) return null;

    const handleToggleRoom = (roomId) => {
        setSelectedRooms((prev) =>
            prev.includes(roomId)
                ? prev.filter((id) => id !== roomId)
                : [...prev, roomId]
        );
    };

    const handleForward = () => {
        if (selectedRooms.length === 0) return;
        onForward(selectedRooms);
    };

    return (
        <div
            className="modal"
            style={{
                display: "block",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.5)",
                zIndex: 9999,
            }}
            onClick={(e) => {
                if (e.target.className && e.target.className.includes("modal")) onClose();
            }}
        >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Chuyển tiếp tin nhắn</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {forwardMessageObj && (
                            <div style={{ background: '#e6f7ff', borderLeft: '3px solid #00bfff', padding: 8, marginBottom: 12, borderRadius: 6 }}>
                                <span style={{ fontSize: 13, color: '#007bff', fontWeight: 'bold' }}>Nội dung chuyển tiếp:</span><br />
                                {forwardMessageObj.message ? (
                                    <span style={{ fontSize: 13, color: '#333', fontStyle: 'italic' }}>{forwardMessageObj.message}</span>
                                ) : forwardMessageObj.fileUrl ? (
                                    <span style={{ fontSize: 13, color: '#333', fontStyle: 'italic' }}>[Tệp] {forwardMessageObj.fileName || 'Tệp đính kèm'}</span>
                                ) : null}
                            </div>
                        )}
                        <div style={{ maxHeight: 300, overflowY: "auto" }}>
                            <ul className="list-unstyled">
                                {Object.entries(activeChats || {})
                                    .filter(([roomId]) => roomId !== currentRoom)
                                    .map(([roomId, chat]) => (
                                        <li key={roomId} style={{ display: "flex", alignItems: "center", padding: 6 }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedRooms.includes(roomId)}
                                                onChange={() => handleToggleRoom(roomId)}
                                                style={{ marginRight: 8 }}
                                            />
                                            <span>
                                                <strong>{chat.partner || chat.groupName || roomId}</strong>
                                                {chat.isGroup && <span style={{ color: '#007bff', marginLeft: 6 }}>(Nhóm)</span>}
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleForward} disabled={selectedRooms.length === 0}>
                            Chuyển tiếp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForwardModal; 