import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { MdDashboard, MdLogout } from "react-icons/md";
import { FaFileAlt } from "react-icons/fa";

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
];

const CollegeLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/admin-login");
  };

  return (
    <div className="flex min-h-screen bg-[#F8F4F0] font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } bg-[#7B1C2E] text-white flex flex-col transition-all duration-300 ease-in-out relative`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-[#7B1C2E] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md z-10 text-xs"
        >
          {collapsed ? "›" : "‹"}
        </button>

        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          {collapsed ? (
            <div className="flex justify-center">
              <MdDashboard size={22} />
            </div>
          ) : (
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Admin Panel</p>
              <h1 className="text-sm font-bold leading-tight">RMD Ayurveda College</h1>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {collegeNavItems.map((group) => (
            <div key={group.section}>
              {!collapsed && (
                <p className="text-[10px] uppercase tracking-widest text-white/40 px-2 mb-1">
                  {group.section}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-white/20 text-white font-semibold"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
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
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <MdLogout size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-800">College Admin Dashboard</h2>
            <p className="text-xs text-gray-400">RMD Ayurveda College & Hospital</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#7B1C2E] text-white flex items-center justify-center text-sm font-bold">
              C
            </div>
            <span className="text-sm text-gray-600">College Admin</span>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CollegeLayout;