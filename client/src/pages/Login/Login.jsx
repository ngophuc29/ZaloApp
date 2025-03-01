// LoginRegister.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginRegister = () => {
  const navigate = useNavigate();
  // State để điều chỉnh tab hiện tại: 'login' hoặc 'register'
  const [activeTab, setActiveTab] = useState("login");

  // Ở form login, chỉ cần phone và password
  const [loginData, setLoginData] = useState({ phone: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
    fullname: "",
  });

  const handleLogin = () => {
    if (!loginData.phone.trim()) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }
    const data = {
      phone: loginData.phone,
      password: loginData.password,
    };

    fetch("/api/accounts/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.statusCode) {
          alert(result.message);
        } else {
          localStorage.setItem("username", result.username);
          navigate("/home");
        }
      })
      .catch((error) => {
        alert("Có lỗi xảy ra: " + error.message);
      });
  };

  const handleRegister = () => {
    if (registerData.password !== registerData.confirmPassword) {
      alert("Password không trùng nhau!");
      return;
    }
    const data = {
      username: registerData.username,
      phone: registerData.phone,
      password: registerData.password,
      fullname: registerData.fullname,
    };

    fetch("/api/accounts/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.statusCode) {
          alert(result.message);
        } else {
          alert("Đăng ký thành công, hãy đăng nhập!");
        }
      })
      .catch((error) => {
        alert("Có lỗi xảy ra: " + error.message);
      });
  };

  return (
    <div className="container mt-5">
      {/* Tabs Navigation */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
        </li>
      </ul>

      {/* Nội dung theo tab */}
      {activeTab === "login" ? (
        <div>
          <h1>Login</h1>
          {/* Chỉ có Phone Number và Password */}
          <input
            type="text"
            className="form-control"
            placeholder="Phone Number"
            onChange={(e) =>
              setLoginData({ ...loginData, phone: e.target.value })
            }
            required
          />
          <input
            type="password"
            className="form-control mt-2"
            placeholder="Password"
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
            required
          />
          <button className="btn btn-primary mt-2" onClick={handleLogin}>
            Đăng nhập
          </button>
        </div>
      ) : (
        <div>
          <h1>Đăng ký</h1>
          <input
            type="text"
            className="form-control"
            placeholder="Username"
            onChange={(e) =>
              setRegisterData({ ...registerData, username: e.target.value })
            }
            required
          />
          <input
            type="text"
            className="form-control mt-2"
            placeholder="Phone Number"
            onChange={(e) =>
              setRegisterData({ ...registerData, phone: e.target.value })
            }
            required
          />
          <input
            type="password"
            className="form-control mt-2"
            placeholder="Password"
            onChange={(e) =>
              setRegisterData({ ...registerData, password: e.target.value })
            }
            required
          />
          <input
            type="password"
            className="form-control mt-2"
            placeholder="Nhập lại Password"
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                confirmPassword: e.target.value,
              })
            }
            required
          />
          <input
            type="text"
            className="form-control mt-2"
            placeholder="Nhập họ và tên"
            onChange={(e) =>
              setRegisterData({ ...registerData, fullname: e.target.value })
            }
            required
          />
          <button className="btn btn-success mt-2" onClick={handleRegister}>
            Đăng ký
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginRegister;
