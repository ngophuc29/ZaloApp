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
    requestedFriends,           // danh sách người nhận lời mời (đã gửi) nhận từ state của component cha
    setRequestedFriends,        // cập nhật state cho danh sách lời mời đã gửi từ component cha
}) => {
    // State để theo dõi username đang được gửi lời mời hoặc thu hồi lời mời
    const [loadingFriend, setLoadingFriend] = useState(null);

    // Khi bấm nút "Kết bạn": gửi lời mời và đóng modal
    const addFriendHandler = async (username) => {
        setLoadingFriend(username);
        await handleAddFriend(username); // Sau khi emit, component cha sẽ nhận sự kiện realtime và cập nhật requestedFriends nếu cần.
        setLoadingFriend(null);
        setFriendModalVisible(false);
    };

    // Khi bấm nút "Thu hồi": gọi hàm thu hồi lời mời và cập nhật lại danh sách lời mời đã gửi
    const cancelFriendHandler = async (username) => {
        setLoadingFriend(username);
        await handleWithdrawFriendRequest(username);
        setLoadingFriend(null);
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
                                    // Kiểm tra nếu lời mời đã được gửi (theo state requestedFriends)
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
