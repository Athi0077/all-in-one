import React, { useEffect, useState } from 'react';
import { getRelatedProducts } from '../services/productService';
import ProductCard from './ProductCard';
import { ProductSkeleton } from './Skeleton';

const RelatedProducts = ({ productId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const data = await getRelatedProducts(productId);
        setProducts(data);
      } catch (error) {
        console.error('Error fetching related products:', error);
      }
      setLoading(false);
    };

    if (productId) {
      fetchRelated();
    }
  }, [productId]);

  if (!loading && products.length === 0) {
    return null; // Don't show the section if no related products
  }

  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-gray-900">You Might Also Like</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          [1, 2, 3, 4].map(n => <ProductSkeleton key={n} />)
        ) : (
          products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};

export default RelatedProducts;
