<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import {
    ModuleRegistry,
    ClientSideRowModelModule,
    ValidationModule,
    CellStyleModule,
} from 'ag-grid-community';
import { TreeDataModule, RowGroupingModule } from 'ag-grid-enterprise';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { TreeStore } from '../store/TreeStore';
import { loadItems } from '../api/loaditems';
import type { Item, TreeRow } from '../types';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ValidationModule,
    CellStyleModule,
    TreeDataModule,
    RowGroupingModule,
]);

const store = shallowRef(new TreeStore());
const loading = ref(true);
const rowData = ref<TreeRow[]>([]);
const gridApi = ref<GridApi | null>(null);

const columnDefs: ColDef<TreeRow>[] = [
    {
        headerName: '№ п/п',
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        width: 90,
        cellStyle: { textAlign: 'center' },
    },
    {
        headerName: 'Категория',
        field: 'category',
        width: 160,
    },
    {
        headerName: 'Наименование',
        field: 'label',
        flex: 1,
    },
];

const defaultColDef: ColDef = {
    resizable: true,
    sortable: false,
    filter: false,
};

function buildRows(store: TreeStore): TreeRow[] {
    const rows: TreeRow[] = [];
    const all = store.getAll();
    const roots = all.filter(
        (it) => it.parent === null || !all.some((p) => p.id === it.parent),
    );

    const visit = (item: Item, path: string[]) => {
        const children = store.getChildren(item.id);
        const stringId = String(item.id);
        rows.push({
            id: item.id,
            label: item.label,
            category: children.length > 0 ? 'Группа' : 'Элемент',
            path: [...path, stringId],
        });
        for (const child of children) visit(child, [...path, stringId]);
    };

    for (const root of roots) visit(root, []);
    return rows;
}

function refresh() {
    rowData.value = buildRows(store.value);
}

function getDataPath(data: TreeRow): string[] {
    return data.path;
}

onMounted(async () => {
    try {
        const items = await loadItems();
        store.value.setItems(items);
        refresh();
    } finally {
        loading.value = false;
    }
});

watch(
    () => store.value.version,
    () => refresh(),
);

function onGridReady(event: GridReadyEvent) {
    gridApi.value = event.api;
}
</script>

<template>
    <div class="wrapper">
        <div v-if="loading" class="loader">
            <div class="spinner" />
            <p>Загрузка данных…</p>
        </div>

        <AgGridVue v-else class="ag-theme-quartz" style="width: 100%; height: 100%" :column-defs="columnDefs"
            :default-col-def="defaultColDef" :row-data="rowData" :tree-data="true" :get-data-path="getDataPath"
            :animate-rows="true" :group-default-expanded="-1" :get-row-id="(params) => String(params.data.id)"
            :auto-group-column-def="{
                headerName: 'Наименование',
                field: 'label',
                cellRendererParams: { suppressCount: true },
            }" @grid-ready="onGridReady" />
    </div>
</template>

<style scoped>
.wrapper {
    width: 100%;
    height: 100vh;
    padding: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

.loader {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #4a5568;
}

.spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e2e8f0;
    border-top-color: #3182ce;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 12px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>