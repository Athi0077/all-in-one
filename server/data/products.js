const products = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    slug: 'wireless-noise-cancelling-headphones',
    description: 'Experience premium sound quality with active noise cancellation, 30-hour battery life, and superior comfort for all-day listening.',
    price: 299.99,
    discountPrice: 249.99,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'],
    brand: 'AudioTech',
    stock: 50,
    rating: 4.8,
    numReviews: 124,
    isFeatured: true,
    categoryName: 'Electronics'
  },
  {
    name: 'Men\'s Classic Leather Watch',
    slug: 'mens-classic-leather-watch',
    description: 'A timeless classic featuring a genuine leather strap, water resistance up to 50m, and precise quartz movement.',
    price: 150.00,
    discountPrice: 120.00,
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800'],
    brand: 'TimePiece',
    stock: 30,
    rating: 4.5,
    numReviews: 89,
    isFeatured: true,
    categoryName: 'Men'
  },
  {
    name: 'Women\'s Flowy Maxi Dress',
    slug: 'womens-flowy-maxi-dress',
    description: 'Beautiful and comfortable flowy maxi dress, perfect for summer evenings and casual outings.',
    price: 85.00,
    discountPrice: 0,
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800'],
    brand: 'StyleCo',
    stock: 120,
    rating: 4.7,
    numReviews: 56,
    isFeatured: false,
    categoryName: 'Women'
  },
  {
    name: 'Minimalist Ceramic Vase',
    slug: 'minimalist-ceramic-vase',
    description: 'Add a touch of modern elegance to your home with this handcrafted ceramic vase.',
    price: 45.00,
    discountPrice: 35.00,
    images: ['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&q=80&w=800'],
    brand: 'HomeStyle',
    stock: 80,
    rating: 4.9,
    numReviews: 42,
    isFeatured: true,
    categoryName: 'Home & Living'
  },
  {
    name: 'Hydrating Facial Serum',
    slug: 'hydrating-facial-serum',
    description: 'Revitalize your skin with our deeply hydrating and anti-aging facial serum packed with vitamins.',
    price: 55.00,
    discountPrice: 40.00,
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800'],
    brand: 'GlowBeauty',
    stock: 200,
    rating: 4.6,
    numReviews: 210,
    isFeatured: false,
    categoryName: 'Beauty'
  },
  {
    name: 'Smart Home Security Camera',
    slug: 'smart-home-security-camera',
    description: '1080p HD smart camera with motion detection, two-way audio, and night vision.',
    price: 120.00,
    discountPrice: 99.99,
    images: ['https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?auto=format&fit=crop&q=80&w=800'],
    brand: 'SecureHome',
    stock: 45,
    rating: 4.4,
    numReviews: 67,
    isFeatured: true,
    categoryName: 'Electronics'
  }
];

export default products;
