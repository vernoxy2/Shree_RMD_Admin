import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";
import CollegeLayout from "./Components/Layout/CollegeLayout";
import HospitalLayout from "./Components/Layout/HospitalLayout";

const Login = lazy(() => import("./Pages/Authentication/Login"));
const CollegeDashboard = lazy(() => import("./Pages/Dashboard/CollegeDashboard"));
const HospitalDashboard = lazy(() => import("./Pages/Dashboard/HospitalDashboard"));
const HospitalAttendance = lazy(() => import("./Pages/Hospital/HospitalAttendance"));
const OutreachProgram = lazy(() => import("./Pages/Hospital/OutreachProgram"));
const HospitalStaffManagement = lazy(() => import("./Pages/Hospital/HospitalStaffManagement"));
const AdmissionUpdate = lazy(() => import("./Pages/College/AdmissionUpdate"));
const UniversityExamination = lazy(() => import("./Pages/College/UniversityExamination"));
const UniversityResults = lazy(() => import("./Pages/College/UniversityResults"));
const AcademicCalendar = lazy(() => import("./Pages/College/AcademicCalendar"));
const BAMSLecturesTimetable = lazy(() => import("./Pages/College/BAMSLecturesTimetable"));
const SyllabusDetail = lazy(() => import("./Pages/College/SyllabusDetail"));
const GAUQuestionPaperLink = lazy(() => import("./Pages/College/GAUQuestionPaperLink"));
const ForthComingTheoryExamination = lazy(() => import("./Pages/College/ForthComingTheoryExamination"));
const ForthComingPracticalExamination = lazy(() => import("./Pages/College/ForthComingPracticalExamination"));
const StudentDetail = lazy(() => import("./Pages/College/Student/StudentDetail"));
const Activities = lazy(() => import("./Pages/College/Student/Activities"));
const StudentAttendance = lazy(() => import("./Pages/College/Attendance/StudentAttendance"));
const StaffAttendance = lazy(() => import("./Pages/College/Attendance/StaffAttendance"));
const StaffDetails = lazy(() => import("./Pages/College/Faculty/StaffDetails"));
const FeeStructure = lazy(() => import("./Pages/College/Faculty/FeeStructure"));
const ResearchWork = lazy(() => import("./Pages/College/Faculty/ResearchWork"));
const GalleryManagement = lazy(() => import("./Pages/College/GalleryManagement"));
const Gallery = lazy(() => import("./Pages/Gallery/Gallery"));
const PublicHospitalStaff = lazy(() => import("./Pages/Hospital/PublicHospitalStaff"));

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
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/gallery/:category" element={<Gallery />} />
        <Route path="/ayurved-hospital/hospital-staff" element={<PublicHospitalStaff />} />

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
          <Route path="university-examination" element={<UniversityExamination />} />
          <Route path="university-results" element={<UniversityResults />} />
          <Route path="academic-calendar" element={<AcademicCalendar />} />
          <Route path="bams-lectures-timetable" element={<BAMSLecturesTimetable />} />
          <Route path="syllabus-detail" element={<SyllabusDetail />} />
          <Route path="gau-question-paper" element={<GAUQuestionPaperLink />} />
          <Route path="forth-coming-theory" element={<ForthComingTheoryExamination />} />
          <Route path="forth-coming-practical" element={<ForthComingPracticalExamination />} />
          <Route path="student-detail" element={<StudentDetail />} />
          <Route path="activities" element={<Activities />} />
          <Route path="student-attendance" element={<StudentAttendance />} />
          <Route path="staff-attendance" element={<StaffAttendance />} />
          <Route path="staff-details" element={<StaffDetails />} />
          <Route path="fee-structure" element={<FeeStructure />} />
          <Route path="research-work" element={<ResearchWork />} />
          <Route path="gallery" element={<GalleryManagement />} />
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
          <Route path="hospital-attendance" element={<HospitalAttendance />} />
          <Route path="outreach-program" element={<OutreachProgram />} />
          <Route path="hospital-staff" element={<HospitalStaffManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin-login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;