import { useEffect } from "react";
import { createContext } from "react";
import { useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

  const url = "http://localhost:4000";
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");

  useEffect(() => {
    if (localStorage.getItem("admin_token")) {
      setToken(localStorage.getItem("admin_token"));
    }
  }, []);

  const contextValue = {
    url, 
    token,
    setToken,
  }

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  )
}

export default StoreContextProvider