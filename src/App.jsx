import { Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { lazy, Suspense } from "react";
import Loader from "./components/ui/Loader";

const LoginPage = lazy(() => import("./pages/LoginPage"))
const HomePage = lazy(() => import("./pages/HomePage"))
const CatalogPage = lazy(() => import("./pages/CatalogPage"))
const ProductPage = lazy(() => import("./pages/ProductPage"))
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"))
const CartPage = lazy(() => import("./pages/CartPage"))
const AiAgentPage = lazy(() => import("./pages/AiAgentPage"))
const CompaniesPage = lazy(() => import("./pages/CompaniesPage"))
const ProfilePage = lazy(() => import("./pages/ProfilePage"))
const SellerDashboardPage = lazy(() => import("./pages/SellerDashboardPage"))
const ModeratorDashboardPage = lazy(() => import("./pages/ModeratorDashboardPage"))
const TariffsPage = lazy(() => import("./pages/TariffsPage"))
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"))
const VerifyAccountPage = lazy(() => import("./pages/VerifyAccountPage"))

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
                <Route path="/login" element={
                  <Suspense fallback={<Loader />}>
                    <LoginPage />
                  </Suspense>
                } />
                <Route path="/forgot-password" element={
                  <Suspense fallback={<Loader />}>
                    <ForgotPasswordPage />
                  </Suspense>
                } />
                <Route path="/verify/:token" element={
                  <Suspense fallback={<Loader />}>
                    <VerifyAccountPage />
                  </Suspense>
                } />
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={
                  <Suspense fallback={<Loader />}>
                    <CatalogPage />
                  </Suspense>
                } />
                <Route path="/products-explore" element={
                  <Suspense fallback={<Loader />}>
                    <CatalogPage />
                  </Suspense>
                } />
                <Route path="/product/:id" element={
                  <Suspense fallback={<Loader />}>
                    <ProductPage />
                  </Suspense>
                } />
                <Route path="/favorites" element={
                  <Suspense fallback={<Loader />}>
                    <FavoritesPage />
                  </Suspense>
                } />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/ai-agent" element={
                  <Suspense fallback={<Loader />}>
                    <AiAgentPage />
                  </Suspense>
                } />
                <Route path="/companies" element={
                  <Suspense fallback={<Loader />}>
                    <CompaniesPage />
                  </Suspense>
                } />
                <Route path="/profile" element={
                  <Suspense fallback={<Loader />}>
                    <ProfilePage />
                  </Suspense>
                } />
                <Route path="/company/:id" element={
                  <Suspense fallback={<Loader />}>
                    <ProfilePage />
                  </Suspense>
                } />
                <Route path="/seller" element={
                  <Suspense fallback={<Loader />}>
                    <SellerDashboardPage />
                  </Suspense>
                } />
                <Route path="/moderator" element={
                  <Suspense fallback={<Loader />}>
                    <ModeratorDashboardPage />
                  </Suspense>
                } />
                <Route path="/tariffs" element={
                  <Suspense fallback={<Loader />}>
                    <TariffsPage />
                  </Suspense>
                } />
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
