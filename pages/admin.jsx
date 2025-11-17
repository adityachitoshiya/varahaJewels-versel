import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  Tag, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  TrendingUp,
  FileText,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/get-orders');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
        
        // Calculate stats
        const totalRevenue = data.orders.reduce((sum, order) => sum + order.amount, 0);
        const pending = data.orders.filter(o => o.status === 'pending').length;
        const completed = data.orders.filter(o => o.status === 'completed').length;
        
        setStats({
          totalOrders: data.orders.length,
          totalRevenue,
          pendingOrders: pending,
          completedOrders: completed
        });
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard - Varaha Jewels</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-heritage border-b border-heritage/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-royal font-bold text-warm-sand">Admin Panel</h1>
                <span className="px-3 py-1 bg-copper text-warm-sand text-xs font-semibold rounded-full">
                  Varaha Jewels
                </span>
              </div>
              <Link
                href="/"
                className="px-4 py-2 bg-warm-sand text-heritage font-medium rounded-sm hover:bg-copper hover:text-warm-sand transition-all duration-300"
              >
                Back to Website
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-copper/30 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-copper/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="text-copper" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <h3 className="text-2xl font-bold text-heritage mb-1">{stats.totalOrders}</h3>
              <p className="text-sm text-heritage/60">Total Orders</p>
            </div>

            <div className="bg-white border border-copper/30 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <h3 className="text-2xl font-bold text-heritage mb-1">₹{stats.totalRevenue.toLocaleString('en-IN')}</h3>
              <p className="text-sm text-heritage/60">Total Revenue</p>
            </div>

            <div className="bg-white border border-copper/30 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FileText className="text-yellow-600" size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-heritage mb-1">{stats.pendingOrders}</h3>
              <p className="text-sm text-heritage/60">Pending Orders</p>
            </div>

            <div className="bg-white border border-copper/30 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="text-purple-600" size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-heritage mb-1">{stats.completedOrders}</h3>
              <p className="text-sm text-heritage/60">Completed Orders</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border border-copper/30 rounded-sm mb-8">
            <div className="border-b border-copper/30">
              <nav className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-copper text-copper'
                      : 'border-transparent text-heritage/60 hover:text-heritage'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={18} />
                    Orders
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === 'products'
                      ? 'border-copper text-copper'
                      : 'border-transparent text-heritage/60 hover:text-heritage'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package size={18} />
                    Products
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === 'coupons'
                      ? 'border-copper text-copper'
                      : 'border-transparent text-heritage/60 hover:text-heritage'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag size={18} />
                    Coupons
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === 'customers'
                      ? 'border-copper text-copper'
                      : 'border-transparent text-heritage/60 hover:text-heritage'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={18} />
                    Customers
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <OrdersTab 
                  orders={orders} 
                  loading={loading} 
                  onRefresh={fetchOrders}
                  onViewOrder={setSelectedOrder}
                />
              )}
              {activeTab === 'products' && <ProductsTab />}
              {activeTab === 'coupons' && <CouponsTab />}
              {activeTab === 'customers' && <CustomersTab orders={orders} />}
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </>
  );
}

// Orders Tab Component
function OrdersTab({ orders, loading, onRefresh, onViewOrder }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-copper border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-heritage/70">Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-heritage">Recent Orders</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-copper text-warm-sand rounded-sm hover:bg-heritage transition-all duration-300"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-heritage/5">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Order ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Product</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-copper/20">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-heritage/5">
                <td className="px-4 py-3 text-sm font-mono text-heritage">{order.id}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium text-heritage">{order.customer.name}</div>
                  <div className="text-xs text-heritage/60">{order.customer.email}</div>
                </td>
                <td className="px-4 py-3 text-sm text-heritage">
                  {order.product.productName} x {order.product.quantity}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-heritage">
                  ₹{order.amount.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-heritage/70">
                  {new Date(order.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <button 
                    onClick={() => onViewOrder(order)}
                    className="p-2 hover:bg-heritage/10 rounded"
                  >
                    <Eye size={16} className="text-heritage" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Products Tab Component
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-copper border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-heritage/70">Loading products...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-heritage">Products</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-copper text-warm-sand rounded-sm hover:bg-heritage transition-all duration-300 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-warm-sand border border-copper/20 rounded-sm p-4">
            <img 
              src={product.images?.[0] || '/placeholder.jpg'} 
              alt={product.name}
              className="w-full h-48 object-cover rounded-sm mb-4"
            />
            <h3 className="font-bold text-heritage mb-2">{product.name}</h3>
            <p className="text-sm text-heritage/70 mb-2 line-clamp-2">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-heritage">₹{product.price?.toLocaleString('en-IN')}</span>
              <button 
                onClick={() => handleDeleteProduct(product.id)}
                className="p-2 hover:bg-heritage/10 rounded text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-heritage/70">
          No products found. Add your first product!
        </div>
      )}

      {showAddForm && <AddProductForm onClose={() => setShowAddForm(false)} onSuccess={fetchProducts} />}
    </div>
  );
}

