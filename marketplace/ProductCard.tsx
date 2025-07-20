import React from 'react';
import { Star } from 'lucide-react';

export interface Product {
    id: string;
    name: string;
    author: string;
    thumbnail: string;
    price: string;
    rating?: number;
    reviews?: number;
    isFree?: boolean;
}

interface ProductCardProps {
    product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div className="bg-zinc-800 rounded-lg overflow-hidden flex flex-col h-full group">
            <div className="relative aspect-video">
                <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <h3 className="font-semibold text-white truncate text-sm">{product.name}</h3>
                <p className="text-xs text-zinc-400 truncate mb-2">{product.author}</p>
                <div className="flex-grow" />
                <div className="flex items-center justify-between mt-1">
                     {product.rating && (
                        <div className="flex items-center gap-1 text-xs text-zinc-300">
                            <Star size={14} className="text-amber-400 fill-current" />
                            <span>{product.rating.toFixed(1)}</span>
                            {product.reviews && <span className="text-zinc-500">({product.reviews})</span>}
                        </div>
                    )}
                    <p className={`text-sm font-semibold ${product.isFree ? 'text-green-400' : 'text-zinc-300'}`}>
                        {product.isFree ? 'From Free' : product.price}
                    </p>
                </div>
            </div>
        </div>
    );
};
