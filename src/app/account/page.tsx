'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    ArrowLeft,
    User,
    Shield,
    LogOut,
    Lock,
    Loader2,
    Check,
    Building,
} from 'lucide-react';
import { logout, getAuthToken, changePassword } from '@/lib/api-client';
import { User as UserType } from '@/types';

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserType | null>(null);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChanging, setIsChanging] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = getAuthToken();

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        try {
            setUser(JSON.parse(userData));
        } catch {
            router.push('/login');
        }
    }, [router]);

    const handleLogout = () => {
        logout();
        localStorage.removeItem('user');
        router.push('/login');
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('ລະຫັດຜ່ານໃໝ່ບໍ່ຕົງກັນ');
            return;
        }

        if (newPassword.length < 3) {
            toast.error('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ');
            return;
        }

        if (!user) return;

        setIsChanging(true);
        try {
            const result = await changePassword(user.id, {
                currentPassword,
                newPassword,
            });

            if (result.success) {
                toast.success('ປ່ຽນລະຫັດຜ່ານສຳເລັດ');
                setShowPasswordForm(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
            }
        } catch (error) {
            toast.error('ເກີດຂໍ້ຜິດພາດ');
        }
        setIsChanging(false);
    };

    const getRoleName = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'ແອັດມິນ';
            case 'MANAGER': return 'ຜູ້ຈັດການ';
            default: return 'ພະນັກງານ';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-100 text-red-600';
            case 'MANAGER': return 'bg-purple-100 text-purple-600';
            default: return 'bg-blue-100 text-blue-600';
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">ບັນຊີຂອງຂ້ອຍ</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {/* Profile Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
                                <p className="text-gray-500">@{user.username}</p>
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                    <Shield className="w-3 h-3 inline mr-1" />
                                    {getRoleName(user.role)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            ປ່ຽນລະຫັດຜ່ານ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!showPasswordForm ? (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowPasswordForm(true)}
                            >
                                ປ່ຽນລະຫັດຜ່ານ
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label>ລະຫັດຜ່ານປັດຈຸບັນ</Label>
                                    <Input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ລະຫັດຜ່ານໃໝ່</Label>
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ຢືນຢັນລະຫັດຜ່ານໃໝ່</Label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowPasswordForm(false)}
                                    >
                                        ຍົກເລີກ
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleChangePassword}
                                        disabled={isChanging}
                                    >
                                        {isChanging ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4 mr-1" />
                                        )}
                                        ບັນທຶກ
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Logout */}
                <Button
                    variant="destructive"
                    className="w-full h-12"
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    ອອກຈາກລະບົບ
                </Button>
            </main>
        </div>
    );
}
