import { describe, expect, it } from 'vitest';
import { TreeStore } from './TreeStore';
import type { Item } from '../types';

const items: Item[] = [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: '91064cef', parent: 1, label: 'Айтем 2' },
  { id: 3, parent: 1, label: 'Айтем 3' },
  { id: 4, parent: '91064cef', label: 'Айтем 4' },
  { id: 5, parent: '91064cef', label: 'Айтем 5' },
  { id: 6, parent: '91064cef', label: 'Айтем 6' },
  { id: 7, parent: 4, label: 'Айтем 7' },
  { id: 8, parent: 4, label: 'Айтем 8' },
];

describe('TreeStore', () => {
  it('getAll возвращает все элементы', () => {
    const store = new TreeStore(items);
    expect(store.getAll()).toHaveLength(items.length);
  });

  it('getItem возвращает элемент по id', () => {
    const store = new TreeStore(items);
    expect(store.getItem(1)?.label).toBe('Айтем 1');
    expect(store.getItem('91064cef')?.label).toBe('Айтем 2');
    expect(store.getItem('unknown')).toBeUndefined();
  });

  it('getChildren возвращает прямых детей', () => {
    const store = new TreeStore(items);
    const children = store.getChildren(1).map((c) => c.id);
    expect(children).toContain('91064cef');
    expect(children).toContain(3);
    expect(children).toHaveLength(2);
  });

  it('getChildren возвращает [] для листа', () => {
    const store = new TreeStore(items);
    expect(store.getChildren(7)).toEqual([]);
  });

  it('getAllChildren возвращает всё поддерево', () => {
    const store = new TreeStore(items);
    const ids = store.getAllChildren(1).map((c) => c.id).sort();
    expect(ids).toEqual(['91064cef', 3, 4, 5, 6, 7, 8].sort());
  });

  it('getAllParents возвращает цепочку от элемента к корню', () => {
    const store = new TreeStore(items);
    const chain = store.getAllParents(7).map((c) => c.id);
    expect(chain).toEqual([7, 4, '91064cef', 1]);
  });

  it('setItems полностью заменяет данные', () => {
    const store = new TreeStore(items);
    store.setItems([{ id: 'x', parent: null, label: 'X' }]);
    expect(store.getAll()).toHaveLength(1);
    expect(store.getItem('x')?.label).toBe('X');
    expect(store.getItem(1)).toBeUndefined();
  });

  it('addItem добавляет элемент', () => {
    const store = new TreeStore(items);
    store.addItem({ id: 'new', parent: 1, label: 'Новый' });
    expect(store.getItem('new')?.label).toBe('Новый');
    expect(store.getChildren(1).some((c) => c.id === 'new')).toBe(true);
  });

  it('removeItem удаляет элемент и всех потомков', () => {
    const store = new TreeStore(items);
    store.removeItem(4);
    expect(store.getItem(4)).toBeUndefined();
    expect(store.getItem(7)).toBeUndefined();
    expect(store.getItem(8)).toBeUndefined();
    expect(store.getChildren('91064cef').some((c) => c.id === 4)).toBe(false);
  });

  it('updateItem обновляет поля', () => {
    const store = new TreeStore(items);
    store.updateItem({ id: 3, parent: 1, label: 'Обновлён' });
    expect(store.getItem(3)?.label).toBe('Обновлён');
  });

  it('updateItem переносит элемент при смене parent', () => {
    const store = new TreeStore(items);
    store.updateItem({ id: 3, parent: '91064cef', label: 'Айтем 3' });
    expect(store.getChildren(1).some((c) => c.id === 3)).toBe(false);
    expect(store.getChildren('91064cef').some((c) => c.id === 3)).toBe(true);
  });

  it('не путает числовые и строковые id', () => {
    const store = new TreeStore([
      { id: 1, parent: null, label: 'num' },
      { id: '1', parent: null, label: 'str' },
    ]);
    expect(store.getItem(1)?.label).toBe('num');
    expect(store.getItem('1')?.label).toBe('str');
  });

  it('version увеличивается при мутациях', () => {
    const store = new TreeStore(items);
    const v0 = store.version;
    store.addItem({ id: 'x', parent: null, label: 'X' });
    expect(store.version).toBeGreaterThan(v0);
    const v1 = store.version;
    store.removeItem('x');
    expect(store.version).toBeGreaterThan(v1);
    const v2 = store.version;
    store.updateItem({ id: 1, parent: null, label: 'Обновлён' });
    expect(store.version).toBeGreaterThan(v2);
    const v3 = store.version;
    store.setItems([]);
    expect(store.version).toBeGreaterThan(v3);
  });

  it('работает на большом массиве', () => {
    const big: Item[] = [{ id: 0, parent: null, label: 'root' }];
    for (let i = 1; i < 50_000; i++) {
      big.push({ id: i, parent: i - 1, label: `item-${i}` });
    }
    const t0 = performance.now();
    const store = new TreeStore(big);
    const t1 = performance.now();
    expect(store.getAllChildren(0)).toHaveLength(49_999);
    const t2 = performance.now();
    expect(t1 - t0).toBeLessThan(2000);
    expect(t2 - t1).toBeLessThan(2000);
  });
});