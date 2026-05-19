import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// Inyectar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// En 401, limpiar sesión y redirigir al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const apiLogin = (email, password, fingerprint, deviceLabel) =>
  api.post("/auth/login", { email, password, fingerprint, deviceLabel }).then((r) => r.data);

export const apiMe = () =>
  api.get("/auth/me").then((r) => r.data);

export const apiChangePassword = (currentPassword, newPassword) =>
  api.put("/auth/change-password", { currentPassword, newPassword }).then((r) => r.data);

// ─── USUARIOS ────────────────────────────────────────────────────────────────

export const apiGetUsers = () =>
  api.get("/usuarios").then((r) => r.data);

export const apiGetUserById = (id) =>
  api.get(`/usuarios/${id}`).then((r) => r.data);

export const apiCreateUser = (data) =>
  api.post("/usuarios", data).then((r) => r.data);

export const apiUpdateUser = (id, data) =>
  api.put(`/usuarios/${id}`, data).then((r) => r.data);

export const apiDeleteUser = (id) =>
  api.delete(`/usuarios/${id}`).then((r) => r.data);

// ─── CAPACITACIÓN ────────────────────────────────────────────────────────────

export const apiGetCourses = () =>
  api.get("/capacitacion/cursos").then((r) => r.data);

export const apiCreateCourse = (data) => {
  const isFormData = data instanceof FormData;
  return api.post("/capacitacion/cursos", data, isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}).then((r) => r.data);
};

export const apiUpdateCourse = (id, data) =>
  api.put(`/capacitacion/cursos/${id}`, data).then((r) => r.data);

export const apiDeleteCourse = (id) =>
  api.delete(`/capacitacion/cursos/${id}`).then((r) => r.data);

export const apiGetMyProgress = () =>
  api.get("/capacitacion/progreso").then((r) => r.data);

export const apiUpdateProgress = (courseId, progress) =>
  api.post("/capacitacion/progreso", { courseId, progress }).then((r) => r.data);

// ─── COMUNICACIÓN ────────────────────────────────────────────────────────────

export const apiGetNotices = () =>
  api.get("/comunicacion/avisos").then((r) => r.data);

export const apiCreateNotice = (data) =>
  api.post("/comunicacion/avisos", data).then((r) => r.data);

export const apiDeleteNotice = (id) =>
  api.delete(`/comunicacion/avisos/${id}`).then((r) => r.data);

export const apiGetDocuments = () =>
  api.get("/comunicacion/documentos").then((r) => r.data);

export const apiUploadDocument = (formData) =>
  api.post("/comunicacion/documentos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const apiDeleteDocument = (id) =>
  api.delete(`/comunicacion/documentos/${id}`).then((r) => r.data);

export const apiGetRseVideos = () =>
  api.get("/comunicacion/videos").then((r) => r.data);

export const apiCreateRseVideo = (data) => {
  const isFormData = data instanceof FormData;
  return api.post("/comunicacion/videos", data, isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}).then((r) => r.data);
};

export const apiDeleteRseVideo = (id) =>
  api.delete(`/comunicacion/videos/${id}`).then((r) => r.data);

// ─── INDICADORES ─────────────────────────────────────────────────────────────

export const apiGetIndicadores = (params) =>
  api.get("/indicadores", { params }).then((r) => r.data);

export const apiGetLatestIndicadores = () =>
  api.get("/indicadores/latest").then((r) => r.data);

export const apiCreateIndicador = (data) =>
  api.post("/indicadores", data).then((r) => r.data);

export const apiUpdateIndicador = (id, data) =>
  api.put(`/indicadores/${id}`, data).then((r) => r.data);

export const apiDeleteIndicador = (id) =>
  api.delete(`/indicadores/${id}`).then((r) => r.data);

// ─── REPORTES ────────────────────────────────────────────────────────────────

export const apiGetReportes = () =>
  api.get("/reportes").then((r) => r.data);

export const apiCreateReporte = (data) =>
  api.post("/reportes", data).then((r) => r.data);

export const apiDeleteReporte = (id) =>
  api.delete(`/reportes/${id}`).then((r) => r.data);

// ─── DISPOSITIVOS ─────────────────────────────────────────────────────────────

export const apiGetDevices        = ()         => api.get("/devices").then((r) => r.data);
export const apiGetPendingDevices = ()         => api.get("/devices/pending").then((r) => r.data);
export const apiApproveDevice     = (id)       => api.put(`/devices/${id}/approve`).then((r) => r.data);
export const apiRejectDevice      = (id)       => api.put(`/devices/${id}/reject`).then((r) => r.data);
export const apiDeleteDevice      = (id)       => api.delete(`/devices/${id}`).then((r) => r.data);

export default api;
