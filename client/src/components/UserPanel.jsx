import React from "react";

const UserPanel = ({
    searchFilter,
    setSearchFilter,
    filteredAccounts,
    handleUserClick,
    myname,
    setFriendModalVisible,
}) => {
    return (
        <div className="col-3 border-end" style={{ padding: "10px" }}>
            <div className="mb-3 d-flex">
                <input
                    type="text"
                    id="search_user"
                    className="form-control"
                    placeholder="Search user by name"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                />
                <button className="btn btn-success ms-2" onClick={() => setFriendModalVisible(true)}>
                    Kết bạn
                </button>
            </div>
            <ul className="list-unstyled">
                {filteredAccounts.map((account, idx) => (
                    <li key={idx} style={{ cursor: "pointer", marginBottom: "10px" }} onClick={() => handleUserClick(account.username)}>
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
        </div>
    );
};

export default UserPanel;
