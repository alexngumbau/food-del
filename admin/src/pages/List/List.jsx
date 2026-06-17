import { useEffect, useState, useContext, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import './List.css';

const PAGE_SIZES = [10, 25, 50];

const categorySlug = (cat) =>
  (cat || '').toLowerCase().replace(/\s+/g, '-');

const formatRelative = (date) => {
  if (!date) return '—';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const List = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState({ key: 'name', dir: 'asc' });
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Client-side availability map (Phase 1 — until backend supports it).
  // Keyed by item _id, value boolean. Missing entries default to true.
  const [availability, setAvailability] = useState({});

  /* ---------- data ---------- */
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${url}/api/food/list`);
      if (res.data.success) setList(res.data.data);
      else toast.error('Failed to load items');
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFood = async (foodId) => {
    try {
      const res = await axios.post(
        `${url}/api/food/remove`,
        { id: foodId },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(foodId);
          return next;
        });
      } else {
        toast.error('Failed to delete item');
      }
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    await removeFood(id);
    await fetchList();
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} item(s)? This cannot be undone.`)) return;
    await Promise.all([...selected].map((id) => removeFood(id)));
    await fetchList();
  };

  /* ---------- derived data ---------- */
  const isAvailable = (item) =>
    availability[item._id] !== undefined ? availability[item._id] : true;

  const categories = useMemo(() => {
    const set = new Set(list.map((i) => i.category));
    return ['all', ...set];
  }, [list]);

  const stats = useMemo(() => {
    const total = list.length;
    const available = list.filter(isAvailable).length;
    const unavailable = total - available;
    const catCount = new Set(list.map((i) => i.category)).size;
    return { total, available, unavailable, catCount };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, availability]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter === 'available'   && !isAvailable(item)) return false;
      if (statusFilter === 'unavailable' &&  isAvailable(item)) return false;
      if (q) {
        const hay = `${item.name} ${item.description} ${item._id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, search, categoryFilter, statusFilter, availability]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const { key, dir } = sortBy;
      let av = a[key], bv = b[key];
      if (key === 'price') { av = Number(av); bv = Number(bv); }
      else { av = String(av || '').toLowerCase(); bv = String(bv || '').toLowerCase(); }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ?  1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * pageSize;
  const visible    = sorted.slice(pageStart, pageStart + pageSize);

  /* ---------- handlers ---------- */
  const toggleSort = (key) => {
    setSortBy((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const allSelected = visible.every((i) => selected.has(i._id));
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((i) => allSelected ? next.delete(i._id) : next.add(i._id));
      return next;
    });
  };

  // Phase 1: client-only. Replace with PATCH /api/food/availability later.
  const toggleAvailability = (id) => {
    setAvailability((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const bulkSetAvailability = (value) => {
    if (selected.size === 0) return;
    setAvailability((prev) => {
      const next = { ...prev };
      selected.forEach((id) => { next[id] = value; });
      return next;
    });
    toast.info('Availability is preview-only until backend support is added');
  };

  const sortIndicator = (key) =>
    sortBy.key === key ? <span className="sort">{sortBy.dir === 'asc' ? '↑' : '↓'}</span> : null;

  /* ---------- render ---------- */
  return (
    <div className="list">
      {/* Header */}
      <div className="list-header">
        <div>
          <h1>Menu Items</h1>
          <p>Manage your food catalog</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/add')}>+ Add Item</button>
      </div>

      {/* Stats */}
      <div className="list-stats">
        <div className="stat"><div className="label">Total Items</div><div className="value">{stats.total}</div></div>
        <div className="stat"><div className="label">Available</div><div className="value">{stats.available}</div></div>
        <div className="stat unavailable"><div className="label">Unavailable</div><div className="value">{stats.unavailable}</div></div>
        <div className="stat"><div className="label">Categories</div><div className="value">{stats.catCount}</div></div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="search"
            placeholder="Search by name, id, description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="select"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
            ))}
          </select>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="unavailable">Hidden</option>
          </select>
        </div>
      </div>

      {/* Bulk action banner */}
      {selected.size > 0 && (
        <div className="bulk-banner">
          <div className="left">
            <span className="check checked">✓</span>
            <span><strong>{selected.size} item{selected.size > 1 ? 's' : ''} selected</strong> · choose a bulk action</span>
          </div>
          <div className="actions">
            <button onClick={() => bulkSetAvailability(true)}>Make available</button>
            <button onClick={() => bulkSetAvailability(false)}>Hide</button>
            <button onClick={handleBulkDelete}>Delete</button>
            <button onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <span
                  className={`check ${visible.length > 0 && visible.every((i) => selected.has(i._id)) ? 'checked' : ''}`}
                  onClick={toggleSelectAllVisible}
                  title="Select all on page"
                >
                  {visible.length > 0 && visible.every((i) => selected.has(i._id)) ? '✓' : ''}
                </span>
              </th>
              <th className="sortable" onClick={() => toggleSort('name')}>Item {sortIndicator('name')}</th>
              <th className="sortable" onClick={() => toggleSort('category')}>Category {sortIndicator('category')}</th>
              <th className="sortable" onClick={() => toggleSort('price')}>Price {sortIndicator('price')}</th>
              <th>Status</th>
              <th>Live</th>
              <th>Updated</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="empty-state"><p>Loading items…</p></td></tr>
            )}

            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="icon">🍽️</div>
                    <h3>No items found</h3>
                    <p>{list.length === 0 ? 'Add your first menu item to get started.' : 'Try adjusting your filters.'}</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && visible.map((item) => {
              const live = isAvailable(item);
              return (
                <tr key={item._id} className={selected.has(item._id) ? 'selected' : ''}>
                  <td>
                    <span
                      className={`check ${selected.has(item._id) ? 'checked' : ''}`}
                      onClick={() => toggleSelect(item._id)}
                    >
                      {selected.has(item._id) ? '✓' : ''}
                    </span>
                  </td>
                  <td>
                    <div className="item-cell">
                      <img className="thumb" src={`${url}/images/${item.image}`} alt={item.name} />
                      <div>
                        <div className="item-name">{item.name}</div>
                        <div className="item-id">#{String(item._id).slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`category-pill ${categorySlug(item.category)}`}>{item.category}</span></td>
                  <td className="price">${item.price}</td>
                  <td>
                    <span className={`availability ${live ? '' : 'off'}`}>
                      <span className="dot-status"></span> {live ? 'Available' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`switch ${live ? '' : 'off'}`}
                      onClick={() => toggleAvailability(item._id)}
                      aria-label={live ? 'Hide item' : 'Show item'}
                    />
                  </td>
                  <td>{formatRelative(item.updatedAt || item.createdAt || item.date)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" title="Edit" disabled>✎</button>
                      <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(item._id)}>×</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div className="table-footer">
          <div>
            Showing {sorted.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + pageSize, sorted.length)} of {sorted.length} items
            {selected.size > 0 && ` · ${selected.size} selected`}
          </div>
          <div className="page-controls">
            <span style={{ marginRight: 8 }}>Rows per page</span>
            <select
              className="select"
              style={{ padding: '4px 8px' }}
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <button className="page-btn" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((n) => (
              <button
                key={n}
                className={`page-btn ${n === safePage ? 'active' : ''}`}
                onClick={() => setPage(n)}
              >{n}</button>
            ))}
            <button className="page-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default List;