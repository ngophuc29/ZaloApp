import React from "react";

const FriendModal = ({
    friendInput,
    setFriendInput,
    accounts,
    myname,
    friends,
    setFriendModalVisible,
    handleAddFriend,
}) => {
    return (
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
                        <input
                            type="text"
                            value={friendInput}
                            onChange={(e) => setFriendInput(e.target.value)}
                            className="form-control mb-3"
                            placeholder="Tìm kiếm user..."
                        />
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
    );
};

export default FriendModal;
