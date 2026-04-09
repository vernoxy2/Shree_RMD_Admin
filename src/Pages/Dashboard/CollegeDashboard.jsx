import { FaUserGraduate, FaCalendarAlt, FaUniversity } from "react-icons/fa";

const cards = [
  { label: "Total Students", value: "—", icon: <FaUserGraduate size={18} />, color: "bg-rose-50 text-rose-700" },
  { label: "Active Sessions", value: "1", icon: <FaCalendarAlt size={18} />, color: "bg-amber-50 text-amber-700" },
  { label: "Departments", value: "—", icon: <FaUniversity size={18} />, color: "bg-emerald-50 text-emerald-700" },
];

const CollegeDashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome, College Admin</h1>
      <p className="text-gray-400 text-sm mb-8">Manage college data from the sidebar.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollegeDashboard;