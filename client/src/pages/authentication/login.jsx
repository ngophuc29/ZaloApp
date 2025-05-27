import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Row, Col, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useGlobalContext } from '@/context/GlobalProvider';

const { Text } = Typography;

const Login = () => {
  const { setIsLoggedIn } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState('');
  const apiUrl = "https://sockettubuild.onrender.com/api";

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { account, password } = values;

      const response = await axios.post(`${apiUrl}/accounts/login`, {
        email: account,
        username: account,
        phone: account,
        password,
      });

      if (response.status === 200) {
        const { token, username } = response.data;        localStorage.setItem('token', token);
        localStorage.setItem("username", username);
        setIsLoggedIn(true);
        message.success('Đăng nhập thành công');
        navigate('/chat');
      }
    } catch (error) {
      setLoginError('Sai thông tin đăng nhập');
      message.error('Đăng nhập thất bại: ' + (error.response?.data?.message || 'Lỗi server'));
    }
    setLoading(false);
  };

  return (
    <Row justify="center" align="middle" style={{ height: '100vh', background: '#f0f2f5' }}>
      <Col xs={24} sm={12} md={8}>
        <Card
          title={<h2 style={{ textAlign: 'center' }}>Đăng Nhập</h2>}
          style={{
            padding: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            borderRadius: '8px',
          }}
        >
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              name="account"
              label="Email / Username / Số điện thoại"
              rules={[{ required: true, message: 'Vui lòng nhập tài khoản!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập tài khoản"
                style={{ borderRadius: '4px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật Khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
                style={{ borderRadius: '4px' }}
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Nhớ tài khoản</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{ borderRadius: '4px' }}
              >
                Đăng nhập
              </Button>
            </Form.Item>

            {loginError && <Text type="danger">{loginError}</Text>}

            <Form.Item style={{ textAlign: 'center' }}>
              <Text>
                Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
              </Text>
            </Form.Item>

            <Form.Item style={{ textAlign: 'center' }}>
              <Link to="/forgot-password">
                <Button type="link" style={{ padding: 0 }}>
                  Quên mật khẩu?
                </Button>
              </Link>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;
