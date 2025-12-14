import axios, { AxiosError } from "axios";

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

const api = axios.create({
  baseURL: apiBase,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Attach token from localStorage on each request
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("jwt");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Types
export interface LoginDto {
  userName: string;
  password: string;
}

export interface RegisterDto {
  userName: string;
  email: string;
  password: string;
  firstName: string;
}

export interface LoginResponse {
  token: string;
}

export interface Appointment {
  id: number;
  userName: string;
  firstName: string;
  appointmentDate: string;
  groomingType: string;
  price: number;
}

export interface AppointmentDetail extends Appointment {
  createdAt: string;
  durationMinutes: number;
}

export interface AppointmentDto {
  groomingTypeId: number;
  appointmentDate: string;
}

export interface GroomingType {
  id: number;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface Customer {
  id: number;
  userName: string;
  email: string;
  firstName: string;
}

export interface CustomerHistory {
  bookingCount: number;
  lastAppointmentDate: string | null;
}

export interface AppointmentView {
  id: number;
  userId: string;
  userName: string | null;
  firstName: string | null;
  email: string | null;
  groomingTypeId: number;
  dogSize: string | null;
  price: number;
  durationMinutes: number;
  appointmentDate: string;
  createdAt: string;
}

// Error response interfaces
export interface ApiErrorResponse {
  message?: string;
  errors?: string[];
}

export interface AxiosErrorResponse {
  response?: {
    data?: ApiErrorResponse;
    status?: number;
  };
  message?: string;
}

// Query parameters interfaces
export interface GetAppointmentsParams {
  name?: string;
  fromDate?: string;
  toDate?: string;
}

// Auth endpoints
export async function login(body: LoginDto): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login", body);
  return res.data;
}

export async function register(body: RegisterDto): Promise<void> {
  await api.post("/auth/register", body);
}

// Appointment endpoints
export async function getAppointments(
  params?: GetAppointmentsParams
): Promise<Appointment[]> {
  const res = await api.get<Appointment[]>("/appointments", { params });
  return res.data;
}

export async function getAppointment(id: number): Promise<AppointmentDetail> {
  const res = await api.get<AppointmentDetail>(`/appointments/${id}`);
  return res.data;
}

export async function createAppointment(
  body: AppointmentDto
): Promise<AppointmentDetail> {
  const res = await api.post<AppointmentDetail>("/appointments", body);
  return res.data;
}

export async function updateAppointment(
  id: number,
  body: AppointmentDto
): Promise<void> {
  await api.put(`/appointments/${id}`, body);
}

export async function deleteAppointment(id: number): Promise<void> {
  await api.delete(`/appointments/${id}`);
}

// Customer endpoints
export async function getCurrentCustomer(): Promise<Customer> {
  const res = await api.get<Customer>("/customers/me");
  return res.data;
}

export async function getCustomerHistory(id: number): Promise<CustomerHistory> {
  const res = await api.get<CustomerHistory>(`/customers/${id}/history`);
  return res.data;
}

// Get customer history for currently authenticated user (stored procedure)
export async function getMyHistory(): Promise<CustomerHistory> {
  const res = await api.get<CustomerHistory>("/customers/history");
  return res.data;
}

// Get appointments view (SQL view) with optional date filter
export async function getAppointmentsView(
  date?: Date
): Promise<AppointmentView[]> {
  const params = date ? { date: date.toISOString().split("T")[0] } : {};
  const res = await api.get<AppointmentView[]>("/customers/view", { params });
  return res.data;
}

// Grooming types endpoint
export async function getGroomingTypes(): Promise<GroomingType[]> {
  const res = await api.get<GroomingType[]>("/groomingtypes");
  return res.data;
}

export default api;
