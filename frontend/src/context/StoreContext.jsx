import axios from "axios";
import { createContext, useEffect, useState, useRef, useCallback } from "react";


export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

  const url = "http://localhost:4000";
  const [cartItems, setCartItems] = useState({});
  const [token,setToken] = useState(localStorage.getItem("user_token") || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("user_refresh_token") || "");
  const [food_list, setFoodList] = useState([]);
  
  const isRefreshing = useRef(false);
  const failedQueue = useRef([]);

  const processQueue = (newToken) => {
    failedQueue.current.forEach((cb) => cb(newToken));
    failedQueue.current = [];
  }

  const logout = useCallback(() => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_refresh_token");
    setToken("");
    setRefreshToken("");
  }, []);


  useEffect(() => {
    const interceptor = axios.interceptors.response.use (
      (response) => {
        if (
          response.data &&
          response.data.success === false &&
          response.data.expired === true
        ) {
          const originalRequest = response.config;

          if (originalRequest.url.includes("/refresh-token")) {
            logout();
            return response;
          }

          if (originalRequest._retry) {
            logout();
            return response;
          }

          originalRequest._retry = true;

          if (isRefreshing.current) {
            return new Promise((resolve) => {
              failedQueue.current.push((newToken) => {
                if (!newToken) {
                  resolve(response);
                  return;
                }

                originalRequest.headers.token = newToken;
                resolve(axios(originalRequest));
              });
            });
          }

          isRefreshing.current = true;

          const storedRefreshToken = localStorage.getItem("user_refresh_token");

          return axios
            .post(`${url}/api/user/refresh-token`, {
              refreshToken: storedRefreshToken,
            })
            .then((res) => {
              if (res.data.success) {
                const newToken = res.data.token;
                localStorage.setItem("user_token", newToken);
                setToken(newToken);
                processQueue(newToken);

                originalRequest.headers.token = newToken;
                return axios(originalRequest);
              }

              processQueue(null);
              logout();
              return response;
            })
            .catch (() => {
              processQueue(null);
              logout();
              return response;
            })
            .finally (() => {
              isRefreshing.current = false;
            });
        } 

        return response;

      },
      (error) => Promise.reject(error),
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [url, logout]);

  const refreshAccessToken = useCallback(async () => {
    const storeRefreshToken = localStorage.getItem("user_refresh_token");

    if (!storeRefreshToken) {
      logout();
      return null;
    }

    try {
      const response = await axios.post(`${url}/api/user/refresh-token`, {
        refreshToken: storeRefreshToken,
      });

      if (response.data.success) {
        const newToken = response.data.token;
        localStorage.setItem("user_token", newToken);
        setToken(newToken);
        return newToken;
      }

      logout();
      return null;
    } catch {
      logout();
      return null;
    }
  }, [url, logout]);

  const getTokenExpiryTime = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (!token) return;

    const expiryTime = getTokenExpiryTime(token);

    if (!expiryTime) {
      const timer = setTimeout(() => {
        logout();
      }, 0);

      return () => clearTimeout(timer);
    }

    const refreshTime = expiryTime - Date.now() - 15 * 1000;

    if (refreshTime <= 0) {
      const timer = setTimeout(() => {
        refreshAccessToken();
      }, 0);

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      refreshAccessToken();
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [token, logout, refreshAccessToken]);

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
