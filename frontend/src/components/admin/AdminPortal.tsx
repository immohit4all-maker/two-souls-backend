import { useState, useEffect } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { getSellers, createSeller, updateSeller, deleteSeller } from '../../services/sellerService';
import { getProducts, createProduct, updateProduct, deleteProduct, getUploadUrl } from '../../services/productService';
import './Admin.css';

const AddSellerModal = ({ isOpen, onClose, onAdd, initialData }: any) => {
  const [seller, setSeller] = useState(initialData || { name: '', email: '', store_name: '', business_name: '' });

  useEffect(() => { setSeller(initialData || { name: '', email: '', store_name: '', business_name: '' }); }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{initialData ? 'Edit Seller' : 'Add New Seller'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onAdd(seller); }}>
          <div className="form-group"><label>Contact Name</label><input className="form-input" value={seller.name} onChange={e => setSeller({...seller, name: e.target.value})} required /></div>
          <div className="form-group"><label>Email</label><input className="form-input" type="email" value={seller.email} onChange={e => setSeller({...seller, email: e.target.value})} required /></div>
          <div className="form-group"><label>Store Name</label><input className="form-input" value={seller.store_name} onChange={e => setSeller({...seller, store_name: e.target.value})} required /></div>
          <div className="form-group"><label>Business Name</label><input className="form-input" value={seller.business_name} onChange={e => setSeller({...seller, business_name: e.target.value})} required /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddProductModal = ({ isOpen, onClose, onSave, initialData }: any) => {
  const [product, setProduct] = useState(initialData || { title: '', category: '', buy_price: '', sell_price: '', stock_quantity: '' });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { setProduct(initialData || { title: '', category: '', buy_price: '', sell_price: '', stock_quantity: '' }); }, [initialData]);

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
          <div className="form-group"><label>Category</label><input className="form-input" value={product.category} onChange={e => setProduct({...product, category: e.target.value})} required /></div>
          <div className="form-group"><label>Buy Price</label><input className="form-input" type="number" value={product.buy_price} onChange={e => setProduct({...product, buy_price: e.target.value})} required /></div>
          <div className="form-group"><label>Sell Price</label><input className="form-input" type="number" value={product.sell_price} onChange={e => setProduct({...product, sell_price: e.target.value})} required /></div>
          <div className="form-group"><label>Stock</label><input className="form-input" type="number" value={product.stock_quantity} onChange={e => setProduct({...product, stock_quantity: e.target.value})} required /></div>
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
            <tr><th>Store Name</th><th>Business Name</th><th>Contact Name</th><th>Email</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {sellers.map((s: any) => (
              <tr key={s.seller_id}>
                <td>{s.store_name}</td>
                <td>{s.business_name}</td>
                <td>{s.name}</td>
                <td>{s.email}</td>
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
    if(window.confirm('Are you sure?')) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card">
      <div className="page-header">
        <h3>Product Catalog</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <input className="form-input" placeholder="Search products..." style={{ width: '250px' }} onChange={e => setSearchTerm(e.target.value)} />
            <button className="btn-primary" onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>+ Add Product</button>
        </div>
      </div>
      {loading ? <div className="loading-spinner">Loading...</div> : (
        <table className="data-table">
          <thead>
            <tr><th>Image</th><th>Title</th><th>Category</th><th>Buy Price</th><th>Sell Price</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredProducts.map((p: any) => (
              <tr key={p.product_id}>
                <td>{p.imageUrl && <img src={p.imageUrl} alt={p.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />}</td>
                <td>{p.title}</td>
                <td>{p.category}</td>
                <td>{p.buy_price}</td>
                <td>{p.sell_price}</td>
                <td>{p.stock_quantity}</td>
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

const AdminPortal = () => {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2>Two Souls Admin</h2>
        <nav className="sidebar-nav">
          <NavLink to="/admin/sellers" className="sidebar-link">Manage Sellers</NavLink>
          <NavLink to="/admin/products">Manage Products</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="sellers" element={<SellersManager />} />
          <Route path="products" element={<ProductManager />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPortal;
