'use client';

import { forwardRef } from 'react';
import { Shipment, ShipmentDirection } from '@/types';
import { formatLAK, PARCEL_TYPE_LABELS } from '@/lib/constants';

interface ShippingLabelProps {
    shipment: Shipment;
}

// SVG Barcode component (using Code128-like pattern for visual representation)
function Barcode({ value }: { value: string }) {
    // Simple barcode visualization - alternating bars based on char code
    const generateBars = () => {
        const bars: { width: number; filled: boolean }[] = [];
        // Start guard
        bars.push({ width: 3, filled: true }, { width: 1, filled: false }, { width: 3, filled: true });

        for (let i = 0; i < value.length; i++) {
            const charCode = value.charCodeAt(i);
            // Pattern based on character
            bars.push(
                { width: (charCode % 3) + 1, filled: true },
                { width: (charCode % 2) + 1, filled: false },
                { width: ((charCode >> 2) % 3) + 1, filled: true },
                { width: (charCode % 2) + 1, filled: false }
            );
        }
        // End guard
        bars.push({ width: 3, filled: true }, { width: 1, filled: false }, { width: 3, filled: true });

        return bars;
    };

    const bars = generateBars();
    let x = 0;

    return (
        <svg width="280" height="60" viewBox="0 0 280 60" className="mx-auto">
            {bars.map((bar, index) => {
                const rect = (
                    <rect
                        key={index}
                        x={x}
                        y="0"
                        width={bar.width}
                        height="45"
                        fill={bar.filled ? '#000' : '#fff'}
                    />
                );
                x += bar.width;
                return rect;
            })}
            <text x="140" y="58" textAnchor="middle" fontSize="10" fontFamily="monospace">
                {value}
            </text>
        </svg>
    );
}

export const ShippingLabel = forwardRef<HTMLDivElement, ShippingLabelProps>(
    function ShippingLabel({ shipment }, ref) {
        const direction = shipment.direction === ShipmentDirection.TH_TO_LA
            ? { from: '🇹🇭 ไทย', to: '🇱🇦 ລາວ', color: 'border-orange-400' }
            : { from: '🇱🇦 ລາວ', to: '🇹🇭 ไทย', color: 'border-blue-400' };

        const routeCode = shipment.direction === ShipmentDirection.TH_TO_LA ? 'VTE' : 'BKK';

        return (
            <div
                ref={ref}
                className="bg-white p-6 w-[10cm] h-[15cm] mx-auto border-2 border-gray-800 font-sans"
                style={{
                    width: '10cm',
                    minHeight: '15cm',
                    boxSizing: 'border-box',
                }}
            >
                {/* Header with logo/company name */}
                <div className="text-center border-b-2 border-gray-800 pb-3 mb-3">
                    <h1 className="text-lg font-extrabold tracking-wide">🚚 TH-LA LOGISTICS</h1>
                    <p className="text-xs text-gray-600">ການຂົນສົ່ງສິນຄ້າ ໄທ-ລາວ</p>
                </div>

                {/* Direction indicator */}
                <div className={`text-center py-2 mb-3 border-y-2 ${direction.color} bg-gray-50 flex items-center justify-between px-4`}>
                    <span className="font-bold text-base">
                        {direction.from} ➜ {direction.to}
                    </span>
                    <span className="font-black text-2xl tracking-widest bg-gray-900 text-white px-2 rounded">
                        {routeCode}
                    </span>
                </div>

                {/* Member ID (New) */}
                {shipment.customer && (
                    <div className="text-center mb-3">
                        <div className="inline-block border-2 border-dashed border-gray-400 px-4 py-1 rounded-lg">
                            <span className="text-xs text-gray-500 block">MEMBER ID</span>
                            <span className="text-3xl font-black font-mono tracking-wider">
                                {shipment.customer.code}
                            </span>
                        </div>
                    </div>
                )}

                {/* Barcode */}
                <div className="py-3 border-b border-dashed border-gray-400">
                    <Barcode value={shipment.companyTracking} />
                </div>

                {/* Tracking Numbers */}
                <div className="py-3 border-b border-dashed border-gray-400 space-y-1">
                    <div className="flex justify-between">
                        <span className="text-xs text-gray-600">ເລກບໍລິສັດ:</span>
                        <span className="font-bold text-lg font-mono">{shipment.companyTracking}</span>
                    </div>
                    {shipment.thaiTracking && (
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-600">ເລກ TH:</span>
                            <span className="font-mono text-sm">{shipment.thaiTracking}</span>
                        </div>
                    )}
                </div>

                {/* Receiver Info */}
                <div className="py-3 border-b border-dashed border-gray-400">
                    <h3 className="font-bold text-sm mb-2 bg-gray-100 px-2 py-1 -mx-2">
                        📦 ຜູ້ຮັບ (Receiver)
                    </h3>
                    <p className="font-bold text-base">{shipment.receiverName}</p>
                    <p className="font-mono">📞 {shipment.receiverPhone}</p>
                    {shipment.receiverAddress && (
                        <p className="text-sm text-gray-600 mt-1">📍 {shipment.receiverAddress}</p>
                    )}
                </div>

                {/* Parcel Details */}
                <div className="py-3 text-sm grid grid-cols-2 gap-2 border-b border-dashed border-gray-400">
                    <div>
                        <span className="text-gray-500">ປະເພດ:</span>
                        <span className="ml-1 font-medium">{PARCEL_TYPE_LABELS[shipment.parcelType]}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">ນ້ຳໜັກ:</span>
                        <span className="ml-1 font-medium">{shipment.weight} kg</span>
                    </div>
                </div>

                {/* Fees */}
                <div className="py-3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>ຄ່າຂົນສົ່ງ:</span>
                        <span className="font-bold">{formatLAK(shipment.crossBorderFee)}</span>
                    </div>
                    {shipment.codAmount && shipment.codAmount > 0 && (
                        <div className="flex justify-between bg-yellow-100 -mx-2 px-2 py-2 rounded font-bold">
                            <span>💰 COD ເກັບເງິນ:</span>
                            <span className="text-lg text-red-600">{formatLAK(shipment.codAmount)}</span>
                        </div>
                    )}
                </div>

                {/* Notes */}
                {shipment.note && (
                    <div className="py-2 px-2 bg-gray-50 border-t border-gray-300 text-xs">
                        📝 {shipment.note}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-xs text-gray-400 pt-3 mt-auto border-t border-gray-200">
                    <p>ສະແກນ QR ເພື່ອຕິດຕາມ: www.th-la-logistics.com</p>
                    <p className="mt-1">ຂອບໃຈທີ່ໃຊ້ບໍລິການ 🙏</p>
                </div>
            </div>
        );
    }
);
