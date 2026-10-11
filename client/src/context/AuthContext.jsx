import { createContext, useContext, useEffect, useState } from "react";

import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
const loadUser = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    setUser(null);
    setLoading(false);
    return null;
  }

  try {
    const response = await api.get("/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const currentUser = response.data.user || response.data;

    setUser(currentUser);
    return currentUser;
  } catch (error) {
    console.error(
      "Failed to load current user:",
      error.response?.data || error.message
    );

    localStorage.removeItem("token");
    setUser(null);
    return null;
  } finally {
    setLoading(false);
  }
};

const refreshUser = async () => {
  return await loadUser();
};


  useEffect(() => {
    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}