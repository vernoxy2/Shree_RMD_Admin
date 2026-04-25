import { useState, useEffect } from "react";
import { db } from "../../../../firebase";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { supabase } from "../../../../supabase";
import { FiUpload, FiEdit2, FiTrash2, FiEye, FiX, FiFileText, FiAlertTriangle, FiCheckCircle, FiInfo } from "react-icons/fi";

const ResearchWork = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    yearRange: "",
    details: ""
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dialog, setDialog] = useState({
    show: false,
    title: "",
    message: "",
    type: "confirm",
    onConfirm: null,
  });

  const colRef = collection(db, "cllg_research_work");
  const BUCKET_NAME = "Research-Work-and-Publication-files";

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

  const closeDialog = () => setDialog((prev) => ({ ...prev, show: false }));

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const resetForm = () => {
    setForm({ yearRange: "", details: "" });
    setFile(null);
    setEditId(null);
    setShowForm(false);
    setUploading(false);
    setSaving(false);
  };

  // FIX: renamed parameter from 'file' to 'fileToUpload' to avoid shadowing warning
  const uploadToSupabase = async (fileToUpload) => {
    try {
      const fileName = `${Date.now()}_${fileToUpload.name.replace(/\s+/g, "_")}`;
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileToUpload, { cacheControl: "3600", upsert: false });

      if (error) throw new Error(error.message);

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return { url: urlData.publicUrl, path: fileName };
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!form.yearRange) return showAlert("Year Range is required (e.g. 2018-2023).", "warning");
    if (!form.details) return showAlert("Details of Months/Name is required.", "warning");
    if (!editId && !file) return showAlert("Please select a PDF file to upload.", "warning");

    setSaving(true);
    try {
      let fileData = null;
      if (file) {
        setUploading(true);
        fileData = await uploadToSupabase(file); // passing state variable 'file'
        setUploading(false);
      }

      if (editId) {
        const updateData = {
          yearRange: form.yearRange,
          details: form.details
        };
        if (fileData) {
          updateData.fileUrl = fileData.url;
          updateData.filePath = fileData.path;
          updateData.fileName = file.name;
        }
        await updateDoc(doc(db, "cllg_research_work", editId), updateData);
        showAlert("Record updated successfully!");
      } else {
        await addDoc(colRef, {
          yearRange: form.yearRange,
          details: form.details,
          fileUrl: fileData.url,
          filePath: fileData.path,
          fileName: file.name,
          createdAt: serverTimestamp(),
        });
        showAlert("New record added successfully!");
      }
      resetForm();
      fetchRecords();
    } catch (err) {
      console.error("Upload error:", err);
      showAlert(`Error: ${err.message}`, "error");
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const handleEdit = (rec) => {
    if (rec.isStatic) return;
    setForm({
      yearRange: rec.yearRange || "",
      details: rec.details || ""
    });
    setEditId(rec.id);
    setShowForm(true);
  };

  const handleDelete = async (rec) => {
    if (rec.isStatic) return;
    showConfirm(
      `Are you sure you want to delete this record? This action cannot be undone.`,
      async () => {
        try {
          if (rec.filePath) {
            await supabase.storage.from(BUCKET_NAME).remove([rec.filePath]);
          }
          await deleteDoc(doc(db, "cllg_research_work", rec.id));
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
    const range = rec.yearRange || "Unknown Range";
    if (!acc[range]) acc[range] = [];
    acc[range].push(rec);
    return acc;
  }, {});

  const sortedRanges = Object.keys(groupedRecords).sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true })
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Research Work and Publication</h1>
          <p className="text-sm text-gray-500 mt-1">Manage public site research publications by year range</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#7B1C2E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#6a1727] transition shadow-lg shadow-rose-900/20 flex items-center gap-2"
        >
          <FiUpload size={16} />
          <span>Add Publication</span>
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editId ? "Edit Publication" : "Add New Publication"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">
                  Research Work and Publication Year *
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C2E] bg-gray-50/50"
                  placeholder="e.g. 2018-2023"
                  value={form.yearRange}
                  onChange={(e) => setForm({ ...form, yearRange: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">
                  Details of Months (Name/Description) *
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C2E] bg-gray-50/50 min-h-[100px]"
                  placeholder="Enter details of months or research title..."
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">
                  Upload PDF (Know More) {editId ? "(optional)" : "*"}
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#7B1C2E] hover:bg-rose-50/30 transition-all group">
                  <div className="bg-gray-100 p-3 rounded-full mb-2 group-hover:bg-rose-100 transition-colors">
                    <FiUpload size={24} className="text-gray-400 group-hover:text-[#7B1C2E]" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 text-center px-4">
                    {file ? file.name : "Drop PDF here or click to browse"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              </div>

              {uploading && (
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <span>Uploading PDF...</span>
                    <span>Please wait</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#7B1C2E] h-full rounded-full animate-[progress_2s_ease-in-out_infinite] w-1/2"></div>
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
          <span className="text-sm font-medium text-gray-400">Loading publications...</span>
        </div>
      ) : sortedRanges.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full w-fit mx-auto mb-4 shadow-sm">
            <FiUpload size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No publications found. Add your first research work.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {sortedRanges.map((range) => (
            <div key={range} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-gray-900 mb-4 ml-1">
                Research Work and Publication – {range}
              </h2>

              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-200/50">
                {/* Table Header */}
                <div className="bg-[#7B1C2E] text-white px-6 py-4 grid grid-cols-[60px_1fr_120px] sm:grid-cols-[80px_1fr_200px] items-center font-bold text-sm tracking-wide">
                  <span>Sr.</span>
                  <span>Research Work Details</span>
                  <span className="text-right sm:text-center">Action</span>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {groupedRecords[range].map((rec, idx) => (
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
                          <FiFileText size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                            {rec.details}
                          </span>
                          {rec.isStatic && (
                            <span className="text-[8px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-tighter mt-1 w-fit">
                              Static Record
                            </span>
                          )}
                          {!rec.isStatic && rec.fileName && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1 truncate">
                              {rec.fileName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:justify-center gap-2">
                        {rec.fileUrl && (
                          <a
                            href={rec.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-[#7B1C2E] text-white hover:bg-[#6a1727] transition shadow-lg shadow-rose-900/10 active:scale-95"
                          >
                            <FiEye size={14} />
                            <span className="hidden sm:inline">Know More</span>
                          </a>
                        )}
                        {!rec.isStatic && (
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
                        )}
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
              dialog.type === "confirm" ? "bg-amber-50 text-amber-500" :
              dialog.type === "error"   ? "bg-red-50 text-red-500" :
              dialog.type === "warning" ? "bg-orange-50 text-orange-500" :
              "bg-emerald-50 text-emerald-500"
            }`}>
              {dialog.type === "confirm" && <FiAlertTriangle size={24} />}
              {dialog.type === "error"   && <FiX size={24} />}
              {dialog.type === "warning" && <FiInfo size={24} />}
              {dialog.type === "success" && <FiCheckCircle size={24} />}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{dialog.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{dialog.message}</p>

            <div className="flex gap-3 justify-center">
              {dialog.type === "confirm" ? (
                <>
                  <button
                    onClick={closeDialog}
                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { dialog.onConfirm(); closeDialog(); }}
                    className="bg-[#7B1C2E] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#6a1727] transition shadow-lg shadow-rose-900/10"
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

export default ResearchWork;