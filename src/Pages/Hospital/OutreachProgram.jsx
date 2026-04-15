import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { supabase } from "../../../supabase";
import { FiUpload, FiEdit2, FiTrash2, FiEye, FiX, FiFileText, FiAlertTriangle, FiCheckCircle, FiInfo } from "react-icons/fi";

const OutreachProgram = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ 
    title: "", 
    category: "Health & Speciality Camps",
    year: new Date().getFullYear().toString()
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Custom Dialog State
  const [dialog, setDialog] = useState({
    show: false,
    title: "",
    message: "",
    type: "confirm", // 'confirm', 'success', 'error', 'warning'
    onConfirm: null,
  });

  const colRef = collection(db, "hosp_outreach_programs");
  const BUCKET_NAME = "outreach-files";

  const categories = [
    "Health & Speciality Camps",
    "Awareness Programmes",
    "Yoga & Wellness",
    "Medicine & Kit Distribution",
    "Guest Lectures",
    "Cultural & Celebration Events",
    "Other Programmes"
  ];

  const showAlert = (message, type = "success", title = "") => {
    setDialog({
      show: true,
      message,
      title: title || (type === "success" ? "Success" : type === "error" ? "Error" : "Notice"),
      type,
      onConfirm: null,
    });
  };

  const showConfirm = (message, onConfirm, title = "Are you sure?") => {
    setDialog({
      show: true,
      message,
      title,
      type: "confirm",
      onConfirm,
    });
  };

  const closeDialog = () => setDialog({ ...dialog, show: false });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const q = query(colRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecords(data);
    } catch (error) {
      console.error("Error fetching records:", error);
      showAlert("Failed to load records. Please try again.", "error");
    }
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const resetForm = () => {
    setForm({ 
      title: "", 
      category: "Health & Speciality Camps",
      year: new Date().getFullYear().toString()
    });
    setFile(null);
    setEditId(null);
    setShowForm(false);
  };

  const uploadToSupabase = async (file) => {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, path: fileName };
  };

  const handleSubmit = async () => {
    if (!form.title) return showAlert("Activity Title is required.", "warning");
    if (!form.category) return showAlert("Category is required.", "warning");
    if (!editId && !file) return showAlert("Please select a report file to upload.", "warning");
    setSaving(true);

    try {
      if (editId) {
        const updateData = { 
          title: form.title,
          category: form.category,
          year: form.year
        };
        if (file) {
          setUploading(true);
          const { url, path } = await uploadToSupabase(file);
          setUploading(false);
          updateData.fileUrl = url;
          updateData.filePath = path;
          updateData.fileName = file.name;
        }
        await updateDoc(doc(db, "hosp_outreach_programs", editId), updateData);
        showAlert("Outreach program updated successfully!");
      } else {
        setUploading(true);
        const { url, path } = await uploadToSupabase(file);
        setUploading(false);
        await addDoc(colRef, {
          title: form.title,
          category: form.category,
          year: form.year,
          fileUrl: url,
          filePath: path,
          fileName: file.name,
          createdAt: serverTimestamp(),
        });
        showAlert("New outreach program added successfully!");
      }
      resetForm();
      fetchRecords();
    } catch (err) {
      showAlert(`Error: ${err.message}`, "error");
    }
    setSaving(false);
  };

  const handleEdit = (rec) => {
    setForm({ 
      title: rec.title,
      category: rec.category,
      year: rec.year || new Date().getFullYear().toString()
    });
    setEditId(rec.id);
    setShowForm(true);
  };

  const handleDelete = async (rec) => {
    showConfirm(
      `Are you sure you want to delete "${rec.title}"? This action cannot be undone.`,
      async () => {
        try {
          if (rec.filePath) {
            await supabase.storage.from(BUCKET_NAME).remove([rec.filePath]);
          }
          await deleteDoc(doc(db, "hosp_outreach_programs", rec.id));
          showAlert("Record deleted successfully.", "success");
          fetchRecords();
        } catch (error) {
          showAlert("Error deleting: " + error.message, "error");
        }
      },
      "Confirm Deletion"
    );
  };

  // Group records by category
  const groupedRecords = records.reduce((acc, rec) => {
    const cat = rec.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(rec);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A3C5E]">Outreach Programs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage hospital outreach camps, awareness and wellness programs</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#1A3C5E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#142e4a] transition shadow-lg shadow-blue-900/20 flex items-center gap-2"
        >
          <FiUpload size={16} />
          <span>Add Program</span>
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editId ? "Edit Program" : "Add New Program"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Activity Category *</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C5E] bg-gray-50/50 appearance-none"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Activity Title *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C5E] bg-gray-50/50"
                  placeholder="e.g. International Yoga Day"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Year</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C5E] bg-gray-50/50"
                  placeholder="e.g. 2026"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">
                  Upload Report / Photo {editId ? "(optional)" : "*"}
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#1A3C5E] hover:bg-blue-50/30 transition-all group">
                  <div className="bg-gray-100 p-3 rounded-full mb-2 group-hover:bg-blue-100 transition-colors">
                    <FiUpload size={24} className="text-gray-400 group-hover:text-[#1A3C5E]" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 text-center px-4">
                    {file ? file.name : "Drop report file here or click to browse"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              </div>

              {uploading && (
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <span>Uploading...</span>
                    <span>Please wait</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#1A3C5E] h-full rounded-full animate-[progress_2s_ease-in-out_infinite] w-1/2"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={resetForm}
                className="px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || uploading}
                className="bg-[#1A3C5E] text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-[#142e4a] transition disabled:opacity-50 shadow-lg shadow-blue-900/10"
              >
                {saving ? "Saving..." : editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records grouped by Category */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-gray-100 border-t-[#1A3C5E] animate-spin"></div>
          <span className="text-sm font-medium text-gray-400">Loading programs...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full w-fit mx-auto mb-4 shadow-sm">
             <FiUpload size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No outreach programs found. Start by adding one.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {categories.map((cat) => groupedRecords[cat] && (
            <div key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4 ml-1">
                <h2 className="text-xl font-black text-[#1A3C5E]">{cat}</h2>
                <span className="bg-blue-50 text-[#1A3C5E] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                  {groupedRecords[cat].length} Activities
                </span>
              </div>
              
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-200/50">
                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {groupedRecords[cat].map((rec, idx) => (
                    <div
                      key={rec.id}
                      className="px-6 py-4 grid grid-cols-[50px_1fr_120px] sm:grid-cols-[60px_1fr_200px] items-center hover:bg-blue-50/30 transition-colors group"
                    >
                      <div className="flex items-center">
                        <span className="w-7 h-7 rounded-full bg-blue-50 text-[#1A3C5E] flex items-center justify-center text-xs font-black">
                          {idx + 1}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <div className="hidden sm:flex bg-gray-50 p-2 rounded-lg text-gray-400 group-hover:bg-white group-hover:text-[#1A3C5E] transition-colors">
                           <FiFileText size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-gray-800 line-clamp-1 leading-snug">
                            {rec.title}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1 truncate">
                             {rec.year || "Outreach"} Activity
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:justify-center gap-2">
                        {rec.fileUrl && (
                          <a
                            href={rec.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-[#1A3C5E] text-white hover:bg-[#142e4a] transition shadow-lg shadow-blue-900/10 active:scale-95"
                          >
                            <FiEye size={14} />
                            <span className="hidden sm:inline">View</span>
                          </a>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(rec)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(rec)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Custom Dialog */}
      {dialog.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-[340px] border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              dialog.type === 'confirm' ? 'bg-amber-50 text-amber-500' :
              dialog.type === 'error' ? 'bg-red-50 text-red-500' :
              dialog.type === 'warning' ? 'bg-orange-50 text-orange-500' :
              'bg-emerald-50 text-emerald-500'
            }`}>
              {dialog.type === 'confirm' && <FiAlertTriangle size={24} />}
              {dialog.type === 'error' && <FiX size={24} />}
              {dialog.type === 'warning' && <FiInfo size={24} />}
              {dialog.type === 'success' && <FiCheckCircle size={24} />}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">{dialog.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{dialog.message}</p>
            
            <div className="flex gap-3 justify-center">
              {dialog.type === 'confirm' ? (
                <>
                  <button
                    onClick={closeDialog}
                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { dialog.onConfirm(); closeDialog(); }}
                    className="bg-[#1A3C5E] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#142e4a] transition shadow-lg shadow-blue-900/10"
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={closeDialog}
                  className="bg-gray-900 text-white px-8 py-2 rounded-xl text-sm font-bold hover:bg-black transition shadow-lg"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default OutreachProgram;
