import { useState, useEffect } from 'react';
import { Search, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getCustomersWithSearch } from '@/lib/api-client';
import { Customer } from '@/types';
import { Card } from '@/components/ui/card';

interface CustomerLookupProps {
    onSelect: (customer: Customer) => void;
}

export function CustomerLookup({ onSelect }: CustomerLookupProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    async function handleSearch() {
        setIsLoading(true);
        const res = await getCustomersWithSearch(query);
        if (res.success && res.data) {
            setResults(res.data);
            setShowResults(true);
        }
        setIsLoading(false);
    }

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="ຄົ້ນຫາດ້ວຍ ID (TLL-xxx) ຫຼື ເບີໂທ..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (results.length > 0) setShowResults(true);
                    }}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    className="pl-9 bg-blue-50/50 border-blue-100 focus:border-blue-500"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                )}
            </div>

            {showResults && results.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto border-gray-200 shadow-xl">
                    <div className="p-1">
                        {results.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    onSelect(c);
                                    setQuery(c.code + ' - ' + c.name);
                                    setShowResults(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg flex items-center justify-between group transition-colors"
                            >
                                <div>
                                    <div className="font-bold text-gray-900 flex items-center gap-2">
                                        <span className="font-mono text-xs bg-blue-100 text-blue-700 px-1.5 rounded">{c.code}</span>
                                        {c.name}
                                    </div>
                                    <div className="text-xs text-gray-500 ml-1">{c.phone}</div>
                                </div>
                                <Check className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100" />
                            </button>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
