import React, { useState } from 'react';
import { Form, Input, Button, message, Row, Col, Card, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const ResetPassword = () => {
  const location = useLocation();
  const { email } = location.state || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (!email) {
      message.error('Không tìm thấy email, vui lòng quay lại bước trước.');
      return;
    }

    if (newPassword !== confirmPassword) {
      message.error('Mật khẩu và xác nhận mật khẩu không khớp');
      return;
    }

    if (newPassword.length < 6) {
      message.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/accounts/reset-password`,
        { email, newPassword }
      );

      if (response.status === 200) {
        message.success('Mật khẩu đã được thay đổi thành công!');
        navigate('/login');
      }
    } catch (error) {
      message.error('Lỗi khi đổi mật khẩu: ' + (error.response?.data?.message || 'Lỗi server'));
    }
    setLoading(false);
  };

  return (
    <Row justify="center" align="middle" style={{ height: '100vh', background: '#f0f2f5' }}>
      <Col xs={24} sm={16} md={10} lg={8}>
        <Card
          title={<Title level={3} style={{ textAlign: 'center' }}>Đặt lại mật khẩu</Title>}
          style={{
            padding: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            borderRadius: '8px',
          }}
        >
          <Form layout="vertical" onFinish={handleResetPassword}>
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
            >
              <Input.Password
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu!' }]}
            >
              <Input.Password
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ borderRadius: '4px' }}
              >
                Xác nhận đổi mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default ResetPassword;
