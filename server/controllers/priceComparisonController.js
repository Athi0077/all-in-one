/**
 * @desc    Get mock price comparisons for a product
 * @route   GET /api/price-comparison
 * @access  Public
 */
export const getPriceComparison = async (req, res, next) => {
  try {
    const { search } = req.query;

    if (!search) {
      res.status(400);
      throw new Error('Search query is required');
    }

    // Generate a mock base price based on the length of the string to have some variance
    const basePriceSeed = search.length * 15 + search.charCodeAt(0) * 2;
    const basePrice = Math.max(99, basePriceSeed);

    // Generate mock results
    const results = [
      {
        store: 'Amazon',
        title: `${search} - Authentic & Original`,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300&h=300', // Generic product box placeholder
        price: Math.round(basePrice * 0.95),
        originalPrice: Math.round(basePrice * 1.2),
        discount: Math.round((1 - 0.95 / 1.2) * 100),
        rating: 4.5,
        productUrl: `https://www.amazon.in/s?k=${encodeURIComponent(search)}`
      },
      {
        store: 'Flipkart',
        title: `${search} (Latest Edition)`,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300&h=300',
        price: Math.round(basePrice * 0.98),
        originalPrice: Math.round(basePrice * 1.3),
        discount: Math.round((1 - 0.98 / 1.3) * 100),
        rating: 4.2,
        productUrl: `https://www.flipkart.com/search?q=${encodeURIComponent(search)}`
      },
      {
        store: 'Myntra',
        title: `Premium ${search}`,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300&h=300',
        price: Math.round(basePrice * 1.05),
        originalPrice: Math.round(basePrice * 1.5),
        discount: Math.round((1 - 1.05 / 1.5) * 100),
        rating: 4.7,
        productUrl: `https://www.myntra.com/${encodeURIComponent(search)}`
      },
      {
        store: 'Ajio',
        title: `${search} - Trending Now`,
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=300&h=300',
        price: Math.round(basePrice * 0.9),
        originalPrice: Math.round(basePrice * 1.4),
        discount: Math.round((1 - 0.9 / 1.4) * 100),
        rating: 4.0,
        productUrl: `https://www.ajio.com/search/?text=${encodeURIComponent(search)}`
      }
    ];

    // Simulate slight network delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 800));

    res.json({
      productName: search,
      results
    });
  } catch (error) {
    next(error);
  }
};
