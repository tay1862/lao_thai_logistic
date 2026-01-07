'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ShipmentDirection } from '@/types';
import { DIRECTION_LABELS, DIRECTION_STYLES } from '@/lib/constants';

interface DirectionBadgeProps {
    direction: ShipmentDirection;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function DirectionBadge({ direction, size = 'md', className }: DirectionBadgeProps) {
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    return (
        <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
                'inline-flex items-center gap-1.5 font-semibold text-white rounded-full',
                DIRECTION_STYLES[direction].gradient,
                sizeClasses[size],
                className
            )}
        >
            {direction === ShipmentDirection.TH_TO_LA ? '🇹🇭' : '🇱🇦'}
            <span>{DIRECTION_LABELS[direction]}</span>
            {direction === ShipmentDirection.TH_TO_LA ? '🇱🇦' : '🇹🇭'}
        </motion.span>
    );
}
