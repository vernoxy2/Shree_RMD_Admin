import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { supabase } from "../../../supabase";
import { FiUpload, FiEdit2, FiTrash2, FiEye, FiX, FiImage, FiAlertTriangle, FiCheckCircle, FiInfo, FiPlus } from "react-icons/fi";

const GalleryManagement = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ cardName: "", subCardName: "", tag: "" });
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

  const colRef = collection(db, "cllg_gallery");
  const BUCKET_NAME = "gallery-files";

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
      console.error("Error fetching gallery records:", error);
      showAlert("Failed to load gallery items. Please try again.", "error");
    }
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const resetForm = () => {
    setForm({ cardName: "", subCardName: "", tag: "" });
    setFile(null);
    setEditId(null);
    setShowForm(false);
  };

  const uploadToSupabase = async (file) => {
    const fileName = `gallery/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
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
    if (!form.cardName) return showAlert("Card Name is required.", "warning");
    if (!editId && !file) return showAlert("Please select an image to upload.", "warning");
    setSaving(true);

    try {
      if (editId) {
        const updateData = { 
            cardName: form.cardName,
            subCardName: form.subCardName,
            tag: form.tag || form.subCardName // Use subCardName as tag if tag is empty
        };
        if (file) {
          setUploading(true);
          const { url, path } = await uploadToSupabase(file);
          setUploading(false);
          updateData.imageUrl = url;
          updateData.imagePath = path;
          updateData.imageName = file.name;
        }
        await updateDoc(doc(db, "cllg_gallery", editId), updateData);
        showAlert("Gallery item updated successfully!");
      } else {
        setUploading(true);
        const { url, path } = await uploadToSupabase(file);
        setUploading(false);
        await addDoc(colRef, {
          cardName: form.cardName,
          subCardName: form.subCardName,
          tag: form.tag || form.subCardName,
          imageUrl: url,
          imagePath: path,
          imageName: file.name,
          createdAt: serverTimestamp(),
        });
        showAlert("New gallery item added successfully!");
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
        cardName: rec.cardName, 
        subCardName: rec.subCardName || "", 
        tag: rec.tag || "" 
    });
    setEditId(rec.id);
    setShowForm(true);
  };

  const handleDelete = async (rec) => {
    showConfirm(
      `Are you sure you want to delete this image? This action cannot be undone.`,
      async () => {
        try {
          if (rec.imagePath) {
            await supabase.storage.from(BUCKET_NAME).remove([rec.imagePath]);
          }
          await deleteDoc(doc(db, "cllg_gallery", rec.id));
          showAlert("Gallery item deleted successfully.", "success");
          fetchRecords();
        } catch (error) {
          showAlert("Error deleting: " + error.message, "error");
        }
      },
      "Confirm Deletion"
    );
  };

  // Group records by Card Name
  const groupedRecords = records.reduce((acc, rec) => {
    const card = rec.cardName || "Other";
    if (!acc[card]) acc[card] = [];
    acc[card].push(rec);
    return acc;
  }, {});

  const sortedCards = Object.keys(groupedRecords).sort((a, b) => a.localeCompare(b));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gallery Management</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and organize gallery images by cards and tags</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#7B1C2E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#6a1727] transition shadow-lg shadow-rose-900/20 flex items-center gap-2"
        >
          <FiPlus size={18} />
          <span>Add Image</span>
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editId ? "Edit Gallery Item" : "Add New Image"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Card Name *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C2E] bg-gray-50/50"
                  placeholder="e.g. Nss activity"
                  value={form.cardName}
                  onChange={(e) => setForm({ ...form, cardName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Sub-card Name</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C2E] bg-gray-50/50"
                  placeholder="e.g. Water treatment plant"
                  value={form.subCardName}
                  onChange={(e) => setForm({ ...form, subCardName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Tag (Optional)</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C2E] bg-gray-50/50"
                  placeholder="e.g. Activity Tag"
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">
                  Upload Image {editId ? "(optional)" : "*"}
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#7B1C2E] hover:bg-rose-50/30 transition-all group overflow-hidden">
                  {file ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                            src={URL.createObjectURL(file)} 
                            alt="Preview" 
                            className="w-full h-full object-cover opacity-40" 
                        />
                        <span className="absolute text-xs font-bold text-gray-700 bg-white/80 px-2 py-1 rounded-md shadow-sm">
                            {file.name}
                        </span>
                    </div>
                  ) : (
                    <>
                        <div className="bg-gray-100 p-3 rounded-full mb-2 group-hover:bg-rose-100 transition-colors">
                            <FiImage size={24} className="text-gray-400 group-hover:text-[#7B1C2E]" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 text-center px-4">
                            Drop your image here or click to browse
                        </span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
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

      {/* Gallery List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-gray-100 border-t-[#7B1C2E] animate-spin"></div>
          <span className="text-sm font-medium text-gray-400">Loading gallery...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full w-fit mx-auto mb-4 shadow-sm">
             <FiImage size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No gallery items found. Start by adding one.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedCards.map((card) => (
            <div key={card} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-gray-900 mb-4 ml-1">{card}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedRecords[card].map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-200/50 group hover:border-[#7B1C2E]/30 transition-all"
                  >
                    <div className="aspect-video relative overflow-hidden bg-gray-100">
                        <img 
                            src={rec.imageUrl} 
                            alt={rec.subCardName} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                             <button
                                onClick={() => handleEdit(rec)}
                                className="p-2 rounded-lg bg-white/90 text-gray-600 hover:text-blue-600 shadow-sm transition-colors"
                                title="Edit"
                            >
                                <FiEdit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDelete(rec)}
                                className="p-2 rounded-lg bg-white/90 text-gray-600 hover:text-red-600 shadow-sm transition-colors"
                                title="Delete"
                            >
                                <FiTrash2 size={14} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-4">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-sm font-bold text-gray-800 truncate">
                            {rec.subCardName || "No Sub-card"}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white bg-[#7B1C2E] px-2 py-0.5 rounded uppercase tracking-wider">
                                {rec.tag || "No Tag"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {rec.imageName}
                            </span>
                          </div>
                        </div>
                    </div>
                  </div>
                ))}
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

export default GalleryManagement;
