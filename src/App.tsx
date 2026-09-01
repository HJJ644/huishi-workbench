import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Menu } from "lucide-react";
import { AppProvider, useApp } from "./store/AppContext";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { Overview } from "./pages/Overview";
import { Orders } from "./pages/Orders";
import { Schedule } from "./pages/Schedule";
import { Warehouse } from "./pages/Warehouse";
import { Settings } from "./pages/Settings";
import { About } from "./pages/About";

function ToastContainer() {
  const { toast, dispatch } = useApp();
  if (!toast.visible) return null;
  return (
    <Toast
      message={toast.message}
      onClose={() => dispatch({ type: "HIDE_TOAST" })}
    />
  );
}

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
        <ToastContainer />
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden mb-4 p-2 rounded-lg bg-surface border border-border text-text-secondary"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/warehouse" element={<Warehouse />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
