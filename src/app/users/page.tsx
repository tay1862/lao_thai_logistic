'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { User, UserRole } from '@/types';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Shield,
    ShieldCheck,
    User as UserIcon,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';

const roleLabels: Record<string, string> = {
    STAFF: 'ພະນັກງານ',
    MANAGER: 'ຜູ້ຈັດການ',
    ADMIN: 'ຜູ້ບໍລິຫານ',
};

const roleIcons: Record<string, React.ReactNode> = {
    STAFF: <UserIcon className="w-4 h-4" />,
    MANAGER: <Shield className="w-4 h-4" />,
    ADMIN: <ShieldCheck className="w-4 h-4" />,
};

const roleColors: Record<string, string> = {
    STAFF: 'bg-gray-100 text-gray-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    ADMIN: 'bg-purple-100 text-purple-700',
};

export default function UsersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        role: 'STAFF' as 'STAFF' | 'MANAGER' | 'ADMIN',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check access
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
                router.push('/dashboard');
            }
        }
    }, [user, authLoading, router]);

    // Load users
    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        setIsLoading(true);
        const result = await getUsers();
        if (result.success && result.data) {
            setUsers(result.data);
        }
        setIsLoading(false);
    }

    function openAddDialog() {
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            fullName: '',
            role: 'STAFF',
        });
        setIsDialogOpen(true);
    }

    function openEditDialog(u: User) {
        setEditingUser(u);
        setFormData({
            username: u.username,
            password: '',
            fullName: u.fullName,
            role: u.role,
        });
        setIsDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingUser) {
                // Update user
                const result = await updateUser(editingUser.id, {
                    fullName: formData.fullName,
                    role: formData.role,
                });
                if (result.success) {
                    toast.success('ແກ້ໄຂຜູ້ໃຊ້ສຳເລັດ');
                    setIsDialogOpen(false);
                    loadUsers();
                } else {
                    toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
                }
            } else {
                // Create user
                if (!formData.password) {
                    toast.error('ກະລຸນາໃສ່ລະຫັດຜ່ານ');
                    setIsSubmitting(false);
                    return;
                }
                const result = await createUser({
                    username: formData.username,
                    password: formData.password,
                    fullName: formData.fullName,
                    role: formData.role,
                });
                if (result.success) {
                    toast.success('ເພີ່ມຜູ້ໃຊ້ສຳເລັດ');
                    setIsDialogOpen(false);
                    loadUsers();
                } else {
                    toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
                }
            }
        } catch (error) {
            toast.error('ເກີດຂໍ້ຜິດພາດ');
        }
        setIsSubmitting(false);
    }

    async function handleDelete(u: User) {
        if (!confirm(`ຕ້ອງການລຶບ ${u.fullName} ບໍ?`)) return;

        const result = await deleteUser(u.id);
        if (result.success) {
            toast.success('ລຶບຜູ້ໃຊ້ສຳເລັດ');
            loadUsers();
        } else {
            toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
        }
    }

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <h1 className="text-xl font-bold">ຈັດການພະນັກງານ</h1>
                        </div>
                        <Button onClick={openAddDialog}>
                            <Plus className="w-4 h-4 mr-2" />
                            ເພີ່ມພະນັກງານ
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ຊື່ຜູ້ໃຊ້</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ຊື່ເຕັມ</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ບົດບາດ</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">ການດຳເນີນການ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-sm">{u.username}</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{u.fullName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[u.role]}`}>
                                            {roleIcons[u.role]}
                                            {roleLabels[u.role]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(u)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            {user?.role === 'ADMIN' && u.id !== user.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(u)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            ບໍ່ມີຂໍ້ມູນພະນັກງານ
                        </div>
                    )}
                </div>
            </main>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? 'ແກ້ໄຂພະນັກງານ' : 'ເພີ່ມພະນັກງານໃໝ່'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? 'ແກ້ໄຂຂໍ້ມູນພະນັກງານ'
                                : 'ໃສ່ຂໍ້ມູນເພື່ອເພີ່ມພະນັກງານໃໝ່'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">ຊື່ຜູ້ໃຊ້</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!!editingUser}
                                    required
                                />
                            </div>

                            {!editingUser && (
                                <div className="space-y-2">
                                    <Label htmlFor="password">ລະຫັດຜ່ານ</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="fullName">ຊື່ເຕັມ</Label>
                                <Input
                                    id="fullName"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>ບົດບາດ</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value: 'STAFF' | 'MANAGER' | 'ADMIN') =>
                                        setFormData({ ...formData, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STAFF">ພະນັກງານ</SelectItem>
                                        <SelectItem value="MANAGER">ຜູ້ຈັດການ</SelectItem>
                                        {user?.role === 'ADMIN' && (
                                            <SelectItem value="ADMIN">ຜູ້ບໍລິຫານ</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                ຍົກເລີກ
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                {editingUser ? 'ບັນທຶກ' : 'ເພີ່ມ'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
