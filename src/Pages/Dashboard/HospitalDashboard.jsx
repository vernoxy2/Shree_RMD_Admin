import { MdLocalHospital } from "react-icons/md";
import { FaBed, FaUserMd } from "react-icons/fa";

const cards = [
  { label: "OPD Today", value: "—", icon: <MdLocalHospital size={20} />, color: "bg-blue-50 text-blue-700" },
  { label: "IPD Patients", value: "—", icon: <FaBed size={18} />, color: "bg-indigo-50 text-indigo-700" },
  { label: "Staff Present", value: "—", icon: <FaUserMd size={18} />, color: "bg-teal-50 text-teal-700" },
];

const HospitalDashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome, Hospital Admin</h1>
      <p className="text-gray-400 text-sm mb-8">Manage hospital data from the sidebar.</p>

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

export default HospitalDashboard;