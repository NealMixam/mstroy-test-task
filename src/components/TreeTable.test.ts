import { describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TreeTable from './TreeTable.vue';

vi.mock('ag-grid-vue3', () => ({
  AgGridVue: {
    name: 'AgGridVue',
    props: ['rowData', 'columnDefs', 'treeData', 'getDataPath'],
    template: '<div class="ag-grid-mock">{{ rowData.length }}</div>',
  },
}));

vi.mock('../api/loaditems', () => ({
  loadItems: () =>
    Promise.resolve([
      { id: 1, parent: null, label: 'Айтем 1' },
      { id: 2, parent: 1, label: 'Айтем 2' },
    ]),
}));

describe('TreeTable', () => {
  it('показывает лоадер до загрузки данных', () => {
    const wrapper = mount(TreeTable);
    expect(wrapper.find('.loader').exists()).toBe(true);
    expect(wrapper.find('.ag-grid-mock').exists()).toBe(false);
  });

  it('после загрузки показывает таблицу с данными', async () => {
    const wrapper = mount(TreeTable);
    await flushPromises();
    expect(wrapper.find('.loader').exists()).toBe(false);
    expect(wrapper.find('.ag-grid-mock').text()).toBe('2');
  });
});