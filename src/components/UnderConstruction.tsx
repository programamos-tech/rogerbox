'use client';

import { Settings } from 'lucide-react';

interface UnderConstructionProps {
    title: string;
    description?: string;
    icon: any;
}

export default function UnderConstruction({ title, description, icon: Icon }: UnderConstructionProps) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/5 shadow-inner min-h-[500px]">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-[#85ea10]/20 blur-3xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-[#85ea10]/20 to-[#85ea10]/5 rounded-3xl flex items-center justify-center shadow-xl border border-[#85ea10]/20">
                    <Icon className="w-12 h-12 text-[#85ea10]" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#164151] dark:bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                    <Settings className="w-5 h-5 text-white dark:text-[#164151] animate-spin-slow" />
                </div>
            </div>

            <h2 className="text-3xl font-black text-[#164151] dark:text-white uppercase tracking-tighter mb-4">
                {title} <span className="text-[#85ea10]">en construcción</span>
            </h2>

            <p className="text-[#164151]/60 dark:text-white/40 max-w-md font-semibold text-lg leading-relaxed">
                {description || "Este módulo está siendo optimizado para ofrecerte el mejor rendimiento y nuevas funciones. ¡Estará listo muy pronto!"}
            </p>

            <div className="mt-12 flex items-center gap-4 bg-gray-100 dark:bg-white/5 px-6 py-3 rounded-2xl">
                <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-[#85ea10] animate-bounce"
                            style={{ animationDelay: `${i * 0.2}s` }}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-black text-[#164151]/40 dark:text-white/30 uppercase tracking-[0.2em]">
                    Working on it
                </span>
            </div>
        </div>
    );
}
