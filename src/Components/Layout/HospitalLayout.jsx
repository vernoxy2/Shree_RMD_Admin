import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { MdDashboard, MdLogout, MdLocalHospital, MdMenu, MdClose } from "react-icons/md";

const hospitalNavItems = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", path: "/hospital-dashboard", icon: <MdDashboard size={18} />, end: true },
    ],
  },
];

const HospitalLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/admin-login");
  };

  const SidebarContent = ({ onNavClick }) => (
    <>
      <div className="px-4 py-5 border-b border-white/10">
        {collapsed ? (
          <div className="flex justify-center"><MdLocalHospital size={22} /></div>
        ) : (
          <div>
            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Admin Panel</p>
            <h1 className="text-sm font-bold leading-tight">RMD Ayurveda Hospital</h1>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {hospitalNavItems.map((group) => (
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
                onClick={onNavClick}
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

      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <MdLogout size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F0F4F8] font-sans">

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } hidden md:flex bg-[#1A3C5E] text-white flex-col transition-all duration-300 ease-in-out relative shrink-0`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-[#1A3C5E] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md z-10 text-xs"
        >
          {collapsed ? "›" : "‹"}
        </button>
        <SidebarContent onNavClick={() => {}} />
      </aside>

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1A3C5E] text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <MdClose size={22} />
        </button>
        <SidebarContent onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              <MdMenu size={24} />
            </button>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-gray-800">Hospital Admin Dashboard</h2>
              <p className="text-xs text-gray-400 hidden sm:block">RMD Ayurveda College & Hospital</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center text-sm font-bold shrink-0">
              H
            </div>
            <span className="text-sm text-gray-600 hidden sm:block">Hospital Admin</span>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default HospitalLayout;