// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DefaultLayout from "@/layouts/DafaultLayout/DefaultLayout";
import { publicRoutes } from "@/routes/routes";
import Chat from "@/pages/Chat/Chat";
import "./App.css";
import "./assets/css/style.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ToastContainer } from 'react-toastify';

// PrivateRoute component to handle authentication
const PrivateRoute = ({ children }) => {
  const username = localStorage.getItem("username");
  
  if (!username) {
    // Redirect them to the /login page
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we're on /chat without authentication
    const path = window.location.pathname;
    const username = localStorage.getItem("username");
    
    if (path === "/chat" && !username) {
      window.location.href = "/login";
      return;
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) return null;

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirect mặc định */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Route công khai */}
          {publicRoutes.map((route, index) => {
            const Page = route.component;
            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <DefaultLayout>
                    <Page />
                  </DefaultLayout>
                }
              />
            );
          })}

          {/* Route riêng - phải login mới vào được */}
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <DefaultLayout>
                  <Chat />
                </DefaultLayout>
              </PrivateRoute>
            }
          />

          {/* Route không tồn tại */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>

        {/* Toast hiển thị thông báo */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;