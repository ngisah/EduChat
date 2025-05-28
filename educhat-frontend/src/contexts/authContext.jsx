import React, { createContext, useState, useEffect, useContext } from 'react';
import {authService} from '../services/authService'; // Import your authentication service

// Create a context for authentication
const AuthContext = createContext();

// AuthProvider component that wraps the app and provides authentication state
export const AuthProvider = ({ children }) => {
    // State for storing user data
    const [user, setUser] = useState(null);
    // State for storing authentication token
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    // Loading state for handling authentication checks
    const [loading, setLoading] = useState(true);

    // Effect hook to check authentication status on component mount
    useEffect(() => {
        // Check if there's a stored user when a token exists
        const storedUser = localStorage.getItem('authUser');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, [token]);

    // Handle user login
    const login = async (email, password) => {
        setLoading(true);
        try {
            // Call authentication service to login
            const data = await authService.login(email, password);
            // Update state with user data and token
            setUser(data.user);
            setToken(data.token);
            // Store authentication data in localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('authUser', JSON.stringify(data.user));
            setLoading(false);
            return data;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    // Handle user registration
    const register = async (fullName, email, password, role) => {
        setLoading(true);
        try {
            // Call authentication service to register new user
            const data = await authService.register(fullName, email, password, role);
            // Update state with new user data and token
            setUser(data.user);
            setToken(data.token);
            // Store authentication data in localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('authUser', JSON.stringify(data.user));
            setLoading(false);
            return data;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    // Handle user logout
    const logout = async () => {
        // Call authentication service to logout
        await authService.logout();
        // Clear user data and token from state
        setUser(null);
        setToken(null);
        // Remove authentication data from localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    };

    // Provide authentication context to children components
    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            register, 
            logout, 
            isAuthenticated: !!user, // Boolean flag for authentication status
            isLoading: loading 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for using authentication context
export const useAuth = () => useContext(AuthContext);
