import React from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/getImageUrl';

const CategoryCard = ({ category }) => {
  return (
    <Link 
      to={`/products?category=${category.slug}`}
      className="group block relative overflow-hidden rounded-2xl aspect-[4/5] sm:aspect-square"
    >
      <img 
        src={getImageUrl(category.image)} 
        alt={category.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300"></div>
      <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight">{category.name}</h3>
        <p className="text-white/80 text-sm opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          Shop Now →
        </p>
      </div>
    </Link>
  );
};

export default CategoryCard;
