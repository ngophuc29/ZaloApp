import React, { useState } from 'react';
import { Form, Input, Button, Row, Col, Card, Typography, DatePicker } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Title } = Typography;

const Register2 = () => {
    const location = useLocation();
    const { email } = location.state || {};
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [image, setImage] = useState(null);
    const navigate = useNavigate();

    const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/2048px-User-avatar.svg.png';

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

    const isOldEnough = (birthday) => {
        const today = dayjs();
        const age = today.diff(dayjs(birthday), 'year');
        return age >= 13;
    };

    const onFinishStep2 = async (values) => {
        const { username, password, phone, birthday, fullname } = values;

        if (!isOldEnough(birthday)) {
            toast.error('Bạn phải từ 13 tuổi trở lên mới được đăng ký.');
            return;
        }

        setLoading(true);
        try {
            const checkUsername = await axios.get(`http://localhost:5000/api/accounts/check-username`, {
                params: { username },
            });

            if (checkUsername.data.exists) {
                toast.error('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
                setLoading(false);
                return;
            }

            const checkPhone = await axios.get(`http://localhost:5000/api/accounts/check-phone`, {
                params: { phone },
            });

            if (checkPhone.data.exists) {
                toast.error('Số điện thoại đã được sử dụng.');
                setLoading(false);
                return;
            }

            const response = await axios.post(`http://localhost:5000/api/accounts/register-step2`, {
                username,
                password,
                phone,
                email,
                birthday,
                fullname,
                image: image || undefined,
            });

            if (response.status === 201) {
                toast.success('Đăng ký thành công!');
                navigate('/login');
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
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                                { min: 4, message: 'Tên đăng nhập phải có ít nhất 4 ký tự!' },
                                {
                                    pattern: /^[^\s]+$/,
                                    message: 'Tên đăng nhập không được chứa khoảng trắng!',
                                },
                            ]}
                        >
                            <Input placeholder="Tên đăng nhập" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                                {
                                    pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/,
                                    message: 'Mật khẩu phải bao gồm cả chữ và số!',
                                },
                            ]}
                        >
                            <Input.Password placeholder="Mật khẩu" />
                        </Form.Item>

                        <Form.Item
                            name="fullname"
                            label="Họ và tên"
                            rules={[
                                { required: true, message: 'Vui lòng nhập họ tên!' },
                                {
                                    pattern: /^[\p{L}\s]+$/u,
                                    message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng!',
                                },
                            ]}
                        >
                            <Input placeholder="Họ và tên" />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="Số điện thoại"
                            rules={[
                                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                                {
                                    pattern: /^(0|\+84)[3|5|7|8|9]\d{8}$/,
                                    message: 'Số điện thoại không hợp lệ!',
                                },
                            ]}
                        >
                            <Input placeholder="Số điện thoại" />
                        </Form.Item>

                        <Form.Item
                            name="birthday"
                            label="Ngày sinh"
                            rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
                        >
                            <DatePicker style={{ width: '100%' }} />
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
                    <ToastContainer />
                </Card>
            </Col>
        </Row>
    );
};

export default Register2;
