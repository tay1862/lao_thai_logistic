'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScan: (code: string) => void;
    onError?: (error: string) => void;
}

export function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const startScanner = async () => {
        if (!containerRef.current) return;

        try {
            setError(null);
            const scanner = new Html5Qrcode('scanner-container');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 100 },
                    aspectRatio: 1.5,
                },
                (decodedText) => {
                    onScan(decodedText);
                    // Don't stop scanner automatically - allow multiple scans
                },
                (errorMessage) => {
                    // Ignore continuous scan errors
                }
            );

            setIsScanning(true);
        } catch (err: any) {
            const errorMsg = err.message || 'ບໍ່ສາມາດເປີດກ້ອງໄດ້';
            setError(errorMsg);
            onError?.(errorMsg);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
                setIsScanning(false);
            } catch (err) {
                console.error('Stop scanner error:', err);
            }
        }
    };

    useEffect(() => {
        startScanner();
        return () => {
            stopScanner();
        };
    }, []);

    return (
        <div className="w-full">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4 text-center">
                    <p>{error}</p>
                    <button
                        onClick={startScanner}
                        className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg"
                    >
                        ລອງໃໝ່
                    </button>
                </div>
            )}

            <div
                id="scanner-container"
                ref={containerRef}
                className="w-full rounded-xl overflow-hidden bg-black"
                style={{ minHeight: '300px' }}
            />

            {isScanning && (
                <p className="text-center text-gray-500 mt-4 text-sm">
                    ເອົາ Barcode ໃສ່ໃນກອບ
                </p>
            )}
        </div>
    );
}
