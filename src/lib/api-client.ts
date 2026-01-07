import type {
    ApiResponse,
    AuthResponse,
    CreateShipmentDTO,
    DashboardStats,
    FinancialStats,
    LoginCredentials,
    Shipment,
    ShipmentFilters,
    TrackingResponse,
    UpdateCodStatusDTO,
    UpdateLastMileDTO,
    UpdateStatusDTO,
    User,
    Customer,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Token management
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
    if (token) {
        localStorage.setItem('auth_token', token);
    } else {
        localStorage.removeItem('auth_token');
    }
}

export function getAuthToken(): string | null {
    if (authToken) return authToken;
    if (typeof window !== 'undefined') {
        authToken = localStorage.getItem('auth_token');
    }
    return authToken;
}

// Base fetch with auth
async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || data.message || 'API request failed',
            };
        }

        return {
            success: true,
            data: data.data || data,
        };
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

// ============================================
// Auth APIs
// ============================================

export async function login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const result = await fetchApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });

    if (result.success && result.data) {
        setAuthToken(result.data.token);
    }

    return result;
}

export async function logout() {
    setAuthToken(null);
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
    return fetchApi<User>('/auth/me');
}

// ============================================
// Public APIs (Customer Tracking)
// ============================================

export async function getTrackingInfo(trackingNumber: string): Promise<ApiResponse<TrackingResponse>> {
    return fetchApi<TrackingResponse>(`/tracking/${encodeURIComponent(trackingNumber)}`);
}

// ============================================
// Shipment APIs (Protected)
// ============================================

export async function getShipments(filters?: ShipmentFilters): Promise<ApiResponse<{ shipments: Shipment[]; total: number; page: number; limit: number }>> {
    const params = new URLSearchParams();

    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });
    }

    const queryString = params.toString();
    return fetchApi<{ shipments: Shipment[]; total: number; page: number; limit: number }>(
        `/shipments${queryString ? `?${queryString}` : ''}`
    );
}

export async function getShipment(id: string): Promise<ApiResponse<Shipment>> {
    return fetchApi<Shipment>(`/shipments/${id}`);
}

export async function getShipmentByTracking(tracking: string): Promise<ApiResponse<Shipment>> {
    // Use the search filter to find by tracking
    const result = await fetchApi<{ shipments: Shipment[] }>(`/shipments?search=${encodeURIComponent(tracking)}&limit=1`);
    if (result.success && result.data?.shipments?.[0]) {
        return { success: true, data: result.data.shipments[0] };
    }
    return { success: false, error: 'ບໍ່ພົບພັດສະດຸ' };
}

export async function deleteShipment(id: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/shipments/${id}`, { method: 'DELETE' });
}

export async function createShipment(data: CreateShipmentDTO): Promise<ApiResponse<Shipment>> {
    return fetchApi<Shipment>('/shipments', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateShipmentStatus(
    id: string,
    data: UpdateStatusDTO
): Promise<ApiResponse<Shipment>> {
    return fetchApi<Shipment>(`/shipments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function updateLastMileMethod(
    id: string,
    data: UpdateLastMileDTO
): Promise<ApiResponse<Shipment>> {
    return fetchApi<Shipment>(`/shipments/${id}/lastmile`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function updateCodStatus(
    id: string,
    data: UpdateCodStatusDTO
): Promise<ApiResponse<Shipment>> {
    return fetchApi<Shipment>(`/shipments/${id}/cod`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

// ============================================
// Dashboard APIs
// ============================================

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return fetchApi<DashboardStats>('/dashboard/stats');
}

export async function getFinancialStats(): Promise<ApiResponse<FinancialStats>> {
    return fetchApi<FinancialStats>('/dashboard/financial');
}

// ============================================
// Export API
// ============================================

export async function exportToCSV(filters?: ShipmentFilters): Promise<Blob | null> {
    const token = getAuthToken();
    if (!token) return null;

    const params = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });
    }

    const queryString = params.toString();

    try {
        const response = await fetch(
            `${API_BASE}/export/csv${queryString ? `?${queryString}` : ''}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) return null;

        return response.blob();
    } catch (error) {
        console.error('Export error:', error);
        return null;
    }
}

// ============================================
// User APIs
// ============================================

export interface CreateUserDTO {
    username: string;
    password: string;
    fullName: string;
    role?: 'STAFF' | 'MANAGER' | 'ADMIN';
}

export interface UpdateUserDTO {
    fullName?: string;
    role?: 'STAFF' | 'MANAGER' | 'ADMIN';
}

export interface ChangePasswordDTO {
    currentPassword?: string;
    newPassword: string;
}

export async function getUsers(): Promise<ApiResponse<User[]>> {
    return fetchApi<User[]>('/users');
}

export async function getUser(id: string): Promise<ApiResponse<User>> {
    return fetchApi<User>(`/users/${id}`);
}

export async function createUser(data: CreateUserDTO): Promise<ApiResponse<User>> {
    return fetchApi<User>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateUser(id: string, data: UpdateUserDTO): Promise<ApiResponse<User>> {
    return fetchApi<User>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    return fetchApi<{ message: string }>(`/users/${id}`, {
        method: 'DELETE',
    });
}

export async function changePassword(id: string, data: ChangePasswordDTO): Promise<ApiResponse<{ message: string }>> {
    return fetchApi<{ message: string }>(`/users/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

// ============================================
// Customer APIs
// ============================================

export async function getCustomersWithSearch(search?: string): Promise<ApiResponse<Customer[]>> {
    return fetchApi<Customer[]>(`/customers${search ? `?search=${search}` : ''}`);
}

export async function getCustomer(id: string): Promise<ApiResponse<Customer>> {
    return fetchApi<Customer>(`/customers/${id}`);
}

export async function createCustomer(data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return fetchApi<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return fetchApi<Customer>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/customers/${id}`, {
        method: 'DELETE',
    });
}
