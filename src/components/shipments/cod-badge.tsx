'use client';

import { cn } from '@/lib/utils';
import { CodStatus } from '@/types';
import { COD_STATUS_LABELS, COD_STATUS_COLORS, formatLAK } from '@/lib/constants';

interface CodBadgeProps {
    status: CodStatus;
    amount?: number;
    size?: 'sm' | 'md' | 'lg';
    showAmount?: boolean;
    className?: string;
}

export function CodBadge({ status, amount, size = 'md', showAmount = true, className }: CodBadgeProps) {
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    const colors = COD_STATUS_COLORS[status];

    if (status === CodStatus.NONE) {
        return null;
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 font-medium rounded-full',
                colors.bg,
                colors.text,
                sizeClasses[size],
                className
            )}
        >
            <span>COD</span>
            {showAmount && amount !== undefined && (
                <span className="font-semibold">{formatLAK(amount)}</span>
            )}
            <span className="text-xs opacity-75">({COD_STATUS_LABELS[status]})</span>
        </span>
    );
}
