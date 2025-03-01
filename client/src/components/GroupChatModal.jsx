import React from "react";

const GroupChatModal = ({
    groupName,
    setGroupName,
    accounts,
    selectedMembers,
    setSelectedMembers,
    myname,
    setGroupModalVisible,
    handleCreateGroup,
}) => {
    return (
        <div
            className="modal"
            style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => {
                if (e.target.className.includes("modal")) setGroupModalVisible(false);
            }}
        >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Tạo Nhóm Chat</h5>
                        <button type="button" className="btn-close" onClick={() => setGroupModalVisible(false)}></button>
                    </div>
                    <div className="modal-body">
                        <input
                            type="text"
                            id="groupName"
                            className="form-control mb-3"
                            placeholder="Tên nhóm chat"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <h6>Chọn thành viên:</h6>
                        <div style={{ maxHeight: "200px", overflowY: "scroll", border: "1px solid #ccc", padding: "5px" }}>
                            {accounts
                                .filter((acc) => acc.username !== myname)
                                .map((account, idx) => (
                                    <div key={idx} className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            value={account.username}
                                            id={`member-${idx}`}
                                            checked={selectedMembers.includes(account.username)}
                                            onChange={() => {
                                                const username = account.username;
                                                setSelectedMembers((prev) =>
                                                    prev.includes(username)
                                                        ? prev.filter((u) => u !== username)
                                                        : [...prev, username]
                                                );
                                            }}
                                        />
                                        <label className="form-check-label" htmlFor={`member-${idx}`}>
                                            {account.username}
                                        </label>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-primary" onClick={handleCreateGroup}>
                            Tạo Nhóm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupChatModal;
