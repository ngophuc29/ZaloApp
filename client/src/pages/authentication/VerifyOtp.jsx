import React, { useState } from 'react';
import { Form, Input, Button, message, Row, Col, Card, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const VerifyOtp = () => {
  const location = useLocation();
  const { email, type } = location.state || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      message.error('Vui lòng nhập OTP!');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/accounts/verify-otp`,
        { email, otp }
      );

      if (response.status === 200) {
        message.success('Xác thực OTP thành công!');

        if (type === 'new') {
          navigate('/register2', { state: { email } });
        } else {
          navigate('/reset-password', { state: { email } });
        }
      }
    } catch (error) {
      message.error('OTP không hợp lệ: ' + (error.response?.data?.message || 'Lỗi server'));
    }
    setLoading(false);
  };

  return (
    <Row justify="center" align="middle" style={{ height: '100vh', background: '#f0f2f5' }}>
      <Col xs={24} sm={16} md={10} lg={8}>
        <Card
          title={<Title level={3} style={{ textAlign: 'center' }}>Xác Thực OTP</Title>}
          style={{
            padding: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            borderRadius: '8px',
          }}
        >
          <Form onFinish={handleVerifyOtp} layout="vertical">
            <Form.Item
              name="otp"
              label="Nhập mã OTP"
              rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
            >
              <Input
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
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
                Xác Thực OTP
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default VerifyOtp;
