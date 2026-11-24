import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000';

// Helper membaca kolom Oracle (huruf KAPITAL maupun kecil)
const val = (obj, key) => obj?.[key] ?? obj?.[key.toUpperCase()] ?? obj?.[key.toLowerCase()] ?? '';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('mipa_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('catalog');
  const [serverOnline, setServerOnline] = useState(true);

  // Data dari Backend Oracle
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [custodyList, setCustodyList] = useState([]);
  const [handovers, setHandovers] = useState([]);

  // Filter Katalog
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  // Form State
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    full_name: '',
    npm: '',
    email: '',
    password: '',
    role: 'MAHASISWA',
  });

  const [reportForm, setReportForm] = useState({
    item_name: '',
    category_id: '1',
    date_found: new Date().toISOString().split('T')[0],
    location_found: '',
    photo: '',
    description: '',
    secret_question: '',
    secret_answer_hash: '',
  });

  const [custodyForm, setCustodyForm] = useState({
    item_id: '',
    from_location: '',
    to_location: '',
    notes: '',
  });

  const [handoverForm, setHandoverForm] = useState({
    item_id: '',
    owner_id: '',
    handover_code_hash: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchItems();
    fetchClaims();
  }, []);

  useEffect(() => {
    if (activeTab === 'claims') fetchClaims();
    if (activeTab === 'custody') fetchCustody();
    if (activeTab === 'handovers') fetchHandovers();
  }, [activeTab]);

  // 1. FETCH KATEGORI & KATALOG
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/items/categories`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
      }
    } catch {
      // Abaikan saat offline
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/items`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setItems(json.data || []);
      setServerOnline(true);
    } catch {
      setServerOnline(false);
      setItems([]);
    }
  };

  // 2. AUTENTIKASI
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('mipa_user', JSON.stringify(data.user));
        setShowAuthModal(false);
        setLoginForm({ email: '', password: '' });
      }
    } catch {
      alert('Server backend belum merespons. Pastikan backend berjalan di port 5000.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setAuthMode('login');
        setRegForm({ full_name: '', npm: '', email: '', password: '', role: 'MAHASISWA' });
      }
    } catch {
      alert('Gagal mendaftar. Periksa koneksi ke server backend.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mipa_user');
    setCurrentUser(null);
  };

  // 3. LAPOR BARANG TEMUAN
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('Silakan masuk ke akunmu terlebih dahulu untuk melapor.');
    try {
      const res = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(val(currentUser, 'user_id')),
          category_id: Number(reportForm.category_id),
          item_name: reportForm.item_name,
          description: reportForm.description,
          secret_question: reportForm.secret_question,
          secret_answer_hash: reportForm.secret_answer_hash,
          photo: reportForm.photo,
          location_found: reportForm.location_found,
          date_found: reportForm.date_found,
          status: 'ACTIVE',
        }),
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setShowReportModal(false);
        setReportForm({
          item_name: '',
          category_id: '1',
          date_found: new Date().toISOString().split('T')[0],
          location_found: '',
          photo: '',
          description: '',
          secret_question: '',
          secret_answer_hash: '',
        });
        fetchItems();
      }
    } catch {
      alert('Gagal mengirim laporan barang.');
    }
  };

  // 4. KLAIM & VERIFIKASI
  const handleClaimSubmit = async (itemId) => {
    if (!currentUser) return alert('Masuk ke akunmu terlebih dahulu untuk mengajukan klaim barang.');
    try {
      const res = await fetch(`${API_URL}/api/claims/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: Number(itemId),
          user_id: Number(val(currentUser, 'user_id')),
        }),
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        fetchClaims();
        setActiveTab('claims');
      }
    } catch {
      alert('Gagal mengajukan klaim.');
    }
  };

  const fetchClaims = async () => {
    try {
      const res = await fetch(`${API_URL}/api/claims`);
      const json = await res.json();
      setClaims(json.data || []);
    } catch {
      setClaims([]);
    }
  };

  const handleClaimAction = async (action, claimId, isCorrect = null) => {
    const payload =
      isCorrect !== null ? { claim_id: Number(claimId), is_correct: isCorrect } : { claim_id: Number(claimId) };
    try {
      const res = await fetch(`${API_URL}/api/claims/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      alert(data.message);
      fetchClaims();
    } catch {
      alert('Gagal memproses verifikasi klaim.');
    }
  };

  // 5. PENITIPAN BARANG
  const fetchCustody = async () => {
    try {
      const res = await fetch(`${API_URL}/api/custody`);
      const json = await res.json();
      setCustodyList(json.data || []);
    } catch {
      setCustodyList([]);
    }
  };

  const handleCustodySubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('Silakan masuk sebagai petugas terlebih dahulu.');
    try {
      const res = await fetch(`${API_URL}/api/custody`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: Number(custodyForm.item_id),
          officer_id: Number(val(currentUser, 'user_id')),
          from_location: custodyForm.from_location,
          to_location: custodyForm.to_location,
          notes: custodyForm.notes,
        }),
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setShowCustodyModal(false);
        setCustodyForm({ item_id: '', from_location: '', to_location: '', notes: '' });
        fetchCustody();
      }
    } catch {
      alert('Gagal menyimpan catatan penitipan.');
    }
  };

  // 6. SERAH-TERIMA
  const fetchHandovers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/handovers`);
      const json = await res.json();
      setHandovers(json.data || []);
    } catch {
      setHandovers([]);
    }
  };

  const handleCreateHandover = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('Silakan masuk sebagai petugas terlebih dahulu.');
    try {
      const res = await fetch(`${API_URL}/api/handovers/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: Number(handoverForm.item_id),
          officer_id: Number(val(currentUser, 'user_id')),
          owner_id: Number(handoverForm.owner_id),
          handover_code_hash: handoverForm.handover_code_hash,
        }),
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setShowHandoverModal(false);
        setHandoverForm({ item_id: '', owner_id: '', handover_code_hash: '' });
        fetchHandovers();
      }
    } catch {
      alert('Gagal membuat berita serah-terima.');
    }
  };

  const handleConfirmHandover = async (handoverId) => {
    try {
      const res = await fetch(`${API_URL}/api/handovers/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handover_id: Number(handoverId) }),
      });
      const data = await res.json();
      alert(data.message);
      fetchHandovers();
    } catch {
      alert('Gagal mengonfirmasi serah-terima.');
    }
  };

  const filteredItems = items.filter((item) => {
    const itemName = String(val(item, 'item_name')).toLowerCase();
    const loc = String(val(item, 'location_found')).toLowerCase();
    const catName = String(val(item, 'category_name')).toLowerCase();
    return (
      (!filterCategory || catName.includes(filterCategory.toLowerCase())) &&
      (!filterSearch || itemName.includes(filterSearch.toLowerCase()) || loc.includes(filterSearch.toLowerCase()))
    );
  });

  const formatDate = (rawDate) => {
    if (!rawDate) return '-';
    try {
      return new Date(rawDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(rawDate).slice(0, 10);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#f6f5f0] text-stone-800 selection:bg-teal-700 selection:text-white"
      style={{
        backgroundImage: 'radial-gradient(#d6d3cb 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* TOPBAR */}
      <header className="bg-teal-950 text-stone-100 border-b-4 border-amber-500 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-teal-950 flex items-center justify-center font-black text-lg shadow-inner">
              <i className="fa-solid fa-compass"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">MIPA-Temu</span>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-teal-800 text-amber-300 border border-teal-700 px-2 py-0.5 rounded-md">
                  FMIPA Hub
                </span>
              </div>
              <p className="text-[11px] text-teal-300/90 hidden sm:block">
                Pusat Pelaporan & Verifikasi Barang Temuan Kampus
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-teal-900/90 border border-teal-700 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-semibold text-stone-100">{val(currentUser, 'full_name')}</span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                  {val(currentUser, 'role')}
                </span>
              </div>
            ) : (
              <span className="text-xs text-teal-200 bg-teal-900/60 border border-teal-800 px-3 py-1.5 rounded-xl">
                Pengunjung Umum
              </span>
            )}

            <button
              onClick={() => setShowReportModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-teal-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow transition cursor-pointer"
            >
              <i className="fa-solid fa-bullhorn mr-1.5"></i> Lapor Temuan
            </button>

            {currentUser ? (
              <button
                onClick={handleLogout}
                className="bg-rose-600/90 hover:bg-rose-600 text-white text-xs sm:text-sm px-3.5 py-2 rounded-xl font-semibold transition cursor-pointer"
              >
                Keluar
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-teal-800 hover:bg-teal-700 text-white border border-teal-600 text-xs sm:text-sm px-4 py-2 rounded-xl font-semibold transition cursor-pointer"
              >
                Masuk / Daftar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO BANNER & RINGKASAN STATISTIK */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white border-b border-teal-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold bg-black/25 text-amber-300 px-3 py-1 rounded-full">
              <i className="fa-solid fa-shield-check"></i> Sistem Blind Verification Terpadu
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              Kehilangan barang di area gedung kuliah atau laboratorium?
            </h1>
            <p className="text-sm text-teal-100/90 max-w-2xl leading-relaxed">
              Telusuri katalog barang temuan di lingkungan fakultas, ajukan klaim kepemilikan dengan menjawab ciri
              khusus barang, dan pantau proses serah-terima secara transparan.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3.5">
              <p className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold">Total Temuan</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{items.length}</p>
              <p className="text-[11px] text-amber-300 mt-1">Tercatat aktif</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3.5">
              <p className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold">Proses Klaim</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{claims.length}</p>
              <p className="text-[11px] text-emerald-300 mt-1">Antrean verifikasi</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3.5">
              <p className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold">Status API</p>
              <p className="text-base sm:text-lg font-extrabold text-white mt-2 flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${serverOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                {serverOnline ? 'Terhubung' : 'Offline'}
              </p>
              <p className="text-[11px] text-teal-200 mt-1">Port 5000</p>
            </div>
          </div>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-7">
        {!serverOnline && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 text-amber-950 p-4 rounded-r-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <i className="fa-solid fa-plug-circle-exclamation text-amber-600 text-xl mt-0.5 sm:mt-0"></i>
              <div className="text-xs sm:text-sm">
                <p className="font-bold">Koneksi ke Server Backend (localhost:5000) belum aktif</p>
                <p className="text-amber-800">
                  Jalankan server Node.js & Oracle terlebih dahulu agar katalog barang dan tombol transaksi berfungsi penuh.
                </p>
              </div>
            </div>
            <button
              onClick={fetchItems}
              className="self-start sm:self-auto bg-amber-500 hover:bg-amber-600 text-teal-950 font-bold text-xs px-3.5 py-2 rounded-lg shrink-0 cursor-pointer"
            >
              Coba Hubungkan Ulang
            </button>
          </div>
        )}

        {/* NAVIGASI MENU UTAMA */}
        <div className="flex flex-wrap gap-2.5 mb-7">
          {[
            { id: 'catalog', icon: 'fa-grid-2', label: 'Katalog Temuan' },
            { id: 'claims', icon: 'fa-user-shield', label: 'Verifikasi Klaim' },
            { id: 'custody', icon: 'fa-box-archive', label: 'Log Penitipan' },
            { id: 'handovers', icon: 'fa-handshake-simple', label: 'Serah-Terima' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-teal-900 text-amber-300 shadow-md ring-2 ring-teal-900/20'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-teal-600 hover:text-teal-800 shadow-xs'
                }`}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ============================================================
            TAB 1: KATALOG BARANG TEMUAN
        ============================================================ */}
        {activeTab === 'catalog' && (
          <section>
            {/* Bar Pencarian & Filter */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200/90 mb-6 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
              <div className="relative flex-grow">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Ketik nama barang (misal: Kalkulator, KTM, Tumbler) atau lokasi ditemukan..."
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-teal-600 focus:bg-white transition"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-stone-200 bg-stone-50 rounded-xl px-3.5 py-2.5 text-sm font-medium text-stone-700 focus:outline-none focus:border-teal-600"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((c) => {
                    const name = val(c, 'category_name');
                    return (
                      <option key={val(c, 'category_id')} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Grid Kartu Barang */}
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                  <i className="fa-solid fa-inbox"></i>
                </div>
                <h3 className="font-bold text-stone-800">Belum ada barang yang sesuai</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  Data katalog akan otomatis muncul saat database terhubung atau ketika ada laporan barang temuan baru.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                  const id = val(item, 'item_id');
                  const photo =
                    val(item, 'photo') || 'https://placehold.co/600x360/134e4a/fde68a?text=Barang+Temuan+FMIPA';
                  const question = val(item, 'secret_question');
                  const status = val(item, 'status') || 'ACTIVE';

                  return (
                    <article
                      key={id}
                      className="group bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-48 bg-stone-200 overflow-hidden">
                          <img
                            src={photo}
                            alt={val(item, 'item_name')}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          <span className="absolute top-3 left-3 text-[11px] font-bold bg-stone-900/80 text-amber-300 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                            #{id} • {val(item, 'category_name') || 'Umum'}
                          </span>
                          <span
                            className={`absolute top-3 right-3 text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow ${
                              status === 'ACTIVE'
                                ? 'bg-emerald-500 text-teal-950'
                                : 'bg-amber-400 text-stone-900'
                            }`}
                          >
                            {status}
                          </span>
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                            <span className="font-medium truncate">
                              <i className="fa-solid fa-location-dot text-amber-400 mr-1.5"></i>
                              {val(item, 'location_found')}
                            </span>
                            <span className="text-[11px] text-stone-200 shrink-0 ml-2">
                              {formatDate(val(item, 'date_found'))}
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <h3 className="font-extrabold text-lg text-stone-900 group-hover:text-teal-800 transition">
                            {val(item, 'item_name')}
                          </h3>
                          <p className="text-sm text-stone-600 mt-1.5 leading-relaxed line-clamp-2">
                            {val(item, 'description') || 'Tidak ada catatan tambahan dari penemu.'}
                          </p>

                          {question && (
                            <div className="mt-4 p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-950">
                              <div className="font-bold text-amber-800 flex items-center gap-1.5 mb-0.5">
                                <i className="fa-solid fa-key text-amber-600"></i> Pertanyaan Verifikasi Pemilik
                              </div>
                              <p className="leading-snug">{question}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[11px] text-stone-500 font-medium">Merasa ini milikmu?</span>
                        <button
                          onClick={() => handleClaimSubmit(id)}
                          className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Ajukan Klaim <i className="fa-solid fa-arrow-right ml-1"></i>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================
            TAB 2: VERIFIKASI KLAIM
        ============================================================ */}
        {activeTab === 'claims' && (
          <section className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900">Daftar Pengajuan & Verifikasi Klaim</h2>
                <p className="text-xs text-stone-500">
                  Petugas memeriksa kecocokan jawaban rahasia pemilik sebelum menyetujui pengambilan barang.
                </p>
              </div>
              <button
                onClick={fetchClaims}
                className="text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                <i className="fa-solid fa-rotate mr-1"></i> Muat Ulang
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-100 text-stone-600 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-4">ID Klaim</th>
                    <th className="p-4">Barang</th>
                    <th className="p-4">Pengklaim</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Tindakan Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-stone-400">
                        Belum ada pengajuan klaim yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    claims.map((c) => {
                      const cid = val(c, 'claim_id');
                      return (
                        <tr key={cid} className="hover:bg-stone-50/80">
                          <td className="p-4 font-mono font-bold text-teal-900">#{cid}</td>
                          <td className="p-4 font-semibold">{val(c, 'item_name') || `Barang #${val(c, 'item_id')}`}</td>
                          <td className="p-4">{val(c, 'full_name') || `User #${val(c, 'user_id')}`}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                              {val(c, 'status')}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleClaimAction('verify', cid, 1)}
                              className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Jawaban Cocok
                            </button>
                            <button
                              onClick={() => handleClaimAction('verify', cid, 0)}
                              className="bg-amber-500 hover:bg-amber-600 text-teal-950 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Tidak Cocok
                            </button>
                            <button
                              onClick={() => handleClaimAction('approve', cid)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleClaimAction('reject', cid)}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Tolak
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ============================================================
            TAB 3: PENITIPAN BARANG
        ============================================================ */}
        {activeTab === 'custody' && (
          <section className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900">Log Penitipan & Lokasi Penyimpanan</h2>
                <p className="text-xs text-stone-500">
                  Jejak perpindahan barang dari penemu ke pos keamanan atau loker administrasi FMIPA.
                </p>
              </div>
              <button
                onClick={() => setShowCustodyModal(true)}
                className="bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm px-4 py-2 rounded-xl font-bold shadow-xs cursor-pointer"
              >
                <i className="fa-solid fa-plus mr-1.5"></i> Catat Penitipan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-100 text-stone-600 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-4">ID Barang</th>
                    <th className="p-4">Lokasi Awal</th>
                    <th className="p-4">Lokasi Tujuan</th>
                    <th className="p-4">Keterangan</th>
                    <th className="p-4">Waktu Catat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {custodyList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-stone-400">
                        Belum ada catatan perpindahan lokasi barang.
                      </td>
                    </tr>
                  ) : (
                    custodyList.map((r, i) => (
                      <tr key={i} className="hover:bg-stone-50/80">
                        <td className="p-4 font-mono font-bold text-teal-900">#{val(r, 'item_id')}</td>
                        <td className="p-4 text-stone-600">{val(r, 'from_location') || '-'}</td>
                        <td className="p-4 font-bold text-stone-900">{val(r, 'to_location')}</td>
                        <td className="p-4 text-stone-600">{val(r, 'notes') || '-'}</td>
                        <td className="p-4 text-xs text-stone-500">{formatDate(val(r, 'custody_date'))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ============================================================
            TAB 4: SERAH-TERIMA
        ============================================================ */}
        {activeTab === 'handovers' && (
          <section className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900">Berita Acara Serah-Terima Barang</h2>
                <p className="text-xs text-stone-500">
                  Penerbitan kode serah-terima dan konfirmasi akhir saat barang kembali ke pemilik sah.
                </p>
              </div>
              <button
                onClick={() => setShowHandoverModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-teal-950 text-xs sm:text-sm px-4 py-2 rounded-xl font-bold shadow-xs cursor-pointer"
              >
                <i className="fa-solid fa-file-signature mr-1.5"></i> Buat Serah-Terima
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-100 text-stone-600 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-4">ID Serah-Terima</th>
                    <th className="p-4">ID Barang</th>
                    <th className="p-4">ID Pemilik</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Konfirmasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {handovers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-stone-400">
                        Belum ada data serah-terima barang.
                      </td>
                    </tr>
                  ) : (
                    handovers.map((h) => {
                      const hid = val(h, 'handover_id');
                      return (
                        <tr key={hid} className="hover:bg-stone-50/80">
                          <td className="p-4 font-mono font-bold text-teal-900">#{hid}</td>
                          <td className="p-4 font-semibold">#{val(h, 'item_id')}</td>
                          <td className="p-4">#{val(h, 'owner_id')}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 text-xs font-bold">
                              {val(h, 'status') || 'MENUNGGU'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleConfirmHandover(hid)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Konfirmasi Selesai
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-teal-950 text-teal-300/80 text-xs py-5 px-4 mt-10 border-t border-teal-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="font-semibold text-stone-200">MIPA-Temu • Sistem Informasi Lost & Found FMIPA</p>
          <p>Terintegrasi dengan Layanan Verifikasi & Penitipan Barang Fakultas</p>
        </div>
      </footer>

      {/* ============================================================
          MODAL LOGIN & REGISTER
      ============================================================ */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold text-teal-950">Portal Akun MIPA-Temu</h3>
              <button onClick={() => setShowAuthModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl mb-5">
              <button
                onClick={() => setAuthMode('login')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  authMode === 'login' ? 'bg-teal-900 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                Masuk Akun
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  authMode === 'register' ? 'bg-teal-900 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                Daftar Baru
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Email Kampus / Terdaftar</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="nama@mhs.unsyiah.ac.id"
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Kata Sandi</label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-700"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-800 hover:bg-teal-900 text-white py-2.5 rounded-xl text-sm font-bold shadow cursor-pointer"
                >
                  Masuk Sekarang
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  required
                  value={regForm.full_name}
                  onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="NPM / NIP"
                  required
                  value={regForm.npm}
                  onChange={(e) => setRegForm({ ...regForm, npm: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
                />
                <input
                  type="password"
                  placeholder="Buat Kata Sandi"
                  required
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
                />
                <select
                  value={regForm.role}
                  onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm bg-white"
                >
                  <option value="MAHASISWA">Peran: Mahasiswa</option>
                  <option value="PETUGAS">Peran: Petugas Pos / Loker</option>
                  <option value="ADMIN">Peran: Admin Fakultas</option>
                </select>
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-teal-950 py-2.5 rounded-xl text-sm font-extrabold shadow cursor-pointer"
                >
                  Buat Akun
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL LAPOR BARANG TEMUAN
      ============================================================ */}
      {showReportModal && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-teal-950">Laporkan Barang Temuan</h3>
                <p className="text-xs text-stone-500">Bantu pemilik menemukan barangnya dengan detail yang jelas.</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Nama Barang (cth: Kalkulator Scientific Casio)"
                required
                value={reportForm.item_name}
                onChange={(e) => setReportForm({ ...reportForm, item_name: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={reportForm.category_id}
                  onChange={(e) => setReportForm({ ...reportForm, category_id: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm bg-white"
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={val(c, 'category_id')} value={val(c, 'category_id')}>
                        {val(c, 'category_name')}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1">Elektronik</option>
                      <option value="2">Dokumen / Kartu</option>
                      <option value="3">Aksesori & Kunci</option>
                      <option value="4">Lainnya</option>
                    </>
                  )}
                </select>
                <input
                  type="date"
                  required
                  value={reportForm.date_found}
                  onChange={(e) => setReportForm({ ...reportForm, date_found: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Lokasi Ditemukan (cth: Lab Komputasi Lt. 2)"
                required
                value={reportForm.location_found}
                onChange={(e) => setReportForm({ ...reportForm, location_found: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              />
              <input
                type="url"
                placeholder="Tautan Foto Barang (Opsional)"
                value={reportForm.photo}
                onChange={(e) => setReportForm({ ...reportForm, photo: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              />
              <textarea
                rows="2"
                placeholder="Deskripsi umum (warna, merek, kondisi luar)..."
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              ></textarea>

              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 space-y-2">
                <p className="text-xs font-extrabold text-amber-900">
                  <i className="fa-solid fa-lock mr-1"></i> Pertanyaan Rahasia Pemilik (Blind Verification)
                </p>
                <input
                  type="text"
                  placeholder="Pertanyaan ciri khusus (cth: Apa wallpaper HP / nama di dalam dompet?)"
                  required
                  value={reportForm.secret_question}
                  onChange={(e) => setReportForm({ ...reportForm, secret_question: e.target.value })}
                  className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Jawaban rahasia yang benar..."
                  required
                  value={reportForm.secret_answer_hash}
                  onChange={(e) => setReportForm({ ...reportForm, secret_answer_hash: e.target.value })}
                  className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-800 hover:bg-teal-900 text-white py-2.5 rounded-xl text-sm font-bold shadow cursor-pointer"
              >
                Publikasikan Temuan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL CATAT PENITIPAN
      ============================================================ */}
      {showCustodyModal && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-lg font-extrabold text-teal-950 mb-3">Catat Penitipan Barang</h3>
            <form onSubmit={handleCustodySubmit} className="space-y-3">
              <input
                type="number"
                placeholder="ID Barang (item_id)"
                required
                value={custodyForm.item_id}
                onChange={(e) => setCustodyForm({ ...custodyForm, item_id: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Lokasi Awal (cth: Mahasiswa Penemu)"
                value={custodyForm.from_location}
                onChange={(e) => setCustodyForm({ ...custodyForm, from_location: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Lokasi Penyimpanan (cth: Pos Satpam FMIPA)"
                required
                value={custodyForm.to_location}
                onChange={(e) => setCustodyForm({ ...custodyForm, to_location: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Catatan kondisi barang..."
                value={custodyForm.notes}
                onChange={(e) => setCustodyForm({ ...custodyForm, notes: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustodyModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-stone-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL BUAT SERAH-TERIMA
      ============================================================ */}
      {showHandoverModal && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-lg font-extrabold text-teal-950 mb-3">Buat Jadwal Serah-Terima</h3>
            <form onSubmit={handleCreateHandover} className="space-y-3">
              <input
                type="number"
                placeholder="ID Barang (item_id)"
                required
                value={handoverForm.item_id}
                onChange={(e) => setHandoverForm({ ...handoverForm, item_id: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="ID Pemilik Sah (owner_id)"
                required
                value={handoverForm.owner_id}
                onChange={(e) => setHandoverForm({ ...handoverForm, owner_id: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Kode Serah-Terima (cth: MIPA-2026)"
                required
                value={handoverForm.handover_code_hash}
                onChange={(e) => setHandoverForm({ ...handoverForm, handover_code_hash: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowHandoverModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-stone-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-teal-950 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Terbitkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
