import { useState, useEffect } from 'react';
import { getProducts } from '../services/productService';
import { getSellers } from '../services/sellerService';

const Storefront = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodData, sellerData] = await Promise.all([getProducts(), getSellers()]);
        setProducts(prodData || []);
        setSellers(sellerData || []);
      } catch (err) {
        console.error('Error fetching storefront data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = ['ALL', ...Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)))];

  const filteredProducts = selectedCategory === 'ALL' 
    ? products 
    : products.filter((p: any) => p.category === selectedCategory);

  return (
    <div className="storefront-container">
      {/* Hero Banner */}
      <section className="hero-banner">
        <h1 className="hero-title">Discover Curated Artisan Goods</h1>
        <p className="hero-subtitle">
          Connect directly with verified independent sellers, artisans, and boutique creators worldwide on Two Souls.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            className="btn-primary" 
            style={{ padding: '0.8rem 1.8rem', fontSize: '1rem' }}
            onClick={() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Catalog 🛍️
          </button>
        </div>
      </section>

      {/* Sellers Spotlight Bar */}
      {sellers.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.2rem', fontFamily: 'var(--font-heading)' }}>
            Featured Verified Sellers ✨
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {sellers.map((s: any) => (
              <div 
                key={s.seller_id} 
                style={{
                  background: 'rgba(18, 24, 38, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  backdropFilter: 'blur(12px)'
                }}
              >
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, color: '#ffffff', fontSize: '1.2rem'
                }}>
                  {s.store_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{s.store_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{s.business_name || 'Independent Creator'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Catalog & Filter */}
      <section id="catalog-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
            Marketplace Products
          </h3>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedCategory === cat ? '#ffffff' : '#94a3b8',
                  border: '1px solid ' + (selectedCategory === cat ? '#818cf8' : 'rgba(255, 255, 255, 0.1)'),
                  padding: '0.4rem 1rem',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', background: 'rgba(18, 24, 38, 0.5)', borderRadius: '16px' }}>
            No products available in this category yet.
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((p: any) => (
              <div key={p.product_id} className="product-card">
                <img 
                  src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'} 
                  alt={p.title} 
                  className="product-card-img" 
                />
                <div className="product-card-body">
                  <span className="product-card-tag">{p.category || 'General'}</span>
                  <h4 className="product-card-title">{p.title}</h4>
                  {p.description && (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.4rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.description}
                    </p>
                  )}
                  <div className="product-card-price">
                    <span>${Number(p.sell_price || 0).toFixed(2)}</span>
                    <button className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Storefront;
