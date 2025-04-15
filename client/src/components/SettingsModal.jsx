import React, { useState } from 'react';
import { Modal, Menu, Switch, Select } from 'antd';
import {
    SettingOutlined, LockOutlined, BellOutlined, 
    SyncOutlined, DatabaseOutlined, MobileOutlined,
    NotificationOutlined, MessageOutlined, UserOutlined
} from '@ant-design/icons';

const SettingsModal = ({ visible, onClose }) => {
    const [selectedMenu, setSelectedMenu] = useState('general');

    const menuItems = [
        {
            key: 'general',
            icon: <SettingOutlined />,
            label: 'Cài đặt chung'
        },
        {
            key: 'security',
            icon: <LockOutlined />,
            label: 'Tài khoản và bảo mật'
        },
        {
            key: 'privacy',
            icon: <UserOutlined />,
            label: 'Quyền riêng tư'
        },
        {
            key: 'sync',
            icon: <SyncOutlined />,
            label: 'Đồng bộ tin nhắn'
        },
        {
            key: 'data',
            icon: <DatabaseOutlined />,
            label: 'Quản lý dữ liệu'
        },
        {
            key: 'interface',
            icon: <MobileOutlined />,
            label: 'Giao diện',
            beta: true
        },
        {
            key: 'notification',
            icon: <BellOutlined />,
            label: 'Thông báo'
        },
        {
            key: 'message',
            icon: <MessageOutlined />,
            label: 'Tin nhắn'
        }
    ];

    const renderContent = () => {
        switch (selectedMenu) {
            case 'general':
                return (
                    <div>
                        <h3>Danh bạ</h3>
                        <p className="text-muted">Danh sách bạn bè được hiển thị trong danh bạ</p>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <div>Hiển thị tất cả bạn bè</div>
                                <div className="text-muted">Hiển thị tất cả bạn bè trong danh bạ</div>
                            </div>
                            <Switch />
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <div>Chỉ hiển thị bạn bè đang sử dụng Zalo</div>
                                <div className="text-muted">Chỉ hiển thị những người bạn đang sử dụng Zalo</div>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <h3 className="mt-4">Ngôn ngữ</h3>
                        <div className="mb-3">
                            <div>Thay đổi ngôn ngữ</div>
                            <Select
                                defaultValue="vi"
                                style={{ width: 200 }}
                                options={[
                                    { value: 'vi', label: 'Tiếng Việt' },
                                    { value: 'en', label: 'English' }
                                ]}
                            />
                        </div>

                        <h3 className="mt-4">Khởi động & ghi nhớ tài khoản</h3>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <div>Khởi động Zalo khi mở máy</div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <div>Ghi nhớ tài khoản đăng nhập</div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>
                );
            // Thêm các case khác cho các menu khác
            default:
                return <div>Đang phát triển...</div>;
        }
    };

    return (
        <Modal
            title="Cài đặt"
            open={visible}
            onCancel={onClose}
            width={800}
            footer={null}
        >
            <div className="d-flex">
                <Menu
                    mode="inline"
                    selectedKeys={[selectedMenu]}
                    onClick={({ key }) => setSelectedMenu(key)}
                    style={{ width: 250, borderRight: '1px solid #f0f0f0' }}
                    items={menuItems.map(item => ({
                        ...item,
                        label: (
                            <span>
                                {item.label}
                                {item.beta && (
                                    <span className="ms-2 badge bg-primary" style={{ fontSize: '0.7em' }}>
                                        Beta
                                    </span>
                                )}
                            </span>
                        )
                    }))}
                />
                <div className="flex-grow-1 p-4">
                    {renderContent()}
                </div>
            </div>
        </Modal>
    );
};

export default SettingsModal; 