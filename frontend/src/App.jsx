import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

import TicketList from "./pages/Tickets/TicketList";
import TicketDetail from "./pages/Tickets/TicketDetail";

import AssetList from "./pages/Assets/AssetList";

import KBList from "./pages/KnowledgeBase/KBList";
import KBDetail from "./pages/KnowledgeBase/KBDetail";

import Users from "./pages/Admin/Users";
import Categories from "./pages/Admin/Categories";
import Departments from "./pages/Admin/Departments";
import SLAPolicies from "./pages/Admin/SLAPolicies";
import Vendors from "./pages/Admin/Vendors";

import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontSize: "14px", fontWeight: 500 },
          success: { iconTheme: { primary: "#1a3150", secondary: "#fff" } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />

          <Route
            path="/assets"
            element={
              <ProtectedRoute roles={["admin", "it_manager", "asset_manager", "technician"]}>
                <AssetList />
              </ProtectedRoute>
            }
          />

          <Route path="/knowledge-base" element={<KBList />} />
          <Route path="/knowledge-base/:id" element={<KBDetail />} />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["admin", "it_manager"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute roles={["admin", "it_manager"]}>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/slas"
            element={
              <ProtectedRoute roles={["admin"]}>
                <SLAPolicies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendors"
            element={
              <ProtectedRoute roles={["admin", "asset_manager"]}>
                <Vendors />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
