import React, { useState } from "react";

const GroupChatModal = ({
    groupName,
    setGroupName,
    accounts,
    selectedMembers,
    setSelectedMembers,
    myname,
    setGroupModalVisible,
    handleCreateGroup,
    friends,
}) => {
    // Add validation check
    const isValid = selectedMembers.length >= 2 && groupName.trim() !== "";
    const [error, setError] = useState("");

    const handleSubmit = () => {
        if (selectedMembers.length < 2) {
            setError("Vui lòng chọn ít nhất 2 thành viên");
            return;
        }
        if (!groupName.trim()) {
            setError("Vui lòng nhập tên nhóm");
            return;
        }
        handleCreateGroup();
    };

    return (
        <div
            className="modal"
            style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setGroupModalVisible(false);
                }
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
                        <h6>Chọn thành viên: (Tối thiểu 2 người)</h6>
                        <div style={{ maxHeight: "200px", overflowY: "scroll", border: "1px solid #ccc", padding: "5px" }}>
                            {accounts
                                .filter((acc) => acc.username !== myname && friends.includes(acc.username))
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
                        {error && <div className="text-danger mt-2">{error}</div>}
                    </div>
                    <div className="modal-footer">
                        <button 
                            className="btn btn-primary" 
                            onClick={handleSubmit}
                            disabled={!isValid}
                        >
                            Tạo Nhóm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupChatModal;
