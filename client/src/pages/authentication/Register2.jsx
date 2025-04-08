import React, { useState } from 'react';
import { Form, Input, Button, message, Row, Col, Card, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const Register2 = () => {
    const location = useLocation();
    const { email } = location.state || {};
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [image, setImage] = useState(null);
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onFinishStep2 = async (values) => {
        const { username, password, phone, birthday, fullname } = values;

        setLoading(true);
        try {
            const response = await axios.post(
                `http://localhost:5000/api/accounts/register-step2`,
                {
                    username,
                    password,
                    phone,
                    email,
                    birthday,
                    fullname,
                    image,
                }
            );

            if (response.status === 201) {
                message.success('Đăng ký thành công!');
                navigate('/login');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi server');
        }
        setLoading(false);
    };

    return (
        <Row justify="center" align="middle" style={{ height: '100vh', background: '#f0f2f5' }}>
            <Col xs={24} sm={12} md={8}>
                <Card
                    title={<h2 style={{ textAlign: 'center' }}>Đăng Ký Bước 2</h2>}
                    style={{
                        padding: '20px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                    }}
                >
                    <Form form={form} layout="vertical" onFinish={onFinishStep2}>
                        <Form.Item
                            name="username"
                            label="Tên đăng nhập"
                            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                        >
                            <Input placeholder="Tên đăng nhập" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password placeholder="Mật khẩu" />
                        </Form.Item>

                        <Form.Item
                            name="fullname"
                            label="Họ và tên"
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                        >
                            <Input placeholder="Họ và tên" />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="Số điện thoại"
                            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                        >
                            <Input placeholder="Số điện thoại" />
                        </Form.Item>

                        <Form.Item name="birthday" label="Ngày sinh">
                            <Input type="date" />
                        </Form.Item>

                        <Form.Item name="image" label="Hình ảnh" extra="Chọn ảnh đại diện">
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                        </Form.Item>

                        {image && (
                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                <img
                                    src={image}
                                    alt="Avatar"
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '50%',
                                    }}
                                />
                            </div>
                        )}

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                style={{ borderRadius: '4px' }}
                            >
                                Hoàn tất Đăng ký
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default Register2;
