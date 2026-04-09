import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";
import CollegeLayout from "./Components/Layout/CollegeLayout";
import HospitalLayout from "./Components/Layout/HospitalLayout";

const Login = lazy(() => import("./Pages/Authentication/Login"));
const CollegeDashboard = lazy(() => import("./Pages/Dashboard/CollegeDashboard"));
const HospitalDashboard = lazy(() => import("./Pages/Dashboard/HospitalDashboard"));
const AdmissionUpdate = lazy(() => import("./Pages/College/AdmissionUpdate"));

const Loader = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-[#7B1C2E] animate-spin"></div>
  </div>
);

const App = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/admin-login" replace />} />
        <Route path="/admin-login" element={<Login />} />

        {/* College Admin - with sidebar layout */}
        <Route
          path="/college-dashboard"
          element={
            <ProtectedRoute allowedRole="college admin">
              <CollegeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CollegeDashboard />} />
          <Route path="admission-update" element={<AdmissionUpdate />} />
        </Route>

        {/* Hospital Admin - with sidebar layout */}
        <Route
          path="/hospital-dashboard"
          element={
            <ProtectedRoute allowedRole="hospital admin">
              <HospitalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HospitalDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin-login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;