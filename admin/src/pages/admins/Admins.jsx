import { useContext } from 'react';
import './Admins.css';
import { StoreContext } from '../../context/StoreContext';
import { useState } from 'react';
import {toast} from 'react-toastify';
import axios from 'axios';
import { useEffect } from 'react';

export const Admins = () => {

  const {url, token} = useContext(StoreContext);
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const fetchAdmins = async() => {
    const response = await axios.get(`${url}/api/user/list-admins`, {headers: {token} });
    if (response.data.success) {
      setAdmins(response.data.data);
    } else {
      toast.error("Failed to fetch admins");
    }
  };

  const onChangeHandler = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const response = await axios.post(`${url}/api/user/create-admin`, data, {headers: {token}});
    if (response.data.success) {
      toast.success(response.data.message);
      setData({name: "", email: "", password: ""});
      setShowForm(false);
      await fetchAdmins();
    } else {
      toast.error(response.data.message || "Failed to create admin");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAdmins();
  }, [token]);


  return (
    <div className="admins add">

      <div className="admins-header">
        <p>Admin Users</p>
        <button className='admins-add-btn' onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Admin"}</button>
      </div>

      {showForm && (
        <form onSubmit={onSubmitHandler}  className="admins-form">
          <input type="text" name="name" value={data.name} placeholder='Full Name' required  onChange={onChangeHandler} />
          <input type="email" name="email" value={data.email} placeholder='Email' required onChange={onChangeHandler} />
          <input type="password" name="password" value={data.password} placeholder='Password (min 8 characters)' required minLength={8} onChange={onChangeHandler} />
          <button type='submit'>Create Admin</button>
        </form>
      )}

      <div className="admins-table">
        <div className="admins-table-format title">
          <b>Name</b>
          <b>Email</b>
          <b>Created</b>
        </div>
        {admins.map((admin) => (
          <div key={admin._id} className="admins-table-format">
            <p>{admin.name}</p>
            <p>{admin.email}</p>
            <p>{new Date(admin.createdAt || admin._id.toString().substring(0, 8)).toLocaleDateString()}</p>
          </div>
        ))}
        {admins.length === 0 && <p className='admins-empty'>No admin users found.</p>}
      </div>
    </div>
  )
}
