// Real API client for skladmarket.uz (auth/user/company/category/product/lead/chat/notification/report
// microservices, all proxied under /api — see vite.config.js). Every function below keeps the same
// name/signature the app already relies on; only the implementation talks to the real backend now.
import http, { unwrap } from "./http";

function toSingleFileForm(file) {
  const form = new FormData();
  form.append("file", file);
  return form;
}

function toMultiFileForm(files) {
  const form = new FormData();
  Array.from(files).forEach((file) => form.append("files", file));
  return form;
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function registerUser({ firstName, lastName, username, password, roles }) {
  const data = await unwrap(http.post("/auth/registration", { firstName, lastName, username, password }, { params: roles ? { roles } : undefined }));
  return { success: true, message: data };
}

export async function login({ username, password }) {
  const data = await unwrap(http.post("/auth/registration/login", { username, password }));
  if (data?.accessToken) localStorage.setItem("access_token", data.accessToken);
  if (data?.refreshToken) localStorage.setItem("refresh_token", data.refreshToken);
  return data;
}

export async function resetPassword({ username }) {
  const message = await unwrap(http.post("/auth/registration/reset", { username }));
  return { success: true, message };
}

export async function confirmResetPassword({ username, confirmCode, newPassword }) {
  const message = await unwrap(http.post("/auth/registration/reset-password/confirm", { username, confirmCode, newPassword }));
  return { message };
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  const data = await unwrap(http.post("/auth/refresh", { refreshToken }));
  if (data?.access_token) localStorage.setItem("access_token", data.access_token);
  if (data?.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function verifyAccount(token) {
  const message = await unwrap(http.get(`/auth/verification/${token}`));
  return { message };
}

// ─── Favorites (products) ──────────────────────────────────────────────────────

export async function addFavorite(productId) {
  return unwrap(http.post(`/product-favorites/${productId}`));
}

export async function removeFavorite(productId) {
  return unwrap(http.delete(`/product-favorites/${productId}`));
}

export async function getFavorites({ page = 1, perPage = 20 } = {}) {
  return unwrap(http.get("/product-favorites", { params: { page, perPage } }));
}

export async function getFavoritesCount() {
  const data = await unwrap(http.get("/product-favorites/count"));
  return data?.count ?? 0;
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export async function getAllProducts({ page = 1, perPage = 20, category } = {}) {
  return unwrap(http.get("/catalog", { params: { page, perPage, category } }));
}

export async function getPopularProducts({ page = 1, size = 8 } = {}) {
  return unwrap(http.get("/catalog/popular", { params: { page, size } }));
}

export async function getCatalogBySaleType(saleType, { page = 1, perPage = 20 } = {}) {
  return unwrap(http.get("/catalog/saleType/product", { params: { saleType, page, perPage } }));
}

export async function getHomepageData() {
  return unwrap(http.get("/catalog/homepage"));
}

export async function getCatalogMap({ page = 1, perPage = 20 } = {}) {
  return unwrap(http.get("/catalog/map", { params: { page, per_page: perPage } }));
}

export async function getCatalogFilters() {
  return unwrap(http.get("/catalog/filters"));
}

export async function getCategoryCounts() {
  return unwrap(http.get("/catalog/category-counts"));
}

export async function getSearchSuggestions(q) {
  if (!q) return [];
  const data = await unwrap(http.get("/catalog/search/suggestions", { params: { q } }));
  return data?.suggestions ?? [];
}

// ─── Companies ────────────────────────────────────────────────────────────────
//
// Per the company-service OpenAPI spec: GET /companies returns CompanyShortDTO
// (id, name, slug, logoUrl, verificationStatus, isBlocked, createdAt only) and
// GET /companies/{slug} returns CompanySlugMapResponse (id, name, slug, status,
// regionId, districtId, address, lat, lng). Neither ever returns stir,
// phonePrimary, phoneSecondary, website, description, shortDescription or
// coverUrl — there is no backend endpoint that reads those back for the owner.
// The only responses that include them are the POST create / PUT update
// responses (CompanyResponseDTO), so we cache those locally and layer them
// under the always-fresh data from the two GET endpoints above.

const COMPANY_CACHE_KEY = "sklad_company_detail_cache";

function cacheCompanyDetail(company) {
  if (!company?.id) return company;
  try {
    const all = JSON.parse(localStorage.getItem(COMPANY_CACHE_KEY) || "{}");
    all[company.id] = { ...all[company.id], ...company };
    localStorage.setItem(COMPANY_CACHE_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable — caching is a best-effort convenience, not required
  }
  return company;
}

function getCachedCompanyDetail(id) {
  try {
    const all = JSON.parse(localStorage.getItem(COMPANY_CACHE_KEY) || "{}");
    return all[id] ?? null;
  } catch {
    return null;
  }
}

export async function getMyCompany() {
  const companies = await unwrap(http.get("/companies"));
  if (!companies?.length) throw new Error("Компания не найдена");
  const summary = companies[0];
  const [slugDetail, cached] = await Promise.all([
    summary?.slug ? getCompanyBySlug(summary.slug).catch(() => null) : Promise.resolve(null),
    Promise.resolve(getCachedCompanyDetail(summary.id)),
  ]);
  // Precedence low -> high: cached (fills gaps no GET endpoint covers) <
  // summary (always fresh) < slugDetail (freshest for region/district/address/coords).
  return { ...cached, ...summary, ...slugDetail };
}

export async function getPublicCompanies({ page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/companies/public", { params: { page, per_page } }));
}

export async function searchCompanies({ query, page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/companies/search", { params: { q: query, page, per_page } }));
}

export async function getCompanyBySlug(slug) {
  return unwrap(http.get(`/companies/${slug}`));
}

export async function getCompanyProducts(slug, { page = 1, per_page = 20 } = {}) {
  return unwrap(http.get(`/companies/${slug}/products`, { params: { page, per_page } }));
}

export async function getCompanyReviews(companyId, { page = 1, per_page = 20 } = {}) {
  return unwrap(http.get(`/companies/${companyId}/reviews`, { params: { page, per_page } }));
}

export async function getAllCompanies() {
  return unwrap(http.get("/companies"));
}

export async function getCompaniesMap({ page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/companies/map", { params: { page, per_page } }));
}

export async function createCompany(data) {
  const company = await unwrap(http.post("/companies/create", data));
  // CompanyResponseDTO (the create response) never echoes lat/lng back — keep
  // what we actually sent so the cached copy stays complete.
  return cacheCompanyDetail({ ...company, lat: data.lat, lng: data.lng });
}

export async function updateCompany(id, data) {
  const company = await unwrap(http.put(`/companies/${id}`, data));
  return cacheCompanyDetail({ ...company, lat: data.lat, lng: data.lng });
}

export async function deleteCompany(id) {
  return unwrap(http.delete(`/companies/${id}`));
}

export async function submitCompanyVerification(id) {
  return unwrap(http.post(`/companies/${id}/submit-verification`));
}

export async function uploadCompanyLogo(id, file) {
  const result = await unwrap(http.post(`/companies/${id}/logo`, toSingleFileForm(file)));
  // GET /companies and GET /companies/{slug} never echo logoUrl back for the owner
  // (see getMyCompany above) — cache it now or it disappears on the next reload.
  if (result?.url) cacheCompanyDetail({ id, logoUrl: result.url });
  return result;
}

export async function uploadCompanyCover(id, file) {
  const result = await unwrap(http.post(`/companies/${id}/coverUrl`, toSingleFileForm(file)));
  if (result?.url) cacheCompanyDetail({ id, coverUrl: result.url });
  return result;
}

export async function addCompanyDocument(id, { documentType, attachId = "", fileUrl }) {
  return unwrap(http.post(`/companies/${id}/documents`, { documentType, attachId, fileUrl }));
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories({ page = 0, size = 100 } = {}) {
  return unwrap(http.get("/categories", { params: { page, size } }));
}

export async function getCategoryBySlug(slug) {
  return unwrap(http.get(`/categories/${slug}`));
}

export async function createCategory(data) {
  return unwrap(http.post("/categories/create", data));
}

export async function updateCategory(id, data) {
  return unwrap(http.put(`/categories/update/${id}`, data));
}

export async function deleteCategory(id) {
  return unwrap(http.delete(`/categories/delete/${id}`));
}

// ─── Company Favorites ────────────────────────────────────────────────────────

export async function addCompanyFavorite(companyId) {
  return unwrap(http.post(`/company-favorites/create/${companyId}`));
}

export async function removeCompanyFavorite(companyId) {
  return unwrap(http.delete(`/company-favorites/delete/${companyId}`));
}

export async function getCompanyFavorites({ page = 1, perPage = 20 } = {}) {
  return unwrap(http.get("/company-favorites", { params: { page, perPage } }));
}

export async function getCompanyFavoritesCount() {
  const data = await unwrap(http.get("/company-favorites/count"));
  return data?.favoriteCount ?? 0;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function getCart() {
  return unwrap(http.get("/cart"));
}

export async function getCartCount() {
  const data = await unwrap(http.get("/cart/count"));
  return data?.count ?? 0;
}

export async function addCartItem({ productId, quantity = 1 }) {
  return unwrap(http.post("/cart/items", { productId, quantity }));
}

export async function updateCartItem(id, { quantity }) {
  return unwrap(http.put(`/cart/items/${id}`, { quantity }));
}

export async function removeCartItem(id) {
  return unwrap(http.delete(`/cart/items/${id}`));
}

export async function clearCart() {
  return unwrap(http.delete("/cart"));
}

export async function checkoutRfq({ contactName, contactPhone, contactEmail, deliveryAddress, neededDate, comment } = {}) {
  return unwrap(http.post("/cart/checkout-rfq", { contactName, contactPhone, contactEmail, deliveryAddress, neededDate, comment }));
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function getLeads({ page = 1, perPage = 20, status } = {}) {
  return unwrap(http.get("/leads", { params: { page, perPage, status } }));
}

export async function getSellerLeads({ page = 1, perPage = 20, status, companyId } = {}) {
  return unwrap(http.get("/leads/seller", { params: { page, perPage, status, companyId } }));
}

export async function getLead(id) {
  return unwrap(http.get(`/leads/${id}`));
}

export async function createLead({ source = "PRODUCT", productId, productIds, quantity = 1, contactName, contactPhone, contactEmail, deliveryAddress, neededDate, comment } = {}) {
  return unwrap(http.post("/leads", { source, productId, productIds, quantity, contactName, contactPhone, contactEmail, deliveryAddress, neededDate, comment }));
}

export async function updateLeadStatus(id, { status, closeReason } = {}) {
  return unwrap(http.put(`/leads/${id}/status`, { status, closeReason }));
}

export async function deleteLead(id) {
  return unwrap(http.delete(`/leads/${id}`));
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getMyProducts({ page = 1, per_page = 20, company_id, status } = {}) {
  return unwrap(http.get("/products/my", { params: { page, per_page, company_id, status } }));
}

export async function searchProducts({ query, page = 1, perPage = 20, category } = {}) {
  return unwrap(http.get("/catalog/search", { params: { q: query, page, perPage, category } }));
}

export async function getProductBySlug(slug) {
  return unwrap(http.get(`/products/${slug}`));
}

export async function createProduct(data) {
  return unwrap(http.post("/products", data));
}

export async function updateProduct(id, data) {
  const body = {
    name: data.name,
    description: data.description,
    price: data.price,
    currency: data.currency,
    attributes: data.attributes,
    company_id: data.companyId,
    category_id: data.categoryId,
    short_description: data.shortDescription,
    price_type: data.priceType,
    region_id: data.regionId,
    district_id: data.districtId,
  };
  return unwrap(http.put(`/products/${id}`, body));
}

export async function deleteProduct(id) {
  return unwrap(http.delete(`/products/${id}`));
}

export async function publishProduct(id) {
  return unwrap(http.post(`/products/${id}/publish`));
}

export async function archiveProduct(id) {
  return unwrap(http.post(`/products/${id}/archive`));
}

export async function uploadProductImages(id, files) {
  return unwrap(http.post(`/products/${id}/images`, toMultiFileForm(files)));
}

export async function deleteProductImage(productId, imageId) {
  return unwrap(http.delete(`/products/${productId}/images/${imageId}`));
}

export async function setProductPrimaryImage(productId, imageId) {
  return unwrap(http.put(`/products/${productId}/images/${imageId}/set-primary`));
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function createReport({ targetType, targetId, reasonCode, comment }) {
  return unwrap(http.post("/reports", { targetType, targetId, reasonCode, comment }));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications({ page = 1, per_page = 20, is_read } = {}) {
  return unwrap(http.get("/notifications", { params: { page, per_page, is_read } }));
}

export async function getNotificationsUnreadCount() {
  const data = await unwrap(http.get("/notifications/unread-count"));
  return data?.count ?? 0;
}

export async function markNotificationsRead({ notification_ids = [], mark_all = false } = {}) {
  return unwrap(http.post("/notifications/mark-read", { notification_ids, mark_all }));
}

export async function getNotificationPreferences() {
  return unwrap(http.get("/notifications/preferences"));
}

export async function updateNotificationPreferences({ push, email, in_app }) {
  return unwrap(http.put("/notifications/preferences", { push, email, in_app }));
}

export async function registerPushToken({ token, platform = "ANDROID" }) {
  return unwrap(http.post("/notifications/push-token", { token, platform }));
}

// ─── Chats ────────────────────────────────────────────────────────────────────

export async function createChat({ seller_company_id, product_id } = {}) {
  return unwrap(http.post("/chats/create", { seller_company_id, product_id }));
}

export async function getChats({ page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/chats", { params: { page, per_page } }));
}

export async function getChatMessages(threadId, { page = 1, per_page = 20, before_id } = {}) {
  return unwrap(http.get(`/chats/${threadId}/messages`, { params: { page, per_page, before_id } }));
}

export async function getChatUnreadCount() {
  const data = await unwrap(http.get("/chats/unread-count"));
  return data?.unread_count ?? 0;
}

export async function uploadChatImage(threadId, file) {
  return unwrap(http.post(`/chats/${threadId}/messages/image`, toSingleFileForm(file)));
}

export async function uploadChatFile(threadId, file) {
  return unwrap(http.post(`/chats/${threadId}/messages/file`, toSingleFileForm(file)));
}

export async function getChatWsToken() {
  return unwrap(http.post("/chats/ws-token"));
}

export async function deleteChat(threadId) {
  return unwrap(http.delete(`/chats/${threadId}`));
}

// ─── Admin: dashboard ─────────────────────────────────────────────────────────

export async function getAdminDashboard() {
  return unwrap(http.get("/admin/dashboard"));
}

// ─── Admin: users ─────────────────────────────────────────────────────────────

export async function getAdminUsers({ q, status, roles, page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/admin/users", { params: { q, status, roles, page, per_page } }));
}

export async function getAdminUser(userId) {
  return unwrap(http.get(`/admin/users/${userId}`));
}

export async function blockUser(userId, reason) {
  return unwrap(http.put(`/admin/users/${userId}/block`, { reason }));
}

export async function unblockUser(userId) {
  return unwrap(http.put(`/admin/users/${userId}/unblock`));
}

export async function setUserRole(userId, role) {
  return unwrap(http.put(`/admin/users/set-admin/${userId}`, null, { params: { role } }));
}

export async function revokeUserSessions(userId) {
  return unwrap(http.delete(`/admin/users/${userId}/sessions`));
}

// ─── Admin: companies ─────────────────────────────────────────────────────────

export async function getAdminCompanies({ status, q, page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/admin/companies", { params: { status, q, page, per_page } }));
}

export async function getCompanyModerationQueue() {
  return unwrap(http.get("/admin/companies/moderation-queue"));
}

export async function verifyCompany(id) {
  return unwrap(http.put(`/admin/companies/${id}/verify`));
}

export async function rejectCompany(id, { reasonCode, comment } = {}) {
  return unwrap(http.put(`/admin/companies/${id}/reject`, { reasonCode, comment }));
}

export async function blockCompany(id, reason) {
  return unwrap(http.put(`/admin/companies/${id}/block`, { reason }));
}

// ─── Admin: products ──────────────────────────────────────────────────────────

export async function getAdminProducts({ status, company_id, q, page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/admin/products", { params: { status, company_id, q, page, per_page } }));
}

export async function getAdminProduct(id) {
  return unwrap(http.get(`/admin/products/${id}`));
}

export async function getProductModerationQueue() {
  return unwrap(http.get("/admin/products/moderation-queue"));
}

export async function approveProduct(id) {
  return unwrap(http.put(`/admin/products/${id}/approve`));
}

export async function rejectProduct(id, { reasonCode, comment } = {}) {
  return unwrap(http.put(`/admin/products/${id}/reject`, { reasonCode, comment }));
}

export async function blockProduct(id, reason) {
  return unwrap(http.put(`/admin/products/${id}/block`, { reason }));
}

export async function promoteProduct(id, { promotionType, startsAt, endsAt } = {}) {
  return unwrap(http.put(`/admin/products/${id}/promote`, { promotionType, startsAt, endsAt }));
}

// ─── Admin: reports ───────────────────────────────────────────────────────────

export async function getAdminReports({ status, targetType, page = 1, size = 20 } = {}) {
  return unwrap(http.get("/admin/reports", { params: { status, targetType, page, size } }));
}

export async function getAdminReport(id) {
  return unwrap(http.get(`/admin/reports/${id}`));
}

export async function resolveReport(id, resolutionNote) {
  return unwrap(http.put(`/admin/reports/${id}/resolve`, { resolutionNote }));
}

export async function rejectReport(id, resolutionNote) {
  return unwrap(http.put(`/admin/reports/${id}/reject`, { resolutionNote }));
}

export async function warnReportedUser(id, message) {
  return unwrap(http.put(`/admin/reports/${id}/warn-user`, { message }));
}

export async function blockReportTarget(id, reason) {
  return unwrap(http.put(`/admin/reports/${id}/block-target`, { reason }));
}
