import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";

// Context
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { AdminProvider } from "./context/AdminContext";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLayout from "./components/AdminLayout";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import DesignEditor from "./pages/DesignEditor";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminContent from "./pages/admin/AdminContent";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AdminProvider>
          <BrowserRouter>
            <Routes>
              {/* Admin Routes - No Navbar/Footer */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/*" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Public Routes - With Navbar/Footer */}
              <Route path="/*" element={
                <div className="min-h-screen flex flex-col bg-white">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/produkter" element={<Products />} />
                      <Route path="/produkter/:category" element={<Products />} />
                      <Route path="/produkt/:productId" element={<ProductDetail />} />
                      <Route path="/design/:productId" element={<DesignEditor />} />
                      <Route path="/varukorg" element={<Cart />} />
                      <Route path="/kassa" element={<Checkout />} />
                      <Route path="/order-confirmation" element={<OrderConfirmation />} />
                      <Route path="/konto" element={<Account />} />
                      <Route path="/logga-in" element={<Login />} />
                      <Route path="/registrera" element={<Register />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              } />
            </Routes>
            <Toaster position="top-right" />
          </BrowserRouter>
        </AdminProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
