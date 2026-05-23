import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Plus, Trash2, Edit2, Check, X, LayoutGrid, Coffee, Users, DollarSign, QrCode, TrendingUp, BarChart2, FileText, Download, Layers, Activity, Printer } from 'lucide-react';

const AdminDashboard = () => {
  const { getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'tables', 'stats'
  
  // Menu states
  const [menuItems, setMenuItems] = useState([]);
  const [newFood, setNewFood] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    isVeg: true,
    spicyLevel: 0,
    image: '',
  });

  // Table states
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ number: '', capacity: 4 });

  // Stats / Orders states
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded Restaurant Analytics states
  const [stats, setStats] = useState({
    totalDailySales: 0,
    paidSales: 0,
    unpaidSales: 0,
    totalOrdersToday: 0,
    activeTables: 0,
    pendingKitchenOrders: 0,
    deliveredOrdersToday: 0
  });
  const [chartData, setChartData] = useState({
    revenueLast7Days: [],
    hourlyTrends: []
  });
  const [topItems, setTopItems] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null); // stores active invoice modal

  useEffect(() => {
    fetchData();
  }, [activeTab]); // Refetch when switching tabs for up-to-date real-time metrics!

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Perform parallel data fetching
      const [menuRes, tablesRes, ordersRes, statsRes, chartsRes, topItemsRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/menu`),
        fetch(`${API_BASE_URL}/tables`),
        fetch(`${API_BASE_URL}/orders`, { headers }),
        fetch(`${API_BASE_URL}/analytics/stats`, { headers }),
        fetch(`${API_BASE_URL}/analytics/charts`, { headers }),
        fetch(`${API_BASE_URL}/analytics/top-items`, { headers }),
        fetch(`${API_BASE_URL}/analytics/history`, { headers }),
      ]);

      const menuData = await menuRes.json();
      const tablesData = await tablesRes.json();
      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      const chartsData = await chartsRes.json();
      const topItemsData = await topItemsRes.json();
      const historyData = await historyRes.json();

      if (menuData.success) setMenuItems(menuData.data);
      if (tablesData.success) setTables(tablesData.data);
      if (ordersData.success) setOrders(ordersData.data);
      if (statsData.success) setStats(statsData.data);
      if (chartsData.success) setChartData(chartsData.data);
      if (topItemsData.success) setTopItems(topItemsData.data);
      if (historyData.success) setBillHistory(historyData.data);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!newFood.name || !newFood.price || !newFood.description) {
      alert('Please fill out all fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/menu`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newFood),
      });
      const data = await response.json();
      if (data.success) {
        setMenuItems([...menuItems, data.data]);
        setNewFood({
          name: '',
          description: '',
          price: '',
          category: 'Main Course',
          isVeg: true,
          spicyLevel: 0,
          image: '',
        });
        alert('Menu item added successfully');
      } else {
        alert(data.message || 'Error adding menu item');
      }
    } catch (err) {
      alert('Network error adding menu item');
    }
  };

  const handleDeleteFood = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setMenuItems(menuItems.filter(item => item._id !== id));
      } else {
        alert(data.message || 'Error deleting item');
      }
    } catch (err) {
      alert('Server error deleting item');
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTable.number) {
      alert('Please enter table number');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tables`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newTable),
      });
      const data = await response.json();
      if (data.success) {
        setTables([...tables, data.data].sort((a, b) => a.number - b.number));
        setNewTable({ number: '', capacity: 4 });
        alert('Table added successfully');
      } else {
        alert(data.message || 'Error adding table');
      }
    } catch (err) {
      alert('Network error adding table');
    }
  };

  // Structured Reporting CSV Exporter
  const exportSalesReportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'FoodForMe Restaurant Analytics Report\n';
    csvContent += `Generated At,${new Date().toLocaleString()}\n\n`;
    
    csvContent += 'KEY PERFORMANCE METRICS\n';
    csvContent += `Total Daily Revenue,₹${stats.totalDailySales}\n`;
    csvContent += `Paid Revenue,₹${stats.paidSales}\n`;
    csvContent += `Active Unpaid Revenue,₹${stats.unpaidSales}\n`;
    csvContent += `Total Orders Placed Today,${stats.totalOrdersToday}\n`;
    csvContent += `Delivered Orders Today,${stats.deliveredOrdersToday}\n`;
    csvContent += `Active Dining Tables,${stats.activeTables}\n\n`;
    
    csvContent += '7-DAY REVENUE LOG\n';
    csvContent += 'Date,Sales (INR)\n';
    (chartData.revenueLast7Days || []).forEach(d => {
      csvContent += `${d.date},₹${d.sales}\n`;
    });
    
    csvContent += '\nTOP SELLING DISHES\n';
    csvContent += 'Dish Name,Category,Price,Total Quantity Ordered\n';
    topItems.forEach(item => {
      csvContent += `"${item.foodItem?.name || 'Dish'}",${item.foodItem?.category || '-'},₹${item.foodItem?.price || 0},${item.count}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `foodforme_restaurant_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Historical Billing Log CSV Exporter
  const exportBillHistoryCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'FoodForMe Historical Bills Ledger\n';
    csvContent += `Generated At,${new Date().toLocaleString()}\n\n`;
    csvContent += 'Invoice ID,Table,Subtotal,Tax (5%),Service Charge (10%),Grand Total,Payment Method,Payment Status,Date,Time\n';
    
    billHistory.forEach(bill => {
      const date = new Date(bill.createdAt).toLocaleDateString();
      const time = new Date(bill.createdAt).toLocaleTimeString();
      csvContent += `${bill._id.toUpperCase()},#${bill.tableNumber},₹${bill.subTotal},₹${bill.tax},₹${bill.serviceCharge},₹${bill.totalAmount},${bill.paymentMethod},${bill.paymentStatus},${date},${time}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `foodforme_bills_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG coordinates calculations for line chart
  const revenuePoints = chartData.revenueLast7Days || [];
  const salesValues = revenuePoints.map(r => r.sales);
  const maxSalesVal = Math.max(...salesValues, 1000);
  const maxSales = Math.ceil(maxSalesVal / 1000) * 1000;

  const points = revenuePoints.map((r, i) => {
    const w = 500;
    const h = 200;
    const leftPad = 50;
    const rightPad = 20;
    const topPad = 25;
    const botPad = 40;
    
    const xStep = (w - leftPad - rightPad) / Math.max(1, revenuePoints.length - 1);
    const x = leftPad + i * xStep;
    const usableHeight = h - botPad - topPad;
    const y = (h - botPad) - (r.sales / maxSales) * usableHeight;
    return { x, y, r };
  });

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z` : '';

  // Max orders count for hourly trends
  const maxOrdersVal = Math.max(...(chartData.hourlyTrends || []).map(h => h.ordersCount), 1);
  const maxOrders = Math.ceil(maxOrdersVal / 2) * 2;

  // Max ordered food quantity for progress bars
  const maxTopQty = Math.max(...topItems.map(i => i.count), 1);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-display">Administrator Panel</h1>
          <p className="text-sm text-dark-300">Manage digital menu, dining tables, and restaurant performance</p>
        </div>
        
        {/* Tab Selection */}
        <div className="flex bg-dark-900 border border-dark-850 p-1.5 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'menu' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'
            }`}
          >
            Manage Menu
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tables' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'
            }`}
          >
            Dining Tables
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'stats' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'
            }`}
          >
            Insights & Stats
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Main Tabs Component Rendering */}

          {/* Tab 1: Menu Items Management */}
          {activeTab === 'menu' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form: Add Item */}
              <div className="lg:col-span-1">
                <div className="glass p-6 rounded-2xl border-dark-850 sticky top-28">
                  <h2 className="text-lg font-bold text-white mb-4">Add Menu Item</h2>
                  <form onSubmit={handleAddFood} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-300 mb-1.5">Dish Name</label>
                      <input
                        type="text"
                        value={newFood.name}
                        onChange={e => setNewFood({ ...newFood, name: e.target.value })}
                        placeholder="e.g. Garlic Bread"
                        className="w-full text-xs glass-input"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-dark-300 mb-1.5">Price (₹)</label>
                        <input
                          type="number"
                          value={newFood.price}
                          onChange={e => setNewFood({ ...newFood, price: parseInt(e.target.value) || '' })}
                          placeholder="e.g. 199"
                          className="w-full text-xs glass-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-dark-300 mb-1.5">Category</label>
                        <select
                          value={newFood.category}
                          onChange={e => setNewFood({ ...newFood, category: e.target.value })}
                          className="w-full text-xs glass-input select-arrow"
                        >
                          <option value="Starters">Starters</option>
                          <option value="Main Course">Main Course</option>
                          <option value="Desserts">Desserts</option>
                          <option value="Beverages">Beverages</option>
                          <option value="Sides">Sides</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark-300 mb-1.5">Image URL</label>
                      <input
                        type="text"
                        value={newFood.image}
                        onChange={e => setNewFood({ ...newFood, image: e.target.value })}
                        placeholder="Unsplash / external image link"
                        className="w-full text-xs glass-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark-300 mb-1.5">Description</label>
                      <textarea
                        rows={2}
                        value={newFood.description}
                        onChange={e => setNewFood({ ...newFood, description: e.target.value })}
                        placeholder="Describe ingredients, portion, flavor..."
                        className="w-full text-xs glass-input resize-none"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t border-dark-850">
                      <span className="text-xs font-semibold text-dark-300">Is Vegetarian?</span>
                      <button
                        type="button"
                        onClick={() => setNewFood({ ...newFood, isVeg: !newFood.isVeg })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          newFood.isVeg
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {newFood.isVeg ? 'Vegetarian' : 'Non-Veg'}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-dark-300">Spicy Level</span>
                        <span className="text-xs font-bold text-amber-400">{newFood.spicyLevel} / 3</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        value={newFood.spicyLevel}
                        onChange={e => setNewFood({ ...newFood, spicyLevel: parseInt(e.target.value) })}
                        className="w-full accent-brand-500"
                      />
                    </div>

                    <button type="submit" className="w-full glass-btn-primary py-2.5 text-xs font-bold mt-2">
                      <Plus size={14} className="inline mr-1" /> Add to Menu
                    </button>
                  </form>
                </div>
              </div>

              {/* Menu Grid List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="glass p-6 rounded-2xl">
                  <h2 className="text-lg font-bold text-white mb-6">Active Menu Items</h2>
                  <div className="space-y-3">
                    {menuItems.map(item => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl border border-dark-850 bg-dark-900/20"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover bg-dark-950 flex-shrink-0" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-dark-850 flex items-center justify-center text-dark-400 flex-shrink-0">
                              <Coffee size={20} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                item.isVeg ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {item.isVeg ? 'V' : 'NV'}
                              </span>
                            </div>
                            <p className="text-xs text-dark-400 truncate max-w-md mt-0.5">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="font-bold text-sm text-brand-400">₹{item.price}</span>
                          <button
                            onClick={() => handleDeleteFood(item._id)}
                            className="text-dark-400 hover:text-rose-500 p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Dining Tables Management */}
          {activeTab === 'tables' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Add Table form */}
              <div className="lg:col-span-1">
                <div className="glass p-6 rounded-2xl sticky top-28">
                  <h2 className="text-lg font-bold text-white mb-4">Register New Table</h2>
                  <form onSubmit={handleAddTable} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-300 mb-1.5">Table Number</label>
                      <input
                        type="number"
                        value={newTable.number}
                        onChange={e => setNewTable({ ...newTable, number: parseInt(e.target.value) || '' })}
                        placeholder="e.g. 7"
                        className="w-full text-xs glass-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark-300 mb-1.5">Seating Capacity</label>
                      <input
                        type="number"
                        value={newTable.capacity}
                        onChange={e => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || '' })}
                        placeholder="e.g. 4"
                        className="w-full text-xs glass-input"
                        required
                      />
                    </div>

                    <button type="submit" className="w-full glass-btn-primary py-2.5 text-xs font-bold mt-2">
                      <Plus size={14} className="inline mr-1" /> Add Table
                    </button>
                  </form>

                  <div className="mt-8 border-t border-dark-850 pt-6 space-y-3">
                    <h3 className="text-xs font-bold text-white">QR Code Simulation Link</h3>
                    <p className="text-xs text-dark-400 leading-relaxed">
                      QR codes are placed physically on each table. Customers scanning them are redirected to:
                    </p>
                    <code className="block p-3 rounded-lg bg-dark-950 border border-dark-850 text-[10px] text-brand-400 break-all select-all font-mono">
                      http://localhost:5173/menu?table=NUM
                    </code>
                  </div>
                </div>
              </div>

              {/* Tables status grid */}
              <div className="lg:col-span-2">
                <div className="glass p-6 rounded-2xl">
                  <h2 className="text-lg font-bold text-white mb-6">Physical Table Grid & QR Mockups</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {tables.map(tbl => (
                      <div
                        key={tbl._id}
                        className="p-5 rounded-xl border border-dark-850 bg-dark-900/20 flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-extrabold text-white text-lg">Table {tbl.number}</h3>
                            <p className="text-xs text-dark-400 mt-0.5">{tbl.capacity} Seats Available</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            tbl.status === 'empty'
                              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/20'
                              : tbl.status === 'occupied'
                                ? 'bg-amber-950/70 text-amber-400 border border-amber-500/20'
                                : 'bg-dark-800 text-dark-400'
                          }`}>
                            {tbl.status}
                          </span>
                        </div>

                        {/* Interactive Visual QR Code Mockup */}
                        <div className="flex flex-col items-center justify-center bg-dark-950/40 border border-dark-850 p-4 rounded-xl mb-4 transition-all duration-300 hover:border-brand-500/30">
                          <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-lg relative overflow-hidden flex items-center justify-center group cursor-pointer transition-transform duration-300 hover:scale-105">
                            <img
                              src={`${API_BASE_URL}/tables/${tbl.number}/qr`}
                              alt={`QR Code for Table ${tbl.number}`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`http://localhost:5173/menu?table=${tbl.number}`)}`;
                              }}
                            />
                            <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <span className="text-[10px] text-dark-400 mt-2 font-medium tracking-wide">
                            Scan to Order • Table {tbl.number}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 border-t border-dark-850/60 pt-4">
                          <a
                            href={`/menu?table=${tbl.number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-dark-800 hover:bg-dark-750 text-dark-200 hover:text-white text-xs font-bold transition-all border border-dark-700 cursor-pointer"
                          >
                            <QrCode size={14} className="text-brand-400" />
                            <span>Scan (Customer)</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Expanded Restaurant Analytics & Reporting Console */}
          {activeTab === 'stats' && (
            <div className="space-y-8">
              
              {/* Premium Analytics Metric Summary Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-dark-850 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">Today's Revenue</p>
                    <p className="text-xl font-extrabold text-white mt-0.5">₹{stats.totalDailySales}</p>
                    <span className="text-[9px] text-dark-500 font-medium tracking-wide">₹{stats.paidSales} paid • ₹{stats.unpaidSales} active</span>
                  </div>
                </div>

                <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-dark-850 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-brand-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">Total Orders Today</p>
                    <p className="text-xl font-extrabold text-white mt-0.5">{stats.totalOrdersToday}</p>
                    <span className="text-[9px] text-dark-500 font-medium tracking-wide">{stats.deliveredOrdersToday} served & delivered</span>
                  </div>
                </div>

                <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-dark-850 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-indigo-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">Active Seated Tables</p>
                    <p className="text-xl font-extrabold text-white mt-0.5">{stats.activeTables}</p>
                    <span className="text-[9px] text-dark-500 font-medium tracking-wide">Currently dining traffic</span>
                  </div>
                </div>

                <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-dark-850 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-rose-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">Kitchen Load Queue</p>
                    <p className="text-xl font-extrabold text-white mt-0.5">{stats.pendingKitchenOrders} Pending</p>
                    <span className="text-[9px] text-dark-500 font-medium tracking-wide">Cooking / pending items</span>
                  </div>
                </div>
              </div>

              {/* Graphic charts Section */}
              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* 7-day Sales Revenue Line Chart */}
                <div className="lg:col-span-2 glass p-6 rounded-2xl border border-dark-850 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-dark-850 pb-4 mb-4">
                    <div>
                      <h3 className="font-extrabold text-white text-base">7-Day Sales Trend</h3>
                      <p className="text-xs text-dark-400 mt-0.5">Finalized paid checkout totals weekly log</p>
                    </div>
                    <button
                      onClick={exportSalesReportCSV}
                      className="glass bg-dark-850 hover:bg-dark-800 border border-dark-750 text-dark-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download size={13} />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* SVG line graph area */}
                  <div className="h-56 w-full flex items-center justify-center">
                    {revenuePoints.length === 0 ? (
                      <p className="text-xs text-dark-500 italic">No revenue log recorded yet</p>
                    ) : (
                      <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d97706" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Horizontal Grid guidelines */}
                        <line x1="50" y1="25" x2="480" y2="25" stroke="#222" strokeDasharray="3,3" />
                        <line x1="50" y1="92.5" x2="480" y2="92.5" stroke="#222" strokeDasharray="3,3" />
                        <line x1="50" y1="160" x2="480" y2="160" stroke="#333" />
                        
                        {/* Y axis text */}
                        <text x="42" y="28" textAnchor="end" fill="#555" fontSize="7" fontFamily="monospace">₹{maxSales}</text>
                        <text x="42" y="95.5" textAnchor="end" fill="#555" fontSize="7" fontFamily="monospace">₹{maxSales / 2}</text>
                        <text x="42" y="163" textAnchor="end" fill="#555" fontSize="7" fontFamily="monospace">₹0</text>
                        
                        {/* Area Gradient fill */}
                        {points.length > 0 && <path d={areaPath} fill="url(#areaGradient)" />}
                        {/* Glowing Line */}
                        {points.length > 0 && <path d={linePath} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_2px_8px_rgba(217,119,6,0.3)]" />}
                        
                        {/* Interactive Dot Nodes */}
                        {points.map((p, i) => (
                          <g key={i} className="group">
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="3.5"
                              fill="#d97706"
                              stroke="#fff"
                              strokeWidth="1"
                              className="cursor-pointer transition-all duration-300 group-hover:r-5 group-hover:fill-white"
                            />
                            {/* Floating values */}
                            <text
                              x={p.x}
                              y={p.y - 8}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize="8"
                              fontWeight="bold"
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none font-mono bg-dark-950 px-1 py-0.5 rounded border border-dark-700"
                            >
                              ₹{p.r.sales}
                            </text>
                          </g>
                        ))}
                        
                        {/* X Axis Labels */}
                        {points.map((p, i) => (
                          <text key={i} x={p.x} y="180" textAnchor="middle" fill="#666" fontSize="8" fontFamily="sans-serif">
                            {p.r.date}
                          </text>
                        ))}
                      </svg>
                    )}
                  </div>
                </div>

                {/* Top Selling Dish Progress Meters */}
                <div className="lg:col-span-1 glass p-6 rounded-2xl border border-dark-850 flex flex-col justify-between">
                  <div className="border-b border-dark-850 pb-4 mb-4">
                    <h3 className="font-extrabold text-white text-base">Popular Dishes</h3>
                    <p className="text-xs text-dark-400 mt-0.5">Most ordered items based on count</p>
                  </div>

                  <div className="space-y-4 my-auto">
                    {topItems.length === 0 ? (
                      <p className="text-xs text-dark-500 italic text-center py-10">No items statistics</p>
                    ) : (
                      topItems.map((item, index) => {
                        const pct = Math.max(8, Math.min(100, Math.floor((item.count / maxTopQty) * 100)));
                        return (
                          <div key={index} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-white font-bold truncate max-w-[130px]">{item.foodItem?.name || 'Dish'}</span>
                              <span className="text-brand-400 font-extrabold">{item.count} orders</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-dark-950 overflow-hidden border border-dark-850">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  index === 0
                                    ? 'bg-amber-500'
                                    : index === 1
                                      ? 'bg-amber-600'
                                      : 'bg-brand-500/70'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-dark-500">
                              <span>{item.foodItem?.category || 'Main'}</span>
                              <span>₹{item.foodItem?.price || 0} each</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Distribution & History Log section */}
              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* 24 Hour Order Distribution Trend */}
                <div className="lg:col-span-1 glass p-6 rounded-2xl border border-dark-850 flex flex-col justify-between">
                  <div className="border-b border-dark-850 pb-4 mb-4">
                    <h3 className="font-extrabold text-white text-base">Hourly Order Trends</h3>
                    <p className="text-xs text-dark-400 mt-0.5">Order placement load throughout today</p>
                  </div>

                  <div className="h-44 w-full flex items-center justify-center">
                    {(!chartData.hourlyTrends || chartData.hourlyTrends.length === 0) ? (
                      <p className="text-xs text-dark-500 italic">No orders today</p>
                    ) : (
                      <svg viewBox="0 0 500 140" className="w-full h-full overflow-visible">
                        <line x1="30" y1="10" x2="490" y2="10" stroke="#222" strokeDasharray="3,3" />
                        <line x1="30" y1="55" x2="490" y2="55" stroke="#222" strokeDasharray="3,3" />
                        <line x1="30" y1="100" x2="490" y2="100" stroke="#333" />
                        
                        {/* Y-axis labels */}
                        <text x="22" y="13" textAnchor="end" fill="#555" fontSize="7" fontFamily="monospace">{maxOrders}</text>
                        <text x="22" y="58" textAnchor="end" fill="#555" fontSize="7" fontFamily="monospace">{Math.ceil(maxOrders / 2)}</text>
                        <text x="22" y="103" textAnchor="end" fill="#555" fontSize="7" fontFamily="monospace">0</text>
                        
                        {/* Bars */}
                        {chartData.hourlyTrends.map((d, i) => {
                          const barWidth = 12;
                          const barSpacing = 460 / 24;
                          const xPos = 30 + i * barSpacing + (barSpacing - barWidth) / 2;
                          const barHeight = (d.ordersCount / maxOrders) * 90;
                          const yPos = 100 - barHeight;
                          
                          return (
                            <g key={i} className="group cursor-pointer">
                              <rect
                                x={xPos}
                                y={yPos}
                                width={barWidth}
                                height={Math.max(1, barHeight)}
                                rx="1.5"
                                fill="#d97706"
                                opacity={d.ordersCount > 0 ? '0.85' : '0.15'}
                                className="transition-all duration-300 hover:fill-amber-400 hover:opacity-100"
                              />
                              {/* Hover Tooltip */}
                              <text
                                x={xPos + barWidth / 2}
                                y={yPos - 6}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize="7"
                                fontWeight="bold"
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none font-mono bg-dark-950 px-1 py-0.5 rounded"
                              >
                                {d.ordersCount}
                              </text>
                            </g>
                          );
                        })}
                        
                        {/* X-axis labels at 3hr intervals */}
                        {chartData.hourlyTrends.map((d, i) => {
                          if (i % 4 !== 0) return null;
                          const barSpacing = 460 / 24;
                          const xPos = 30 + i * barSpacing + barSpacing / 2;
                          return (
                            <text key={i} x={xPos} y="118" textAnchor="middle" fill="#666" fontSize="7">
                              {d.hour}
                            </text>
                          );
                        })}
                      </svg>
                    )}
                  </div>
                </div>

                {/* Complete Bill Invoice Ledger & Order History */}
                <div className="lg:col-span-2 glass p-6 rounded-2xl border border-dark-850 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-dark-850 pb-4 mb-4">
                    <div>
                      <h3 className="font-extrabold text-white text-base">Completed Invoices Ledger</h3>
                      <p className="text-xs text-dark-400 mt-0.5">Audit complete dining sessions and checkout bills</p>
                    </div>
                    <button
                      onClick={exportBillHistoryCSV}
                      className="glass bg-dark-850 hover:bg-dark-800 border border-dark-750 text-dark-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download size={13} />
                      <span>Export Ledger</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto my-auto max-h-56 overflow-y-auto">
                    {billHistory.length === 0 ? (
                      <p className="text-xs text-dark-500 italic text-center py-10">No completed invoices found</p>
                    ) : (
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-dark-850 text-dark-400">
                            <th className="py-2.5 px-3">INVOICE ID</th>
                            <th className="py-2.5 px-3">Table</th>
                            <th className="py-2.5 px-3">Finalized At</th>
                            <th className="py-2.5 px-3 text-right">Total Amount</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billHistory.map(bill => (
                            <tr key={bill._id} className="border-b border-dark-900 hover:bg-dark-900/10 transition-colors">
                              <td className="py-2.5 px-3 text-dark-400 font-mono text-[9px] uppercase">
                                {bill._id.substring(12)}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-white">#{bill.tableNumber}</td>
                              <td className="py-2.5 px-3 text-dark-400">
                                {new Date(bill.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(bill.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2.5 px-3 text-right font-extrabold text-brand-400">
                                ₹{bill.totalAmount}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${
                                  bill.paymentStatus === 'paid'
                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {bill.paymentStatus}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => setSelectedBill(bill)}
                                  className="text-brand-400 hover:text-white p-1 rounded bg-dark-850 hover:bg-brand-500 transition-all cursor-pointer inline-flex items-center gap-1 text-[9px] font-bold"
                                >
                                  <Printer size={10} />
                                  <span>Receipt</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Audit Invoice Printable Modal popup */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white text-black max-w-sm w-full p-6 rounded-lg font-mono text-xs shadow-2xl relative border-4 border-double border-gray-400 animate-fade-in">
            <button
              onClick={() => setSelectedBill(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black font-bold p-1"
            >
              <X size={16} />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-gray-400 mb-4">
              <h2 className="text-base font-extrabold uppercase tracking-wider">FoodForMe Bistro</h2>
              <p className="text-[9px] text-gray-650 mt-0.5">128 Gourmet Street, Bangalore</p>
              <p className="text-[9px] text-gray-650">Ph: +91 98765 43210</p>
              <h3 className="text-xs font-bold uppercase tracking-wider mt-2.5 bg-black text-white py-1">CUSTOMER BILL INVOICE</h3>
            </div>

            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span>INVOICE ID:</span>
                <span className="font-bold">{selectedBill._id.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>TABLE NUMBER:</span>
                <span className="font-bold text-sm">TABLE {selectedBill.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date(selectedBill.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>BILL STATUS:</span>
                <span className={`font-extrabold uppercase ${selectedBill.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedBill.paymentStatus}
                </span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 font-bold flex justify-between text-[10px]">
              <span className="w-1/2">ITEM</span>
              <span className="w-1/6 text-right">QTY</span>
              <span className="w-1/6 text-right">PRICE</span>
              <span className="w-1/6 text-right text-black font-extrabold">TOT</span>
            </div>

            {/* List items consolidated across all orders in bill */}
            <div className="space-y-1.5 mb-4 border-b border-dashed border-gray-400 pb-4">
              {selectedBill.orders?.map(order => 
                order.items?.map(item => (
                  <div key={item._id} className="flex justify-between text-[10px]">
                    <span className="w-1/2 text-left truncate">{item.foodItem?.name || 'Dish'}</span>
                    <span className="w-1/6 text-right">x{item.quantity}</span>
                    <span className="w-1/6 text-right">₹{item.price}</span>
                    <span className="w-1/6 text-right font-bold">₹{item.price * item.quantity}</span>
                  </div>
                ))
              )}
            </div>

            {/* Financial breakdown */}
            <div className="space-y-1.5 mb-6 border-b border-dashed border-gray-400 pb-4 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{selectedBill.subTotal}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>CGST/SGST (5.0%):</span>
                <span>₹{selectedBill.tax}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Service Charge (10.0%):</span>
                <span>₹{selectedBill.serviceCharge}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm border-t border-gray-300 pt-2 text-black mt-2">
                <span>GRAND TOTAL:</span>
                <span>₹{selectedBill.totalAmount}</span>
              </div>
            </div>

            {selectedBill.paymentStatus === 'paid' && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-850 p-2.5 rounded text-center font-bold mb-4">
                PAID VIA {selectedBill.paymentMethod?.toUpperCase()}
              </div>
            )}

            <div className="flex gap-2 border-t border-dashed border-gray-400 pt-4 mt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-black text-white py-2.5 rounded font-bold text-center text-[10px] hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer size={12} />
                <span>Print Bill (PDF)</span>
              </button>
              <button
                onClick={() => setSelectedBill(null)}
                className="flex-1 bg-gray-250 border border-gray-450 text-black py-2.5 rounded font-bold text-center text-[10px] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
