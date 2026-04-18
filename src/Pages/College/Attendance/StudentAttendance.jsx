import { useState, useEffect } from "react";
import { db } from "../../../../firebase";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, serverTimestamp, query, orderBy, onSnapshot
} from "firebase/firestore";
import { supabase } from "../../../../supabase";
import { FiUpload, FiEdit2, FiTrash2, FiEye, FiX, FiFileText, FiAlertTriangle, FiCheckCircle, FiInfo } from "react-icons/fi";

const StudentAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ 
    year: new Date().getFullYear().toString(),
    courseType: "New BAMS",
    professionalYear: "I Professional",
    month: "January",
    batch: ""
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dialog, setDialog] = useState({ show: false, title: "", message: "", type: "confirm", onConfirm: null });

  const colRef = collection(db, "cllg_student_attendance");
  const BUCKET_NAME = "student-attendance-files";

  const courseTypes = ["Old BAMS", "New BAMS"];
  const professionalYears = ["I Professional", "II Professional", "III Professional", "IV Professional"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecords(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const parseFileName = (fileName) => {
    const name = fileName.toUpperCase();
    let updates = {};
    if (name.includes("4TH") || name.includes("IV PRO") || name.includes("FOURTH")) updates.professionalYear = "IV Professional";
    else if (name.includes("3RD") || name.includes("III PRO") || name.includes("THIRD")) updates.professionalYear = "III Professional";
    else if (name.includes("2ND") || name.includes("II PRO") || name.includes("SECOND")) updates.professionalYear = "II Professional";
    else if (name.includes("1ST") || name.includes("I PRO") || name.includes("FIRST")) updates.professionalYear = "I Professional";
    if (name.includes("NEW")) updates.courseType = "New BAMS";
    else if (name.includes("OLD")) updates.courseType = "Old BAMS";
    for (const m of months) { if (name.includes(m.toUpperCase())) { updates.month = m; break; } }
    const batchMatch = name.match(/20\d{2}-\d{2}/);
    if (batchMatch) updates.batch = batchMatch[0];
    const yearMatches = name.match(/20\d{2}/g);
    if (yearMatches) updates.year = yearMatches[yearMatches.length - 1];
    return updates;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    const parsedData = parseFileName(selectedFile.name);
    setForm(prev => ({ ...prev, ...parsedData }));
  };

  const showAlert = (message, type = "success", title = "") => {
    setDialog({ show: true, message, title: title || (type === "success" ? "Success" : "Notice"), type, onConfirm: null });
  };

  const showConfirm = (message, onConfirm, title = "Are you sure?") => {
    setDialog({ show: true, message, title, type: "confirm", onConfirm });
  };

  const closeDialog = () => setDialog({ ...dialog, show: false });

  const resetForm = () => {
    setForm({ year: new Date().getFullYear().toString(), courseType: "New BAMS", professionalYear: "I Professional", month: months[new Date().getMonth()], batch: "" });
    setFile(null); setEditId(null); setShowForm(false);
    setSaving(false); setUploading(false);
  };

  const uploadToSupabase = async (file) => {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) throw new Error(error.message);
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    return { url: urlData.publicUrl, path: fileName };
  };

  const handleSubmit = async () => {
    if (!form.year) return showAlert("Attendance Year is required.", "warning");
    if (!editId && !file) return showAlert("Please select a file.", "warning");
    setSaving(true);
    try {
      const payload = { year: form.year, courseType: form.courseType, professionalYear: form.professionalYear, month: form.month, batch: form.batch || "" };
      if (editId) {
        if (file) {
          setUploading(true);
          const { url, path } = await uploadToSupabase(file);
          setUploading(false);
          payload.fileUrl = url; payload.filePath = path; payload.fileName = file.name;
        }
        await updateDoc(doc(db, "cllg_student_attendance", editId), payload);
        showAlert("Updated successfully!");
      } else {
        setUploading(true);
        const { url, path } = await uploadToSupabase(file);
        setUploading(false);
        await addDoc(colRef, { ...payload, fileUrl: url, filePath: path, fileName: file.name, createdAt: serverTimestamp() });
        showAlert("Added successfully!");
      }
      resetForm();
    } catch (err) { showAlert(err.message, "error"); }
    finally { setSaving(false); setUploading(false); }
  };

  const handleEdit = (rec) => {
    setForm({ year: rec.year, courseType: rec.courseType, professionalYear: rec.professionalYear, month: rec.month, batch: rec.batch || "" });
    setEditId(rec.id); setShowForm(true);
  };

  const handleDelete = async (rec) => {
    showConfirm(`Delete this record?`, async () => {
      try {
        if (rec.filePath) await supabase.storage.from(BUCKET_NAME).remove([rec.filePath]);
        await deleteDoc(doc(db, "cllg_student_attendance", rec.id));
        showAlert("Deleted.");
      } catch (error) { showAlert(error.message, "error"); }
    });
  };

  // Group by Professional + Year (e.g., "II PROFESSIONAL - 2026")
  const groupedRecords = records.reduce((acc, rec) => {
    const prof = rec.professionalYear || "I Professional";
    const year = rec.year || "Unknown";
    const key = `${prof.toUpperCase()} - ${year}`;
    if (!acc[key]) acc[key] = {};
    if (!acc[key][rec.month]) acc[key][rec.month] = [];
    acc[key][rec.month].push(rec);
    return acc;
  }, {});

  const sortedKeys = Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-10 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Student Attendance</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Management Portal</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-[#7B1C2E] text-white px-8 py-4 rounded-2xl text-sm font-black hover:bg-[#6a1727] transition-all shadow-lg flex items-center gap-3">
          <FiUpload size={20} />
          <span>Upload Record</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-[3rem] shadow-2xl p-8 sm:p-10 w-full max-w-xl relative border border-gray-100 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#7B1C2E]"></div>
            <h2 className="text-2xl font-black text-gray-900 mb-8">{editId ? "Edit Record" : "Add Attendance"}</h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-1">Professional Year</label>
                <select className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[#7B1C2E]" value={form.professionalYear} onChange={(e) => setForm({ ...form, professionalYear: e.target.value })}>
                  {professionalYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-1">Course Type</label>
                <select className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[#7B1C2E]" value={form.courseType} onChange={(e) => setForm({ ...form, courseType: e.target.value })}>
                  {courseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-1">Month</label>
                <select className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[#7B1C2E]" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-1">Attendance Year</label>
                <input className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[#7B1C2E]" placeholder="2026" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-1">Batch (e.g. 2023-24)</label>
                <input className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[#7B1C2E]" placeholder="2023-2024" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
              </div>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-4 border-dashed border-gray-100 rounded-[2rem] cursor-pointer hover:bg-rose-50/30 transition-all mb-8">
              <span className="text-sm font-bold text-gray-700">{file ? file.name : "Click to select PDF"}</span>
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
            </label>
            {(uploading || saving) && <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-8"><div className="bg-[#7B1C2E] h-full animate-pulse w-full"></div></div>}
            <div className="flex gap-4">
              <button onClick={resetForm} className="flex-1 py-4 text-sm font-black text-gray-400 bg-gray-50 rounded-2xl hover:bg-gray-100">Cancel</button>
              <button onClick={handleSubmit} disabled={saving || uploading} className="flex-[2] bg-[#7B1C2E] text-white py-4 rounded-2xl text-sm font-black shadow-xl disabled:opacity-50 active:scale-95 transition-all">Save Record</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-40"><div className="h-16 w-16 border-8 border-gray-100 border-t-[#7B1C2E] rounded-full animate-spin"></div></div>
      ) : sortedKeys.length === 0 ? (
        <div className="bg-white p-20 text-center rounded-[3rem] border border-gray-100 text-gray-400 font-bold">No records found.</div>
      ) : (
        <div className="space-y-16">
          {sortedKeys.map((key) => (
            <div key={key}>
              <div className="flex items-center gap-6 mb-6">
                <h2 className="text-lg font-black text-gray-900 whitespace-nowrap tracking-tight bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">{key}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
              </div>
              <div className="space-y-3">
                {months.filter(m => groupedRecords[key][m]).map(monthName => (
                  groupedRecords[key][monthName].map((rec) => (
                    <div key={rec.id} className="bg-white px-8 py-5 rounded-[2rem] border border-gray-50 hover:border-[#7B1C2E]/20 hover:shadow-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-[1.25rem] bg-gray-50 flex items-center justify-center text-[#7B1C2E] group-hover:bg-[#7B1C2E] group-hover:text-white transition-all shadow-sm">
                           <FiFileText size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-black text-gray-900">{rec.month} Attendance {rec.batch ? `(${rec.batch})` : ""}</h4>
                            <span className="text-[10px] font-black px-3 py-1 bg-rose-50 text-[#7B1C2E] rounded-full uppercase tracking-widest">{rec.courseType}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">{rec.fileName || "DOCUMENT.PDF"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(rec)} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><FiEdit2 size={18}/></button>
                          <button onClick={() => handleDelete(rec)} className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><FiTrash2 size={18}/></button>
                        </div>
                        <a href={rec.fileUrl} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7B1C2E] transition-all shadow-lg active:scale-95">
                          <FiEye size={16}/> <span>View PDF</span>
                        </a>
                      </div>
                    </div>
                  ))
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {dialog.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 mb-2">{dialog.title}</h3>
            <p className="text-sm text-gray-500 font-bold mb-8">{dialog.message}</p>
            <div className="flex gap-4">
              {dialog.type === 'confirm' ? (
                <>
                  <button onClick={closeDialog} className="flex-1 py-4 text-gray-400 font-black uppercase text-xs">No</button>
                  <button onClick={() => { dialog.onConfirm(); closeDialog(); }} className="flex-[2] bg-[#7B1C2E] text-white py-4 rounded-2xl font-black text-xs shadow-lg">Confirm</button>
                </>
              ) : <button onClick={closeDialog} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs">OK</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
