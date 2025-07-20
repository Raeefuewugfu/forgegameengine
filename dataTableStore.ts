import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ForgeTable, ForgeDataRow } from '../types';

const mockWeaponData: ForgeTable = {
    id: 'dt_weapons',
    name: 'WeaponData',
    rows: [
      { "ID": "Sword01", "Name": "Bronze Sword", "Damage": 10, "Weight": 1.2, "IsTwoHanded": false },
      { "ID": "Axe01", "Name": "Iron Axe", "Damage": 16, "Weight": 2.0, "IsTwoHanded": true },
      { "ID": "Staff01", "Name": "Magic Staff", "Damage": 22, "Weight": 0.8, "IsTwoHanded": false },
      { "ID": "Bow01", "Name": "Longbow", "Damage": 12, "Weight": 1.0, "IsTwoHanded": true }
    ]
};

const mockEnemyData: ForgeTable = {
    id: 'dt_enemies',
    name: 'EnemyData',
    rows: [
      { "ID": "Goblin01", "Name": "Goblin Scout", "Health": 50, "BaseDamage": 5, "Experience": 10 },
      { "ID": "Orc01", "Name": "Orc Grunt", "Health": 120, "BaseDamage": 15, "Experience": 25 },
      { "ID": "Troll01", "Name": "Cave Troll", "Health": 300, "BaseDamage": 40, "Experience": 100 },
    ]
};

interface DataTableState {
    tables: ForgeTable[];
    getTableById: (id: string) => ForgeTable | undefined;
    updateRow: (tableId: string, rowId: string, newRowData: ForgeDataRow) => void;
}

export const useDataTableStore = create<DataTableState>()(
    persist(
        (set, get) => ({
            tables: [mockWeaponData, mockEnemyData],
            
            getTableById: (id) => get().tables.find(t => t.id === id),

            updateRow: (tableId, rowId, newRowData) => {
                set(state => ({
                    tables: state.tables.map(table => {
                        if (table.id === tableId) {
                            return {
                                ...table,
                                rows: table.rows.map(row => row.ID === rowId ? newRowData : row)
                            };
                        }
                        return table;
                    })
                }));
            },
        }),
        {
            name: 'forge-engine-datatables-storage',
        }
    )
);