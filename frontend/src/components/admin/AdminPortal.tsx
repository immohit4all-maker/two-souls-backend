import { useState, useEffect } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { getSellers, createSeller, updateSeller, deleteSeller } from '../../services/sellerService';
import { getProducts, createProduct, updateProduct, deleteProduct, getUploadUrl } from '../../services/productService';
import { getOrders, updateOrder, deleteOrder } from '../../services/orderService';
import './Admin.css';

const AddSellerModal = ({ isOpen, onClose, onAdd, initialData }: any) => {
  const [seller, setSeller] = useState(initialData || {
    name: '', email: '', phone_number: '', store_name: '', business_name: '', tax_id: '', status: 'ACTIVE', commission_rate: 10
  });

  useEffect(() => {
    setSeller(initialData || {
      name: '', email: '', phone_number: '', store_name: '', business_name: '', tax_id: '', status: 'ACTIVE', commission_rate: 10
    });
  }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{initialData ? 'Edit Seller' : 'Add New Seller'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onAdd(seller); }}>
          <div className="form-group"><label>Store Name</label><input className="form-input" value={seller.store_name} onChange={e => setSeller({...seller, store_name: e.target.value})} required /></div>
          <div className="form-group"><label>Business Name</label><input className="form-input" value={seller.business_name} onChange={e => setSeller({...seller, business_name: e.target.value})} required /></div>
          <div className="form-group"><label>Contact Name</label><input className="form-input" value={seller.name} onChange={e => setSeller({...seller, name: e.target.value})} required /></div>
          <div className="form-group"><label>Email</label><input className="form-input" type="email" value={seller.email} onChange={e => setSeller({...seller, email: e.target.value})} required /></div>
          <div className="form-group"><label>Phone Number</label><input className="form-input" value={seller.phone_number || ''} onChange={e => setSeller({...seller, phone_number: e.target.value})} /></div>
          <div className="form-group"><label>Tax ID / GSTIN</label><input className="form-input" value={seller.tax_id || ''} onChange={e => setSeller({...seller, tax_id: e.target.value})} /></div>
          <div className="form-group"><label>Commission Rate (%)</label><input className="form-input" type="number" step="0.1" value={seller.commission_rate || 10} onChange={e => setSeller({...seller, commission_rate: parseFloat(e.target.value)})} /></div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-input" value={seller.status || 'ACTIVE'} onChange={e => setSeller({...seller, status: e.target.value})}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="btn-primary">Save Seller</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddProductModal = ({ isOpen, onClose, onSave, initialData }: any) => {
  const [product, setProduct] = useState(initialData || {
    title: '', category: '', sku: '', buy_price: '', sell_price: '', stock_quantity: '', status: 'PUBLISHED', description: ''
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setProduct(initialData || {
      title: '', category: '', sku: '', buy_price: '', sell_price: '', stock_quantity: '', status: 'PUBLISHED', description: ''
    });
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = product.imageUrl || '';
    if (file) {
      const uploadUrl = await getUploadUrl(file.name, file.type);
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
      imageUrl = uploadUrl.split('?')[0];
    }
    await onSave({ ...product, imageUrl });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{initialData ? 'Edit Product' : 'Add New Product'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Title</label><input className="form-input" value={product.title} onChange={e => setProduct({...product, title: e.target.value})} required /></div>
          <div className="form-group"><label>SKU</label><input className="form-input" value={product.sku || ''} onChange={e => setProduct({...product, sku: e.target.value})} placeholder="e.g. MUG-001" /></div>
          <div className="form-group"><label>Category</label><input className="form-input" value={product.category} onChange={e => setProduct({...product, category: e.target.value})} required /></div>
          <div className="form-group"><label>Buy Price (Cost)</label><input className="form-input" type="number" step="0.01" value={product.buy_price} onChange={e => setProduct({...product, buy_price: e.target.value})} required /></div>
          <div className="form-group"><label>Sell Price (Retail)</label><input className="form-input" type="number" step="0.01" value={product.sell_price} onChange={e => setProduct({...product, sell_price: e.target.value})} required /></div>
          <div className="form-group"><label>Stock Quantity</label><input className="form-input" type="number" value={product.stock_quantity} onChange={e => setProduct({...product, stock_quantity: e.target.value})} required /></div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-input" value={product.status || 'PUBLISHED'} onChange={e => setProduct({...product, status: e.target.value})}>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
          <div className="form-group"><label>Description</label><textarea className="form-input" value={product.description || ''} onChange={e => setProduct({...product, description: e.target.value})} rows={3} /></div>
          <div className="form-group"><label>Image</label><input type="file" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="btn-primary">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SellersManager = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<any>(null);

  useEffect(() => { fetchSellers(); }, []);

  const fetchSellers = async () => {
    setLoading(true);
    const data = await getSellers();
    setSellers(data);
    setLoading(false);
  };

  const handleSaveSeller = async (seller: any) => {
    if (editingSeller) await updateSeller(seller);
    else await createSeller(seller);
    setIsModalOpen(false);
    setEditingSeller(null);
    fetchSellers();
  };

  const handleDeleteSeller = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this seller?')) {
      await deleteSeller(id);
      fetchSellers();
    }
  };

  return (
    <div className="card">
      <div className="page-header">
        <h3>Sellers Management</h3>
        <button className="btn-primary" onClick={() => { setEditingSeller(null); setIsModalOpen(true); }}>+ Add Seller</button>
      </div>
      {loading ? <div className="loading-spinner">Loading...</div> : (
        <table className="data-table">
          <thead>
            <tr><th>Store Name</th><th>Business Name</th><th>Contact</th><th>Email</th><th>Status</th><th>Commission</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {sellers.map((s: any) => (
              <tr key={s.seller_id}>
                <td><strong>{s.store_name}</strong></td>
                <td>{s.business_name}</td>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td><span className={`status-pill ${s.status?.toLowerCase() || 'active'}`}>{s.status || 'ACTIVE'}</span></td>
                <td>{s.commission_rate || 10}%</td>
                <td>
                  <button onClick={() => { setEditingSeller(s); setIsModalOpen(true); }} className="btn-primary" style={{ padding: '4px 8px', marginRight: '10px' }}>Edit</button>
                  <button onClick={() => handleDeleteSeller(s.seller_id)} className="btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <AddSellerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleSaveSeller} initialData={editingSeller} />
    </div>
  );
};

const ProductManager = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleSaveProduct = async (product: any) => {
    if (editingProduct) await updateProduct(product);
    else await createProduct(product);
    setIsModalOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card">
      <div className="page-header">
        <h3>Product Catalog</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <input className="form-input" placeholder="Search title or SKU..." style={{ width: '250px' }} onChange={e => setSearchTerm(e.target.value)} />
            <button className="btn-primary" onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>+ Add Product</button>
        </div>
      </div>
      {loading ? <div className="loading-spinner">Loading...</div> : (
        <table className="data-table">
          <thead>
            <tr><th>Image</th><th>Title & SKU</th><th>Category</th><th>Buy Price</th><th>Sell Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredProducts.map((p: any) => (
              <tr key={p.product_id}>
                <td>{p.imageUrl && <img src={p.imageUrl} alt={p.title} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} />}</td>
                <td>
                  <strong>{p.title}</strong>
                  {p.sku && <div style={{ fontSize: '0.8rem', color: '#666' }}>SKU: {p.sku}</div>}
                </td>
                <td>{p.category}</td>
                <td>${Number(p.buy_price || 0).toFixed(2)}</td>
                <td><strong>${Number(p.sell_price || 0).toFixed(2)}</strong></td>
                <td>{p.stock_quantity}</td>
                <td><span className={`status-pill ${p.status?.toLowerCase() || 'published'}`}>{p.status || 'PUBLISHED'}</span></td>
                <td>
                  <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="btn-primary" style={{ padding: '4px 8px', marginRight: '10px' }}>Edit</button>
                  <button onClick={() => handleDeleteProduct(p.product_id)} className="btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProduct} initialData={editingProduct} />
    </div>
  );
};

const OrdersManager = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  const handleStatusChange = async (order: any, newStatus: string) => {
    await updateOrder({ ...order, status: newStatus });
    fetchOrders();
  };

  const handleDeleteOrder = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this order?')) {
      await deleteOrder(id);
      fetchOrders();
    }
  };

  return (
    <div className="card">
      <div className="page-header">
        <h3>Orders Management</h3>
      </div>
      {loading ? <div className="loading-spinner">Loading...</div> : (
        <table className="data-table">
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Total Amount</th><th>Payment Status</th><th>Fulfillment Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.order_id}>
                <td><strong>{o.order_number || o.order_id?.substring(0, 8)}</strong></td>
                <td>{o.shipping_address?.full_name || o.customer_id || 'N/A'}</td>
                <td><strong>${Number(o.total_amount || 0).toFixed(2)}</strong> ({o.currency || 'USD'})</td>
                <td><span className="status-pill active">{o.payment_status || 'PAID'}</span></td>
                <td>
                  <select 
                    value={o.status || 'PROCESSING'} 
                    onChange={e => handleStatusChange(o, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px' }}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => handleDeleteOrder(o.order_id)} className="btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const AdminStats = () => {
  const [stats, setStats] = useState({ sellersCount: 0, productsCount: 0, ordersCount: 0, totalRevenue: 0 });

  useEffect(() => {
    Promise.all([getSellers(), getProducts(), getOrders()]).then(([sellers, products, orders]) => {
      const rev = (orders || []).reduce((acc: number, curr: any) => acc + Number(curr.total_amount || 0), 0);
      setStats({
        sellersCount: (sellers || []).length,
        productsCount: (products || []).length,
        ordersCount: (orders || []).length,
        totalRevenue: rev
      });
    }).catch(err => console.error(err));
  }, []);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-header">Total Marketplace Revenue</div>
        <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
        <div className="stat-subtext">↑ 14.2% vs last month</div>
      </div>
      <div className="stat-card">
        <div className="stat-header">Active Sellers</div>
        <div className="stat-value">{stats.sellersCount}</div>
        <div className="stat-subtext">Verified Merchant Partners</div>
      </div>
      <div className="stat-card">
        <div className="stat-header">Catalog Products</div>
        <div className="stat-value">{stats.productsCount}</div>
        <div className="stat-subtext">Published Listings</div>
      </div>
      <div className="stat-card">
        <div className="stat-header">Orders Volume</div>
        <div className="stat-value">{stats.ordersCount}</div>
        <div className="stat-subtext">Total Processed Orders</div>
      </div>
    </div>
  );
};

const AdminPortal = () => {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2>⚡ Two Souls Admin</h2>
        <nav className="sidebar-nav">
          <NavLink to="/admin/sellers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            🏪 Manage Sellers
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            📦 Manage Products
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            📑 Manage Orders
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <AdminStats />
        <Routes>
          <Route path="sellers" element={<SellersManager />} />
          <Route path="products" element={<ProductManager />} />
          <Route path="orders" element={<OrdersManager />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPortal;


