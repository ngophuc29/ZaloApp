import React, { useState } from 'react';
import { Layout, message } from 'antd';
import Sidebar from '../components/Sidebar';
import SidebarCenter from '../components/SidebarCenter';
import Content from '../components/Content';
import { useNavigate } from 'react-router-dom';

const { Header, Sider } = Layout;

const Home = () => {
    const [selectedGroup, setSelectedGroup] = useState('CNMoi - Nhóm 8');
    const [newMessage, setNewMessage] = useState('');
    const [image, setImage] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [sidebarMode, setSidebarMode] = useState('chat');
    const [selectedSidebarItem, setSelectedSidebarItem] = useState('friends');
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState({
        'CNMoi - Nhóm 8': [
            { id: 1, sender: 'Công Huy', content: 'ok làm hết đi', time: '2025-04-05T17:33:00', avatar: 'https://joeschmoe.io/api/v1/cory' },
            { id: 2, sender: 'Bạn', content: 'Nào ai làm thì nhắn ở đây nha anh em', time: '2025-04-05T17:32:00', avatar: 'https://joeschmoe.io/api/v1/random' },
        ],
        'Ba': [
            { id: 1, sender: 'asdasd', content: 'caqwdqwas', time: '2025-04-05T22:00:00', avatar: 'https://joeschmoe.io/api/v1/random' },
            { id: 2, sender: 'Bạn', content: 'asdqcqwed', time: '2025-04-05T22:05:00', avatar: 'https://joeschmoe.io/api/v1/random' },
        ],
        'Mẹ': [
            { id: 1, sender: 'cqwdqw', content: 'dasdqweqwd', time: '2025-04-05T18:30:00', avatar: 'https://joeschmoe.io/api/v1/random' },
            { id: 2, sender: 'Bạn', content: 'asdqwfqwd', time: '2025-04-05T18:45:00', avatar: 'https://joeschmoe.io/api/v1/random' },
        ],
    });

    const handleSendMessage = () => {
        if (newMessage.trim() || image) {
            const newMsg = {
                id: Date.now(),
                sender: 'Bạn',
                content: newMessage.trim(),
                time: new Date().toISOString(),
                avatar: 'https://joeschmoe.io/api/v1/random',
                image,
            };
            setMessages((prevMessages) => ({
                ...prevMessages,
                [selectedGroup]: [newMsg, ...(prevMessages[selectedGroup] || [])],
            }));

            setNewMessage('');
            setImage(null);
        } else {
            message.warning('Vui lòng nhập tin nhắn hoặc chọn hình ảnh.');
        }
    };

    const handleUploadChange = (info) => {
        if (info.file.status === 'done') {
            message.success(`${info.file.name} đã tải lên thành công`);
            setImage(info.file.response.url);
        } else if (info.file.status === 'error') {
            message.error(`${info.file.name} tải lên thất bại.`);
        }
    };


    return (
        <Layout style={{ height: '100vh' }}>
            <Sidebar sidebarMode={sidebarMode} setSidebarMode={setSidebarMode} />
            <SidebarCenter
  sidebarMode={sidebarMode}
  selectedGroup={selectedGroup}
  setSelectedGroup={setSelectedGroup}
  selectedSidebarItem={selectedSidebarItem}
  setSelectedSidebarItem={setSelectedSidebarItem}
/>

<Content
  sidebarMode={sidebarMode}
  selectedGroup={selectedGroup}
  selectedSidebarItem={selectedSidebarItem}
  messages={messages}
  newMessage={newMessage}
  setNewMessage={setNewMessage}
  showEmojiPicker={showEmojiPicker}
  setShowEmojiPicker={setShowEmojiPicker}
  handleSendMessage={handleSendMessage}
  handleUploadChange={handleUploadChange}
/>


        </Layout>
    );
};

export default Home;
