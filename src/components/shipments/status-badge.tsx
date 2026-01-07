'use client';

import { cn } from '@/lib/utils';
import { ShipmentStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';

interface StatusBadgeProps {
    status: ShipmentStatus;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    const colors = STATUS_COLORS[status];

    return (
        <span
            className={cn(
                'inline-flex items-center font-medium rounded-full',
                colors.bg,
                colors.text,
                sizeClasses[size],
                className
            )}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}
