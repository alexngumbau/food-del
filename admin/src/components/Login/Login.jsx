import { useContext } from 'react'
import { StoreContext } from '../../context/StoreContext'
import { useState } from 'react';
import axios from 'axios';
import './Login.css';
import { toast } from 'react-toastify';

const Login = () => {
  const {url, setToken} = useContext(StoreContext);
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const onChangeHandler = (e) => {
    setData((prev) => ({...prev, [e.target.name]: e.target.value}));
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const response = await axios.post(`${url}/api/user/login`, data);
    
    if (response.data.success) {
      localStorage.setItem("admin_token", response.data.token);
      setToken(response.data.token);
      toast.success(response.data.message);
    } else {
      toast.error(response.data.message);
    }
  }

  return (
    <div className="login">
      <form onSubmit={onSubmitHandler} className="login-form">
        <h2>Admin Login</h2>
        <input name='email' onChange={onChangeHandler} type="email" placeholder='Email' required />
        <input name='password' onChange={onChangeHandler} type="password" placeholder='Password' required />
        <button type='submit'>Login</button>
      </form>
    </div>
  )
}

export default Login