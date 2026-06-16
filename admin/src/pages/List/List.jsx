import { useEffect, useState, useContext, useMemo } from 'react'
import './List.css'
import axios from 'axios';
import { toast } from 'react-toastify';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZES = [10, 25, 50];

const categorySlug = (cat) => 
  (cat || '').toLowerCase().replace(/\s+/g, '-');

const formatRelative = (date) => {
  if (!date) return '-';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const List = () => {

  const {url, token} = useContext(StoreContext);
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState({key: 'name', dir: 'asc'});
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [availability, setAvailability] = useState({});

  // data
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${url}/api/food/list`);
      if (res.data.success) setList(res.data.data);
      else toast.error(res.data.message);
    } catch (err) {
      console.log('Failed to load items.', err);
      toast.error('Failed to load items.')
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  },  []);

  const removeFood = async (foodId) => {
    try {
      const res =  await axios.post(
        `${url}/api/food/remove`,
        {id: foodId},
        {headers: {token}}
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(foodId);
          return next;
        })
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.log('Failed to delete item', err);
      toast.error('Failed to delete item');
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item? This cannot be undone')) return;
    await removeFood(id);
    await fetchList();
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} item(s)? This cannnot be undone.`)) return;
    await Promise.all([...selected].map((id) => removeFood(id)));
    await fetchList();
  }

  // derived data
  const isAvailable = (item) => 
    availability[item._id] !== undefined ? availability[item._id] : true;

  const categories = useMemo (() => {
    const set = new Set(list.map((i) => i.category));
    return ['all', ...set];
  }, [list]);

  const stats = useMemo(() => {
    const total = list.length;
    const available = list.filter(isAvailable).length;
    const unavailable = total - available;
    const catCount = new Set(list.map((i) => i.category)).size;
    return { total, available, unavailable, catCount };
  }, [list, availability]);

  const filtered = useMemo (() => {
    const q = search.trim().toLowerCase();
    return list.filter((item) => {
      if (categoryFilter != 'all' && item.category !== categoryFilter) return false;
      if (statusFilter === 'available' && !isAvailable(item)) return false;
      if (statusFilter === 'unavailable' && isAvailable(item)) return false;
      if (q) {
        const hay = `${item.name} ${item.description} ${item._id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
  }, [list, search, categoryFilter, statusFilter, availability]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const { key, dir } = sortBy;
      let av = a[key], bv = b[key];
      if (key === 'price') { av = Number(av); bv = Number(bv); }
      else { av = String(av || '').toLowerCase(); bv = String(bv || '').toLowerCase(); }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visible = sorted.slice(pageStart, pageStart * pageSize);

  // Handlers
  const toggleSort = (key) => {
    setSortBy((prev) => 
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc'}
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
      visible.forEach((i) => allSelected ? next.delete(i._id) : next.add(i._add));
      return next;
    });
  };

  // phase 1: client-only. Replace with PATCH /api/foof/availability later
  const toggleAvailability = (id) => {
    setAvailability((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }
  
  const bulkSetAvailability = (value) => {
    if (selected.size === 0) return;
    setAvailability((prev) => {
      const next = { ...prev };
      selected.forEach((id) => {next[id] = value; });
      return next;
    });
    toast.info('Availability is preview-only until backend support is added');
  };

  const setIndicator = (key) => 
    sortBy.key === key ? <span className="sort">{sortBy.dir === 'asc' ? '↑' : '↓'}</span> : null;


  

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
    </div>
  )
}
