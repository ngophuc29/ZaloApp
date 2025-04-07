import React from "react";
import { FaSearch, FaUserPlus, FaUsers } from "react-icons/fa"; // icon mới

const LeftPanel = ({
    searchFilter,
    setSearchFilter,
    filteredAccounts,
    handleUserClick,
    activeChats,
    handleRoomClick,
    activeRoom,
    setFriendModalVisible,
    onOpenGroupModal,
}) => {
    const isSearching = searchFilter.trim().length > 0;

    return (
        <div className="col-3 border-end" style={{ padding: "10px" }}>
            {/* Search Bar & Buttons */}
            <div className="mb-3 d-flex align-items-center">
                {/* Ô search với icon kính lúp bên trong */}
                <div className="input-group">
                    <span className="input-group-text bg-white">
                        <FaSearch />
                    </span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm kiếm"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                    />
                </div>

                {/* Nút friend/group */}
                {isSearching ? (
                    <button
                        className="btn btn-danger ms-2"
                        onClick={() => setSearchFilter("")}
                    >
                        Đóng
                    </button>
                ) : (
                    <>
                        <button
                            className="btn btn-light ms-2"
                            onClick={() => setFriendModalVisible(true)}
                            title="Kết bạn"
                        >
                            <FaUserPlus />
                        </button>
                        <button
                            className="btn btn-light ms-2"
                            onClick={onOpenGroupModal}
                            title="Tạo nhóm"
                        >
                            <FaUsers />
                        </button>
                    </>
                )}
            </div>


            {/* Danh sách bên dưới */}
            {isSearching ? (
                // Khi đang search: hiển thị danh sách user lọc được
                <ul className="list-unstyled">
                    {filteredAccounts.map((account, idx) => (
                        <li
                            key={idx}
                            style={{ cursor: "pointer", marginBottom: "10px" }}
                            onClick={() => handleUserClick(account.username)}
                        >
                            <div className="d-flex">
                                <span>UserName: </span>
                                <p className="ms-2">{account.username}</p>
                            </div>
                            <div className="d-flex">
                                <span>FullName: </span>
                                <p className="ms-2">{account.fullname}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                // Khi không search: hiển thị danh sách chat (vẫn cho phép chuyển room)
                <div>
                    <ul id="chat_list_ul" className="list-group">
                        {Object.keys(activeChats).map((room) => {
                            const isActive = room === activeRoom;
                            return (
                                <li
                                    key={room}
                                    style={{
                                        cursor: "pointer",
                                        padding: "5px",
                                        borderBottom: "1px solid #ddd",
                                        backgroundColor: isActive ? "#f0f8ff" : "transparent",
                                        listStyle:"none"
                                    }}
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
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LeftPanel;
