import { useEffect } from "react";
import { createContext } from "react";
import { useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

  const url = "http://localhost:4000";
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("admin_refresh_token") || "");

  useEffect(() => {
    if (localStorage.getItem("admin_token")) {
      setToken(localStorage.getItem("admin_token"));
    }

    if (localStorage.getItem("admin_refresh_token")) {
      setRefreshToken(localStorage.getItem("admin_refresh_token"));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    setToken("");
    setRefreshToken("");
  };

  const contextValue = {
    url, 
    token,
    setToken,
    refreshToken,
    setRefreshToken,
    logout,
  }

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  )
}

export default StoreContextProvider