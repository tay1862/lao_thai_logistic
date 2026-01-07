'use client';

import { motion } from 'framer-motion';
import { Check, Circle, AlertCircle, Truck, Package, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShipmentEvent, ShipmentStatus } from '@/types';
import { STATUS_LABELS, formatDateTime } from '@/lib/constants';

interface TrackingTimelineProps {
    events: ShipmentEvent[];
    currentStatus: ShipmentStatus;
    className?: string;
}

const statusIcons: Partial<Record<ShipmentStatus, React.ElementType>> = {
    [ShipmentStatus.CREATED]: Package,
    [ShipmentStatus.RECEIVED_AT_ORIGIN]: Package,
    [ShipmentStatus.IN_TRANSIT]: Truck,
    [ShipmentStatus.ARRIVED_AT_HUB]: MapPin,
    [ShipmentStatus.OUT_FOR_DELIVERY]: Truck,
    [ShipmentStatus.READY_FOR_PICKUP]: MapPin,
    [ShipmentStatus.DELIVERED]: Check,
    [ShipmentStatus.FAILED]: AlertCircle,
    [ShipmentStatus.RETURNED]: AlertCircle,
};

export function TrackingTimeline({ events, currentStatus, className }: TrackingTimelineProps) {
    // Sort events by date, newest first
    const sortedEvents = [...events].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div className={cn('space-y-0', className)}>
            {sortedEvents.map((event, index) => {
                const Icon = statusIcons[event.status] || Circle;
                const isFirst = index === 0;
                const isLast = index === sortedEvents.length - 1;
                const isComplete = true; // All past events are complete
                const isCurrent = event.status === currentStatus && isFirst;

                return (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex gap-4"
                    >
                        {/* Timeline line */}
                        {!isLast && (
                            <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-blue-200" />
                        )}

                        {/* Icon */}
                        <div
                            className={cn(
                                'relative z-10 flex items-center justify-center w-10 h-10 rounded-full',
                                isCurrent
                                    ? 'bg-blue-500 text-white shadow-glow'
                                    : isComplete
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-500'
                            )}
                        >
                            <Icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                            <div
                                className={cn(
                                    'p-4 rounded-lg border transition-all',
                                    isCurrent
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'bg-white border-gray-100 hover:border-gray-200'
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4
                                            className={cn(
                                                'font-semibold',
                                                isCurrent ? 'text-blue-700' : 'text-gray-900'
                                            )}
                                        >
                                            {STATUS_LABELS[event.status]}
                                        </h4>
                                        {event.location && (
                                            <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {event.location}
                                            </p>
                                        )}
                                        {event.notes && (
                                            <p className="text-sm text-gray-500 mt-1">{event.notes}</p>
                                        )}
                                    </div>
                                    <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                                        <div>{formatDateTime(event.createdAt)}</div>
                                        {event.createdBy && (
                                            <div className="text-xs text-gray-400">
                                                ໂດຍ {event.createdBy.fullName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
