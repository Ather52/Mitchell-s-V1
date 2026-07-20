import axiosInstance from "./interceptor";

const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.contacts)) return data.contacts;
  return [];
};
const loginApi = async (data) => {
  const params = new URLSearchParams();
  params.append("username", data.email);
  params.append("password", data.password);
  const response = await axiosInstance.post(
    "/auth/login",
    params,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );
  return response.data;
};
const registerApi = async (data) => {
  const response = await axiosInstance.post("/auth/register", data);
  return response.data;
};
const forgotPasswordApi = async (data) => {
  const response = await axiosInstance.post("/auth/forgot-password", data);
  return response.data;
};
const resetPasswordApi = async (data) => {
  const response = await axiosInstance.post("/auth/reset-password", data);
  return response.data;
};
const getCategoriesApi = async () => {
  const res = await axiosInstance.get("/menu/categories");
  return res.data;
};
const createCategoryApi = async (data) => {
  const res = await axiosInstance.post("/menu/categories", data);
  return res.data;
};
const updateCategoryApi = async (id, data) => {
  const res = await axiosInstance.patch(`/menu/categories/${id}`, data);
  return res.data;
};
const deleteCategoryApi = async (id) => {
  await axiosInstance.delete(`/menu/categories/${id}`);
};
const getItemsByCategoryApi = async (categoryId) => {
  const res = await axiosInstance.get(`/menu/items?category_id=${categoryId}`);
  return res.data;
};
const createItemApi = async (data) => {
  const res = await axiosInstance.post("/menu/items", data);
  return res.data;
};
const updateItemApi = async (id, d) => (await axiosInstance.patch(`/menu/items/${id}`, d)).data;
const deleteItemApi = async (id) => {
  await axiosInstance.delete(`/menu/items/${id}`);
};
const getMenuPreviewApi = async () => (await axiosInstance.get("/menu/preview")).data;
const getSpecialsApi = async (activeOnly) => (await axiosInstance.get(
  `/menu/specials${activeOnly !== void 0 ? `?active_only=${activeOnly}` : ""}`
)).data;
const createSpecialApi = async (d) => (await axiosInstance.post("/menu/specials", d)).data;
const updateSpecialApi = async (id, d) => (await axiosInstance.patch(`/menu/specials/${id}`, d)).data;
const deleteSpecialApi = async (id) => {
  await axiosInstance.delete(`/menu/specials/${id}`);
};
const getCallsApi = async (skip = 0, limit = 20) => {
  const response = await axiosInstance.get(
    `/retell/calls?skip=${skip}&limit=${limit}`
  );
  return response.data;
};
const confirmCallOrderApi = async (callId, data) => {
  const res = await axiosInstance.post(`/retell/calls/${callId}/order`, data);
  return res.data;
};
const reprintOrderApi = async (orderId) => {
  const res = await axiosInstance.post(`/retell/orders/${orderId}/reprint`);
  return res.data;
};
const cancelOrderApi = async (orderId) => {
  const res = await axiosInstance.patch(`/retell/orders/${orderId}`, { status: "cancelled" });
  return res.data;
};
const getSettingsApi = async () => {
  const res = await axiosInstance.get("/settings");
  return res.data;
};
const updateSettingsApi = async (data) => {
  const res = await axiosInstance.patch("/settings", data);
  return res.data;
};
const getVoicesApi = async () => {
  const res = await axiosInstance.get("/settings/voices");
  return res.data;
};
const getDashboardStatsApi = async () => {
  const res = await axiosInstance.get("/retell/stats");
  return res.data;
};
const getReportApi = async (days = 7) => {
  const res = await axiosInstance.get(`/retell/reports?days=${days}`);
  return res.data;
};
const getPromptsApi = async () => {
  const res = await axiosInstance.get("/prompts");
  return res.data;
};
const createPromptApi = async (data) => {
  const res = await axiosInstance.post("/prompts", data);
  return res.data;
};
const updatePromptApi = async (id, data) => {
  const res = await axiosInstance.patch(`/prompts/${id}`, data);
  return res.data;
};
const activatePromptApi = async (id) => {
  const res = await axiosInstance.patch(`/prompts/${id}/activate`);
  return res.data;
};
const deactivatePromptApi = async (id) => {
  const res = await axiosInstance.patch(`/prompts/${id}/deactivate`);
  return res.data;
};
const deletePromptApi = async (id) => {
  await axiosInstance.delete(`/prompts/${id}`);
};
const getAgentsApi = async () => {
  const res = await axiosInstance.get("/settings/agents");
  return res.data;
};
const createAgentApi = async (data) => {
  const res = await axiosInstance.post("/settings/agents", data);
  return res.data;
};
const getComplaintsApi = async () => {
  const res = await axiosInstance.get("/retell/complaints");
  return res.data;
};
const getOutboundStatsApi = async () =>
  (await axiosInstance.get("/outbound/stats")).data;
