'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCustomersWithSearch,
    createCustomer,
    updateCustomer,
    deleteCustomer
} from '@/lib/api-client';
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
} from '@/components/ui/dialog';
import { Customer } from '@/types';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Search,
    Loader2,
    User,
    Phone,
    MapPin,
    Hash,
    History
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';

export default function CustomersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        defaultAddress: '',
        lineId: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers(searchTerm?: string) {
        setIsLoading(true);
        const result = await getCustomersWithSearch(searchTerm);
        if (result.success && result.data) {
            setCustomers(result.data);
        }
        setIsLoading(false);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        loadCustomers(search);
    }

    function openAddDialog() {
        setEditingCustomer(null);
        setFormData({
            name: '',
            phone: '',
            defaultAddress: '',
            lineId: '',
        });
        setIsDialogOpen(true);
    }

    function openEditDialog(c: Customer) {
        setEditingCustomer(c);
        setFormData({
            name: c.name,
            phone: c.phone,
            defaultAddress: c.defaultAddress || '',
            lineId: c.lineId || '',
        });
        setIsDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingCustomer) {
                const result = await updateCustomer(editingCustomer.id, formData);
                if (result.success) {
                    toast.success('ແກ້ໄຂຂໍ້ມູນລູກຄ້າສຳເລັດ');
                    setIsDialogOpen(false);
                    loadCustomers(search);
                } else {
                    toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
                }
            } else {
                const result = await createCustomer(formData);
                if (result.success) {
                    toast.success('ເພີ່ມລູກຄ້າສຳເລັດ');
                    setIsDialogOpen(false);
                    loadCustomers(search);
                } else {
                    toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
                }
            }
        } catch (error) {
            toast.error('ເກີດຂໍ້ຜິດພາດ');
        }
        setIsSubmitting(false);
    }

    async function handleDelete(c: Customer) {
        if (!confirm(`ຕ້ອງການລຶບ ${c.name} ບໍ?`)) return;

        const result = await deleteCustomer(c.id);
        if (result.success) {
            toast.success('ລຶບລູກຄ້າສຳເລັດ');
            loadCustomers(search);
        } else {
            toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
        }
    }

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <h1 className="text-xl font-bold">ຈັດການລູກຄ້າ</h1>
                        </div>
                        <Button onClick={openAddDialog} className="gradient-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            ເພີ່ມລູກຄ້າ
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-6">

                {/* Search */}
                <form onSubmit={handleSearch} className="mb-6 flex gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="ຄົ້ນຫາດ້ວຍ ຊື່, ເບີໂທ, ຫຼື ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" variant="secondary">ຄົ້ນຫາ</Button>
                </form>

                {/* List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customers.map((c) => (
                            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                            <span className="font-bold text-blue-600">{c.code.split('-')[1]}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{c.name}</h3>
                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                {c.code}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Link href={`/customers/${c.id}`}>
                                            <Button variant="ghost" size="icon" title="ປະຫວັດ">
                                                <History className="w-4 h-4 text-blue-500" />
                                            </Button>
                                        </Link>
                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)}>
                                            <Pencil className="w-4 h-4 text-gray-400" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}>
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {c.phone}
                                    </div>
                                    {c.defaultAddress && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <span className="line-clamp-2">{c.defaultAddress}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {customers.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500">ບໍ່ພົບຂໍ້ມູນລູກຄ້າ</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCustomer ? 'ແກ້ໄຂຂໍ້ມູນ' : 'ເພີ່ມລູກຄ້າໃໝ່'}</DialogTitle>
                        <DialogDescription>
                            {editingCustomer ? 'ແກ້ໄຂລາຍລະອຽດຂອງລູກຄ້າ' : 'ລົງທະບຽນລູກຄ້າໃໝ່ເຂົ້າໃນລະບົບ'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>ຊື່ລູກຄ້າ <span className="text-red-500">*</span></Label>
                            <Input
                                required
                                placeholder="ຕົວຢ່າງ: ສົມພອນ"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ເບີໂທ <span className="text-red-500">*</span></Label>
                            <Input
                                required
                                type="tel"
                                placeholder="020-xxxxxxx"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Line ID</Label>
                            <Input
                                placeholder="(ຖ້າມີ)"
                                value={formData.lineId}
                                onChange={e => setFormData({ ...formData, lineId: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ທີ່ຢູ່ສົ່ງເຄື່ອງປະຈຳ</Label>
                            <Input
                                placeholder="ບ້ານ, ເມືອງ, ແຂວງ"
                                value={formData.defaultAddress}
                                onChange={e => setFormData({ ...formData, defaultAddress: e.target.value })}
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ຍົກເລີກ</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                ບັນທຶກ
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
