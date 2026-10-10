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
      return;
    }

    try {
      const response = await api.get("/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      /*
        Our backend may return the user directly:

        {
          name: "...",
          email: "...",
          timeCredits: 2
        }

        Or inside a "user" property:

        {
          user: {
            name: "...",
            email: "...",
            timeCredits: 2
          }
        }

        This handles both formats.
      */

      const currentUser = response.data.user || response.data;

      setUser(currentUser);

    } catch (error) {
      console.error(
        "Failed to load current user:",
        error.response?.data || error.message
      );

      localStorage.removeItem("token");
      setUser(null);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = async () => {
    await loadUser();
  };

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