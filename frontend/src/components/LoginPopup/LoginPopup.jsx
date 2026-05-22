import { useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/frontend_assets/assets";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from 'axios';


const LoginPopup = ({ setShowLogin }) => {
  const [currState, setCurrState] = useState("Login");
  const {url, setToken, setRefreshToken } = useContext(StoreContext);

  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({...data, [name]: value}));
  }

  const login = async(event) => {
    event.preventDefault();
    let newUrl = url;
    if (currState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
    }
    const response = await axios.post(newUrl, data);
    console.log(response);

    if (response.data.success) {
      setToken(response.data.token)
      localStorage.setItem("user_token", response.data.token);
      setRefreshToken(response.data.refreshToken);
      localStorage.setItem("user_refresh_token", response.data.refreshToken);
      setShowLogin(false);
    } else {
      alert(response.data.message);
    }
  }


  return (
    <div className="login-popup">
      <form onSubmit={login} className="login-popup-container">
        <div className="login-pop-title">
          <h2>{currState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt=""
          />
        </div>
        <div className="login-popup-inputs">
          {currState === "Login" ? (
            <></>
          ) : (
            <input type="text" placeholder="Your name" name="name" onChange={onChangeHandler} value={data.name} required />
          )}
          <input type="email" placeholder="Your email" required name="email" onChange={onChangeHandler} value={data.email} />
          <input type="password" placeholder="Password" required name="password" onChange={onChangeHandler} value={data.password} />
        </div>
        <button type="submit">{currState === "Sign Up" ? "Create account" : "Login"}</button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, i agree to the terms of use & privacy policy.</p>
        </div>
        {currState==="Login"
          ?<p>Create a new account? <span onClick={() => setCurrState("Sign Up")}>Click here</span></p>
          :<p>Already have an account? <span onClick={() => setCurrState("Login")}>Login here</span></p>
        }
        
        
      </form>
    </div>
  );
};

export default LoginPopup;
