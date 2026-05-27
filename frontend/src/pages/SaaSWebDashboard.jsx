import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { 
  Plus, Trash2, Check, X, LayoutGrid, Coffee, Users, DollarSign, QrCode, 
  TrendingUp, BarChart2, FileText, Download, Layers, Activity, Printer, 
  Sparkles, Shield, UserPlus, Star, Calendar, Mail, BookOpen
} from 'lucide-react';
import JSZip from 'jszip';

const SaaSWebDashboard = () => {
  const { user, getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'tables', 'staff', 'stats', 'subscription'
  
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
  const [zipLoading, setZipLoading] = useState(false);
  const [activePrintTable, setActivePrintTable] = useState(null); // 'all' or a table object

  // Staff states
  const [staffList, setStaffList] = useState([]);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'waiter',
  });
  const [staffLoading, setStaffLoading] = useState(false);

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

  // Auto table numbering utility
  useEffect(() => {
    if (tables && tables.length > 0) {
      const maxNum = Math.max(...tables.map(t => t.number), 0);
      setNewTable(prev => ({ ...prev, number: maxNum + 1 }));
    } else {
      setNewTable(prev => ({ ...prev, number: 1 }));
    }
  }, [tables]);

  // Dynamic HTML5 Canvas PNG compiler for premium QR cards
  const downloadQRCard = (tableNum, capacity) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set high-res printable dimensions (800 x 1200 px for 2:3 aspect ratio card)
    canvas.width = 800;
    canvas.height = 1200;
    
    // 1. Draw rich dark-theme background
    ctx.fillStyle = '#121214'; // dark-950
    ctx.fillRect(0, 0, 800, 1200);
    
    // Draw background subtle radial glow
    const gradient = ctx.createRadialGradient(400, 400, 50, 400, 400, 600);
    gradient.addColorStop(0, 'rgba(72, 168, 115, 0.08)'); // brand-500/8%
    gradient.addColorStop(1, 'rgba(18, 18, 20, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1200);

    // Draw glowing green accent borders
    ctx.strokeStyle = 'rgba(72, 168, 115, 0.15)'; // brand-500/15%
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 740, 1140);
    
    ctx.strokeStyle = 'rgba(72, 168, 115, 0.4)'; // brand-500/40%
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, 720, 1120);

    // 2. Draw Top Brand Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(user?.restaurantId?.restaurantName || 'FoodForMe', 400, 120);

    ctx.fillStyle = '#48a873'; // brand-500
    ctx.font = '800 16px sans-serif';
    ctx.fillText('SMART QR ORDERING SYSTEM', 400, 160);

    // Draw separator line
    ctx.strokeStyle = '#2d2d30'; // dark-800
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 200);
    ctx.lineTo(650, 200);
    ctx.stroke();

    // 3. Draw Center Table Designation
    ctx.fillStyle = '#ffffff';
    ctx.font = 'extrabold 82px sans-serif';
    ctx.fillText(`TABLE ${tableNum.toString().padStart(2, '0')}`, 400, 320);

    ctx.fillStyle = '#9b9ba2'; // dark-300
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`${capacity} SEATS AVAILABLE`, 400, 370);

    // 4. Fetch and render QR Code
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    
    const frontendUrl = window.location.origin;
    const scanUrl = `${frontendUrl}/restaurant/${user?.restaurantId?._id || 'demo'}/table/${tableNum}`;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(scanUrl)}`;

    qrImg.onload = () => {
      // Draw a neat white background card under the QR code
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(175, 450, 450, 450, 24);
      ctx.fill();

      // Draw the QR Code image
      ctx.drawImage(qrImg, 200, 475, 400, 400);

      // 5. Draw Footer Instructions
      ctx.fillStyle = '#48a873'; // brand-500
      ctx.font = 'extrabold 28px sans-serif';
      ctx.fillText('Scan to Order Food', 400, 990);

      ctx.fillStyle = '#75757d'; // dark-400
      ctx.font = 'medium 18px sans-serif';
      ctx.fillText('Explore categories menu • Place orders instantly', 400, 1030);

      ctx.fillStyle = 'rgba(72, 168, 115, 0.4)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`MAPPED TO SAAS WORKSPACE: ${user?.restaurantId?._id || 'N/A'}`, 400, 1080);

      // 6. Trigger client download
      const link = document.createElement('a');
      link.download = `foodforme_table_${tableNum}_qr_card.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    qrImg.onerror = () => {
      alert('Could not compile QR image, please check your network connection.');
    };
  };

  // Dynamic ZIP compiler using canvas blobs and JSZip
  const downloadAllQRCodesAsZIP = async () => {
    if (tables.length === 0) return;
    setZipLoading(true);
    const zip = new JSZip();
    const folder = zip.folder("foodforme_qr_cards");

    const generateBlob = (tbl) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 1200;
        
        ctx.fillStyle = '#121214';
        ctx.fillRect(0, 0, 800, 1200);
        
        const gradient = ctx.createRadialGradient(400, 400, 50, 400, 400, 600);
        gradient.addColorStop(0, 'rgba(72, 168, 115, 0.08)');
        gradient.addColorStop(1, 'rgba(18, 18, 20, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 1200);

        ctx.strokeStyle = 'rgba(72, 168, 115, 0.15)';
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, 740, 1140);
        
        ctx.strokeStyle = 'rgba(72, 168, 115, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 40, 720, 1120);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(user?.restaurantId?.restaurantName || 'FoodForMe', 400, 120);

        ctx.fillStyle = '#48a873';
        ctx.font = '800 16px sans-serif';
        ctx.fillText('SMART QR ORDERING SYSTEM', 400, 160);

        ctx.strokeStyle = '#2d2d30';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, 200);
        ctx.lineTo(650, 200);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'extrabold 82px sans-serif';
        ctx.fillText(`TABLE ${tbl.number.toString().padStart(2, '0')}`, 400, 320);

        ctx.fillStyle = '#9b9ba2';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`${tbl.capacity} SEATS AVAILABLE`, 400, 370);

        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        const frontendUrl = window.location.origin;
        const scanUrl = `${frontendUrl}/restaurant/${user?.restaurantId?._id || 'demo'}/table/${tbl.number}`;
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(scanUrl)}`;

        qrImg.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(175, 450, 450, 450, 24);
          ctx.fill();

          ctx.drawImage(qrImg, 200, 475, 400, 400);

          ctx.fillStyle = '#48a873';
          ctx.font = 'extrabold 28px sans-serif';
          ctx.fillText('Scan to Order Food', 400, 990);

          ctx.fillStyle = '#75757d';
          ctx.font = 'medium 18px sans-serif';
          ctx.fillText('Explore categories menu • Place orders instantly', 400, 1030);

          ctx.fillStyle = 'rgba(72, 168, 115, 0.4)';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`MAPPED TO SAAS WORKSPACE: ${user?.restaurantId?._id || 'N/A'}`, 400, 1080);

          canvas.toBlob((blob) => {
            resolve({ number: tbl.number, blob });
          }, 'image/png');
        };
        
        qrImg.onerror = () => {
          resolve(null);
        };
      });
    };

    try {
      const results = await Promise.all(tables.map(t => generateBlob(t)));
      results.forEach(res => {
        if (res) {
          folder.file(`table_${res.number}_qr_card.png`, res.blob);
        }
      });

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.download = `foodforme_${user?.restaurantId?.restaurantName || 'restaurant'}_qr_cards.zip`;
      link.href = URL.createObjectURL(content);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Error creating bulk ZIP download.');
    } finally {
      setZipLoading(false);
    }
  };

  const handlePrintCard = (tbl) => {
    setActivePrintTable(tbl);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handlePrintAll = () => {
    setActivePrintTable('all');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const rId = user?.restaurantId?._id || user?.restaurantId;
      
      // Perform parallel multi-tenant data fetching
      const [menuRes, tablesRes, ordersRes, statsRes, chartsRes, topItemsRes, historyRes, staffRes] = await Promise.all([
        fetch(`${API_BASE_URL}/menu?restaurantId=${rId}`, { headers }),
        fetch(`${API_BASE_URL}/tables`, { headers }),
        fetch(`${API_BASE_URL}/orders`, { headers }),
        fetch(`${API_BASE_URL}/analytics/stats`, { headers }),
        fetch(`${API_BASE_URL}/analytics/charts`, { headers }),
        fetch(`${API_BASE_URL}/analytics/top-items`, { headers }),
        fetch(`${API_BASE_URL}/analytics/history`, { headers }),
        fetch(`${API_BASE_URL}/auth/staff`, { headers }),
      ]);

      const menuData = await menuRes.json();
      const tablesData = await tablesRes.json();
      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      const chartsData = await chartsRes.json();
      const topItemsData = await topItemsRes.json();
      const historyData = await historyRes.json();
      const staffData = await staffRes.json();

      if (menuData.success) setMenuItems(menuData.data);
      if (tablesData.success) setTables(tablesData.data);
      if (ordersData.success) setOrders(ordersData.data);
      if (statsData.success) setStats(statsData.data);
      if (chartsData.success) setChartData(chartsData.data);
      if (topItemsData.success) setTopItems(topItemsData.data);
      if (historyData.success) setBillHistory(historyData.data);
      if (staffData.success) setStaffList(staffData.data);
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

    // Check trial table limits (e.g. 10 tables maximum on trial plan)
    const plan = user?.restaurantId?.subscriptionPlan || 'Free Trial';
    if (plan === 'Free Trial' && tables.length >= 10) {
      alert('Trial Plan Limit Reached: You can create a maximum of 10 tables. Please upgrade to Pro Premium for unlimited seating.');
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

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setErrorState('');
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      alert('Please fill out all staff fields');
      return;
    }

    setStaffLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newStaff),
      });
      const data = await response.json();
      if (data.success) {
        setStaffList([...staffList, data.user]);
        setNewStaff({
          name: '',
          email: '',
          password: '',
          role: 'waiter',
        });
        alert(`Staff member '${data.user.name}' registered successfully!`);
      } else {
        alert(data.message || 'Error onboarding employee');
      }
    } catch (err) {
      alert('Connection error registering employee');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Delete this staff account permanently? The employee will no longer be able to log in.')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/staff/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setStaffList(staffList.filter(s => s.id !== id && s._id !== id));
        alert('Staff account removed successfully');
      } else {
        alert(data.message || 'Error deleting staff account');
      }
    } catch (err) {
      alert('Server error deleting staff account');
    }
  };

  const [errorState, setErrorState] = useState('');

  // Structured Reporting CSV Exporter
  const exportSalesReportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `FoodForMe SaaS Analytics Report - ${user?.restaurantId?.restaurantName || 'Restaurant'}\n`;
    csvContent += `Generated At,${new Date().toLocaleString()}\n`;
    csvContent += `Subscription Tier,${user?.restaurantId?.subscriptionPlan || 'Free Trial'}\n\n`;
    
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
    link.setAttribute('download', `foodforme_saas_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Historical Billing Log CSV Exporter
  const exportBillHistoryCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `FoodForMe Ledger History - ${user?.restaurantId?.restaurantName || 'Restaurant'}\n`;
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
    link.setAttribute('download', `foodforme_billing_ledger_${new Date().toISOString().split('T')[0]}.csv`);
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
    <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in relative">
      {/* Decorative radial glows */}
      <div className="absolute top-10 left-10 h-[300px] w-[300px] rounded-full bg-brand-500/5 blur-[80px] pointer-events-none" />

      {/* Header section with active tenant badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-2xl font-black text-white font-display">
              {user?.restaurantId?.restaurantName || 'FoodForMe Bistro'}
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-extrabold border border-brand-500/20 uppercase tracking-wider">
              {user?.restaurantId?.subscriptionPlan || 'Free Trial'}
            </span>
          </div>
          <p className="text-xs text-dark-350 flex items-center gap-1.5">
            <span>SaaS Admin Control Workspace</span>
            <span className="h-1.5 w-1.5 rounded-full bg-dark-800"></span>
            <span>Workspace ID: <span className="font-mono text-dark-400">{user?.restaurantId?._id || 'N/A'}</span></span>
          </p>
        </div>
        
        {/* Responsive Dashboard Tab navigation switcher */}
        <div className="flex flex-wrap bg-dark-900 border border-dark-850 p-1.5 rounded-2xl gap-0.5">
          {[
            { id: 'menu', label: 'Manage Menu' },
            { id: 'tables', label: 'Table QRs' },
            { id: 'staff', label: 'Staff Crew' },
            { id: 'stats', label: 'Live Insights' },
            { id: 'subscription', label: 'Subscriptions' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id ? 'bg-brand-500 text-white shadow-md shadow-brand-900/10' : 'text-dark-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Print preview overlays (hidden by default, prints beautifully double-bordered cards) */}
          {activePrintTable && (
            <div id="print-section" className="hidden print:block bg-white text-black p-0 min-h-screen">
              <style>{`
                @media print {
                  body { background: white !important; color: black !important; }
                  #root > div > :not(#print-section) { display: none !important; }
                  nav, footer, button, .glass, .glass-card { display: none !important; }
                  #print-section { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
                  .print-card {
                    width: 100%;
                    max-width: 480px;
                    margin: 50px auto;
                    padding: 40px;
                    border: 6px double #000;
                    text-align: center;
                    font-family: monospace;
                    page-break-inside: avoid;
                    page-break-after: always;
                  }
                  .print-qr-img {
                    width: 280px;
                    height: 280px;
                    margin: 25px auto;
                    display: block;
                  }
                }
              `}</style>
              
              {activePrintTable === 'all' ? (
                tables.map((tbl) => (
                  <div key={tbl._id} className="print-card">
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0' }}>{user?.restaurantId?.restaurantName || 'FoodForMe'}</h1>
                    <p style={{ fontSize: '10px', letterSpacing: '2px', margin: '5px 0 20px' }}>SMART QR ORDERING SYSTEM</p>
                    <div style={{ borderBottom: '2px dashed #000', margin: '15px 0' }}></div>
                    <h2 style={{ fontSize: '48px', fontWeight: 'extrabold', margin: '10px 0' }}>TABLE {tbl.number.toString().padStart(2, '0')}</h2>
                    <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{tbl.capacity} SEATS AVAILABLE</p>
                    
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/restaurant/${user?.restaurantId?._id}/table/${tbl.number}`)}`}
                      alt="QR Code"
                      className="print-qr-img"
                    />
                    
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000', margin: '10px 0' }}>Scan to Order Food</h3>
                    <p style={{ fontSize: '11px' }}>Explore categories menu • Place orders instantly</p>
                    <p style={{ fontSize: '9px', marginTop: '20px', color: '#666' }}>{window.location.origin}/restaurant/{user?.restaurantId?._id}/table/{tbl.number}</p>
                  </div>
                ))
              ) : (
                <div className="print-card">
                  <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0' }}>{user?.restaurantId?.restaurantName || 'FoodForMe'}</h1>
                  <p style={{ fontSize: '10px', letterSpacing: '2px', margin: '5px 0 20px' }}>SMART QR ORDERING SYSTEM</p>
                  <div style={{ borderBottom: '2px dashed #000', margin: '15px 0' }}></div>
                  <h2 style={{ fontSize: '48px', fontWeight: 'extrabold', margin: '10px 0' }}>TABLE {activePrintTable.number.toString().padStart(2, '0')}</h2>
                  <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{activePrintTable.capacity} SEATS AVAILABLE</p>
                  
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/restaurant/${user?.restaurantId?._id}/table/${activePrintTable.number}`)}`}
                    alt="QR Code"
                    className="print-qr-img"
                  />
                  
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000', margin: '10px 0' }}>Scan to Order Food</h3>
                  <p style={{ fontSize: '11px' }}>Explore categories menu • Place orders instantly</p>
                  <p style={{ fontSize: '9px', marginTop: '20px', color: '#666' }}>{window.location.origin}/restaurant/{user?.restaurantId?._id}/table/{activePrintTable.number}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Menu Items CRUD */}
          {activeTab === 'menu' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form: Add Food item */}
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

              {/* Menu listings grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-6">
                    <Coffee className="text-brand-400" />
                    <h2 className="text-lg font-bold text-white">Active Food Items Catalog ({menuItems.length})</h2>
                  </div>
                  
                  {menuItems.length === 0 ? (
                    <div className="py-12 text-center text-dark-400 text-xs">
                      Your menu catalog is empty. Add your first dish above!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {menuItems.map(item => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between gap-4 p-4 rounded-xl border border-dark-850 bg-dark-900/20 hover:border-dark-750 transition-colors"
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
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Table QRs management console */}
          {activeTab === 'tables' && (
            <div className="space-y-6">
              {/* Dynamic QR control bar */}
              <div className="glass p-6 rounded-2xl border border-dark-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <QrCode className="text-brand-400" />
                    <span>Table QR Seating Cards Console</span>
                  </h2>
                  <p className="text-xs text-dark-400 mt-1">Configure layout seating structures, compile dynamic QR tags, and trigger print processes.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePrintAll}
                    className="glass bg-dark-850 hover:bg-dark-800 border border-dark-750 text-dark-200 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={14} className="text-brand-400" />
                    <span>Print All Cards</span>
                  </button>
                  <button
                    onClick={downloadAllQRCodesAsZIP}
                    disabled={zipLoading}
                    className="glass bg-dark-850 hover:bg-dark-800 border border-dark-750 text-dark-200 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {zipLoading ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    ) : (
                      <Download size={14} className="text-brand-400" />
                    )}
                    <span>Download All ZIP</span>
                  </button>
                </div>
              </div>

              {/* Table setup inputs and tables display */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="glass p-6 rounded-2xl border-dark-850">
                    <h3 className="text-base font-bold text-white mb-4">Add Seating Table</h3>
                    <form onSubmit={handleAddTable} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-dark-300 mb-1.5">Table Number</label>
                        <input
                          type="number"
                          value={newTable.number}
                          onChange={e => setNewTable({ ...newTable, number: parseInt(e.target.value) || '' })}
                          placeholder="e.g. 5"
                          className="w-full text-xs glass-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-dark-300 mb-1.5">Capacity (Seats)</label>
                        <input
                          type="number"
                          value={newTable.capacity}
                          onChange={e => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || '' })}
                          placeholder="e.g. 4"
                          className="w-full text-xs glass-input"
                          required
                        />
                      </div>
                      <button type="submit" className="w-full glass-btn-primary py-2.5 text-xs font-bold">
                        <Plus size={14} className="inline mr-1" /> Add Table
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="glass p-6 rounded-2xl">
                    <h3 className="text-base font-bold text-white mb-6">Configured Dining Tables ({tables.length})</h3>
                    {tables.length === 0 ? (
                      <p className="py-12 text-center text-dark-400 text-xs">No tables registered yet.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {tables.map(tbl => (
                          <div
                            key={tbl._id}
                            className="p-4 rounded-xl border border-dark-850 bg-dark-900/30 flex items-center justify-between gap-4"
                          >
                            <div>
                              <p className="font-extrabold text-sm text-white">Table #{tbl.number.toString().padStart(2, '0')}</p>
                              <p className="text-[11px] text-dark-400 mt-0.5">{tbl.capacity} Seats Available</p>
                              <span className={`inline-block mt-2 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                tbl.status === 'empty' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-amber-950/40 text-amber-400'
                              }`}>
                                {tbl.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handlePrintCard(tbl)}
                                className="p-2 rounded-lg bg-dark-850 text-dark-250 hover:text-white border border-dark-750 transition-colors cursor-pointer"
                                title="Print Card"
                              >
                                <Printer size={13} />
                              </button>
                              <button
                                onClick={() => downloadQRCard(tbl.number, tbl.capacity)}
                                className="p-2 rounded-lg bg-dark-850 text-dark-250 hover:text-brand-400 border border-dark-750 transition-colors cursor-pointer"
                                title="Download QR Card"
                              >
                                <Download size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Staff Management Controls */}
          {activeTab === 'staff' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form: Onboard Employee */}
              <div className="lg:col-span-1">
                <div className="glass p-6 rounded-2xl border-dark-850">
                  <h2 className="text-lg font-bold text-white mb-4">Onboard Staff Member</h2>
                  <form onSubmit={handleAddStaff} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-300 mb-1.5">Employee Name</label>
                      <input
                        type="text"
                        value={newStaff.name}
                        onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                        placeholder="e.g. John Waiter"
                        className="w-full text-xs glass-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-300 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={newStaff.email}
                        onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                        placeholder="john@restaurant.com"
                        className="w-full text-xs glass-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-300 mb-1.5">Temporary Password</label>
                      <input
                        type="password"
                        value={newStaff.password}
                        onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full text-xs glass-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-300 mb-1.5">Assigned Console Role</label>
                      <select
                        value={newStaff.role}
                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                        className="w-full text-xs glass-input select-arrow"
                      >
                        <option value="waiter">Waiter Service Console</option>
                        <option value="kitchen">Kitchen Preparation Feed</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={staffLoading}
                      className="w-full glass-btn-primary py-2.5 text-xs font-bold mt-2"
                    >
                      {staffLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
                      ) : (
                        <>
                          <UserPlus size={14} className="inline mr-1" />
                          <span>Onboard Employee</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Staff List table */}
              <div className="lg:col-span-2">
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-6">
                    <Users className="text-brand-400" />
                    <h2 className="text-lg font-bold text-white">Active Employee Crew ({staffList.length})</h2>
                  </div>

                  {staffList.length === 0 ? (
                    <p className="py-12 text-center text-dark-400 text-xs">No staff accounts registered. Onboard waiters or chefs above!</p>
                  ) : (
                    <div className="space-y-3.5">
                      {staffList.map(member => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between gap-4 p-4 rounded-xl border border-dark-850 bg-dark-900/10 hover:border-dark-750 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-white">{member.name}</p>
                              <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                                member.role === 'kitchen' ? 'bg-amber-950/40 text-amber-400' : 'bg-blue-950/40 text-blue-400'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                            <p className="text-xs text-dark-400 mt-1 flex items-center gap-1.5">
                              <Mail size={11} className="text-dark-500" />
                              <span>{member.email}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteStaff(member._id)}
                            className="text-dark-400 hover:text-rose-500 p-2 rounded-lg bg-dark-850 hover:bg-dark-800 transition-colors cursor-pointer border border-dark-750"
                            title="Delete Employee Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Live Insights & Chart Aggregates */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Aggregates Dashboard Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Daily Revenue', val: `₹${stats.totalDailySales}`, desc: `Paid: ₹${stats.paidSales}`, icon: DollarSign, color: 'text-emerald-450 bg-emerald-500/10 border-emerald-500/15' },
                  { label: 'Orders Placed Today', val: stats.totalOrdersToday, desc: `Delivered: ${stats.deliveredOrdersToday}`, icon: Activity, color: 'text-brand-400 bg-brand-500/10 border-brand-500/15' },
                  { label: 'Active Tables', val: stats.activeTables, desc: `Total tables: ${tables.length}`, icon: Layers, color: 'text-blue-450 bg-blue-500/10 border-blue-500/15' },
                  { label: 'Kitchen Queue', val: stats.pendingKitchenOrders, desc: 'Cooking / Pending', icon: Coffee, color: 'text-amber-450 bg-amber-500/10 border-amber-500/15' },
                ].map((card, idx) => (
                  <div key={idx} className="glass p-5 rounded-2xl border-dark-850">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-semibold text-dark-305">{card.label}</span>
                      <div className={`p-2 rounded-lg border ${card.color}`}>
                        <card.icon size={14} />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-white">{card.val}</p>
                    <p className="text-[10px] text-dark-400 font-bold mt-1 uppercase tracking-wider">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* Aggregated Trends Charts & Top Dishes */}
              <div className="grid lg:grid-cols-3 gap-8">
                {/* 7-Day Revenue Trend Line Graph */}
                <div className="lg:col-span-2 glass p-6 rounded-2xl border-dark-850">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-brand-400" />
                      <span>7-Day Sales Aggregate Trend</span>
                    </h3>
                    <button
                      onClick={exportSalesReportCSV}
                      className="px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-dark-250 hover:text-white border border-dark-750 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download size={11} />
                      <span>Export Reports</span>
                    </button>
                  </div>

                  <div className="relative h-[220px] w-full flex items-end">
                    {/* SVG Line Graph */}
                    <svg className="w-full h-[180px] overflow-visible">
                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = 25 + ratio * 120;
                        return (
                          <line
                            key={idx}
                            x1="50"
                            y1={y}
                            x2="480"
                            y2={y}
                            stroke="#2d2d30"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        );
                      })}

                      {/* Area Shade */}
                      {areaPath && (
                        <path
                          d={areaPath}
                          fill="url(#revenue-glow)"
                          opacity="0.15"
                        />
                      )}

                      {/* Sparkline */}
                      {linePath && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#48a873"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Interactive nodes */}
                      {points.map((p, idx) => (
                        <g key={idx} className="group/node">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="#121214"
                            stroke="#48a873"
                            strokeWidth="3"
                            className="transition-transform duration-200 cursor-pointer hover:scale-125"
                          />
                          <text
                            x={p.x}
                            y={p.y - 12}
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="opacity-0 group-hover/node:opacity-100 transition-opacity duration-200"
                          >
                            ₹{p.r.sales}
                          </text>
                        </g>
                      ))}

                      {/* Definitions */}
                      <defs>
                        <linearGradient id="revenue-glow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#48a873" />
                          <stop offset="100%" stopColor="#48a873" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Dates underneath axes */}
                    <div className="absolute bottom-0 left-0 right-0 pl-[50px] pr-[20px] flex justify-between text-[9px] font-bold text-dark-500 uppercase">
                      {revenuePoints.map((p, idx) => (
                        <span key={idx}>{p.date}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hot items list */}
                <div className="lg:col-span-1 glass p-6 rounded-2xl border-dark-850">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 mb-6">
                    <BarChart2 size={16} className="text-brand-400" />
                    <span>Top Selling Food Dishes</span>
                  </h3>

                  {topItems.length === 0 ? (
                    <p className="py-12 text-center text-dark-400 text-xs">No orders recorded today.</p>
                  ) : (
                    <div className="space-y-4">
                      {topItems.map((item, idx) => {
                        const pct = Math.max(8, Math.min(100, Math.floor((item.count / maxTopQty) * 100)));
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-bold text-white">
                              <span className="truncate max-w-[150px]">{item.foodItem?.name || 'Unknown'}</span>
                              <span className="text-brand-400 font-mono">{item.count} items</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-dark-950 overflow-hidden border border-dark-850">
                              <div
                                className="h-full rounded-full bg-brand-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Historical Billings Ledger list */}
              <div className="glass p-6 rounded-2xl border-dark-850">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <FileText size={16} className="text-brand-400" />
                    <span>Historical Bills Ledger entries ({billHistory.length})</span>
                  </h3>
                  <button
                    onClick={exportBillHistoryCSV}
                    className="px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-dark-250 hover:text-white border border-dark-750 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Download size={11} />
                    <span>Export Ledger</span>
                  </button>
                </div>

                {billHistory.length === 0 ? (
                  <p className="py-12 text-center text-dark-400 text-xs">No billed entries found.</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1.5">
                    {billHistory.map(bill => (
                      <div
                        key={bill._id}
                        onClick={() => setSelectedBill(bill)}
                        className="p-3.5 rounded-xl border border-dark-850 bg-dark-900/10 hover:bg-dark-900/35 hover:border-dark-750 transition-all flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] font-bold text-dark-400">ID: {bill._id.substring(12).toUpperCase()}</p>
                          <p className="text-xs text-white font-extrabold mt-0.5">Table #{bill.tableNumber}</p>
                          <p className="text-[10px] text-dark-500 mt-1">{new Date(bill.createdAt).toLocaleString()}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-extrabold text-sm text-brand-405">₹{bill.totalAmount}</p>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-450">{bill.paymentMethod}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded font-extrabold bg-emerald-950/40 text-emerald-400 uppercase">
                            {bill.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SaaS Subscription Details Center */}
          {activeTab === 'subscription' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
              {/* Premium Status Card */}
              <div className="glass-card border-brand-500/15 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 h-[100px] w-[100px] rounded-full bg-brand-500/10 blur-[40px]" />
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-brand-500 to-emerald-400"></div>

                <div className="flex justify-between items-start gap-4 mb-6">
                  <div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-wider mb-2 animate-pulse-subtle">
                      <Star size={10} />
                      <span>{user?.restaurantId?.subscriptionPlan || 'Free Trial'} Plan</span>
                    </span>
                    <h2 className="text-xl font-extrabold text-white">Active SaaS Tenant Workspace</h2>
                    <p className="text-xs text-dark-400 mt-1">Isolate your dining configurations under secure subscription protocols.</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/15 flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-y border-dark-850 py-6 my-6 text-xs leading-relaxed">
                  <div className="space-y-1">
                    <p className="text-dark-505 font-bold uppercase tracking-wider text-[10px]">Restaurant Name</p>
                    <p className="text-white font-extrabold text-sm">{user?.restaurantId?.restaurantName || 'FoodForMe Bistro'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-dark-505 font-bold uppercase tracking-wider text-[10px]">Owner Name</p>
                    <p className="text-white font-extrabold text-sm">{user?.restaurantId?.ownerName || 'Admin Owner'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-dark-505 font-bold uppercase tracking-wider text-[10px]">Registered Email</p>
                    <p className="text-white font-mono text-dark-250 truncate">{user?.restaurantId?.email || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-dark-505 font-bold uppercase tracking-wider text-[10px]">Workspace Created</p>
                    <p className="text-white font-extrabold text-sm flex items-center gap-1">
                      <Calendar size={13} className="text-brand-400" />
                      <span>{user?.restaurantId?.createdAt ? new Date(user.restaurantId.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-xs font-bold text-white uppercase tracking-wider text-[10px] mb-2.5">Activated Platform Features</p>
                  {[
                    '100% Secure database tenant data isolation',
                    'Interactive Dining tables layout setup & QR compiled cards',
                    'Digital Food catalog management system',
                    'Real-time order submission & Cooking timer widgets',
                    'Waiter billing receipt checkout ledger & CSV exports',
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-dark-300">
                      <Check size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Plan warning limit */}
                {(user?.restaurantId?.subscriptionPlan || 'Free Trial') === 'Free Trial' ? (
                  <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-5 mb-6 animate-pulse-subtle">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wider text-[10px] mb-1">Trial Version Limitations</p>
                    <p className="text-xs text-dark-200 leading-relaxed">
                      You are currently limited to <span className="text-amber-400 font-bold">10 seating tables maximum</span> and basic sales reports. Upgrade to Pro Premium to activate unlimited tables, full charts aggregation, and KOT zip archives.
                    </p>
                  </div>
                ) : null}

                <button
                  onClick={() => alert('SaaS Billing Integration Mockup: Upgrade triggers payment gateway checkout process. Thank you for testing FoodForMe SaaS!')}
                  className="w-full glass-btn-primary py-3.5 text-xs font-extrabold shadow-lg shadow-brand-500/10 active:scale-[0.98]"
                >
                  {(user?.restaurantId?.subscriptionPlan || 'Free Trial') === 'Free Trial' ? 'Upgrade to Pro Premium' : 'Manage Subscription Plan'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invoice modal popover fromledger */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white text-black max-w-sm w-full p-6 rounded-lg font-mono text-xs shadow-2xl relative border-4 border-double border-gray-400 animate-fade-in">
            <button
              onClick={() => setSelectedBill(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black font-bold p-1 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-gray-400 mb-4">
              <h2 className="text-base font-extrabold uppercase tracking-wider">{user?.restaurantId?.restaurantName || 'FoodForMe Bistro'}</h2>
              <p className="text-[9px] text-gray-650 mt-0.5">{user?.restaurantId?.address || 'Bangalore'}</p>
              <p className="text-[9px] text-gray-650">Ph: {user?.restaurantId?.phone || 'N/A'}</p>
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
                <span>{new Date(selectedBill.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>PAYMENT STATUS:</span>
                <span className="font-extrabold uppercase text-emerald-600">
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

            {/* List items consolidated across all orders */}
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

            <div className="bg-emerald-50 border border-emerald-200 text-emerald-850 p-2.5 rounded text-center font-bold mb-4">
              PAID VIA {selectedBill.paymentMethod?.toUpperCase()}
            </div>

            <div className="flex gap-2 border-t border-dashed border-gray-400 pt-4 mt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-black text-white py-2.5 rounded font-bold text-center text-[10px] hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer size={12} />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => setSelectedBill(null)}
                className="flex-1 bg-gray-250 border border-gray-450 text-black py-2.5 rounded font-bold text-center text-[10px] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaaSWebDashboard;
