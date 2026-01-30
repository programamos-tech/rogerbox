'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export default function VersionFooter() {
    return (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-12">
                    {/* Version Badge */}
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#85ea10]/10 text-[#85ea10] text-xs font-bold uppercase tracking-wider">
                            v1.0.0-beta
                        </span>
                    </div>

                    {/* Powered by */}
                    <Link
                        href="https://programamos.studio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-[#164151]/60 dark:text-white/40 hover:text-[#85ea10] dark:hover:text-[#85ea10] transition-colors group"
                    >
                        <span className="font-medium">Powered by</span>
                        <span className="font-bold">programamos.st</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                </div>
            </div>
        </footer>
    );
}
