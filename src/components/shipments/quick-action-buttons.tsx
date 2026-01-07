'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    MapPin,
    Truck,
    CheckCircle,
    XCircle,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShipmentStatus } from '@/types';
import { STATUS_LABELS } from '@/lib/constants';

interface QuickActionButtonsProps {
    currentStatus: ShipmentStatus;
    onStatusChange: (status: ShipmentStatus) => void;
    isLoading?: boolean;
    className?: string;
}

const actionButtons: {
    status: ShipmentStatus;
    label: string;
    icon: React.ElementType;
    variant: 'primary' | 'success' | 'warning' | 'danger';
}[] = [
        {
            status: ShipmentStatus.ARRIVED_AT_HUB,
            label: 'ຖືກສົ່ງມາສະຖານີ',
            icon: MapPin,
            variant: 'primary',
        },
        {
            status: ShipmentStatus.OUT_FOR_DELIVERY,
            label: 'ກຳລັງນຳສົ່ງ',
            icon: Truck,
            variant: 'warning',
        },
        {
            status: ShipmentStatus.DELIVERED,
            label: 'ສົ່ງສຳເລັດ',
            icon: CheckCircle,
            variant: 'success',
        },
        {
            status: ShipmentStatus.FAILED,
            label: 'ສົ່ງບໍ່ສຳເລັດ',
            icon: XCircle,
            variant: 'danger',
        },
    ];

const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
};

export function QuickActionButtons({
    currentStatus,
    onStatusChange,
    isLoading,
    className,
}: QuickActionButtonsProps) {
    const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus | null>(null);

    const handleClick = (status: ShipmentStatus) => {
        setSelectedStatus(status);
        onStatusChange(status);
    };

    return (
        <div className={cn('grid grid-cols-2 gap-3', className)}>
            {actionButtons.map(({ status, label, icon: Icon, variant }) => {
                const isActive = currentStatus === status;
                const isSelected = selectedStatus === status;

                return (
                    <motion.div
                        key={status}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            variant="ghost"
                            className={cn(
                                'w-full h-auto py-4 flex flex-col items-center gap-2 rounded-xl transition-all',
                                isActive
                                    ? 'ring-2 ring-offset-2 ring-blue-500 opacity-50 cursor-not-allowed'
                                    : variantStyles[variant]
                            )}
                            disabled={isActive || isLoading}
                            onClick={() => handleClick(status)}
                        >
                            <Icon className={cn('w-6 h-6', isSelected && isLoading && 'animate-pulse')} />
                            <span className="text-sm font-medium">{label}</span>
                        </Button>
                    </motion.div>
                );
            })}
        </div>
    );
}
