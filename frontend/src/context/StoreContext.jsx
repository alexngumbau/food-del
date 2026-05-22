import axios from "axios";
import { createContext, useEffect, useState } from "react";


export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

  const url = "http://localhost:4000";
  const [cartItems, setCartItems] = useState({});
  const [token,setToken] = useState(localStorage.getItem("user_token") || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("user_refresh_token") || "");
  const [food_list, setFoodList] = useState([]);

  const logout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_refresh_token");
    setToken("");
    setRefreshToken("");
  }

  const addToCart = async (itemId) => {
    if (!cartItems[itemId]) {
      setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
    } else {
      setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    }
    if (token) {
      await axios.post(url + "/api/cart/add", {itemId}, {headers:{token}});
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    if (token) {
      await axios.post(url + "/api/cart/remove", {itemId}, {headers:{token}} );
    }
  };

  const loadCartData = async (token) => {
    const response = await axios.get(url + "/api/cart/get", {headers: {token}} );
    setCartItems(response.data.cartData);

  }

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        totalAmount += itemInfo.price * cartItems[item];
      }
    }
    return totalAmount;
  }

  const fetchFoodList = async () => {
    const response = await axios.get(url + "/api/food/list");
    setFoodList(response.data.data);
  }

  useEffect(() => {
    
    async function loadData() {
      await fetchFoodList();
      const storedToken = localStorage.getItem("user_token");
      if (storedToken) {
        setToken(storedToken);
        await loadCartData(storedToken);
      }
    }
    loadData();
  }, []);

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
    setToken,
    refreshToken,
    setRefreshToken,
    logout,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
