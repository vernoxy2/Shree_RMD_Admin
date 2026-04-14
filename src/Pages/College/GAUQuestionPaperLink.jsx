import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { FiExternalLink, FiEdit2, FiTrash2, FiLink, FiX, FiAlertTriangle, FiCheckCircle, FiInfo } from "react-icons/fi";

const GAUQuestionPaperLink = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", url: "", year: new Date().getFullYear().toString() });
  const [saving, setSaving] = useState(false);

  const [dialog, setDialog] = useState({
    show: false,
    title: "",
    message: "",
    type: "confirm",
    onConfirm: null,
  });

  const colRef = collection(db, "cllg_gau_question_papers");

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
      
      const sortedData = data.sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        if (yearB !== yearA) return yearB - yearA;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });

      setRecords(sortedData);
    } catch (error) {
      console.error("Error fetching records:", error);
      showAlert("Failed to load links. Please try again.", "error");
    }
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const resetForm = () => {
    setForm({ title: "", url: "", year: new Date().getFullYear().toString() });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.url || !form.year) return showAlert("All fields are required.", "warning");
    setSaving(true);

    try {
      if (editId) {
        await updateDoc(doc(db, "cllg_gau_question_papers", editId), {
          title: form.title,
          url: form.url,
          year: form.year,
        });
        showAlert("Link updated successfully!");
      } else {
        await addDoc(colRef, {
          title: form.title,
          url: form.url,
          year: form.year,
          createdAt: serverTimestamp(),
        });
        showAlert("New link added successfully!");
      }
      resetForm();
      fetchRecords();
    } catch (err) {
      showAlert(`Error: ${err.message}`, "error");
    }
    setSaving(false);
  };

  const handleEdit = (rec) => {
    setForm({ title: rec.title, url: rec.url, year: rec.year || new Date().getFullYear().toString() });
    setEditId(rec.id);
    setShowForm(true);
  };

  const handleDelete = async (rec) => {
    showConfirm(
      `Are you sure you want to delete the link for "${rec.title}"?`,
      async () => {
        try {
          await deleteDoc(doc(db, "cllg_gau_question_papers", rec.id));
          showAlert("Record deleted successfully.", "success");
          fetchRecords();
        } catch (error) {
          showAlert("Error deleting: " + error.message, "error");
        }
      },
      "Confirm Deletion"
    );
  };

  const groupedRecords = records.reduce((acc, rec) => {
    const year = rec.year || "Unknown";
    if (!acc[year]) acc[year] = [];
    acc[year].push(rec);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedRecords).sort((a, b) => b - a);

  const getHostname = (url) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return "External Link";
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">GAU Question Paper Links</h1>
          <p className="text-sm text-gray-500 mt-1">Manage external links to university question papers</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#7B1C2E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#6a1727] transition shadow-lg shadow-rose-900/20 flex items-center gap-2"
        >
          <FiLink size={16} />
          <span>Add Paper Link</span>
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editId ? "Edit Paper Link" : "Add New Paper Link"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Paper Title *</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C2E] bg-gray-50/50"
                    placeholder="e.g. BAMS March 2026 Anatomy Paper I"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">External URL *</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C2E] bg-gray-50/50"
                    placeholder="https://gau.ac.in/papers/..."
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Year *</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C2E] bg-gray-50/50"
                    placeholder="e.g. 2026"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  />
                </div>
              </div>
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
                disabled={saving}
                className="bg-[#7B1C2E] text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-[#6a1727] transition disabled:opacity-50 shadow-lg shadow-rose-900/10"
              >
                {saving ? "Saving..." : editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-gray-100 border-t-[#7B1C2E] animate-spin"></div>
          <span className="text-sm font-medium text-gray-400">Loading links...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full w-fit mx-auto mb-4 shadow-sm">
             <FiLink size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No links found. Start by adding one.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedYears.map((year) => (
            <div key={year} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-gray-900 mb-4 ml-1">{year}</h2>
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-200/50">
                <div className="bg-[#7B1C2E] text-white px-6 py-4 grid grid-cols-[60px_1fr_120px] sm:grid-cols-[80px_1fr_200px] items-center font-bold text-sm tracking-wide">
                  <span>Sr.</span>
                  <span>Description</span>
                  <span className="text-right sm:text-center">Action</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupedRecords[year].map((rec, idx) => (
                    <div
                      key={rec.id}
                      className="px-6 py-5 grid grid-cols-[60px_1fr_120px] sm:grid-cols-[80px_1fr_200px] items-center hover:bg-rose-50/30 transition-colors group"
                    >
                      <div className="flex items-center">
                        <span className="w-8 h-8 rounded-full bg-rose-50 text-[#7B1C2E] flex items-center justify-center text-xs font-black">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <div className="hidden sm:flex bg-gray-50 p-2 rounded-lg text-gray-400 group-hover:bg-white group-hover:text-[#7B1C2E] transition-colors">
                           <FiLink size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                            {rec.title}
                          </span>
                          <span className="text-[10px] font-bold text-[#7B1C2E] uppercase tracking-tighter mt-1 truncate">
                            {getHostname(rec.url)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end sm:justify-center gap-2">
                        {rec.url && (
                          <a
                            href={rec.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-[#7B1C2E] text-white hover:bg-[#6a1727] transition shadow-lg shadow-rose-900/10 active:scale-95"
                          >
                            <FiExternalLink size={14} />
                            <span className="hidden sm:inline">Open Link</span>
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
                  <button onClick={closeDialog} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition">Cancel</button>
                  <button onClick={() => { dialog.onConfirm(); closeDialog(); }} className="bg-[#7B1C2E] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#6a1727] transition shadow-lg shadow-rose-900/10">Confirm</button>
                </>
              ) : (
                <button onClick={closeDialog} className="bg-gray-900 text-white px-8 py-2 rounded-xl text-sm font-bold hover:bg-black transition shadow-lg">Dismiss</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GAUQuestionPaperLink;