import React from 'react';
import { Card, Divider } from 'antd';
import { FaCog } from 'react-icons/fa';

const Settings = () => {
    return (
        <div className="settings-container" style={{ padding: '20px' }}>
            <Card title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaCog /> Cài đặt
                </div>
            }>
                <div className="settings-content">
                    <h3>Cài đặt chung</h3>
                    <Divider />
                    <div className="settings-section">
                        <h4>Giao diện</h4>
                        {/* Thêm các tùy chọn giao diện ở đây */}
                    </div>
                    
                    <div className="settings-section">
                        <h4>Thông báo</h4>
                        {/* Thêm các tùy chọn thông báo ở đây */}
                    </div>
                    
                    <div className="settings-section">
                        <h4>Quyền riêng tư</h4>
                        {/* Thêm các tùy chọn quyền riêng tư ở đây */}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Settings; 