import React, { useState } from "react";

const FriendModal = ({
    friendInput,
    setFriendInput,
    accounts,
    myname,
    friends,
    setFriendModalVisible,
    handleAddFriend,            // Hàm này sẽ emit "addFriend" qua socket
    handleWithdrawFriendRequest, // Hàm này sẽ emit "withdrawFriendRequest" qua socket
    requestedFriends,        // ✅ THÊM
    setRequestedFriends,     // ✅ THÊM

}) => {
    // State để theo dõi username đang được gửi lời mời hoặc thu hồi lời mời
    const [loadingFriend, setLoadingFriend] = useState(null);
    // State để theo dõi danh sách những người mà lời mời đã được gửi (chưa được đồng ý hoặc hủy)
     

    // Khi bấm nút "Kết bạn": gửi lời mời và thêm vào danh sách đã gửi
    const addFriendHandler = async (username) => {
        setLoadingFriend(username);
        await handleAddFriend(username);
        setLoadingFriend(null);
        // setRequestedFriends((prev) => [...prev, username]);
        setFriendModalVisible(false)
    };

    // Khi bấm nút "Thu hồi": gọi hàm thu hồi lời mời và loại bỏ username khỏi danh sách lời mời đã gửi
    const cancelFriendHandler = async (username) => {
        setLoadingFriend(username);
        await handleWithdrawFriendRequest(username);
        setLoadingFriend(null);
        // setRequestedFriends((prev) => prev.filter((u) => u !== username));
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
            }}
            onClick={(e) => {
                if (e.target.className && e.target.className.includes("modal"))
                    setFriendModalVisible(false);
            }}
        >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Kết bạn</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setFriendModalVisible(false)}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <input
                            type="text"
                            value={friendInput}
                            onChange={(e) => setFriendInput(e.target.value)}
                            className="form-control mb-3"
                            placeholder="Tìm kiếm user..."
                        />
                        <ul
                            className="list-unstyled"
                            style={{ maxHeight: "300px", overflowY: "auto" }}
                        >
                            {accounts
                                .filter(
                                    (acc) =>
                                        acc.username
                                            .toLowerCase()
                                            .includes(friendInput.toLowerCase()) &&
                                        acc.username !== myname &&
                                        // Nếu user đã là bạn hoặc đã gửi lời mời, thì không hiển thị để gửi lời mời thêm
                                        !friends.includes(acc.username)
                                )
                                .map((acc) => {
                                    // Nếu user đã được gửi lời mời thì hiển thị nút "Thu hồi", ngược lại hiển thị nút "Kết bạn"
                                    const isRequested = requestedFriends.includes(acc.username);
                                    return (
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
                                            {isRequested ? (
                                                <button
                                                    className="btn btn-warning btn-sm"
                                                    onClick={() => cancelFriendHandler(acc.username)}
                                                    disabled={loadingFriend === acc.username}
                                                >
                                                    {loadingFriend === acc.username ? "Đang hủy..." : "Thu hồi"}
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => addFriendHandler(acc.username)}
                                                    disabled={loadingFriend === acc.username}
                                                >
                                                    {loadingFriend === acc.username ? "Đang gửi..." : "Kết bạn"}
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FriendModal;
