'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, LoginCredentials, AuthResponse } from '@/types';
import { login as apiLogin, logout as apiLogout, getAuthToken, setAuthToken, getCurrentUser } from '@/lib/api-client';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/tracking'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Check if current route requires auth
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith('/tracking/')
    );

    useEffect(() => {
        const initAuth = async () => {
            const token = getAuthToken();
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));

                    // Optionally verify token is still valid
                    const result = await getCurrentUser();
                    if (result.success && result.data) {
                        setUser(result.data);
                        localStorage.setItem('user', JSON.stringify(result.data));
                    }
                } catch {
                    // Token invalid, clear and redirect
                    setAuthToken(null);
                    localStorage.removeItem('user');
                    if (!isPublicRoute) {
                        router.push('/login');
                    }
                }
            } else if (!isPublicRoute) {
                // No token and not on public route
                router.push('/login');
            }

            setIsLoading(false);
        };

        initAuth();
    }, [router, isPublicRoute]);

    const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
        const result = await apiLogin(credentials);

        if (result.success && result.data) {
            setUser(result.data.user);
            localStorage.setItem('user', JSON.stringify(result.data.user));
            return { success: true };
        }

        return { success: false, error: result.error || 'ເກີດຂໍ້ຜິດພາດ' };
    };

    const logout = () => {
        apiLogout();
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
