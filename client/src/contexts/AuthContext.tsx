import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Customer } from "../api";
import { getCurrentCustomer } from "../api";

interface AuthContextType {
  isAuthenticated: boolean;
  customer: Customer | null;
  loading: boolean;
  setCustomer: (customer: Customer | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize state based on token presence
  const hasToken = !!localStorage.getItem("jwt");
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(hasToken); // Only loading if we have a token to verify

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      // Fetch current customer info
      getCurrentCustomer()
        .then((customerData) => {
          setCustomer(customerData);
        })
        .catch(() => {
          localStorage.removeItem("jwt");
          setIsAuthenticated(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // If no token, loading is already false from initial state
  }, []);

  const logout = () => {
    localStorage.removeItem("jwt");
    setIsAuthenticated(false);
    setCustomer(null);
  };

  const handleSetCustomer = (customerData: Customer | null) => {
    setCustomer(customerData);
    setIsAuthenticated(!!customerData);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        customer,
        loading,
        setCustomer: handleSetCustomer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
