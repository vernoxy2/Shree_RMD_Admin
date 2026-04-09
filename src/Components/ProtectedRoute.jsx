import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRole }) => {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/admin-login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default ProtectedRoute;