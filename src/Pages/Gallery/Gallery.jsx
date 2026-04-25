import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PrimaryHeader from '../../Components/Ui/PrimaryHeader';
import GalleryPage from './GalleryPage';
import { GalleryItems } from './GalleryItems';
import GalleryBg from "../../assets/hero.png"; // Using available asset

const Gallery = () => {
  const { category } = useParams();
  const navigate = useNavigate();

  // Find current item based on slug from URL
  const currentItem = GalleryItems.find(item => item.slug === category);
  const galleryTitle = currentItem ? currentItem.name : "Gallery";

  const handleSelectItem = (item) => {
    // Note: The user's code had onSelectItem passing item.name or null
    // But here it uses item.slug. I will adjust it to be consistent with GalleryPage's call.
    if (item && item.slug) {
      navigate(`/gallery/${item.slug}`);
    } else {
      navigate('/gallery');
    }
  };

  return (
    <div>
      <PrimaryHeader HeadLine={<>{galleryTitle}</>} BgImg={GalleryBg} BgPos="bg-top" />
      <GalleryPage onSelectItem={handleSelectItem} />
    </div>
  );
}

export default Gallery;
