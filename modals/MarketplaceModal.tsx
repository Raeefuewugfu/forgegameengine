
import React from 'react';
import ReactDOM from 'react-dom';
import { X, Package } from 'lucide-react';
import { MarketplaceView } from '../marketplace/MarketplaceView';

interface MarketplaceModalProps {
    onClose: () => void;
}

export const MarketplaceModal: React.FC<MarketplaceModalProps> = ({ onClose }) => {
    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-[#111214] w-screen h-screen md:w-full md:max-w-7xl md:h-[90vh] md:rounded-lg shadow-2xl border border-[var(--border-color)] flex flex-col md:animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Custom Header for the modal */}
                <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Package size={20} className="text-[var(--accent)]" />
                        <h2 className="font-semibold text-lg text-white">Forge Marketplace</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]">
                        <X size={20} />
                    </button>
                </div>

                {/* The marketplace view */}
                <div className="flex-grow min-h-0">
                    <MarketplaceView />
                </div>
            </div>
        </div>,
        document.body
    );
};
