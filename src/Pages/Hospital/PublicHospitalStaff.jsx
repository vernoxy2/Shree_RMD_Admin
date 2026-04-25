import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import PrimaryHeader from "../../Components/Ui/PrimaryHeader";
import HospitalBg from "../../assets/hero.png"; 
import { FiUser } from "react-icons/fi";

const PublicHospitalStaff = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      const q = query(collection(db, "hosp_staff"), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecords(data);
    } catch (error) {
      console.error("Error fetching hospital staff:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Grouping logic: Zone -> Designation -> List of Staff
  const groupedData = records.reduce((acc, curr) => {
    const zone = curr.zone || "Other";
    const designation = curr.designation || "Staff";
    
    if (!acc[zone]) acc[zone] = {};
    if (!acc[zone][designation]) acc[zone][designation] = [];
    
    acc[zone][designation].push(curr);
    return acc;
  }, {});

  const sortedZones = Object.keys(groupedData).sort();

  return (
    <div className="bg-gray-50 min-h-screen">
      <PrimaryHeader 
        HeadLine="Hospital Staff" 
        BgImg={HospitalBg} 
        BgPos="bg-center" 
      />

      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-gray-100 border-t-[#1A3C5E] animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading staff information...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <FiUser size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-xl">No staff records available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {sortedZones.map((zone) => (
              <div key={zone} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-black text-[#1A3C5E] uppercase tracking-tight relative inline-block">
                    {zone}
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#1A3C5E]/20 rounded-full"></div>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Object.keys(groupedData[zone]).map((designation) => (
                    <div key={designation} className="space-y-6">
                      <div className="bg-[#1A3C5E] text-white py-3 px-6 rounded-2xl shadow-lg shadow-blue-900/10">
                        <h3 className="text-lg font-bold text-center uppercase tracking-wider">
                          {designation}
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {groupedData[zone][designation].map((staff) => (
                          <div 
                            key={staff.id} 
                            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow group"
                          >
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-gray-50 border border-gray-100 flex items-center justify-center">
                              {staff.imageUrl ? (
                                <img 
                                  src={staff.imageUrl} 
                                  alt={staff.name} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                />
                              ) : (
                                <FiUser size={24} className="text-gray-300" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-[#1A3C5E] transition-colors">
                                {staff.name}
                              </h4>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {staff.designation}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Visual Accents */}
      <style>{`
        .container {
          position: relative;
          z-index: 1;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PublicHospitalStaff;