const getOutboundCampaignsApi = async (skip = 0, limit = 20, search = "") => {
  const params = new URLSearchParams({ skip, limit });
  if (search) params.append("search", search);
  return asList(
    (await axiosInstance.get(`/outbound/campaigns?${params}`)).data
  );
};
const createOutboundCampaignApi = async (data) =>
  (await axiosInstance.post("/outbound/campaigns", data)).data;
const getOutboundCampaignApi = async (id) =>
  (await axiosInstance.get(`/outbound/campaigns/${id}`)).data;
const updateOutboundCampaignApi = async (id, data) =>
  (await axiosInstance.put(`/outbound/campaigns/${id}`, data)).data;
const deleteOutboundCampaignApi = async (id) => {
  await axiosInstance.delete(`/outbound/campaigns/${id}`);
};
const getOutboundCampaignStatsApi = async (id) =>
  (await axiosInstance.get(`/outbound/campaigns/${id}/stats`)).data;
const getOutboundContactsApi = async (campaignId) =>
  asList(
    (await axiosInstance.get(`/outbound/campaigns/${campaignId}/contacts`)).data
  );
const addOutboundContactApi = async (campaignId, data) =>
  (await axiosInstance.post(`/outbound/campaigns/${campaignId}/contacts`, data)).data;
const deleteOutboundContactApi = async (contactId) => {
  await axiosInstance.delete(`/outbound/contacts/${contactId}`);
};
const importOutboundContactsApi = async (campaignId, file) => {
  const form = new FormData();
  form.append("file", file);
  return (
    await axiosInstance.post(
      `/outbound/campaigns/${campaignId}/contacts/import`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
  ).data;
};
const importOutboundContactsJsonApi = async (campaignId, contacts) =>
  (
    await axiosInstance.post(
      `/outbound/campaigns/${campaignId}/contacts/import`,
      { contacts }
    )
  ).data;
const startOutboundCampaignApi = async (campaignId) =>
  (await axiosInstance.post(`/outbound/campaigns/${campaignId}/start`)).data;
const startOutboundCallApi = async (data) =>
  (await axiosInstance.post("/outbound/calls/start", data)).data;
const getOutboundCallsApi = async (skip = 0, limit = 50, campaignId) => {
  const params = new URLSearchParams({ skip, limit });
  if (campaignId) params.append("campaign_id", campaignId);
  return asList(
    (await axiosInstance.get(`/outbound/calls?${params}`)).data
  );
};
const getOutboundCallApi = async (id) =>
  (await axiosInstance.get(`/outbound/calls/${id}`)).data;
const updateOutboundContactApi = async (contactId, data) =>
  (await axiosInstance.patch(`/outbound/contacts/${contactId}`, data)).data;

const setContactRecallApi = async (contactId, recallAt) =>
  (await axiosInstance.patch(`/outbound/contacts/${contactId}/recall`, { recall_at: recallAt })).data;

const setCallRecallApi = async (callId, recallAt) =>
  (await axiosInstance.patch(`/retell/calls/${callId}/recall`, { recall_at: recallAt })).data;

export {
  activatePromptApi,
  cancelOrderApi,
  confirmCallOrderApi,
  createAgentApi,
  createCategoryApi,
  createItemApi,
  createPromptApi,
  createSpecialApi,
  deactivatePromptApi,
  deleteCategoryApi,
  deleteItemApi,
  deletePromptApi,
  deleteSpecialApi,
  forgotPasswordApi,
  getAgentsApi,
  getCallsApi,
  getCategoriesApi,
  getComplaintsApi,
  getDashboardStatsApi,
  getItemsByCategoryApi,
  getMenuPreviewApi,
  getOutboundCallApi,
  getOutboundCallsApi,
  getOutboundCampaignApi,
  getOutboundCampaignsApi,
  getOutboundCampaignStatsApi,
  getOutboundContactsApi,
  getOutboundStatsApi,
  getPromptsApi,
  getReportApi,
  getSettingsApi,
  getSpecialsApi,
  getVoicesApi,
  importOutboundContactsApi,
  importOutboundContactsJsonApi,
  loginApi,
  registerApi,
  reprintOrderApi,
  resetPasswordApi,
  setCallRecallApi,
  setContactRecallApi,
  startOutboundCampaignApi,
  startOutboundCallApi,
  addOutboundContactApi,
  createOutboundCampaignApi,
  deleteOutboundCampaignApi,
  deleteOutboundContactApi,
  updateOutboundCampaignApi,
  updateOutboundContactApi,
  updateCategoryApi,
  updateItemApi,
  updatePromptApi,
  updateSettingsApi,
  updateSpecialApi
};
