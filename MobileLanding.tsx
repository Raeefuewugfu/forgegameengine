
import React from 'react';
import { Dna, Store, UserPlus } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';

export const MobileLanding: React.FC = () => {
    const { openMarketplace } = useEditorStore(state => ({
        openMarketplace: state.openMarketplace,
    }));

    return (
        <div className="w-screen h-screen bg-[var(--bg-deep-dark)] flex flex-col items-center justify-center text-center text-white p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[var(--accent)]/10 rounded-full filter blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-fuchsia-500/10 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <Dna size={56} className="text-[var(--accent)]" />
                    <h1 className="text-3xl font-bold tracking-wider">FORGE ENGINE</h1>
                </div>

                <div className="bg-[var(--bg-panel)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-xl p-6 max-w-sm w-full shadow-2xl">
                    <h2 className="text-xl font-semibold mb-3">Desktop Experience Required</h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-6">
                        The full Forge Engine editor is a powerful tool designed for a desktop environment. Please visit us on a computer for the complete creation experience.
                    </p>

                    <div className="space-y-4">
                         <button
                            onClick={openMarketplace}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-semibold text-sm transition-transform transform hover:scale-105"
                        >
                            <Store size={20} />
                            Explore the Marketplace
                        </button>
                        <button
                            // This button can link to a creator signup page in a real app
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white/10 text-white rounded-lg font-semibold text-sm transition-all transform hover:scale-105 hover:bg-white/20"
                        >
                            <UserPlus size={20} />
                            Become a Creator
                        </button>
                    </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)]/70 mt-8">
                    Forge Engine &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
};
