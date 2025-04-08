import React, { useState } from 'react';
import { Form, Input, Button, message, Row, Col, Card, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const { Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const onFinishStep1 = async (values) => {
    setLoading(true);
    try {
      
      const response = await axios.post(`http://localhost:5000/api/accounts/register-step1`, { email });

      if (response.status === 200) {
        message.success('OTP đã được gửi tới email của bạn. Vui lòng kiểm tra.');
        navigate('/verify-otp', { state: { email, type: 'new' } });
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi server');
    }
    setLoading(false);
  };

  return (
    <Row justify="center" align="middle" style={{ height: '100vh', background: '#f0f2f5' }}>
      <Col xs={24} sm={12} md={8}>
        <Card title={<h2 style={{ textAlign: 'center' }}>Đăng Ký</h2>} style={{ padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
          <Form name="signup" initialValues={{ remember: true }} onFinish={onFinishStep1} layout="vertical">
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập email"
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
                Gửi OTP
              </Button>
            </Form.Item>
          </Form>

          <Form.Item style={{ textAlign: 'center' }}>
            <Text>
              Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
            </Text>
          </Form.Item>
        </Card>
      </Col>
    </Row>
  );
};

export default Register;
