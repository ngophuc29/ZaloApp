import React, { useState } from 'react';
import { Form, Input, Button, message, Row, Col, Card, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/accounts/forgot-password`, { email });

      if (response.status === 200) {
        message.success('Đã gửi email đặt lại mật khẩu! Kiểm tra hộp thư của bạn.');
        navigate('/verify-otp', { state: { email } });
      }
    } catch (error) {
      message.error('Lỗi khi gửi email: ' + error.response?.data?.message || 'Lỗi server');
    }
    setLoading(false);
  };

  return (
    <Row justify="center" align="middle" style={{ height: '100vh', background: '#f0f2f5' }}>
      <Col xs={24} sm={12} md={8}>
        <Card
          title={<h2 style={{ textAlign: 'center' }}>Quên Mật Khẩu</h2>}
          style={{
            padding: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            borderRadius: '8px',
          }}
        >
          <Form onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="email"
              label="Nhập Email"
              rules={[{ required: true, message: 'Vui lòng nhập email của bạn!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{ borderRadius: '4px' }}
              >
                Gửi Email
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default ForgotPassword;
