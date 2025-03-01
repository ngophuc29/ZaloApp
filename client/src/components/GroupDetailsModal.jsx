import React from "react";

const GroupDetailsModal = ({
    groupInfo,
    setGroupDetailsVisible,
    myname,
    handleRemoveGroupMember,
    handleTransferGroupOwner,
    handleAssignDeputy,
    handleCancelDeputy,
    handleAddGroupMember,
    handleLeaveGroup,
    handleDisbandGroup,
}) => {
    return (
        <div
            className="modal"
            style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => {
                if (e.target.className.includes("modal")) setGroupDetailsVisible(false);
            }}
        >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Group Details</h5>
                        <button type="button" className="btn-close" onClick={() => setGroupDetailsVisible(false)}></button>
                    </div>
                    <div className="modal-body">
                        <div id="groupInfo">
                            <p>
                                <strong>Group Name:</strong> {groupInfo.groupName}
                            </p>
                            <p>
                                <strong>Owner:</strong> {groupInfo.owner}
                            </p>
                            <p>
                                <strong>Deputies:</strong> {groupInfo.deputies.join(", ")}
                            </p>
                            <p>
                                <strong>Members:</strong> {groupInfo.members.join(", ")}
                            </p>
                            <ul>
                                {groupInfo.members
                                    .filter((member) => member !== myname)
                                    .map((member, idx) => (
                                        <li key={idx}>
                                            {member}{" "}
                                            {(groupInfo.owner === myname ||
                                                (groupInfo.deputies && groupInfo.deputies.includes(myname))) &&
                                                member !== groupInfo.owner && (
                                                    <button onClick={() => handleRemoveGroupMember(groupInfo.roomId, member)}>
                                                        Remove
                                                    </button>
                                                )}
                                            {groupInfo.owner === myname && member !== groupInfo.owner && (
                                                <button onClick={() => handleTransferGroupOwner(groupInfo.roomId, member)}>
                                                    Transfer Ownership
                                                </button>
                                            )}
                                            {groupInfo.owner === myname && !groupInfo.deputies.includes(member) && (
                                                <button onClick={() => handleAssignDeputy(groupInfo.roomId, member)}>
                                                    Assign Deputy
                                                </button>
                                            )}
                                            {groupInfo.owner === myname && groupInfo.deputies.includes(member) && (
                                                <button onClick={() => handleCancelDeputy(groupInfo.roomId, member)}>
                                                    Cancel Deputy
                                                </button>
                                            )}
                                        </li>
                                    ))}
                            </ul>
                        </div>
                        <div id="groupActions" className="mt-3">
                            <input
                                type="text"
                                id="newMemberInput"
                                className="form-control"
                                placeholder="New member username"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleAddGroupMember(e.target.value);
                                        e.target.value = "";
                                    }
                                }}
                            />
                            <button
                                className="btn btn-primary mb-2"
                                onClick={() => {
                                    const input = document.getElementById("newMemberInput");
                                    handleAddGroupMember(input.value);
                                    input.value = "";
                                }}
                            >
                                Add Member
                            </button>
                            <button className="btn btn-warning mb-2" onClick={handleLeaveGroup}>
                                Leave Group
                            </button>
                            <button className="btn btn-danger" onClick={handleDisbandGroup}>
                                Disband Group
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupDetailsModal;
