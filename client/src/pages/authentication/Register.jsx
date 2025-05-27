import React, { useState } from 'react';
import { Form, Input, Button, Row, Col, Card, Typography, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const { Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailRegistered, setEmailRegistered] = useState(false); // true nếu email đã tồn tại
  const navigate = useNavigate();

  // Hàm kiểm tra định dạng email trước khi gọi API
  const isValidEmailFormat = (email) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };

  // Kiểm tra email khi onBlur
  const handleEmailBlur = async () => {
    if (!email) return;
    // Nếu email chưa đúng định dạng thì không gọi API
    if (!isValidEmailFormat(email)) return;

    try {
      // Gọi API kiểm tra email, giả sử endpoint: /api/accounts/check-email
      const response = await axios.get(`https://sockettubuild.onrender.com/api/accounts/check-email`, {
        params: { email }
      });

      if (response.data.exists) {
        setEmailRegistered(true);
        toast.error('Email đã tồn tại trên hệ thống');
      } else {
        setEmailRegistered(false);
      }
    } catch (error) {
      toast.error('Lỗi kiểm tra email', error);
      // Có thể hiển thị thông báo lỗi hoặc bỏ qua
    }
  };

  const onFinishStep1 = async () => {
    if (emailRegistered) {
      toast.error('Email đã được đăng ký. Vui lòng nhập email khác.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`https://sockettubuild.onrender.com/api/accounts/register-step1`, { email });

      if (response.status === 200) {
        toast.success('OTP đã được gửi tới email của bạn. Vui lòng kiểm tra.');
        navigate('/verify-otp', { state: { email, type: 'new' } });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi server');
    }
    setLoading(false);
  };

  return (
    <Row justify="center" align="middle" style={{ height: '100vh', background: '#f0f2f5' }}>
      <Col xs={24} sm={12} md={8}>
        <Card
          title={<h2 style={{ textAlign: 'center' }}>Đăng Ký</h2>}
          style={{
            padding: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}
        >
          <Form
            name="signup"
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinishStep1}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Sai định dạng email!' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                disabled={emailRegistered} // vô hiệu hóa nếu email đã tồn tại
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
