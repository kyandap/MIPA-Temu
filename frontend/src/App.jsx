
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const read = (o, ...keys) => {
  for (const k of keys)
    if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
  return "";
};

const idOf = o => Number(read(o, "ITEM_ID", "itemId", "item_id"));
const statusOf = o => read(o, "STATUS", "status", "ITEM_STATUS");
const roleOf = u => read(u, "role", "ROLE");
const nameOf = u => read(u, "fullName", "FULL_NAME", "full_name");
const dateOf = v => v ? String(v).slice(0, 10) : "-";

async function request(path, options = {}, token = "") {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }

  return json;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("mipa_token") || "");
  const [readyItems, setReadyItems] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mipa_user") || "null");
    } catch {
      return null;
    }
  });

  const [tab, setTab] = useState("catalog");
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [claims, setClaims] = useState([]);
  const [custody, setCustody] = useState([]);
  const [handovers, setHandovers] = useState([]);

  const [claimVerification, setClaimVerification] = useState(null);
  const [secretAnswer, setSecretAnswer] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);

  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [modal, setModal] = useState("");
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);


  const role = roleOf(user);
  const admin = role === "ADMIN";
  const student = role === "MAHASISWA";
  const officer = role === "PETUGAS" || role === "OFFICER";

  const unresolvedClaimsCount = claims.filter(c => {
  const st = String(
    read(c, "CLAIM_STATUS", "claimStatus", "STATUS")
  ).toUpperCase();

  return ["PENDING", "VERIFIED"].includes(st);
}).length;

  const notify = message => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const loadCatalog = async () => {
    try {
      const [i, c] = await Promise.all([
        request("/items"),
        request("/items/categories"),
      ]);
      setItems(i.data || []);
      setCategories(c.data || []);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  };

  const loadReadyItems = async () => {
    if (!token || !officer) return;

    try {
      const result = await request(
        "/items/ready-for-handover",
        {},
        token
      );

      setReadyItems(result.data || []);
    } catch (e) {
      notify(e.message);
    }
  };

  const loadHistory = async () => {
    if (!token) return;

    try {
      const [cl, cu, ha] = await Promise.all([
        request("/history/claims", {}, token),
        request("/history/custody", {}, token),
        request("/history/handovers", {}, token),
      ]);

      setClaims(cl.data || []);
      setCustody(cu.data || []);
      setHandovers(ha.data || []);
    } catch (e) {
      if (/token|autentikasi|kedaluwarsa/i.test(e.message)) logout(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    loadHistory();
    
    if (officer) {
      loadReadyItems();
    }
  }, [token, officer]);

  const previousTab = useRef(tab);

  useEffect(() => {
    if (previousTab.current !== tab) {
      document.querySelector(".content")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      previousTab.current = tab;
    }
  }, [tab]);

  const logout = (show = true) => {
    localStorage.removeItem("mipa_token");
    localStorage.removeItem("mipa_user");

    setToken("");
    setUser(null);
    setClaims([]);
    setCustody([]);
    setHandovers([]);
    setTab("catalog");

    if (show) notify("Anda telah keluar dari akun.");
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const text = [
        read(item, "ITEM_NAME", "itemName"),
        read(item, "DESCRIPTION", "description"),
        read(item, "LOCATION_FOUND", "locationFound"),
      ].join(" ").toLowerCase();

      const cat = read(item, "CATEGORY_NAME", "categoryName", "CATEGORY");
      const st = String(statusOf(item)).toUpperCase();

      const matchSearch = text.includes(search.toLowerCase());

      const matchCategory =
        filter === "ALL" ||
        (filter.startsWith("STATUS:")
          ? st === filter.slice(7)
          : String(cat) === filter);

      return matchSearch && matchCategory;
    });
  }, [items, search, filter]);

  const submitAuth = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);

    try {
      const path = authMode === "login"
        ? "/auth/login"
        : "/auth/register";

      const payload = authMode === "login"
        ? {
            email: f.get("email"),
            password: f.get("password"),
          }
        : {
            fullName: f.get("fullName"),
            email: f.get("email"),
            password: f.get("password"),
            role: "MAHASISWA",
          };

      const result = await request(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (authMode === "register") {
        notify("Pendaftaran berhasil. Silakan masuk.");
        setAuthMode("login");
        setShowPassword(false);
      } else {
        const t = result.data?.token;
        const u = result.data?.user;

        if (!t || !u) throw new Error("Respons login tidak lengkap.");

        localStorage.setItem("mipa_token", t);
        localStorage.setItem("mipa_user", JSON.stringify(u));

        setToken(t);
        setUser(u);
        setModal("");

        notify(`Selamat datang, ${nameOf(u)}.`);
      }
    } catch (e) {
      notify(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reportItem = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    const payload = {
      categoryId: Number(f.get("categoryId")),
      itemName: f.get("itemName"),
      description: f.get("description"),
      secretQuestion: f.get("secretQuestion"),
      secretAnswer: f.get("secretAnswer"),
      photo: f.get("photo"),
      locationFound: f.get("locationFound"),
      dateFound: f.get("dateFound"),
    };

    try {
      await request("/items", {
        method: "POST",
        body: JSON.stringify(payload),
      }, token);

      setModal("");
      notify("Laporan barang berhasil dibuat.");
      loadCatalog();
    } catch (e) {
      notify(e.message);
    }
  };

  const submitClaim = async item => {
    if (!student) {
      return notify("Masuk sebagai mahasiswa untuk mengajukan klaim.");
    }

    setClaimLoading(true);

    try {
      const r = await request("/claims/submit", {
        method: "POST",
        body: JSON.stringify({ itemId: idOf(item) }),
      }, token);

      let claimId = Number(
        read(r.data, "CLAIM_ID", "claimId", "claim_id")
      );

      // Jika ID tidak dikembalikan oleh submit, cari dari riwayat
      if (!claimId) {
        const history = await request("/history/claims", {}, token);
        const matching = (history.data || []).find(
          c => Number(read(c, "ITEM_ID", "itemId", "item_id")) === idOf(item)
        );

        claimId = Number(
          read(matching, "CLAIM_ID", "claimId", "claim_id")
        );
      }

      if (!claimId) {
        throw new Error("ID klaim tidak ditemukan setelah pengajuan.");
      }

      setSelected(item);
      setSecretAnswer("");
      setClaimVerification({
        item,
        claimId,
        question: read(
          item,
          "SECRET_QUESTION",
          "secretQuestion",
          "secret_question"
        ),
      });
      setModal("claimVerify");
    } catch (e) {
      notify(e.message);
    } finally {
      setClaimLoading(false);
    }
  };

  const sendClaimVerification = async e => {
      e.preventDefault();
    
      if (!claimVerification || !secretAnswer.trim()) {
        return notify("Jawaban rahasia wajib diisi.");
      }
    
      setClaimLoading(true);
    
      try {
        await request("/claims/verify", {
          method: "POST",
          body: JSON.stringify({
            claimId: claimVerification.claimId,
            secretAnswer: secretAnswer.trim(),
          }),
        }, token);
      
        setModal("");
        setClaimVerification(null);
        setSecretAnswer("");
      
        notify("Jawaban verifikasi berhasil dikirim.");
        loadHistory();
        loadCatalog();
      } catch (e) {
        notify(e.message);
      } finally {
        setClaimLoading(false);
      }
    };
  
    const verifyClaim = claim => {
    const claimId = Number(
      read(claim, "CLAIM_ID", "claimId", "claim_id")
    );
  
    const itemId = Number(
      read(claim, "ITEM_ID", "itemId", "item_id")
    );
  
    const item = items.find(i => idOf(i) === itemId);
  
    if (!item) {
      return notify("Data barang tidak ditemukan.");
    }
  
    setClaimVerification({
      item,
      claimId,
      question: read(
        item,
        "SECRET_QUESTION",
        "secretQuestion",
        "secret_question"
      ),
    });
  
    setSecretAnswer("");
    setModal("claimVerify");
  };

  const decision = async (claim, action) => {
    const claimId = Number(read(claim, "CLAIM_ID", "claimId", "claim_id"));

    try {
      await request(`/claims/${action}`, {
        method: "POST",
        body: JSON.stringify({ claimId }),
      }, token);

      notify(`Klaim berhasil ${action === "approve" ? "disetujui" : "ditolak"}.`);
      loadHistory();
      loadCatalog();
    } catch (e) {
      notify(e.message);
    }
  };

  const addCustody = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    try {
      await request("/custody", {
        method: "POST",
        body: JSON.stringify({
          itemId: Number(f.get("itemId")),
          fromLocation: f.get("fromLocation"),
          toLocation: f.get("toLocation"),
          notes: f.get("notes"),
        }),
      }, token);

      setModal("");
      notify("Catatan penitipan berhasil disimpan.");
      loadHistory();
      loadCatalog();
    } catch (e) {
      notify(e.message);
    }
  };

  const createHandover = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    try {
      await request("/handovers/create", {
        method: "POST",
        body: JSON.stringify({
          itemId: Number(f.get("itemId")),
        }),
      }, token);

      setModal("");
      setSelected(null);
      notify("Serah terima berhasil dibuat.");

      loadHistory();
      loadCatalog();
      loadReadyItems();
    } catch (e) {
      notify(e.message);
    }
  };

  const confirmHandover = async h => {
    const handoverId = Number(
      read(h, "HANDOVER_ID", "handoverId", "handover_id")
    );

    try {
      await request("/handovers/confirm", {
        method: "POST",
        body: JSON.stringify({ handoverId }),
      }, token);

      notify("Serah terima berhasil dikonfirmasi.");
      notify("Serah terima berhasil dikonfirmasi.");
      loadHistory();
      loadCatalog();
      loadReadyItems();
      loadHistory();
      loadCatalog();
    } catch (e) {
      notify(e.message);
    }
  };

  const refresh = () => {
    loadCatalog();
    loadHistory();
    loadReadyItems();
  };

  const nav = [
    ...(token ? [{ id: "catalog", label: "Katalog", icon: "⌕" }] : []),
    ...(token && !officer ? [{ id: "claims", label: "Klaim", icon: "↗" }] : []),
    ...(token && !officer ? [{ id: "handovers", label: "Serah Terima", icon: "⇄" }] : []),
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          href="#home"
          className="brand"
          onClick={() => setTab("catalog")}
        >
          <div className="brand-mark">M.</div>
          <div className="brand-text">
            <strong>MIPA<span>-</span>TEMU</strong>
            <small>Temukan · Kembalikan · Hubungkan</small>
          </div>
        </a>

        <nav className="top-nav">
          {nav.map(n => (
            <button
              key={n.id}
              className={`nav-item ${tab === n.id ? "active" : ""}`}
              onClick={() => setTab(n.id)}
            >
              <span>{n.icon}</span>
              {n.label}
              {n.id === "claims" && unresolvedClaimsCount > 0 &&
                <span className="nav-count">{unresolvedClaimsCount}</span>
              }
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <div className="connection-status">
            <span className={`dot ${online ? "green" : "red"}`} />
            <span>{online ? "Terhubung" : "Terputus"}</span>
          </div>

          <button
            className="btn btn-report-top"
            onClick={() => {
              if (!token) setModal("auth");
              else setModal("report");
            }}
          >
            <span>＋</span> Laporkan barang
          </button>

          {user ? (
            <div className="user-pill">
              <div className="avatar">
                {nameOf(user)?.[0]?.toUpperCase() || "U"}
              </div>

              <div className="user-meta">
                <strong>{nameOf(user)}</strong>
                <small>{role}</small>
              </div>

              <button
                className="icon-button logout-button"
                title="Keluar"
                onClick={() => logout()}
              >
                ↗
              </button>
            </div>
          ) : (
            <button className="btn btn-login" onClick={() => setModal("auth")}>
              Masuk <span>↗</span>
            </button>
          )}
        </div>
      </header>

      <main className="main-area">
        <section className="hero" id="home">
          <div className="hero-left">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              FMIPA · UNIVERSITAS SYIAH KUALA
            </div>

            <h1>
              Hilang?
              <br />
              <span>Kami bantu</span>
              <br />
              menemukan.
            </h1>

            <p>
              Satu tempat untuk mencari barang yang hilang,
              melaporkan temuan, dan menghubungkan kembali
              pemilik dengan barangnya.
            </p>

            <div className="hero-actions">
              <button
                className="btn btn-primary"
                onClick={() => document.getElementById("catalog")?.scrollIntoView({
                  behavior: "smooth",
                })}
              >
                Jelajahi barang <span>↘</span>
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => {
                  if (!token) setModal("auth");
                  else setModal("report");
                }}
              >
                Laporkan temuan <span>＋</span>
              </button>
            </div>

            <div className="hero-footnote">
              <span className={`dot ${online ? "green" : "red"}`} />
              {online ? "SISTEM AKTIF" : "SERVER TIDAK TERSEDIA"}
              <span className="footnote-divider">/</span>
              SISTEM BARANG TEMUAN
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-orbit orbit-1" />
            <div className="visual-orbit orbit-2" />
            <div className="visual-orbit orbit-3" />
            <div className="visual-glow" />

            <div className="visual-object">
              <div className="object-inner">
                <span className="object-symbol">⌕</span>
                <span className="object-caption">TEMUAN</span>
              </div>
            </div>

            <div className="floating-note note-1">
              <span className="note-symbol">✳</span>
              <div>
                <strong>Temukan.</strong>
                <small>Cari barang di katalog</small>
              </div>
            </div>

            <div className="floating-note note-2">
              <span className="note-symbol">↗</span>
              <div>
                <strong>Kembalikan.</strong>
                <small>Verifikasi kepemilikan</small>
              </div>
            </div>

            <div className="visual-number">01 / 03</div>
          </div>

          <div className="hero-side-label">
            KOMUNITAS KAMPUS · 2026
          </div>
        </section>

        <section className="intro-strip">
          <div className="intro-block">
            <span className="intro-index">01</span>
            <div>
              <strong>Cari</strong>
              <small>Telusuri katalog barang.</small>
            </div>
          </div>

          <div className="intro-block">
            <span className="intro-index">02</span>
            <div>
              <strong>Verifikasi</strong>
              <small>Konfirmasi kepemilikan.</small>
            </div>
          </div>

          <div className="intro-block">
            <span className="intro-index">03</span>
            <div>
              <strong>Kembalikan</strong>
              <small>Ambil barang milikmu.</small>
            </div>
          </div>

          <div className="intro-decoration">MIPA / TEMU</div>
        </section>

        <section className="content">
          <div className="section-heading" id="catalog">
            <div>
              <div className="eyebrow dark-eyebrow">
                <span className="eyebrow-line" />
                {tab === "catalog" ? "JELAJAHI" : "AKTIVITAS"}
              </div>

              <h2>
                {tab === "catalog"
                  ? <>Barang yang<br />menunggu pemilik.</>
                  : nav.find(n => n.id === tab)?.label}
              </h2>

              <p>
                {tab === "catalog"
                  ? "Telusuri barang temuan dari komunitas FMIPA."
                  : "Kelola dan pantau proses transaksi barang."}
              </p>
            </div>

            {tab === "catalog" && (
              <div className="catalog-counter">
                <span>{filteredItems.length.toString().padStart(2, "0")}</span>
                <small>BARANG<br />DITEMUKAN</small>
              </div>
            )}
          </div>

          {tab === "catalog" && (
            <>
            {officer && (
              <div className="officer-handover-section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow dark-eyebrow">
                      PENGEMBALIAN BARANG
                    </div>
                    <h2>Siap diserahkan.</h2>
                    <p>
                      Barang dengan klaim disetujui yang belum diserahterimakan.
                    </p>
                  </div>

                  <div className="catalog-counter">
                    <span>{readyItems.length.toString().padStart(2, "0")}</span>
                    <small>MENUNGGU<br />SERAH TERIMA</small>
                  </div>
                </div>

                {readyItems.length > 0 ? (
                  <div className="item-grid">
                    {readyItems.map(item => (
                      <article className="item-card" key={item.ITEM_ID}>
                        <div className="item-body">
                          <div className="item-category">
                            {item.HANDOVER_STATUS === "COMPLETED"
                              ? "SERAH TERIMA SELESAI"
                              : item.HANDOVER_STATUS === "PENDING"
                              ? "MENUNGGU KONFIRMASI"
                              : "SIAP SERAH TERIMA"}
                          </div>
                    
                          <h3>{item.ITEM_NAME}</h3>
                    
                          <p>
                            ID Barang #{item.ITEM_ID}
                          </p>
                    
                          <div className="item-location">
                            Pemilik: {item.OWNER_NAME}
                          </div>
                    
                          {!item.HANDOVER_STATUS && (
                            <button
                              className="btn btn-card-primary btn-full"
                              onClick={() => {
                                setSelected(item);
                                setModal("handoverForm");
                              }}
                            >
                              Proses serah terima →
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty">
                    <h3>Belum ada barang siap diserahkan.</h3>
                    <p>
                      Barang akan muncul di sini setelah klaim disetujui
                      dan belum memiliki serah-terima.
                    </p>
                  </div>
                )}
              </div>
            )}
              <div className="catalog-toolbar">
                <div className="searchbox">
                  <span className="search-icon">⌕</span>
                  <input
                    placeholder="Cari nama barang, deskripsi, lokasi..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="clear-search" onClick={() => setSearch("")}>
                      ×
                    </button>
                  )}
                </div>

                <select value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="ALL">Semua kategori</option>
                  <option value="STATUS:ACTIVE">Tersedia</option>
                  <option value="STATUS:CLAIM_PENDING">Dalam proses</option>
                  <option value="STATUS:IN_CUSTODY">Dalam penitipan</option>

                  {categories.map(c => (
                    <option
                      key={read(c, "CATEGORY_ID", "categoryId")}
                      value={read(c, "CATEGORY_NAME", "categoryName", "NAME")}
                    >
                      {read(c, "CATEGORY_NAME", "categoryName", "NAME")}
                    </option>
                  ))}
                </select>

                <button
                  className="refresh-button"
                  onClick={refresh}
                  title="Perbarui data"
                >
                  ↻
                </button>
              </div>

              <div className="catalog-meta">
                <span>MENAMPILKAN {filteredItems.length} BARANG</span>
                <div className="catalog-legend">
                  <span><i className="dot green" /> Tersedia</span>
                  <span><i className="dot gold" /> Diproses</span>
                </div>
              </div>

              <div className="item-grid">
                {filteredItems.map((item, index) => {
                  const st = String(statusOf(item)).toUpperCase();
                  const available = ["ACTIVE", "FOUND"].includes(st);

                  return (
                    <article
                      className={`item-card card-${index % 4}`}
                      key={idOf(item)}
                      onMouseMove={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;

                        e.currentTarget.style.setProperty(
                          "--rx",
                          `${((y / rect.height) - 0.5) * -5}deg`
                        );

                        e.currentTarget.style.setProperty(
                          "--ry",
                          `${((x / rect.width) - 0.5) * 5}deg`
                        );
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.setProperty("--rx", "0deg");
                        e.currentTarget.style.setProperty("--ry", "0deg");
                      }}
                    >
                      <div className="item-image">
                        {read(item, "PHOTO", "photo") ? (
                          <img
                            src={read(item, "PHOTO", "photo")}
                            alt={read(item, "ITEM_NAME", "itemName")}
                            onError={e => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="image-placeholder">
                            <span>⌕</span>
                            <small>MIPA / TEMUAN</small>
                          </div>
                        )}

                        <span className="image-index">
                          #{String(index + 1).padStart(2, "0")}
                        </span>

                        <Badge status={st} />
                      </div>

                      <div className="item-body">
                        <div className="item-category">
                          {read(item, "CATEGORY_NAME", "categoryName", "CATEGORY") || "BARANG"}
                        </div>

                        <h3>{read(item, "ITEM_NAME", "itemName")}</h3>

                        <p>
                          {read(item, "DESCRIPTION", "description") ||
                            "Tidak ada deskripsi."}
                        </p>

                        <div className="item-location">
                          <span>⌖</span>
                          {read(item, "LOCATION_FOUND", "locationFound") ||
                            "Lokasi tidak tersedia"}
                        </div>

                        <div className="item-date">
                          DITEMUKAN · {dateOf(read(item, "DATE_FOUND", "dateFound"))}
                        </div>

                        <div className="item-actions">
                          <button
                            className="btn btn-outline"
                            onClick={() => {
                              setSelected(item);
                              setModal("detail");
                            }}
                          >
                            Detail <span>↗</span>
                          </button>

                          {!officer && (
                            <button
                              className="btn btn-card-primary"
                              disabled={!available}
                              onClick={() => submitClaim(item)}
                            >
                              {available ? "Ajukan klaim" : "Tidak tersedia"}
                              <span>→</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {filteredItems.length === 0 && (
                <div className="empty">
                  <span className="empty-symbol">⌕</span>
                  <h3>Barang tidak ditemukan.</h3>
                  <p>Coba kata kunci atau kategori lain.</p>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setSearch("");
                      setFilter("ALL");
                    }}
                  >
                    Atur ulang filter
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "claims" && (
            <DataPanel
              title="Riwayat Klaim"
              desc="Verifikasi dan pantau status klaim barang."
              data={claims}
              empty="Belum ada riwayat klaim."
              render={c => {
                const st = read(c, "CLAIM_STATUS", "claimStatus", "STATUS");

                return (
                  <div className="record">
                    <div className="record-main">
                      <strong>
                        {read(c, "ITEM_NAME", "itemName") ||
                          `Barang #${read(c, "ITEM_ID", "itemId")}`}
                      </strong>
                      <small>
                        KLAIM #{read(c, "CLAIM_ID", "claimId")} ·
                        {dateOf(read(c, "CLAIM_DATE", "claimDate"))}
                      </small>
                    </div>

                    <div className="record-actions">
                      {student && st === "PENDING" && (
                        <button
                          className="btn btn-outline btn-small"
                          onClick={() => verifyClaim(c)}
                        >
                          Verifikasi
                        </button>
                      )}

                      {admin && st === "VERIFIED" && (
                        <span className="verification-note verified">
                          <icon name="shield-check" size="sm" />
                          Jawaban Terverifikasi
                        </span>
                      )}

                      {admin && st === "VERIFIED" && (
                        <button
                          className="btn btn-card-primary btn-small"
                          onClick={() => decision(c, "approve")}
                        >
                          Setujui
                        </button>
                      )}

                      {admin && st === "PENDING" && (
                        <span className="verification-note">
                          <icon name="clock" size="sm" />
                          Jawaban Tidak Terverifikasi
                        </span>
                      )}

                      {admin && st === "PENDING" && (
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => decision(c, "reject")}
                        >
                          Tolak
                        </button>
                      )}
                      

                    </div>
                  </div>
                );
              }}
            />
          )}

          {tab === "custody" && (
            <DataPanel
              title="Riwayat Penitipan"
              desc="Catatan perpindahan lokasi barang."
              data={custody}
              empty="Belum ada catatan penitipan."
              render={c => (
                <div className="record">
                  <div className="record-main">
                    <strong>
                      {read(c, "ITEM_NAME", "itemName") ||
                        `Barang #${read(c, "ITEM_ID", "itemId")}`}
                    </strong>
                    <small>
                      {read(c, "FROM_LOCATION", "fromLocation")} →
                      {read(c, "TO_LOCATION", "toLocation")}
                    </small>
                  </div>

                  <small>
                    {dateOf(read(c, "RECORD_DATE", "CREATED_AT", "createdAt"))}
                  </small>
                </div>
              )}
            />
          )}

          {tab === "handovers" && (
            <DataPanel
              title="Serah Terima"
              desc="Pantau dan konfirmasi pengembalian barang."
              data={handovers}
              empty="Belum ada serah terima."
              render={h => (
                <div className="record">
                  <div className="record-main">
                    <strong>
                      {read(h, "ITEM_NAME", "itemName") ||
                        `Barang #${read(h, "ITEM_ID", "itemId")}`}
                    </strong>
                    <small>
                      SERAH TERIMA #{read(h, "HANDOVER_ID", "handoverId")} ·
                      {dateOf(read(h, "HANDOVER_DATE", "handoverDate"))}
                    </small>
                  </div>

                  <Badge
                    status={read(h, "HANDOVER_STATUS", "handoverStatus", "STATUS")}
                  />

                  {student &&
                    String(read(h, "HANDOVER_STATUS", "handoverStatus", "STATUS")).toUpperCase() === "PENDING" && (
                      <button
                        className="btn btn-card-primary btn-small"
                        onClick={() => confirmHandover(h)}
                      >
                        Konfirmasi penerimaan
                      </button>
                    )}
                </div>
              )}
            />
          )}
        </section>

        <footer className="footer">
          <div className="footer-brand">
            MIPA<span>-</span>TEMU
          </div>
          <span>FMIPA UNIVERSITAS SYIAH KUALA</span>
          <span>SISTEM BARANG TEMUAN · 2026</span>
        </footer>
      </main>

      {modal === "auth" && (
        <Modal close={() => setModal("")} wide>
          <div className="auth-layout">
            <div className="auth-visual">
              <div className="auth-orbit" />
              <div className="auth-orbit orbit-inner" />

              <div className="auth-visual-mark">
                <span>⌕</span>
                <small>TEMUKAN<br />BERSAMA</small>
              </div>

              <div className="auth-visual-copy">
                <span>KOMUNITAS FMIPA</span>
                <h2>
                  Hilang.
                  <br />
                  Ditemukan.
                  <br />
                  <em>Terhubung.</em>
                </h2>
              </div>

              <div className="auth-visual-footer">
                MIPA-TEMU / 2026
              </div>
            </div>

            <div className="auth-form-side">
              <div className="modal-header">
                <div className="eyebrow dark-eyebrow">
                  <span className="eyebrow-line" />
                  AKSES AKUN
                </div>

                <h2>
                  {authMode === "login"
                    ? "Selamat datang."
                    : "Gabung bersama kami."}
                </h2>

                <p>
                  {authMode === "login"
                    ? "Masuk untuk mengakses fitur transaksi."
                    : "Buat akun mahasiswa untuk menggunakan MIPA-TEMU."}
                </p>
              </div>

              <form onSubmit={submitAuth} className="form">
                {authMode === "register" && (
                  <Field label="Nama lengkap">
                    <input
                      name="fullName"
                      required
                      minLength="2"
                      placeholder="Nama lengkap"
                    />
                  </Field>
                )}

                <Field label="Email">
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                  />
                </Field>

                <Field label="Kata sandi">
                  <div className="password-wrap">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength="6"
                      placeholder="Minimal 6 karakter"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(v => !v)}
                      title={showPassword ? "Sembunyikan" : "Tampilkan"}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </Field>

                <button className="btn btn-primary btn-full" disabled={loading}>
                  {loading
                    ? "Sedang diproses..."
                    : authMode === "login"
                      ? "Masuk →"
                      : "Buat akun →"}
                </button>
              </form>

              <div className="switch-auth">
                {authMode === "login"
                  ? "Belum punya akun?"
                  : "Sudah punya akun?"}

                <button
                  onClick={() => {
                    setAuthMode(v => v === "login" ? "register" : "login");
                    setShowPassword(false);
                  }}
                >
                  {authMode === "login" ? "Daftar" : "Masuk"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modal === "report" && (
        <Modal close={() => setModal("")}>
          <div className="modal-header">
            <div className="eyebrow dark-eyebrow">LAPORAN BARU</div>
            <h2>Laporkan barang.</h2>
            <p>Isi informasi barang yang ditemukan.</p>
          </div>

          <form onSubmit={reportItem} className="form">
            <Field label="Nama barang">
              <input name="itemName" required minLength="2" maxLength="100" />
            </Field>

            <Field label="Kategori">
              <select name="categoryId" required defaultValue="">
                <option value="" disabled>Pilih kategori</option>
                {categories.map(c => (
                  <option
                    key={read(c, "CATEGORY_ID", "categoryId")}
                    value={read(c, "CATEGORY_ID", "categoryId")}
                  >
                    {read(c, "CATEGORY_NAME", "categoryName", "NAME")}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Deskripsi">
              <textarea name="description" maxLength="500" rows="3" />
            </Field>

            <Field label="Lokasi ditemukan">
              <input name="locationFound" required minLength="2" />
            </Field>

            <Field label="Tanggal ditemukan">
              <input
                name="dateFound"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
              />
            </Field>

            <Field label="URL foto (opsional)">
              <input name="photo" type="url" placeholder="https://..." />
            </Field>

            <Field label="Pertanyaan verifikasi rahasia">
              <input
                name="secretQuestion"
                required
                minLength="5"
                maxLength="255"
                placeholder="Contoh: Apa isi gantungan kunci?"
              />
            </Field>

            <Field label="Jawaban verifikasi">
              <input name="secretAnswer" required minLength="1" maxLength="255" />
            </Field>

            <button className="btn btn-primary btn-full">
              Kirim laporan →
            </button>
          </form>
        </Modal>
      )}

      {modal === "detail" && selected && (
        <Modal close={() => setModal("")}>
          <div className="detail-visual">
            {read(selected, "PHOTO", "photo") ? (
              <img
                src={read(selected, "PHOTO", "photo")}
                alt={read(selected, "ITEM_NAME", "itemName")}
              />
            ) : (
              <div className="image-placeholder">
                <span>⌕</span>
                <small>MIPA / TEMUAN</small>
              </div>
            )}

            <Badge status={statusOf(selected)} />
          </div>

          <div className="detail-content">
            <div className="eyebrow dark-eyebrow">DETAIL BARANG</div>

            <h2>{read(selected, "ITEM_NAME", "itemName")}</h2>

            <p>
              {read(selected, "DESCRIPTION", "description") ||
                "Tidak ada deskripsi."}
            </p>

            <div className="detail-row">
              <span>Lokasi</span>
              <strong>{read(selected, "LOCATION_FOUND", "locationFound")}</strong>
            </div>

            <div className="detail-row">
              <span>Tanggal</span>
              <strong>{dateOf(read(selected, "DATE_FOUND", "dateFound"))}</strong>
            </div>

            <div className="detail-row">
              <span>Kategori</span>
              <strong>
                {read(selected, "CATEGORY_NAME", "categoryName", "CATEGORY")}
              </strong>
            </div>

            <div className="verification-note">
              <strong>VERIFIKASI KEPEMILIKAN</strong>
              <p>
                Jawaban verifikasi tidak ditampilkan secara publik.
                Proses verifikasi dilakukan melalui sistem klaim.
              </p>
            </div>

            <button
              className="btn btn-primary btn-full"
              disabled={!["ACTIVE", "FOUND"].includes(String(statusOf(selected)).toUpperCase())}
              onClick={() => {
                setModal("");
                submitClaim(selected);
              }}
            >
              Ajukan klaim →
            </button>
          </div>
        </Modal>
      )}

      {modal === "claimVerify" && claimVerification && (
        <Modal
          close={() => {
            setModal("");
            setClaimVerification(null);
            setSecretAnswer("");
          }}
        >
          <div className="modal-header">
            <div className="eyebrow dark-eyebrow">
              VERIFIKASI KEPEMILIKAN
            </div>
        
            <h2>Konfirmasi kepemilikan.</h2>
        
            <p>
              Jawab pertanyaan rahasia dari pelapor untuk
              membantu memverifikasi kepemilikan barang.
            </p>
          </div>
        
          <div className="verification-note">
             <label className="secret-question-label">
              PERTANYAAN RAHASIA
            </label>
            <p>
              {claimVerification.question ||
                "Pertanyaan rahasia tidak tersedia dari data barang."}
            </p>
          </div>
              
          {!claimVerification.question ? (
            <div className="empty">
              <p>
                Pertanyaan rahasia tidak ditemukan pada data barang.
                Pengajuan sudah tercatat, tetapi verifikasi belum dapat dilakukan.
              </p>
            </div>
          ) : (
            <form
              className="form"
              onSubmit={sendClaimVerification}
            >
              <Field label="Jawaban rahasia">
                <input
                  value={secretAnswer}
                  onChange={e => setSecretAnswer(e.target.value)}
                  required
                  maxLength="255"
                  autoComplete="off"
                  placeholder="Masukkan jawaban..."
                />
              </Field>
          
              <button
                className="btn btn-primary btn-full"
                disabled={claimLoading || !secretAnswer.trim()}
              >
                {claimLoading
                  ? "Memverifikasi..."
                  : "Kirim jawaban →"}
              </button>
            </form>
          )}
        </Modal>
      )}

      {modal === "custodyForm" && (
        <Modal close={() => setModal("")}>
          <div className="modal-header">
            <div className="eyebrow dark-eyebrow">CATATAN PENITIPAN</div>
            <h2>Catat penitipan.</h2>
          </div>

          <form className="form" onSubmit={addCustody}>
            <Field label="ID barang">
              <input name="itemId" type="number" required />
            </Field>

            <Field label="Lokasi asal">
              <input name="fromLocation" required minLength="2" />
            </Field>

            <Field label="Lokasi tujuan">
              <input name="toLocation" required minLength="2" />
            </Field>

            <Field label="Catatan">
              <textarea name="notes" maxLength="500" />
            </Field>

            <button className="btn btn-primary btn-full">
              Simpan catatan →
            </button>
          </form>
        </Modal>
      )}

      {modal === "handoverForm" && (
        <Modal close={() => setModal("")}>
          <div className="modal-header">
            <div className="eyebrow dark-eyebrow">SERAH TERIMA</div>
            <h2>Buat serah terima.</h2>
          </div>

          <form className="form" onSubmit={createHandover}>
            {selected && (
              <div className="selected-item-info">
                <div className="item-category">BARANG TERPILIH</div>
                <h3>{selected.ITEM_NAME}</h3>
                <p>ID Barang #{selected.ITEM_ID}</p>
                <p>Pemilik: {selected.OWNER_NAME}</p>
              </div>
            )}

            <input
              type="hidden"
              name="itemId"
              value={selected?.ITEM_ID || ""}
            />

            <button
              className="btn btn-primary btn-full"
              disabled={!selected}
            >
              Buat serah terima →
            </button>
          </form>
        </Modal>
      )}

      {officer && tab === "custody" && (
        <button
          className="floating-action"
          onClick={() => setModal("custodyForm")}
        >
          ＋ Catat penitipan
        </button>
      )}

      {role === "OFFICER" && tab === "handovers" && (
        <button
          className="floating-action"
          onClick={() => setModal("handoverForm")}
        >
          ＋ Buat serah terima
        </button>
      )}

      {notice && (
        <div className="toast">
          <span>✳</span>
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
    </div>
  );
}

function Eye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0112 5c6.4 0 10 7 10 7s-3.6 7-10 7a10.9 10.9 0 01-4.2-.8" />
      <path d="M6.6 6.6C3.5 8.5 2 12 2 12s3.6 7 10 7" />
    </svg>
  );
}

function Badge({ status }) {
  const s = String(status || "UNKNOWN").toUpperCase();

  let cls = "status-process";

  if (["ACTIVE", "FOUND", "APPROVED", "CLAIM_APPROVED", "RETURNED", "COMPLETED"].includes(s)) {
    cls = "status-available";
  }

  if (["REJECTED", "CANCELLED"].includes(s)) {
    cls = "status-rejected";
  }

  const translations = {
    ACTIVE: "TERSEDIA",
    FOUND: "DITEMUKAN",
    CLAIM_PENDING: "MENUNGGU KLAIM",
    CLAIM_APPROVED: "KLAIM DISETUJUI",
    IN_CUSTODY: "DITITIPKAN",
    RETURNED: "DIKEMBALIKAN",
    COMPLETED: "SELESAI",
    APPROVED: "DISETUJUI",
    REJECTED: "DITOLAK",
    CANCELLED: "DIBATALKAN",
    PENDING: "MENUNGGU",
    UNKNOWN: "TIDAK DIKETAHUI",
  };

  return (
    <span className={`status-badge ${cls}`}>
      {translations[s] || s.replaceAll("_", " ")}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Modal({ close, children, wide = false }) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={e => e.target === e.currentTarget && close()}
    >
      <div className={`modal-box ${wide ? "modal-wide" : ""}`}>
        <button className="modal-close" onClick={close}>×</button>
        {children}
      </div>
    </div>
  );
}

function DataPanel({ title, desc, data, empty, render }) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div className="eyebrow dark-eyebrow">RIWAYAT AKTIVITAS</div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>

      {data.length ? (
        data.map((d, i) => <div key={i}>{render(d)}</div>)
      ) : (
        <div className="empty">
          <span className="empty-symbol">⌑</span>
          <h3>{empty}</h3>
          <p>Data akan tampil di sini saat transaksi dilakukan.</p>
        </div>
      )}
    </div>
  );
}

export default App;
