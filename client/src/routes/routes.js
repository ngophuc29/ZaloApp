// src/routes/routes.jsx
import Home from "@/pages/Home/Home";
import Login from "../pages/authentication/login";
import Signup from "@/pages/Signup/Signup";
import Register from "../pages/authentication/Register";
import Register2 from "../pages/authentication/Register2";
import ForgotPassword from "../pages/authentication/ForgotPassword";
import VerifyOtp from "../pages/authentication/VerifyOtp";
import ResetPassword from "../pages/authentication/ResetPassword";

const publicRoutes = [
  { path: "/login", component: Login },
  { path: "/signup", component: Signup },
  { path: "/register", component: Register },
  { path: "/register2", component: Register2 },
  { path: "/forgot-password", component: ForgotPassword },
  { path: "/verify-otp", component: VerifyOtp },
  { path: "/reset-password", component: ResetPassword },
];

export { publicRoutes };
