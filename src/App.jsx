import { Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import FavoritesPage from "./pages/FavoritesPage";
import CartPage from "./pages/CartPage";
import AiAgentPage from "./pages/AiAgentPage";
import CompaniesPage from "./pages/CompaniesPage";
import ProfilePage from "./pages/ProfilePage";
import SellerDashboardPage from "./pages/SellerDashboardPage";
import ModeratorDashboardPage from "./pages/ModeratorDashboardPage";
import TariffsPage from "./pages/TariffsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyAccountPage from "./pages/VerifyAccountPage";

function AntDThemeBridge({ children }) {
  const { theme } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#0D0D0D",
          borderRadius: 12,
          fontFamily: "'Inter', system-ui, sans-serif",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

function App() {
  return (
    <div className="max-w-[1440px] w-full m-auto bg-white dark:bg-[#0D0D0D] sm:bg-[#F4F6F8] sm:dark:bg-[#121212]">
      <ThemeProvider>
        <AntDThemeBridge>
          <AuthProvider>
            <CartProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify/:token" element={<VerifyAccountPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/products-explore" element={<CatalogPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/ai-agent" element={<AiAgentPage />} />
                <Route path="/companies" element={<CompaniesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/company/:id" element={<ProfilePage />} />
                <Route path="/seller" element={<SellerDashboardPage />} />
                <Route path="/moderator" element={<ModeratorDashboardPage />} />
                <Route path="/tariffs" element={<TariffsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </AntDThemeBridge>
      </ThemeProvider>
    </div>
  );
}

export default App;
