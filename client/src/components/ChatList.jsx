import React from "react";

const ChatList = ({ activeChats, handleRoomClick, onOpenGroupModal }) => {
    return (
        <div className="col-3 border-end" style={{ padding: "10px" }}>
            <div className="d-flex justify-content-between align-items-center">
                <h3>Chats</h3>
                <button className="btn btn-primary" onClick={onOpenGroupModal}>
                    +
                </button>
            </div>
            <ul id="chat_list_ul" className="list-group">
                {Object.keys(activeChats).map((room) => (
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
                ))}
            </ul>
        </div>
    );
};

export default ChatList;
