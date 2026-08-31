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

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

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

export async function verifyAccount({ username, code }) {
  const message = await unwrap(http.put("/auth/verification", { username, confirmPassword: code }));
  return { message };
}

function stripUrlExtension(url) {
  if (!url) return url;
  return url.replace(/\.[a-zA-Z0-9]+$/, "");
}

function dedupeUrlSegment(url) {
  if (!url) return url;
  return url.replace(/\/([^/]+)\/+\1\//, "/$1/");
}

export function normalizePhotoUrl(url) {
  return stripUrlExtension(dedupeUrlSegment(url));
}

export async function getMyUserProfile() {
  return unwrap(http.get("/users"));
}

export async function updateMyUserProfile(data) {
  return unwrap(http.put("/users", data));
}

export async function uploadUserPhoto(file) {
  const data = await unwrap(http.post("/users/upload/photo", toSingleFileForm(file)));
  return data ? { ...data, url: normalizePhotoUrl(data.url) } : data;
}
export async function setUserPhoto(photoId) {
  return unwrap(http.put("/users/update/photo", { photoId }));
}

export async function getMyUserContext() {
  const data = await unwrap(http.get("/users/me/context"));
  return data ? { ...data, photoUrl: normalizePhotoUrl(data.photoUrl) } : data;
}

export async function addFavorite(productId) {
  return unwrap(http.post(`/product-favorites/${productId}`));
}

export async function removeFavorite(productId) {
  return unwrap(http.delete(`/product-favorites/${productId}`));
}

export async function getFavorites({ page = 1, perPage = 20 } = {}) {
  return unwrap(http.get("/product-favorites", { params: { page, perPage } }));
}

export async function getAllProducts({ page = 1, perPage = 20, category, minPrice, maxPrice, inStock, verified } = {}) {
  return unwrap(http.get("/catalog", { params: { page, perPage, category, minPrice, maxPrice, inStock, verified } }));
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

export async function getCatalogMap({ page = 1, perPage = 20, query, category } = {}) {
  return unwrap(http.get("/catalog/map", { params: { page, per_page: perPage, query, category } }));
}

export async function getCatalogFilters() {
  return unwrap(http.get("/catalog/filters"));
}

export async function getProductsByPriceRange({ fromPrice, toPrice, page = 1, perPage = 20 } = {}) {
  return unwrap(http.get("/catalog/filter/product/price", {
    params: { fromPrice, toPrice, page: Math.max(page - 1, 0), size: perPage }
  }))
}

export async function getCategoryCounts() {
  return unwrap(http.get("/catalog/category-counts"));
}

export async function getSearchSuggestions(q) {
  if (!q) return [];
  const data = await unwrap(http.get("/catalog/search/suggestions", { params: { q } }));
  return data?.suggestions ?? [];
}

const COMPANY_CACHE_KEY = "sklad_company_detail_cache";

function cacheCompanyDetail(company) {
  if (!company?.id) return company;
  try {
    const all = JSON.parse(localStorage.getItem(COMPANY_CACHE_KEY) || "{}");
    all[company.id] = { ...all[company.id], ...company };
    localStorage.setItem(COMPANY_CACHE_KEY, JSON.stringify(all));
  } catch { }
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

function normalizeLegalForm(company) {
  if (!company || company.legalForm || !company.companyType) return company;
  return { ...company, legalForm: company.companyType };
}

export async function getMyCompany() {
  const summary = normalizeLegalForm(await unwrap(http.get("/companies")));
  if (!summary?.id) throw new Error("Компания не найдена");
  const [slugDetail, cached] = await Promise.all([
    summary?.slug ? getCompanyBySlug(summary.slug).catch(() => null) : Promise.resolve(null),
    Promise.resolve(getCachedCompanyDetail(summary.id)),
  ]);
  const merged = {
    ...cached,
    ...summary,
    ...slugDetail,
    verificationStatus: summary.verificationStatus,
    isBlocked: summary.isBlocked,
  };
  if (!merged.companyCreatedDate) {
    const publicList = await getPublicCompanies({ page: 1, per_page: 100 }).catch(() => null);
    const match = publicList?.content?.find((c) => c.id === summary.id);
    if (match?.companyCreatedDate) merged.companyCreatedDate = match.companyCreatedDate;
  }
  return cacheCompanyDetail(merged);
}

export async function getPublicCompanies({ page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/companies/public", { params: { page, per_page } }));
}

export async function searchCompanies({ query, page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/companies/search", { params: { q: query, page, per_page } }));
}

export async function getCompanyBySlug(slug) {
  const company = normalizeLegalForm(await unwrap(http.get(`/companies/${slug}`)));
  const cached = company?.id ? getCachedCompanyDetail(company.id) : null;
  return cached ? { ...cached, ...company } : company;
}

export async function getCompanyProductsByCategory(slug, categoryId, { page = 1, per_page = 100 } = {}) {
  return unwrap(http.get(`/companies/${slug}/products/${categoryId}`, { params: { page, per_page } }));
}

export async function getCompanyReviews(companyId, { page = 1, per_page = 20 } = {}) {
  return unwrap(http.get(`/companies/${companyId}/reviews`, { params: { page, per_page } }));
}

export async function getCompanyRating(companyId) {
  const data = await unwrap(http.get(`/companies/${companyId}/reviews/rating`));
  return {
    averageRating: data?.averageRating ?? data?.getAverageRating ?? 0,
    reviewCount: data?.reviewCount ?? data?.getReviewCount ?? 0,
  };
}

export async function createCompanyReview(companyId, { rating, comment } = {}) {
  return unwrap(http.post(`/companies/${companyId}/reviews`, { rating, comment }));
}

export async function updateCompanyReview(companyId, reviewId, { rating, comment } = {}) {
  return unwrap(http.put(`/companies/${companyId}/reviews/${reviewId}`, { rating, comment }));
}

export async function deleteCompanyReview(companyId, reviewId) {
  return unwrap(http.delete(`/companies/${companyId}/reviews/${reviewId}`));
}

export async function getCompaniesMap({ page = 1, per_page = 20, q } = {}) {
  return unwrap(http.get("/companies/map", { params: { page, per_page, q } }));
}

export async function createCompany(data) {
  const { legalForm, ...body } = data;
  const company = normalizeLegalForm(
    await unwrap(http.post("/companies/create", body, legalForm ? { headers: { companyType: legalForm } } : undefined))
  );
  return cacheCompanyDetail({
    ...company,
    legalForm: company?.legalForm ?? legalForm,
    lat: data.lat,
    lng: data.lng,
    regionId: company?.regionId ?? data.regionId,
    districtId: company?.districtId ?? data.districtId,
  });
}

export async function updateCompany(id, data) {
  const { legalForm, ...body } = data;
  const company = normalizeLegalForm(
    await unwrap(
      http.put(
        `/companies/${id}`,
        legalForm ? { ...body, companyType: legalForm } : body,
        legalForm ? { headers: { companyType: legalForm } } : undefined
      )
    )
  );
  return cacheCompanyDetail({ ...company, legalForm: company?.legalForm ?? legalForm, lat: data.lat, lng: data.lng });
}

export async function updateCompanyLocation(companyId, { lat, lng, address }) {
  const company = await unwrap(
    http.put(
      "/companies/update/location",
      { lat: String(lat), lng: String(lng), address },
      { params: { companyId } }
    )
  );
  return cacheCompanyDetail({ ...company, id: company?.id ?? companyId, lat: String(lat), lng: String(lng), address });
}

export async function submitCompanyVerification(id) {
  return unwrap(http.post(`/companies/${id}/submit-verification`));
}

export async function uploadCompanyLogo(id, file) {
  const result = await unwrap(http.post(`/companies/${id}/logo`, toSingleFileForm(file)));
  if (result?.url) cacheCompanyDetail({ id, logoUrl: result.url });
  return result;
}

export async function uploadCompanyBackground(id, file) {
  const result = await unwrap(http.post(`/companies/${id}/coverUrl`, toSingleFileForm(file)));
  if (result?.url) cacheCompanyDetail({ id, backgroundUrl: result.url });
  return result;
}

export async function getCompanyBranches(companyId) {
  const data = await unwrap(http.get(`/companies/branches/${companyId}`));
  return Array.isArray(data) ? data : data?.content ?? [];
}

export async function createCompanyBranch(companyId, { name, address, phone, lat, lng } = {}) {
  return unwrap(http.post(`/companies/create/${companyId}/branches`, { name, address, phone, lat, lng }));
}

export async function updateCompanyBranch(companyId, branchId, { name, address, phone, lat, lng } = {}) {
  return unwrap(http.put(`/companies/${companyId}/branches/${branchId}`, { name, address, phone, lat, lng }));
}

export async function deleteCompanyBranch(companyId, branchId) {
  return unwrap(http.delete(`/companies/${companyId}/branches/${branchId}`));
}

export async function getCategoryTree() {
  return unwrap(http.get("/categories/tree"));
}

export async function getAdminCategories() {
  return unwrap(http.get("/admin/categories"));
}

export async function createCategory(data, file) {
  const form = new FormData();
  if (file) form.append("file", file);
  form.append("request", new Blob([JSON.stringify(data)], { type: "application/json" }));
  return unwrap(http.post("/categories/create", form));
}

export async function updateCategory(id, data, file) {
  const form = new FormData();
  if (file) form.append("file", file);
  form.append("request", new Blob([JSON.stringify(data)], { type: "application/json" }));
  return unwrap(http.put(`/categories/update/${id}`, form));
}

export async function deleteCategory(id) {
  const res = await http.delete(`/categories/delete/${id}`);
  const { success, data, message } = res.data ?? {};
  if (success === false || data === false) {
    throw new Error(message || "Не удалось удалить категорию");
  }
  return data;
}

export async function addCompanyFavorite(companyId) {
  return unwrap(http.post(`/company-favorites/create/${companyId}`));
}

export async function removeCompanyFavorite(companyId) {
  return unwrap(http.delete(`/company-favorites/delete/${companyId}`));
}

export async function getCompanyFavorites({ page = 1, perPage = 20 } = {}) {
  return unwrap(http.get("/company-favorites", { params: { page, perPage } }));
}

export async function getCart() {
  return unwrap(http.get("/cart"));
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

export async function getLeads({ page = 1, perPage = 20, status } = {}) {
  return unwrap(http.get("/leads", { params: { page, perPage, status } }));
}

export async function getSellerLeads({ page = 1, perPage = 20, status, companyId } = {}) {
  return unwrap(http.get("/leads/seller", { params: { page, perPage, status, companyId } }));
}

export async function updateLeadStatus(id, { status, closeReason } = {}) {
  return unwrap(http.put(`/leads/${id}/status`, { status, closeReason }));
}

export async function cancelLead(id) {
  return unwrap(http.delete(`/leads/cancel/${id}`));
}

export async function getSellerDashboard({ companyId, months = 6 } = {}) {
  return unwrap(http.get("/seller/dashboard", { params: { companyId, months } }));
}

export async function getMyProducts({ page = 1, per_page = 20, company_id, status } = {}) {
  return unwrap(http.get("/products/my", { params: { page, per_page, company_id, status } }));
}

export async function searchProducts({ query, page = 1, perPage = 20, category, minPrice, maxPrice, inStock, verified } = {}) {
  return unwrap(http.get("/catalog/search", { params: { q: query, page, perPage, category, minPrice, maxPrice, inStock, verified } }));
}

export async function getProductBySlug(slug) {
  return unwrap(http.get(`/products/slug/${slug}`));
}

export async function getProductReviews(productId, { page = 1, per_page = 20 } = {}) {
  return unwrap(http.get(`/products/${productId}/reviews`, { params: { page, per_page } }));
}

export async function createProductReview(productId, { rating, comment } = {}) {
  return unwrap(http.post(`/products/${productId}/reviews`, { rating, comment }));
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
    min_product: data.minProduct,
    unit: data.unit,
    sale_type: data.saleType,
    wholesale_enabled: data.wholesaleEnabled,
    wholesale_price: data.wholesalePrice,
    wholesale_unit: data.wholesaleUnit,
    wholesale_min_qty: data.wholesaleMinQty,
    wholesale_volume: data.wholesaleVolume,
    retail_enabled: data.retailEnabled,
    retail_price: data.retailPrice,
    retail_unit: data.retailUnit,
    retail_quantity: data.retailQuantity,
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

export async function createReport({ targetType, targetId, reasonCode, comment }) {
  return unwrap(http.post("/reports", { targetType, targetId, reasonCode, comment }));
}

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

export async function deleteChat(threadId) {
  return unwrap(http.delete(`/chats/${threadId}`));
}

export async function getChatWsToken() {
  return unwrap(http.post("/chats/ws-token"));
}

export async function createSupportChat({ subject } = {}) {
  return unwrap(http.post("/support/chats/create", subject ? { subject } : {}));
}

export async function createBannerChat({ subject } = {}) {
  return unwrap(http.post("/support/chats/banner/create", subject ? { subject } : {}));
}

export async function getSupportChatMessages(threadId, { page = 1, per_page = 30, before_id } = {}) {
  return unwrap(http.get(`/support/chats/${threadId}/messages`, { params: { page, per_page, before_id } }));
}

export async function getSupportChatWsToken() {
  return unwrap(http.post("/support/chats/ws-token"));
}

function normalizeSupportThread(t) {
  if (!t) return t;
  const { id, ...rest } = t;
  return { ...rest, thread_id: id ?? rest.thread_id };
}

export async function getAdminSupportChats({ status, page = 1, per_page = 30 } = {}) {
  const data = await unwrap(http.get("/admin/support/chats", { params: { status, page, per_page } }));
  return data ? { ...data, items: (data.items ?? []).map(normalizeSupportThread) } : data;
}

export async function assignSupportChat(threadId) {
  return normalizeSupportThread(await unwrap(http.post(`/admin/support/chats/${threadId}/assign`)));
}

export async function closeSupportChat(threadId) {
  return normalizeSupportThread(await unwrap(http.put(`/admin/support/chats/${threadId}/close`)));
}

export async function getAdminDashboard() {
  return unwrap(http.get("/admin/dashboard"));
}

export async function getAdminUsers({ q, status, roles, page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/admin/users", { params: { q, status, roles, page, per_page } }));
}

export async function blockUser(userId, reason) {
  return unwrap(http.put(`/admin/users/${userId}/block`, { reason }));
}

export async function unblockUser(userId) {
  return unwrap(http.put(`/admin/users/${userId}/unblock`));
}

export async function grantAdminRole(userId) {
  return unwrap(http.put(`/admin/users/set-admin/${userId}`));
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

export async function getProductModerationQueue() {
  return unwrap(http.get("/admin/products/moderation-queue"));
}

export async function approveProduct(id) {
  return unwrap(http.put(`/admin/products/${id}/approve`));
}

export async function rejectProduct(id, { reasonCode, comment } = {}) {
  return unwrap(http.put(`/admin/products/${id}/reject`, { reasonCode, comment }));
}

export async function getAdminReports({ status, targetType, page = 1, size = 20 } = {}) {
  return unwrap(http.get("/admin/reports", { params: { status, targetType, page, size } }));
}

export async function getAdminReport(id) {
  return unwrap(http.get(`/admin/reports/${id}`));
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

export async function getAdminBanners(placementCode) {
  return unwrap(http.get("/admin/banners/getBanner", { params: { placementCode } }));
}

export async function createBanner(data) {
  return unwrap(http.post("/admin/banners", data));
}

export async function updateBanner(id, data) {
  return unwrap(http.put(`/admin/banners/${id}`, data));
}

export async function deleteBanner(id) {
  return unwrap(http.delete(`/admin/banners/${id}`));
}

export async function uploadBannerImage(id, file) {
  return unwrap(http.post(`/admin/banners/${id}/image`, toSingleFileForm(file)));
}

// AI service

export async function createAiConversation({ title } = {}) {
  return unwrap(http.post("/ai/conversations", title ? { title } : {}));
}

export async function getAiConversations({ page = 1, per_page = 20 } = {}) {
  return unwrap(http.get("/ai/conversations", { params: { page, per_page } }));
}

export async function deleteAiConversation(id) {
  return unwrap(http.delete(`/ai/conversations/${id}`));
}

export async function getAiConversationMessages(id, { page = 1, per_page = 20 } = {}) {
  return unwrap(http.get(`/ai/conversations/${id}/messages`, { params: { page, per_page } }));
}

export async function aiSemanticSearch(q, { limit } = {}) {
  return unwrap(http.get("/ai/search", { params: { q, limit } }));
}

export async function aiBusinessSearch({ q, types, categorySlug, regionId, minPrice, maxPrice, currency, limit = 10 } = {}, { signal } = {}) {
  return unwrap(http.get("/ai/business-search", { params: { q, types, categorySlug, regionId, minPrice, maxPrice, currency, limit }, signal }));
}

export async function getSimilarProducts(productId, { limit } = {}) {
  return unwrap(http.get(`/ai/similar/${productId}`, { params: { limit } }));
}

export async function suggestListing({ description, imageIds } = {}) {
  return unwrap(http.post("/ai/seller/suggest-listing", { description, imageIds }));
}

export async function getAiDraft(id) {
  return unwrap(http.get(`/ai/drafts/${id}`));
}

export async function confirmAiDraft(id, data) {
  return unwrap(http.post(`/ai/drafts/${id}/confirm`, data));
}

export async function cancelAiDraft(id) {
  return unwrap(http.post(`/ai/drafts/${id}/cancel`));
}

// AI admin: per-user rate-limit overrides and per-role request quotas (ADMIN / SUPER_ADMIN only)

export async function getAiRateLimits({ signal } = {}) {
  return unwrap(http.get("/ai/admin/rate-limits", { signal }));
}

export async function updateAiRateLimit(userSub, { requestsPerMinute, dailyTokenBudget } = {}) {
  return unwrap(http.put(`/ai/admin/rate-limits/${encodeURIComponent(userSub)}`, { requestsPerMinute, dailyTokenBudget }));
}

export async function resetAiRateLimit(userSub) {
  return unwrap(http.delete(`/ai/admin/rate-limits/${encodeURIComponent(userSub)}`));
}

export async function getAiRoleQuotas({ signal } = {}) {
  return unwrap(http.get("/ai/admin/role-quotas", { signal }));
}

export async function updateAiRoleQuota(roleName, { hourlyRequestLimit, dailyRequestLimit } = {}) {
  return unwrap(http.put(`/ai/admin/role-quotas/${encodeURIComponent(roleName)}`, { hourlyRequestLimit, dailyRequestLimit }));
}
