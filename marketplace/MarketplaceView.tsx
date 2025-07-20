
import React, { useState } from 'react';
import { Sidebar, Category } from './Sidebar';
import { ProductCard, Product } from './ProductCard';
import { ChevronDown, SlidersHorizontal, Clock, Tag, Globe, Package, Type, BarChart, Filter } from 'lucide-react';

const FilterButton: React.FC<{ label: string }> = ({ label }) => (
    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-200 text-sm rounded-md hover:bg-zinc-700 transition-colors">
        {label}
        <ChevronDown size={16} className="text-zinc-500" />
    </button>
);


// MOCK DATA
const sidebarData: Record<string, Category[]> = {
    "Offers": [
        { id: 'free', name: 'Limited-Time Free', icon: <Clock size={16} /> },
        { id: 'sale', name: 'On Sale', icon: <Tag size={16} /> },
    ],
    "Channels": [
        { id: 'unity', name: 'Unity', icon: <Globe size={16} />, count: 10 },
        { id: 'unreal', name: 'Unreal Engine', icon: <Package size={16} />, count: 68 },
        { id: 'uefn', name: 'UEFN', icon: <Type size={16} />, count: 2 },
        { id: 'metahuman', name: 'MetaHuman', icon: <BarChart size={16} />, count: 714 },
    ],
    "Product types": [
        {
            id: '3d', name: '3D', count: 215,
            children: [
                { id: 'buildings', name: 'Buildings & Architecture', count: 30 },
                {
                    id: 'characters', name: 'Characters & Creatures', count: 46,
                    children: [
                        { id: 'anatomy', name: 'Anatomy', count: 318 },
                        { id: 'animals', name: 'Animals', count: 9.4 },
                        { id: 'creatures', name: 'Creatures & Monsters', count: 2.5 },
                        { id: 'grooms', name: 'Grooms', count: 133 },
                    ]
                },
                { id: 'clothing', name: 'Clothing & Accessories', count: 16 },
                { id: 'electronics', name: 'Electronics & Technology', count: 11 },
                { id: 'environments', name: 'Environments', count: 3.8 },
                { id: 'food', name: 'Food & Drink', count: 9.2 },
            ]
        },
    ],
};

const productData: Product[] = [
    { id: '1', name: 'Virtual Reality Hands', author: 'ZectorLab', thumbnail: 'https://i.imgur.com/eBq62FT.png', price: 'From €31.18', rating: 4.1, reviews: 10 },
    { id: '2', name: 'Base Mesh Pack - Character Collection', author: 'PolyOne Studio', thumbnail: 'https://i.imgur.com/8QpYR8u.png', price: 'From €15.58' },
    { id: '3', name: 'Bodybags - Corpses (Nanite & Low Poly)', author: 'Dekogon Studios', thumbnail: 'https://i.imgur.com/O6L2DlL.png', price: 'From €20.78' },
    { id: '4', name: '3D Brain Anatomy', author: '3D4Science', thumbnail: 'https://i.imgur.com/G3tZ7rL.png', price: 'From €40.54' },
    { id: '5', name: 'Complete Eye Anatomy', author: '3D4Science', thumbnail: 'https://i.imgur.com/9v1W3o8.png', price: 'From €50.94' },
    { id: '6', name: 'Eye - Demo Free', author: 'Davlet', thumbnail: 'https://i.imgur.com/aCg3sB7.png', price: 'From Free', rating: 5.0, reviews: 9, isFree: true },
    { id: '7', name: 'City Professions Pack - The Toys\' Tales - ...', author: 'Existence', thumbnail: 'https://i.imgur.com/f0qB1n4.png', price: 'From €36.38' },
    { id: '8', name: 'Ultimate Skeleton and Skull Pack. 62 gam...', author: 'olegwer', thumbnail: 'https://i.imgur.com/eC3bXQJ.png', price: 'From €72.78' },
    { id: '9', name: 'Base Mesh Pack - Hands', author: 'PolyOne Studio', thumbnail: 'https://i.imgur.com/R3dYj0W.png', price: 'From €7.26' },
    { id: '10', name: 'Warrior Rodents Pack - Hamster, Squirrel,...', author: 'Existence', thumbnail: 'https://i.imgur.com/b9J4B7v.png', price: 'From €36.38' },
    { id: '11', name: 'Base Mesh Pack - Stylized Male', author: 'PolyOne Studio', thumbnail: 'https://i.imgur.com/c1h5N37.png', price: 'From €1.21' },
    { id: '12', name: 'Digestive System Anatomy', author: '3D4Science', thumbnail: 'https://i.imgur.com/F0jR1xS.png', price: 'From €51.98' },
    { id: '13', name: '3D Human Liver Anatomy', author: '3D4Science', thumbnail: 'https://i.imgur.com/2Yy2y2m.png', price: 'From €36.38' },
    { id: '14', name: '3D Complete Human Leg Anatomy', author: '3D4Science', thumbnail: 'https://i.imgur.com/n1f1W2G.png', price: 'From €44.69' },
    { id: '15', name: 'Human Skull', author: 'Abandoned World', thumbnail: 'https://i.imgur.com/l2d1b1j.png', price: 'From €10.38' },
];


export const MarketplaceView = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-full bg-[#1D1E20] text-white">
            <Sidebar categories={sidebarData} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
                {/* Header with Filters */}
                <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-zinc-800 rounded-md text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors md:hidden">
                            <Filter size={18} />
                        </button>
                        <div className="hidden md:flex items-center gap-2 flex-wrap">
                            <FilterButton label="Style" />
                            <FilterButton label="Technical features" />
                            <FilterButton label="Formats" />
                            <FilterButton label="Tags" />
                            <FilterButton label="Price" />
                        </div>
                    </div>
                     <div className="flex items-center gap-2 md:gap-4">
                        <button className="flex items-center gap-2 px-3 md:px-4 py-2 bg-zinc-800 text-zinc-200 text-xs md:text-sm rounded-md hover:bg-zinc-700 transition-colors">
                            Sort by: Relevance
                            <ChevronDown size={16} className="text-zinc-500" />
                        </button>
                        <button className="hidden md:block p-2 bg-zinc-800 rounded-md text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
                            <SlidersHorizontal size={18} />
                        </button>
                    </div>
                </div>
                
                {/* Disclaimer */}
                <p className="text-xs text-zinc-500 mb-4 pl-1">
                    * Savings refer to the lowest price offered on Fab in the past 30 days before discount.
                </p>

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {productData.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </main>
        </div>
    );
};
