import Home from "@/pages/Home/Home";
import Login from "../pages/authentication/login";
import Signup from "@/pages/Signup/Signup";
// import Login from './pages/login';
import Register from '../pages/authentication/Register';
import Register2 from '../pages/authentication/Register2'
import ForgotPassword from '../pages/authentication/ForgotPassword';
import VerifyOtp from '../pages/authentication/VerifyOtp';
import ResetPassword from '../pages/authentication/ResetPassword';
import Chat from "../pages/Chat/Chat";
const publicRoutes = [
  // { path: "/home", component: Home },
  { path: "/login", component: Login },
  { path: "/signup", component: Signup },
  { path: "/chat", component: Chat },
  { path: "/register", component: Register },
  { path: "/register2", component: Register2 },
  { path: "/forgot-password", component: ForgotPassword },
  { path: "/verify-otp", component: VerifyOtp },
  { path: "/reset-password", component: ResetPassword },
   
  
];

// Đăng nhập mới xem được (Login)
const privateRoutes = [];

export { publicRoutes, privateRoutes };
