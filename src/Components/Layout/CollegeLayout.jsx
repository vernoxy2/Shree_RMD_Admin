import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { MdDashboard, MdLogout, MdMenu, MdClose } from "react-icons/md";
import { FaFileAlt } from "react-icons/fa";
import NavbarLogo from "../../assets/NavbarLogo.svg";

const collegeNavItems = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", path: "/college-dashboard", icon: <MdDashboard size={18} />, end: true },
    ],
  },
  {
    section: "Academics",
    items: [
      { label: "Admission Update", path: "/college-dashboard/admission-update", icon: <FaFileAlt size={16} /> },
    ],
  },
  {
    section: "UNIVERSITY EXAMINATION",
    items: [
      { label: "University Examination Timetable", path: "/college-dashboard/university-examination", icon: <FaFileAlt size={16} /> },
      { label: "University Results", path: "/college-dashboard/university-results", icon: <FaFileAlt size={16} /> },
      { label: "Academic Calendar", path: "/college-dashboard/academic-calendar", icon: <FaFileAlt size={16} /> },
      { label: "BAMS Lectures Timetable", path: "/college-dashboard/bams-lectures-timetable", icon: <FaFileAlt size={16} /> },
      { label: "Syllabus Detail", path: "/college-dashboard/syllabus-detail", icon: <FaFileAlt size={16} /> },
      { label: "GAU Question Paper Link", path: "/college-dashboard/gau-question-paper", icon: <FaFileAlt size={16} /> },
      { label: "Forth Coming Theory Exam", path: "/college-dashboard/forth-coming-theory", icon: <FaFileAlt size={16} /> },
      { label: "Forth Coming Practical Exam", path: "/college-dashboard/forth-coming-practical", icon: <FaFileAlt size={16} /> },
    ],
  },
  {
    section: "STUDENTS",
    items: [
      { label: "Student Detail", path: "/college-dashboard/student-detail", icon: <FaFileAlt size={16} /> },
      { label: "Activities", path: "/college-dashboard/activities", icon: <FaFileAlt size={16} /> },
    ],
  },
  {
    section: "ATTENDANCE",
    items: [
      { label: "Student Attendance", path: "/college-dashboard/student-attendance", icon: <FaFileAlt size={16} /> },
      { label: "Staff Attendance", path: "/college-dashboard/staff-attendance", icon: <FaFileAlt size={16} /> },
    ],
  },
  {
    section: "FACULTY",
    items: [
      { label: "Staff Details", path: "/college-dashboard/staff-details", icon: <FaFileAlt size={16} /> },
      { label: "Fee Structure", path: "/college-dashboard/fee-structure", icon: <FaFileAlt size={16} /> },
      { label: "Research Work and Publication", path: "/college-dashboard/research-work", icon: <FaFileAlt size={16} /> },
    ],
  },
  {
    section: "MEDIA",
    items: [
      { label: "Gallery", path: "/college-dashboard/gallery", icon: <FaFileAlt size={16} /> },
    ],
  },
];

const CollegeLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/admin-login");
  };

  const SidebarContent = ({ onNavClick }) => (
    <>
      {/* Logo + Title */}
      <div className="px-4 py-4 border-b border-primary/10">
        {collapsed ? (
          <div className="flex justify-center">
            <img src={NavbarLogo} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <img src={NavbarLogo} alt="Logo" className="w-10 h-10 object-contain shrink-0" />
            <div>
              <p className="text-xs text-primary/60 uppercase tracking-widest leading-tight">Admin Panel</p>
              <h1 className="text-sm font-bold leading-tight text-primary">RMD Ayurveda College</h1>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {collegeNavItems.map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-primary/50 px-2 mb-1">
                {group.section}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-primary/70 hover:bg-primary/10 hover:text-primary"
                  }`
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-primary/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-primary/70 hover:bg-primary/10 hover:text-primary transition-all"
        >
          <MdLogout size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-Bg font-sans">

      {/* ── Desktop Sidebar — static, always visible ── */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } hidden md:flex bg-Bg flex-col transition-all duration-300 ease-in-out shrink-0 border-r border-primary/10`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-Bg text-primary rounded-full w-6 h-6 flex items-center justify-center shadow-md z-10 text-xs border border-primary/20"
        >
          {collapsed ? "›" : "‹"}
        </button>
        <SidebarContent onNavClick={() => {}} />
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer — slides in from left ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-Bg flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden border-r border-primary/10 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-primary/70 hover:text-primary"
        >
          <MdClose size={22} />
        </button>
        <SidebarContent onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-secondary hover:text-primary"
            >
              <MdMenu size={24} />
            </button>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-gray-800">College Admin Dashboard</h2>
              <p className="text-xs text-secondary hidden sm:block">RMD Ayurveda College & Hospital</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
              C
            </div>
            <span className="text-sm text-secondary hidden sm:block">College Admin</span>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CollegeLayout;