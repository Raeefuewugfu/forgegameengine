
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PackageStatus = 'installed' | 'not_installed' | 'update_available';

export interface ForgePackage {
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    status: PackageStatus;
    isUninstallable?: boolean;
}

const initialPackages: ForgePackage[] = [
    { id: 'core-renderer', name: 'Standard Renderer', description: 'The default forward rendering pipeline for Forge Engine.', author: 'Forge Team', version: '1.0.0', status: 'installed', isUninstallable: true },
    { id: 'ammo-physics', name: 'Ammo.js Physics', description: 'Physics integration using ammo.js, a port of the Bullet physics engine.', author: 'Forge Team', version: '1.1.2', status: 'installed', isUninstallable: true },
    { id: 'rtx-pipeline', name: 'RTX Ray-Tracing Pipeline', description: 'Experimental WebGPU-based ray-tracing for realistic lighting and reflections.', author: 'Forge Team', version: '0.8.1', status: 'installed' },
    { id: 'multiplayer-net', name: 'ForgeNet Multiplayer', description: 'Real-time networking solution for creating multiplayer games.', author: 'Forge Team', version: '0.5.0', status: 'not_installed' },
    { id: 'advanced-terrain', name: 'Advanced Terrain Tools', description: 'Adds procedural vegetation, hydraulic erosion, and more terrain sculpting tools.', author: 'Community Contributor', version: '1.2.0', status: 'update_available' },
    { id: 'ai-behavior-tree', name: 'AI Behavior Trees', description: 'A powerful tool for creating complex AI logic using behavior trees.', author: 'Community Contributor', version: '1.0.5', status: 'not_installed' },
];

interface PackageState {
    packages: ForgePackage[];
    installPackage: (id: string) => void;
    uninstallPackage: (id: string) => void;
    updatePackage: (id: string) => void;
    isPackageInstalled: (id: string) => boolean;
}

export const usePackageStore = create<PackageState>()(
    persist(
        (set, get) => ({
            packages: initialPackages,
            installPackage: (id) => {
                set(state => ({
                    packages: state.packages.map(p => p.id === id ? { ...p, status: 'installed' } : p)
                }));
            },
            uninstallPackage: (id) => {
                set(state => ({
                    packages: state.packages.map(p => {
                        if (p.id === id && !p.isUninstallable) {
                           return { ...p, status: 'not_installed' };
                        }
                        return p;
                    })
                }));
            },
            updatePackage: (id) => {
                 set(state => ({
                    packages: state.packages.map(p => p.id === id ? { ...p, status: 'installed', version: '1.3.0' } : p) // Example version bump
                }));
            },
            isPackageInstalled: (id: string) => {
                const pkg = get().packages.find(p => p.id === id);
                return pkg?.status === 'installed' || pkg?.status === 'update_available';
            }
        }),
        {
            name: 'forge-engine-packages-storage',
        }
    )
);