import api from "./axios";

// Auth
export const login = (data) => api.post("/auth/login", data);
export const register = (data) => api.post("/auth/register", data);
export const getMe = () => api.get("/auth/me");
export const updateMe = (data) => api.put("/auth/me", data);

// Users
export const getUsers = (params) => api.get("/users", { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post("/users", data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getTechnicianWorkload = () => api.get("/users/technicians/workload");

// Departments
export const getDepartments = () => api.get("/departments");
export const createDepartment = (data) => api.post("/departments", data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);

// Categories
export const getCategories = () => api.get("/categories");
export const createCategory = (data) => api.post("/categories", data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// SLA
export const getSLAs = () => api.get("/slas");
export const createSLA = (data) => api.post("/slas", data);
export const updateSLA = (id, data) => api.put(`/slas/${id}`, data);
export const deleteSLA = (id) => api.delete(`/slas/${id}`);

// Vendors
export const getVendors = () => api.get("/vendors");
export const createVendor = (data) => api.post("/vendors", data);
export const updateVendor = (id, data) => api.put(`/vendors/${id}`, data);
export const deleteVendor = (id) => api.delete(`/vendors/${id}`);

// Tickets
export const getTickets = (params) => api.get("/tickets", { params });
export const getTicket = (id) => api.get(`/tickets/${id}`);
export const createTicket = (data) => api.post("/tickets", data);
export const updateTicket = (id, data) => api.put(`/tickets/${id}`, data);
export const addComment = (id, data) => api.post(`/tickets/${id}/comments`, data);
export const addWorkLog = (id, data) => api.post(`/tickets/${id}/worklogs`, data);
export const getAISuggestions = (id) => api.get(`/tickets/${id}/ai-suggestions`);

// Assets
export const getAssets = (params) => api.get("/assets", { params });
export const getAsset = (id) => api.get(`/assets/${id}`);
export const createAsset = (data) => api.post("/assets", data);
export const updateAsset = (id, data) => api.put(`/assets/${id}`, data);
export const deleteAsset = (id) => api.delete(`/assets/${id}`);

// Knowledge Base
export const getArticles = (params) => api.get("/kb", { params });
export const getArticle = (id) => api.get(`/kb/${id}`);
export const createArticle = (data) => api.post("/kb", data);
export const updateArticle = (id, data) => api.put(`/kb/${id}`, data);
export const deleteArticle = (id) => api.delete(`/kb/${id}`);
export const markHelpful = (id) => api.post(`/kb/${id}/helpful`);

// Notifications
export const getNotifications = () => api.get("/notifications");
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put("/notifications/read-all");

// Dashboard
export const getDashboardStats = () => api.get("/dashboard");
