import { useState, useEffect } from "react";
import { FaChevronRight } from "react-icons/fa";
import GalleryBg from "../../assets/hero.png";
import { GalleryItems as staticGalleryItems } from "./GalleryItems";
import { IoIosArrowBack } from "react-icons/io";
import { FiPlus } from "react-icons/fi";
import { db } from "../../../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const ALL_TAGS = [
  "All",
  "Academic",
  "Community",
  "Seminar",
  "Events & Culture",
  "Visits & Campus",
  "Health & Wellness",
  "Department Modal",
];  

function FilterChip({ label, active, count, onClick, ...props }) {
  return (
    <button
      {...props}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold border whitespace-nowrap transition-all hover:-translate-y-[1px]
      ${
        active
          ? "bg-[#7B1C2E] text-white border-[#7B1C2E] shadow-[0_4px_12px_rgba(123,28,46,0.3)]"
          : "bg-white text-gray-500 border-[#e5dede]"
      }`}
    >
      {label}
      <span
        className={`px-2 rounded-full font-bold ${
          active ? "text-white bg-white/20" : "text-[#7B1C2E] bg-[#7B1C2E]/10"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function GalleryCard({ item, onClick, ...props }) {
  const thumbnail = (item.images && item.images.length > 0) 
    ? item.images[0] 
    : (item.subCategories && item.subCategories[0]?.images?.[0]) 
    || item.icon || "https://via.placeholder.com/300?text=No+Image";

  return (
    <div
      {...props}
      onClick={onClick}
      className="group bg-white rounded-2xl p-4 border hover:border-[#7B1C2E] border-[#ede5e6]/70 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-[0_16px_40px_rgba(123,28,46,0.18)]"
    >
      <div className="flex items-start gap-4">
        <div className="w-24 md:w-32 h-20 md:h-28 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 bg-gray-50 overflow-hidden border border-[#7B1C2E]/10">
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-2xl font-semibold text-[#7B1C2E] leading-snug mb-2 line-clamp-2">
            {item.name}
          </h2>

          {item.tag && (
            <p className="px-3 py-0.5 rounded-full border border-[#7B1C2E] text-[#7B1C2E] bg-[#7B1C2E]/5 w-fit text-xs sm:text-sm font-medium">
              {item.tag}
            </p>
          )}
        </div>

        <div className="shrink-0 mt-1 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#fff5f6]">
            <FaChevronRight size={16} className="text-[#7B1C2E]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryDetailView({ item, onBack }) {
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [active, setActive] = useState(null);

  if (selectedSubItem) {
    return (
      <GalleryDetailView
        item={selectedSubItem}
        onBack={() => setSelectedSubItem(null)}
      />
    );
  }

  const images = item.images || [];
  const subCategories = item.subCategories || [];

  return (
    <div
      className="bg-cover py-16 min-h-screen"
      style={{ backgroundImage: `url(${GalleryBg})` }}
    >
      <div className="container mx-auto px-4 space-y-4 sm:space-y-8">
        <div className="sm:space-y-4 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-1 bg-[#7B1C2E] pr-2 border-4 border-[#7B1C2E] text-white rounded-full font-medium overflow-hidden shrink-0"
          >
            <span className="relative w-8 h-8 flex items-center justify-center bg-white rounded-full overflow-hidden">
              <IoIosArrowBack size={20} className="text-[#7B1C2E]" />
            </span>
            <span className="px-2.5">Back</span>
          </button>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-[#7B1C2E] text-right">
            {item.name}
          </h1>
        </div>

        {subCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {subCategories.map((subItem, i) => (
              <GalleryCard
                key={subItem.id || i}
                item={subItem}
                onClick={() => setSelectedSubItem(subItem)}
              />
            ))}
          </div>
        ) : images.length === 0 ? (
          <h2 className="text-center text-gray-400 py-20 text-xl">
            No images available.
          </h2>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {images.map((src, idx) => (
              <div
                key={idx}
                onClick={() => setActive(src)}
                className="cursor-pointer relative group aspect-square overflow-hidden rounded-2xl border-2 border-transparent hover:border-[#7B1C2E] transition-all duration-300 hover:shadow-xl bg-gray-100"
              >
                <img
                  src={src}
                  alt={`${item.name} ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="p-3 bg-white rounded-full transform scale-50 group-hover:scale-100 transition-transform duration-300 border-4 border-black/20">
                    <FiPlus size={32} className="text-[#7B1C2E]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-w-4xl w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute -top-10 right-0 text-white text-lg font-bold opacity-70 hover:opacity-100 transition-opacity"
            >
              ✕ Close
            </button>
            <img
              src={active}
              alt="preview"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function GalleryPage({ onSelectItem }) {
  const [activeTag, setActiveTag] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [dynamicTags, setDynamicTags] = useState(["All"]);
  const [tagCounts, setTagCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicGallery = async () => {
      try {
        const q = query(collection(db, "cllg_gallery"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const dynamicRecords = snap.docs.map(doc => doc.data());

        // 1. Build Merged Gallery Items
        let mergedItems = JSON.parse(JSON.stringify(staticGalleryItems));

        dynamicRecords.forEach(record => {
          let parentItem = mergedItems.find(item => item.name.toLowerCase() === record.cardName.toLowerCase());
          
          if (!parentItem) {
            parentItem = {
              id: `dynamic-${record.cardName}`,
              name: record.cardName,
              slug: record.cardName.toLowerCase().replace(/\s+/g, '-'),
              tag: record.tag || "General",
              images: [],
              subCategories: []
            };
            mergedItems.push(parentItem);
          }

          if (record.subCardName) {
            let subCat = parentItem.subCategories.find(sub => sub.name.toLowerCase() === record.subCardName.toLowerCase());
            if (!subCat) {
              subCat = {
                id: `dynamic-sub-${record.subCardName}`,
                name: record.subCardName,
                slug: record.subCardName.toLowerCase().replace(/\s+/g, '-'),
                images: []
              };
              parentItem.subCategories.push(subCat);
            }
            subCat.images.push(record.imageUrl);
          } else {
            parentItem.images.push(record.imageUrl);
          }
        });

        setGalleryItems(mergedItems);

        // 2. Extract ALL unique tags from static AND dynamic records
        const allTags = new Set(["All"]);
        const counts = {};

        // From static
        staticGalleryItems.forEach(item => {
            if (item.tag) allTags.add(item.tag);
        });

        // From dynamic raw records (Ensures even new tags appear)
        dynamicRecords.forEach(record => {
            if (record.tag) allTags.add(record.tag);
        });

        // 3. Calculate counts per tag (how many CARDS match the tag)
        mergedItems.forEach(item => {
            if (item.tag) {
                counts[item.tag] = (counts[item.tag] || 0) + 1;
            }
        });

        setTagCounts(counts);
        setDynamicTags(Array.from(allTags).sort((a, b) => {
            if (a === "All") return -1;
            if (b === "All") return 1;
            return a.localeCompare(b);
        }));

      } catch (error) {
        console.error("Error fetching dynamic gallery:", error);
        setGalleryItems(staticGalleryItems);
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicGallery();
  }, []);

  const handleSelect = (item) => {
    setSelectedItem(item);
    onSelectItem?.(item ?? null); 
  };

  if (selectedItem) {
    return (
      <GalleryDetailView
        item={selectedItem}
        onBack={() => handleSelect(null)}
      />
    );
  }

  const filtered = galleryItems.filter((item) => {
    const tagMatch = activeTag === "All" || item.tag === activeTag;
    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());
    return tagMatch && searchMatch;
  });

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-gray-100 border-t-[#7B1C2E] animate-spin"></div>
            <span className="text-sm font-medium text-gray-400">Loading gallery...</span>
        </div>
    );
  }

  return (
    <div className="py-14">
      <div className="container mx-auto px-4 sticky top-0 bg-white border-b border-[#ede5e6] z-20">
        <div className="py-3 space-y-4">
          <input
            type="text"
            placeholder="Search gallery…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3 rounded-lg text-base font-medium bg-gray-50 border border-[#ede5e6] outline-none placeholder:text-gray-400"
          />
          <div className="flex gap-2 overflow-x-auto pt-1 pb-2 scrollbar-hide">
            {dynamicTags.map((tag, i) => (
              <FilterChip
                key={tag}
                label={tag}
                active={activeTag === tag}
                count={tag === "All" ? galleryItems.length : (tagCounts[tag] || 0)}
                onClick={() => setActiveTag(tag)}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="bg-gray-50/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {filtered.map((item, i) => (
              <GalleryCard
                key={item.id}
                item={item}
                onClick={() => handleSelect(item)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
