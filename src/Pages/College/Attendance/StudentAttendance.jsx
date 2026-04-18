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
    console.log("Setting up real-time listener...");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Records fetched:", data.length);
      setRecords(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
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
    console.log("File selected:", selectedFile.name);
    setFile(selectedFile);
    const parsedData = parseFileName(selectedFile.name);
    setForm(prev => ({ ...prev, ...parsedData }));
  };

  const showAlert = (message, type = "success", title = "") => {
    setDialog({ show: true, message, title: title || (type === "success" ? "Success" : type === "error" ? "Error" : "Notice"), type, onConfirm: null });
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
    console.log("Uploading to Supabase bucket:", BUCKET_NAME);
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, { cacheControl: "3600", upsert: false });
    
    if (error) {
      console.error("Supabase Upload Error:", error);
      throw new Error(`Storage Error: ${error.message}. Make sure bucket '${BUCKET_NAME}' exists.`);
    }

    console.log("Upload success, getting public URL...");
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    return { url: urlData.publicUrl, path: fileName };
  };

  const handleSubmit = async () => {
    console.log("handleSubmit triggered. Current form state:", form);
    
    if (!form.year) {
      console.warn("Validation failed: Attendance Year is empty");
      return showAlert("Attendance Year is required.", "warning");
    }
    if (!editId && !file) {
      console.warn("Validation failed: No file selected for new record");
      return showAlert("Please select a file to upload.", "warning");
    }
    
    setSaving(true);
    try {
      const payload = { 
        year: form.year, 
        courseType: form.courseType, 
        professionalYear: form.professionalYear, 
        month: form.month, 
        batch: form.batch || "" 
      };

      if (editId) {
        console.log("Updating existing record:", editId);
        if (file) {
          setUploading(true);
          const { url, path } = await uploadToSupabase(file);
          setUploading(false);
          payload.fileUrl = url; payload.filePath = path; payload.fileName = file.name;
        }
        await updateDoc(doc(db, "cllg_student_attendance", editId), payload);
        console.log("Update success!");
        showAlert("Record updated successfully!");
      } else {
        console.log("Adding new record...");
        setUploading(true);
        const { url, path } = await uploadToSupabase(file);
        setUploading(false);
        await addDoc(colRef, { 
          ...payload, 
          fileUrl: url, 
          filePath: path, 
          fileName: file.name, 
          createdAt: serverTimestamp() 
        });
        console.log("Add success!");
        showAlert("Attendance added successfully!");
      }
      resetForm();
    } catch (err) {
      console.error("Submit Error:", err);
      showAlert(err.message, "error");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleEdit = (rec) => {
    setForm({ year: rec.year, courseType: rec.courseType, professionalYear: rec.professionalYear, month: rec.month, batch: rec.batch || "" });
    setEditId(rec.id);
    setShowForm(true);
  };

  const handleDelete = async (rec) => {
    showConfirm(`Are you sure you want to delete this record?`, async () => {
      try {
        if (rec.filePath) await supabase.storage.from(BUCKET_NAME).remove([rec.filePath]);
        await deleteDoc(doc(db, "cllg_student_attendance", rec.id));
        showAlert("Deleted successfully.");
      } catch (error) { showAlert(error.message, "error"); }
    });
  };

  const yearGroups = records.reduce((acc, rec) => {
    const y = rec.year || "Unknown";
    if (!acc[y]) acc[y] = {};
    const p = rec.professionalYear || "I Professional";
    const b = rec.batch ? `(${rec.batch})` : "";
    const groupKey = `${p} BAMS ${b}`.trim();
    if (!acc[y][groupKey]) acc[y][groupKey] = [];
    acc[y][groupKey].push(rec);
    return acc;
  }, {});

  const sortedYears = Object.keys(yearGroups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Student Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Dashboard - Manage Records</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#7B1C2E] text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-[#6a1727] transition-all shadow-lg flex items-center gap-3 active:scale-95"
        >
          <FiUpload size={20} />
          <span>Upload New Record</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-[3rem] shadow-2xl p-6 sm:p-10 w-full max-w-xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-[#7B1C2E]"></div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">{editId ? "Edit Record" : "Upload Attendance"}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full"><FiX size={24} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-1">Professional Year</label>
                <select className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#7B1C2E]" value={form.professionalYear} onChange={(e) => setForm({ ...form, professionalYear: e.target.value })}>
                  {professionalYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-1">Course Type</label>
                <select className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#7B1C2E]" value={form.courseType} onChange={(e) => setForm({ ...form, courseType: e.target.value })}>
                  {courseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-1">Month</label>
                <select className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#7B1C2E]" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-1">Attendance Year</label>
                <input className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#7B1C2E]" placeholder="2026" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-1">Batch (Academic Year)</label>
                <input className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#7B1C2E]" placeholder="2023-2024" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
              </div>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-32 border-4 border-dashed border-gray-100 rounded-[2.5rem] cursor-pointer hover:bg-rose-50/30 transition-all mb-8">
              {file ? (
                <div className="text-center px-6">
                  <FiFileText size={40} className="mx-auto text-[#7B1C2E] mb-2"/>
                  <span className="text-xs font-bold text-gray-700 block truncate">{file.name}</span>
                </div>
              ) : (
                <div className="text-center">
                  <FiUpload size={40} className="mx-auto text-gray-200 mb-2"/>
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Select PDF File</span>
                </div>
              )}
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
            </label>

            {(uploading || saving) && (
              <div className="mb-8">
                <div className="flex justify-between text-[10px] font-black text-primary uppercase mb-2">
                  <span>{uploading ? "Uploading PDF..." : "Saving Data..."}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#7B1C2E] h-full animate-pulse w-full"></div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={resetForm} className="flex-1 py-4 text-sm font-black text-gray-400 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all">Cancel</button>
              <button 
                onClick={handleSubmit} 
                disabled={saving || uploading} 
                className={`flex-[2] py-4 rounded-2xl text-sm font-black shadow-xl transition-all ${
                  saving || uploading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#7B1C2E] text-white active:scale-95 hover:bg-[#6a1727]"
                }`}
              >
                {saving ? "Processing..." : editId ? "Update Record" : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-40">
           <div className="h-16 w-16 border-8 border-gray-100 border-t-[#7B1C2E] rounded-full animate-spin"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100">
           <p className="text-xl font-black text-gray-400">No records found. Click 'Upload New Record' to start.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {sortedYears.map((year) => (
            <div key={year} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center gap-6 mb-10">
                <h2 className="text-2xl font-black text-gray-900 whitespace-nowrap">Student Attendance {year}</h2>
                <div className="h-[2px] w-full bg-gradient-to-r from-gray-200 to-transparent"></div>
              </div>

              <div className="space-y-10">
                {Object.keys(yearGroups[year]).sort().map(pGroupKey => (
                  <div key={pGroupKey} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-[#7B1C2E] mb-6 uppercase flex items-center gap-3">
                      <span className="w-2 h-8 bg-[#7B1C2E] rounded-full"></span>
                      {pGroupKey}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {yearGroups[year][pGroupKey].sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month)).map((rec) => (
                        <div key={rec.id} className="bg-gray-50/50 p-6 rounded-[2rem] border border-transparent hover:border-[#7B1C2E]/20 hover:bg-white hover:shadow-xl transition-all group">
                          <div className="flex justify-between items-start mb-4">
                            <div className="bg-white p-3 rounded-2xl text-[#7B1C2E] shadow-sm group-hover:bg-[#7B1C2E] group-hover:text-white transition-colors">
                              <FiFileText size={24} />
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleEdit(rec)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={18}/></button>
                              <button onClick={() => handleDelete(rec)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={18}/></button>
                            </div>
                          </div>
                          <h4 className="text-lg font-black text-gray-900 mb-1">{rec.month} Attendance</h4>
                          <div className="flex gap-2 mb-6">
                            <span className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase">{rec.courseType}</span>
                          </div>
                          <a href={rec.fileUrl} target="_blank" rel="noreferrer" className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#7B1C2E] transition-all">
                            <FiEye size={14}/> View PDF
                          </a>
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

      {dialog.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 mb-4">{dialog.title}</h3>
            <p className="text-gray-500 font-bold mb-8 leading-relaxed">{dialog.message}</p>
            <div className="flex gap-4 justify-center">
              {dialog.type === 'confirm' ? (
                <>
                  <button onClick={closeDialog} className="flex-1 py-4 text-gray-400 font-black uppercase text-xs tracking-widest">No</button>
                  <button onClick={() => { dialog.onConfirm(); closeDialog(); }} className="bg-[#7B1C2E] text-white px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Yes, Confirm</button>
                </>
              ) : <button onClick={closeDialog} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest">OK</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
