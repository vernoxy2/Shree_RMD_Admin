import React from 'react';

const PrimaryHeader = ({ HeadLine, BgImg, BgPos }) => {
  return (
    <div 
      className={`relative h-64 flex items-center justify-center text-white bg-cover ${BgPos}`}
      style={{ backgroundImage: `url(${BgImg})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <h1 className="relative z-10 text-4xl md:text-5xl font-bold">{HeadLine}</h1>
    </div>
  );
};

export default PrimaryHeader;
