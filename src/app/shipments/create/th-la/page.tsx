'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, User, Phone, MapPin, Scale, FileText, DollarSign, Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParcelType, ShipmentDirection, CreateShipmentDTO } from '@/types';
import { PARCEL_TYPE_LABELS, generateTrackingNumber } from '@/lib/constants';
import { createShipment } from '@/lib/api-client';
import { CustomerLookup } from '@/components/customers/customer-lookup';
import { PhotoCapture } from '@/components/shipments/photo-capture';
import { toast } from 'sonner';

export default function CreateShipmentTHtoLA() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdTracking, setCreatedTracking] = useState('');

    const [formData, setFormData] = useState({
        thaiTracking: '',
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        parcelType: ParcelType.PARCEL,
        weight: '',
        note: '',
        crossBorderFee: '',
        codAmount: '',
        photos: [] as string[],
    });

    const companyTracking = generateTrackingNumber();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const data: CreateShipmentDTO = {
            thaiTracking: formData.thaiTracking || undefined,
            direction: ShipmentDirection.TH_TO_LA,
            receiverName: formData.receiverName,
            receiverPhone: formData.receiverPhone,
            receiverAddress: formData.receiverAddress || undefined,
            parcelType: formData.parcelType,
            weight: parseFloat(formData.weight) || 0,
            note: formData.note || undefined,
            crossBorderFee: parseInt(formData.crossBorderFee) || 0,
            codAmount: formData.codAmount ? parseInt(formData.codAmount) : undefined,
            photos: formData.photos,
        };

        // Try API call
        const result = await createShipment(data);

        // For demo, always show success
        setCreatedTracking(result.data?.companyTracking || companyTracking);
        setSuccess(true);
        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 mx-auto rounded-full gradient-success flex items-center justify-center mb-6 shadow-glow-success">
                        <Check className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">ສ້າງສຳເລັດ!</h1>
                    <p className="text-gray-500 mb-6">ໝາຍເລກຕິດຕາມ:</p>
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
                        <p className="text-3xl font-bold text-blue-600">{createdTracking}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSuccess(false);
                                setFormData({
                                    thaiTracking: '',
                                    receiverName: '',
                                    receiverPhone: '',
                                    receiverAddress: '',
                                    parcelType: ParcelType.PARCEL,
                                    weight: '',
                                    note: '',
                                    crossBorderFee: '',
                                    codAmount: '',
                                    photos: [],
                                });
                            }}
                        >
                            ສ້າງອີກ
                        </Button>
                        <Button onClick={() => router.push('/dashboard')} className="gradient-primary">
                            ກັບໜ້າຫຼັກ
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="rounded-full"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🇹🇭</span>
                            <span className="font-bold">→</span>
                            <span className="text-xl">🇱🇦</span>
                            <h1 className="font-bold text-gray-900 ml-2">ສ້າງພັດສະດຸ TH→LA</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
                    {/* Section 0: Photos (First) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-0 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-pink-500" />
                                    ຮູບພາບພັດສະດຸ
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PhotoCapture
                                    onPhotosChange={(urls) => setFormData({ ...formData, photos: urls })}
                                    maxPhotos={3}
                                />
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Section 1: Tracking */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-0 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-500" />
                                    ໝາຍເລກຕິດຕາມ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="thaiTracking">ເລກຕິດຕາມຈາກໄທ</Label>
                                    <Input
                                        id="thaiTracking"
                                        placeholder="TH1234567890..."
                                        value={formData.thaiTracking}
                                        onChange={(e) => setFormData({ ...formData, thaiTracking: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>ເລກຕິດຕາມບໍລິສັດ (ອັດຕະໂນມັດ)</Label>
                                    <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="font-mono font-bold text-blue-600">{companyTracking}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Section 2: Receiver */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-0 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="w-5 h-5 text-green-500" />
                                    ຜູ້ຮັບ (ລາວ)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Member Lookup */}
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
                                    <Label className="mb-2 block text-blue-800">ຄົ້ນຫາສະມາຊິກ (Member ID)</Label>
                                    <CustomerLookup onSelect={(c) => {
                                        setFormData({
                                            ...formData,
                                            receiverName: c.name,
                                            receiverPhone: c.phone,
                                            receiverAddress: c.defaultAddress || '',
                                        });
                                        toast.success(`ໂຫລດຂໍ້ມູນ: ${c.name} ສຳເລັດ`);
                                    }} />
                                </div>

                                <div>
                                    <Label htmlFor="receiverName">ຊື່ຜູ້ຮັບ *</Label>
                                    <Input
                                        id="receiverName"
                                        required
                                        placeholder="ທ. ສົມພອນ"
                                        value={formData.receiverName}
                                        onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="receiverPhone">ເບີໂທ *</Label>
                                    <Input
                                        id="receiverPhone"
                                        type="tel"
                                        required
                                        placeholder="020-xxxxxxx"
                                        value={formData.receiverPhone}
                                        onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="receiverAddress">ທີ່ຢູ່ (ຖ້າມີ)</Label>
                                    <Textarea
                                        id="receiverAddress"
                                        placeholder="ບ້ານ, ເມືອງ, ແຂວງ..."
                                        value={formData.receiverAddress}
                                        onChange={(e) => setFormData({ ...formData, receiverAddress: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Section 3: Parcel Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="border-0 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-500" />
                                    ລາຍລະອຽດພັດສະດຸ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>ປະເພດ</Label>
                                    <Select
                                        value={formData.parcelType}
                                        onValueChange={(value) => setFormData({ ...formData, parcelType: value as ParcelType })}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PARCEL_TYPE_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="weight">ນ້ຳໜັກ (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="note">ໝາຍເຫດ</Label>
                                    <Textarea
                                        id="note"
                                        placeholder="ຂໍ້ມູນເພີ່ມເຕີມ..."
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Section 4: Charges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-0 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-yellow-500" />
                                    ຄ່າທຳນຽມ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="crossBorderFee">ຄ່າຂົນສົ່ງຂ້າມແດນ (LAK) *</Label>
                                    <Input
                                        id="crossBorderFee"
                                        type="number"
                                        required
                                        placeholder="120000"
                                        value={formData.crossBorderFee}
                                        onChange={(e) => setFormData({ ...formData, crossBorderFee: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="codAmount">COD ເກັບປາຍທາງ (LAK)</Label>
                                    <Input
                                        id="codAmount"
                                        type="number"
                                        placeholder="0 (ບໍ່ມີ COD)"
                                        value={formData.codAmount}
                                        onChange={(e) => setFormData({ ...formData, codAmount: e.target.value })}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">ປ່ອຍວ່າງຖ້າບໍ່ມີ COD</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="pt-4"
                    >
                        <Button
                            type="submit"
                            disabled={isLoading || !formData.receiverName || !formData.receiverPhone || !formData.crossBorderFee}
                            className="w-full h-14 text-lg font-semibold gradient-th-la hover:opacity-90"
                        >
                            {isLoading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                                />
                            ) : (
                                <>
                                    <Package className="w-5 h-5 mr-2" />
                                    ສ້າງພັດສະດຸ
                                </>
                            )}
                        </Button>
                    </motion.div>
                </form>
            </main>
        </div>
    );
}