// Coupons Tab Component
function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons');
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (response.ok) {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-copper border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-heritage/70">Loading coupons...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-heritage">Coupon Codes</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-copper text-warm-sand rounded-sm hover:bg-heritage transition-all duration-300 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div key={coupon.code} className="bg-warm-sand border border-copper/20 rounded-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-heritage font-mono">{coupon.code}</h3>
                <p className="text-sm text-heritage/70 mt-1">{coupon.description}</p>
              </div>
              <button 
                onClick={() => handleDeleteCoupon(coupon.code)}
                className="p-2 hover:bg-heritage/10 rounded text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-heritage/70">Discount:</span>
                <span className="font-semibold text-heritage">
                  {coupon.type === 'percentage' ? `${coupon.discount}%` : `₹${coupon.discount}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-heritage/70">Usage Limit:</span>
                <span className="font-semibold text-heritage">
                  {coupon.usageLimit === -1 ? 'Unlimited' : coupon.usageLimit}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-heritage/70">Used:</span>
                <span className="font-semibold text-heritage">{coupon.usedCount || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {coupons.length === 0 && (
        <div className="text-center py-12 text-heritage/70">
          No coupons found. Add your first coupon!
        </div>
      )}

      {showAddForm && <AddCouponForm onClose={() => setShowAddForm(false)} onSuccess={fetchCoupons} />}
    </div>
  );
}

// Customers Tab Component
function CustomersTab({ orders }) {
  const uniqueCustomers = orders.reduce((acc, order) => {
    const email = order.customer.email;
    if (!acc[email]) {
      acc[email] = {
        email,
        name: order.customer.name,
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: order.createdAt
      };
    }
    acc[email].totalOrders++;
    acc[email].totalSpent += order.amount;
    if (new Date(order.createdAt) > new Date(acc[email].lastOrder)) {
      acc[email].lastOrder = order.createdAt;
    }
    return acc;
  }, {});

  const customers = Object.values(uniqueCustomers);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-heritage">Customers</h2>
        <span className="text-sm text-heritage/60">{customers.length} total customers</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-heritage/5">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Orders</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Total Spent</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-heritage">Last Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-copper/20">
            {customers.map((customer) => (
              <tr key={customer.email} className="hover:bg-heritage/5">
                <td className="px-4 py-3 text-sm font-medium text-heritage">{customer.name}</td>
                <td className="px-4 py-3 text-sm text-heritage/70">{customer.email}</td>
                <td className="px-4 py-3 text-sm text-heritage">{customer.totalOrders}</td>
                <td className="px-4 py-3 text-sm font-semibold text-heritage">
                  ₹{customer.totalSpent.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-sm text-heritage/70">
                  {new Date(customer.lastOrder).toLocaleDateString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Order Detail Modal Component
function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-warm-sand rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-ivory-smoke p-6 flex items-center justify-between border-b border-copper/20">
          <h2 className="text-2xl font-bold text-heritage">Order Details</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-heritage/10 rounded"
          >
            <X size={24} className="text-heritage" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-heritage mb-3">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-heritage/70">Order ID:</span>
                <p className="font-mono text-heritage font-medium">{order.id}</p>
              </div>
              <div>
                <span className="text-heritage/70">Status:</span>
                <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status}
                </p>
              </div>
              <div>
                <span className="text-heritage/70">Date:</span>
                <p className="text-heritage">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-heritage/70">Payment ID:</span>
                <p className="font-mono text-heritage text-xs">{order.razorpayPaymentId || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-heritage mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-heritage/70">Name:</span>
                <p className="text-heritage font-medium">{order.customer.name}</p>
              </div>
              <div>
                <span className="text-heritage/70">Email:</span>
                <p className="text-heritage">{order.customer.email}</p>
              </div>
              <div>
                <span className="text-heritage/70">Phone:</span>
                <p className="text-heritage">{order.customer.phone}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-heritage mb-3">Shipping Address</h3>
            <p className="text-heritage text-sm">
              {order.address.street}<br />
              {order.address.city}, {order.address.state} - {order.address.pincode}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-heritage mb-3">Product Details</h3>
            <div className="border border-copper/20 rounded-sm p-4">
              <p className="font-semibold text-heritage">{order.product.productName}</p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-heritage/70">Quantity:</span>
                  <p className="text-heritage">{order.product.quantity}</p>
                </div>
                <div>
                  <span className="text-heritage/70">Price:</span>
                  <p className="text-heritage">₹{order.product.price?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-heritage/70">Variant:</span>
                  <p className="text-heritage">{order.product.variant || 'Standard'}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-heritage mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              {order.originalAmount && (
                <div className="flex justify-between">
                  <span className="text-heritage/70">Original Amount:</span>
                  <span className="text-heritage line-through">₹{order.originalAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {order.discountAmount && (
                <>
                  <div className="flex justify-between text-green-700">
                    <span>Discount ({order.couponCode}):</span>
                    <span>- ₹{order.discountAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-copper/20 pt-2"></div>
                </>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span className="text-heritage">Final Amount:</span>
                <span className="text-heritage">₹{order.amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Product Form Component
function AddProductForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    images: [''],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          images: formData.images.filter(img => img.trim() !== '')
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-warm-sand rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-ivory-smoke p-6 flex items-center justify-between border-b border-copper/20">
          <h2 className="text-2xl font-bold text-heritage">Add New Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-heritage/10 rounded">
            <X size={24} className="text-heritage" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-heritage mb-2">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:border-heritage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heritage mb-2">Description *</label>
            <textarea
              required
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:border-heritage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heritage mb-2">Price (₹) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:border-heritage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heritage mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:border-heritage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heritage mb-2">Image URL</label>
            <input
              type="url"
              value={formData.images[0]}
              onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:border-heritage"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-copper text-warm-sand rounded-sm hover:bg-heritage transition-all duration-300 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-copper/30 text-heritage rounded-sm hover:bg-heritage/10 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Coupon Form Component
function AddCouponForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    discount: '',
    description: '',
    usageLimit: -1
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          code: formData.code.toUpperCase(),
          discount: parseFloat(formData.discount),
          usageLimit: parseInt(formData.usageLimit)
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add coupon');
      }
    } catch (error) {
      console.error('Error adding coupon:', error);
      alert('Error adding coupon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-warm-sand rounded-sm max-w-lg w-full">
        <div className="bg-ivory-smoke p-6 flex items-center justify-between border-b border-copper/20">
          <h2 className="text-2xl font-bold text-heritage">Add New Coupon</h2>
          <button onClick={onClose} className="p-2 hover:bg-heritage/10 rounded">
            <X size={24} className="text-heritage" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-heritage mb-2">Coupon Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="SUMMER2024"
              className="w-full px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:border-heritage font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heritage mb-2">Discount Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:border-heritage"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-heritage mb-2">
              Discount Value * {formData.type === 'percentage' ? '(%)' : '(₹)'}
            </label>
            <input
              type="number"
              required
              min="0"
              max={formData.type === 'percentage' ? '100' : undefined}
              step={formData.type === 'percentage' ? '1' : '0.01'}
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              className="w-full px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:border-heritage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heritage mb-2">Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Limited time offer"
              className="w-full px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:border-heritage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heritage mb-2">Usage Limit (-1 for unlimited)</label>
            <input
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              className="w-full px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:border-heritage"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-copper text-warm-sand rounded-sm hover:bg-heritage transition-all duration-300 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Coupon'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-copper/30 text-heritage rounded-sm hover:bg-heritage/10 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
