'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Package, Truck, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function TrackingPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsLoading(true);
    router.push(`/tracking/${encodeURIComponent(trackingNumber.trim())}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-8 pb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            ຕິດຕາມພັດສະດຸ
          </h1>
          <p className="text-gray-500">Track Your Parcel</p>
        </motion.header>

        {/* Main Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex items-start justify-center"
        >
          <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleTrack} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    ໝາຍເລກຕິດຕາມ / Tracking Number
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="LA240900XX, TH123456789..."
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="h-14 pl-12 pr-4 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!trackingNumber.trim() || isLoading}
                  className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary hover:opacity-90 transition-opacity"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Search className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      ຄົ້ນຫາ / Track
                    </>
                  )}
                </Button>
              </form>

              {/* Features */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500">ຂົນສົ່ງຂ້າມແດນ</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-500">ຕິດຕາມແບບ Real-time</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-purple-50 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-purple-500" />
                    </div>
                    <p className="text-xs text-gray-500">ໄທ - ລາວ</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="py-6 text-center"
        >
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <button className="hover:text-blue-600 transition-colors">
              ติดต่อสอบถาม
            </button>
            <span>|</span>
            <button className="hover:text-blue-600 transition-colors font-medium">
              LA / TH
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            © 2025 Thai-Lao Logistics
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
