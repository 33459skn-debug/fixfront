// API URL - uses environment variable in production, localhost in development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Save token to localStorage
const setToken = (token) => localStorage.setItem('token', token);

// Remove token from localStorage
const removeToken = () => localStorage.removeItem('token');

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
};

// Auth API
export const authAPI = {
    signup: async (email, password, name) => {
        const data = await apiCall('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
        setToken(data.token);
        return data;
    },

    login: async (email, password) => {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        return data;
    },

    logout: () => {
        removeToken();
    },

    getMe: async () => {
        return apiCall('/auth/me');
    },

    isLoggedIn: () => {
        return !!getToken();
    },
};

// Tasks API
export const tasksAPI = {
    getAll: async () => {
        const data = await apiCall('/tasks');
        return data.tasks;
    },

    create: async (task) => {
        const data = await apiCall('/tasks', {
            method: 'POST',
            body: JSON.stringify(task),
        });
        return data.task;
    },

    update: async (id, updates) => {
        const data = await apiCall(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        return data.task;
    },

    delete: async (id) => {
        return apiCall(`/tasks/${id}`, {
            method: 'DELETE',
        });
    },
};

export { getToken, setToken, removeToken };
