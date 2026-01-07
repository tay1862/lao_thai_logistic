import { ShipmentStatus, ShipmentDirection, CodStatus, LastMileMethod, ParcelType } from '@/types';

// Status labels in Lao
export const STATUS_LABELS: Record<ShipmentStatus, string> = {
    [ShipmentStatus.CREATED]: 'ສ້າງແລ້ວ',
    [ShipmentStatus.RECEIVED_AT_ORIGIN]: 'ຮັບແລ້ວຢູ່ຕົ້ນທາງ',
    [ShipmentStatus.IN_TRANSIT]: 'ກຳລັງຂົນສົ່ງ',
    [ShipmentStatus.ARRIVED_AT_HUB]: 'ຖືກສົ່ງມາສະຖານີ',
    [ShipmentStatus.OUT_FOR_DELIVERY]: 'ກຳລັງນຳສົ່ງ',
    [ShipmentStatus.READY_FOR_PICKUP]: 'ພ້ອມສຳລັບມາເອົາ',
    [ShipmentStatus.DELIVERED]: 'ສົ່ງສຳເລັດ',
    [ShipmentStatus.FAILED]: 'ສົ່ງບໍ່ສຳເລັດ',
    [ShipmentStatus.RETURNED]: 'ສົ່ງກັບຄືນ',
};

// Status colors
export const STATUS_COLORS: Record<ShipmentStatus, { bg: string; text: string }> = {
    [ShipmentStatus.CREATED]: { bg: 'bg-gray-100', text: 'text-gray-700' },
    [ShipmentStatus.RECEIVED_AT_ORIGIN]: { bg: 'bg-blue-100', text: 'text-blue-700' },
    [ShipmentStatus.IN_TRANSIT]: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    [ShipmentStatus.ARRIVED_AT_HUB]: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    [ShipmentStatus.OUT_FOR_DELIVERY]: { bg: 'bg-orange-100', text: 'text-orange-700' },
    [ShipmentStatus.READY_FOR_PICKUP]: { bg: 'bg-purple-100', text: 'text-purple-700' },
    [ShipmentStatus.DELIVERED]: { bg: 'bg-green-100', text: 'text-green-700' },
    [ShipmentStatus.FAILED]: { bg: 'bg-red-100', text: 'text-red-700' },
    [ShipmentStatus.RETURNED]: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

// Direction labels
export const DIRECTION_LABELS: Record<ShipmentDirection, string> = {
    [ShipmentDirection.TH_TO_LA]: 'TH → LA',
    [ShipmentDirection.LA_TO_TH]: 'LA → TH',
};

// Direction colors
export const DIRECTION_STYLES: Record<ShipmentDirection, { bg: string; gradient: string }> = {
    [ShipmentDirection.TH_TO_LA]: {
        bg: 'bg-orange-500',
        gradient: 'gradient-th-la'
    },
    [ShipmentDirection.LA_TO_TH]: {
        bg: 'bg-blue-500',
        gradient: 'gradient-la-th'
    },
};

// COD Status labels
export const COD_STATUS_LABELS: Record<CodStatus, string> = {
    [CodStatus.NONE]: 'ບໍ່ມີ COD',
    [CodStatus.PENDING]: 'ລໍຖ້າເກັບເງິນ',
    [CodStatus.COLLECTED]: 'ເກັບເງິນແລ້ວ',
    [CodStatus.REMITTED]: 'ໂອນແລ້ວ',
};

// COD Status colors
export const COD_STATUS_COLORS: Record<CodStatus, { bg: string; text: string }> = {
    [CodStatus.NONE]: { bg: 'bg-gray-100', text: 'text-gray-600' },
    [CodStatus.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    [CodStatus.COLLECTED]: { bg: 'bg-green-100', text: 'text-green-700' },
    [CodStatus.REMITTED]: { bg: 'bg-blue-100', text: 'text-blue-700' },
};

// Last-mile method labels
export const LAST_MILE_LABELS: Record<LastMileMethod, string> = {
    [LastMileMethod.PICKUP]: 'ລູກຄ້າມາເອົາເອງ',
    [LastMileMethod.DELIVERY]: 'ນຳສົ່ງຮອດບ້ານ',
};

// Parcel type labels
export const PARCEL_TYPE_LABELS: Record<ParcelType, string> = {
    [ParcelType.DOCUMENT]: 'ເອກະສານ',
    [ParcelType.PARCEL]: 'ພັດສະດຸທົ່ວໄປ',
    [ParcelType.PACKAGE]: 'ກ່ອງພັດສະດຸ',
};

// Format LAK currency
export function formatLAK(amount: number): string {
    return new Intl.NumberFormat('lo-LA', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' LAK';
}

// Format date/time
export function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

// Format date only
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

// Generate company tracking number
export function generateTrackingNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LA${year}${month}${random}`;
}

// Calculate total charge
export function calculateTotal(crossBorderFee: number, codAmount?: number): number {
    return crossBorderFee + (codAmount || 0);
}
