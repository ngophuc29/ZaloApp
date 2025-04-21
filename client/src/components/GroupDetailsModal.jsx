import React, { useState, useEffect, useRef } from "react";

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
    searchUsers,
}) => {
    const [newMemberInput, setNewMemberInput] = useState("");
    const [selectedNewOwner, setSelectedNewOwner] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef(null);
    const suggestionsRef = useRef(null);

    const isOwner = groupInfo.owner === myname;
    const isDeputy = groupInfo.deputies.includes(myname);
    const eligibleNewOwners = groupInfo.members.filter(m => m !== myname);

    useEffect(() => {
        // Add click outside listener to close suggestions
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (value) => {
        setNewMemberInput(value);
        
        // Clear previous timeout
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (value.trim()) {
            setIsSearching(true);
            // Debounce search
            searchTimeout.current = setTimeout(async () => {
                try {
                    const results = await searchUsers(value);
                    // Filter out existing members
                    const filteredResults = results.filter(user => 
                        !groupInfo.members.includes(user.username) && 
                        user.username !== myname
                    );
                    setSuggestions(filteredResults);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error('Error searching users:', error);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const onAddMember = () => {
        if (newMemberInput.trim()) {
            handleAddGroupMember(newMemberInput.trim());
            setNewMemberInput("");
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (username) => {
        handleAddGroupMember(username);
        setNewMemberInput("");
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div
            className="modal"
            style={{
                display: "block",
                position: "fixed",
                top: 0, left: 0,
                width: "100%", height: "100%",
                background: "rgba(0,0,0,0.5)",
            }}
            onClick={e => {
                if (e.target.className.includes("modal")) setGroupDetailsVisible(false);
            }}
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Group Details</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setGroupDetailsVisible(false)}
                        />
                    </div>
                    <div className="modal-body">
                        {/* Info */}
                        <p><strong>Name:</strong> {groupInfo.groupName}</p>
                        <p><strong>Owner:</strong> {groupInfo.owner}</p>
                        <p><strong>Deputies:</strong> {groupInfo.deputies.join(", ") || "None"}</p>

                        {/* Members List (scrollable) */}
                        <div
                            style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #ddd", padding: 8 }}
                        >
                            <strong>Members:</strong>
                            <ul className="list-unstyled mb-0">
                                {groupInfo.members.map(member => (
                                    <li key={member} className="d-flex align-items-center mb-1">
                                        <span className="flex-grow-1">{member}</span>

                                        {/* Remove */}
                                        {/* {(isOwner || isDeputy) && member !== groupInfo.owner && ( */}
                                        {(isOwner || isDeputy) && member !== groupInfo.owner && member !== myname && (
                                            <button
                                                className="btn btn-sm btn-outline-danger me-1"
                                                onClick={() => handleRemoveGroupMember(groupInfo.roomId, member)}
                                            >
                                                Remove
                                            </button>
                                        )}

                                        {/* Owner-only actions */}
                                        {isOwner && member !== myname && (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary me-1"
                                                    onClick={() => handleTransferGroupOwner(groupInfo.roomId, member)}
                                                >
                                                    Transfer
                                                </button>
                                                {!groupInfo.deputies.includes(member) ? (
                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-1"
                                                        onClick={() => handleAssignDeputy(groupInfo.roomId, member)}
                                                    >
                                                        Make Deputy
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-outline-warning me-1"
                                                        onClick={() => handleCancelDeputy(groupInfo.roomId, member)}
                                                    >
                                                        Revoke Deputy
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Add Member */}
                        <div className="position-relative">
                            <div className="input-group mt-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search username to add..."
                                    value={newMemberInput}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" && !showSuggestions) {
                                            onAddMember();
                                        }
                                    }}
                                />
                                <button 
                                    className="btn btn-outline-primary" 
                                    onClick={onAddMember}
                                    disabled={isSearching}
                                >
                                    {isSearching ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                        "Add"
                                    )}
                                </button>
                            </div>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div 
                                    ref={suggestionsRef}
                                    className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" 
                                    style={{ 
                                        maxHeight: "200px", 
                                        overflowY: "auto",
                                        zIndex: 1000
                                    }}
                                >
                                    {suggestions.map((user) => (
                                        <div
                                            key={user.username}
                                            className="p-2 cursor-pointer hover-bg-light border-bottom"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => selectSuggestion(user.username)}
                                        >
                                            <div className="d-flex align-items-center">
                                                {user.avatar && (
                                                    <img 
                                                        src={user.avatar} 
                                                        alt={user.username}
                                                        className="rounded-circle me-2"
                                                        style={{ width: "30px", height: "30px" }}
                                                    />
                                                )}
                                                <div>
                                                    <div className="fw-bold">{user.username}</div>
                                                    {user.fullName && (
                                                        <div className="text-muted small">{user.fullName}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* If owner: select new owner */}
                        {isOwner && (
                            <div className="mt-3">
                                <label className="form-label">
                                    <strong>Choose new owner before leaving:</strong>
                                </label>
                                <select
                                    className="form-select"
                                    value={selectedNewOwner}
                                    onChange={e => setSelectedNewOwner(e.target.value)}
                                >
                                    <option value="">-- Select member --</option>
                                    {eligibleNewOwners.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        {/* Leave Group */}
                        <button
                            className="btn btn-warning"
                            disabled={isOwner && !selectedNewOwner}
                            onClick={() => handleLeaveGroup(isOwner ? selectedNewOwner : null)}
                        >
                            {isOwner ? "Transfer & Leave" : "Leave Group"}
                        </button>

                        {/* Disband Group (owner only) */}
                        {isOwner && (
                            <button className="btn btn-danger" onClick={handleDisbandGroup}>
                                Disband Group
                            </button>
                        )}

                        <button
                            className="btn btn-secondary"
                            onClick={() => setGroupDetailsVisible(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupDetailsModal;
