'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    className?: string;
}

const variantStyles = {
    default: {
        card: 'bg-white border-gray-100',
        icon: 'bg-gray-100 text-gray-600',
        value: 'text-gray-900',
    },
    primary: {
        card: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200',
        icon: 'bg-blue-500 text-white',
        value: 'text-blue-700',
    },
    success: {
        card: 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200',
        icon: 'bg-green-500 text-white',
        value: 'text-green-700',
    },
    warning: {
        card: 'bg-gradient-to-br from-yellow-50 to-orange-100/50 border-yellow-200',
        icon: 'bg-yellow-500 text-white',
        value: 'text-yellow-700',
    },
    danger: {
        card: 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200',
        icon: 'bg-red-500 text-white',
        value: 'text-red-700',
    },
};

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    variant = 'default',
    className,
}: StatCardProps) {
    const styles = variantStyles[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <Card className={cn('overflow-hidden border', styles.card, className)}>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">{title}</p>
                            <h3 className={cn('text-3xl font-bold mt-1', styles.value)}>
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </h3>
                            {description && (
                                <p className="text-sm text-gray-500 mt-1">{description}</p>
                            )}
                            {trend && (
                                <p
                                    className={cn(
                                        'text-sm font-medium mt-2',
                                        trend.isPositive ? 'text-green-600' : 'text-red-600'
                                    )}
                                >
                                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                                </p>
                            )}
                        </div>
                        <div className={cn('p-3 rounded-xl', styles.icon)}>
                            <Icon className="w-6 h-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
