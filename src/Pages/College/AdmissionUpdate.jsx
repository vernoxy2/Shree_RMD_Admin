import { useState, useEffect } from "react";
import { db, storage } from "../../../firebase";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { FiUpload, FiEdit2, FiTrash2, FiEye, FiX } from "react-icons/fi";

const AdmissionUpdate = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", year: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const colRef = collection(db, "cllg_admission_updates");

  const fetchRecords = async () => {
    setLoading(true);
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const resetForm = () => {
    setForm({ title: "", year: "" });
    setFile(null);
    setEditId(null);
    setProgress(0);
    setShowForm(false);
  };

  const uploadFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result, // base64 data URL
        path: null
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

  const handleSubmit = async () => {
    if (!form.title || !form.year) return alert("Title and Year are required.");
    if (!editId && !file) return alert("Please select a file to upload.");
    setSaving(true);

    try {
      if (editId) {
        const updateData = { title: form.title, year: form.year };
        if (file) {
          setUploading(true);
          const { url, path } = await uploadFile(file);
          setUploading(false);
          updateData.fileUrl = url;
          updateData.filePath = path;
        }
        await deleteDoc(doc(db, "cllg_admission_updates", rec.id));
      } else {
        setUploading(true);
        const { url, path } = await uploadFile(file);
        setUploading(false);
        await addDoc(colRef, {
          title: form.title,
          year: form.year,
          fileUrl: url,
          filePath: path,
          fileName: file.name,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
      fetchRecords();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setSaving(false);
  };

  const handleEdit = (rec) => {
    setForm({ title: rec.title, year: rec.year });
    setEditId(rec.id);
    setShowForm(true);
  };

  const handleDelete = async (rec) => {
    if (!confirm("Delete this record?")) return;
    try {
      if (rec.filePath) {
        await deleteObject(ref(storage, rec.filePath));
      }
    } catch (_) {}
    await deleteDoc(doc(db, "admission_updates", rec.id));
    fetchRecords();
  };

  const grouped = records.reduce((acc, rec) => {
    acc[rec.year] = acc[rec.year] || [];
    acc[rec.year].push(rec);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admission Updates</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage admission documents by year</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#7B1C2E] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#6a1727] transition flex items-center gap-2"
        >
          <FiUpload size={14} /> Add Record
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editId ? "Edit Record" : "Add New Record"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Title *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C2E]"
                  placeholder="e.g. Student Details 2025-2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Academic Year *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C2E]"
                  placeholder="e.g. 2025-2026"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Upload File {editId ? "(optional — replaces existing)" : "*"}
                </label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#7B1C2E] hover:bg-rose-50 transition">
                  <FiUpload size={20} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">
                    {file ? file.name : "Click to upload PDF / DOC / '/n'Image should be less than 1MB"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#7B1C2E] h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || uploading}
                className="bg-[#7B1C2E] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#6a1727] transition disabled:opacity-60"
              >
                {saving ? "Saving..." : editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-[#7B1C2E] animate-spin"></div>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 text-gray-400">No records yet. Add one!</div>
      ) : (
        <div className="space-y-8">
          {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map((year) => (
            <div key={year}>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-base font-semibold text-gray-700">
                  Admission Updates <span className="text-[#7B1C2E]">{year}</span>
                </h2>
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400">
                  {grouped[year].length} record{grouped[year].length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-3">
                {grouped[year].map((rec, idx) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-300 w-6">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-gray-700">{rec.title}</span>
                        {rec.fileName && (
                          <p className="text-xs text-gray-400 mt-0.5">{rec.fileName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rec.fileUrl && (
                        <a
                          href={rec.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                        >
                          <FiEye size={12} /> View
                        </a>
                      )}
                      <button
                        onClick={() => handleEdit(rec)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                      >
                        <FiEdit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rec)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                      >
                        <FiTrash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdmissionUpdate;