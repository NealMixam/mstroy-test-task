import type { Item, ItemId } from '../types';

export class TreeStore {
  private itemsMap = new Map<ItemId, Item>();
  private childrenMap = new Map<ItemId, Set<ItemId>>();
  private roots = new Set<ItemId>();
  private allItems: Item[] = [];
  version = 0;

  constructor(initial: Item[] = []) {
    this.setItems(initial);
  }

  getAll(): Item[] {
    return this.allItems.slice();
  }

  getItem(id: ItemId): Item | undefined {
    return this.itemsMap.get(id);
  }

  getChildren(id: ItemId): Item[] {
    const set = this.childrenMap.get(id);
    if (!set || set.size === 0) return [];
    const result: Item[] = [];
    for (const childId of set) {
      const child = this.itemsMap.get(childId);
      if (child) result.push(child);
    }
    return result;
  }

  getAllChildren(id: ItemId): Item[] {
    const result: Item[] = [];
    const stack: ItemId[] = [id];
    while (stack.length) {
      const current = stack.pop()!;
      const children = this.childrenMap.get(current);
      if (!children) continue;
      for (const childId of children) {
        const child = this.itemsMap.get(childId);
        if (!child) continue;
        result.push(child);
        stack.push(childId);
      }
    }
    return result;
  }

  getAllParents(id: ItemId): Item[] {
    const result: Item[] = [];
    let current = this.itemsMap.get(id);
    while (current) {
      result.push(current);
      if (current.parent === null) break;
      current = this.itemsMap.get(current.parent);
    }
    return result;
  }

  setItems(items: Item[]): void {
    this.itemsMap.clear();
    this.childrenMap.clear();
    this.roots.clear();
    this.allItems = [];

    for (const item of items) {
      this.itemsMap.set(item.id, item);
      this.allItems.push(item);
    }

    for (const item of items) {
      if (item.parent === null || !this.itemsMap.has(item.parent)) {
        this.roots.add(item.id);
      } else {
        let bucket = this.childrenMap.get(item.parent);
        if (!bucket) {
          bucket = new Set();
          this.childrenMap.set(item.parent, bucket);
        }
        bucket.add(item.id);
      }
    }

    this.version++;
  }

  addItem(item: Item): void {
    if (this.itemsMap.has(item.id)) {
      throw new Error(`Item with id "${item.id}" already exists`);
    }
    this.itemsMap.set(item.id, item);
    this.allItems.push(item);

    if (item.parent === null || !this.itemsMap.has(item.parent)) {
      this.roots.add(item.id);
    } else {
      let bucket = this.childrenMap.get(item.parent);
      if (!bucket) {
        bucket = new Set();
        this.childrenMap.set(item.parent, bucket);
      }
      bucket.add(item.id);
    }

    this.version++;
  }

  removeItem(id: ItemId): void {
    const item = this.itemsMap.get(id);
    if (!item) return;

    const toRemove = new Set<ItemId>([id]);
    const stack: ItemId[] = [id];
    while (stack.length) {
      const current = stack.pop()!;
      const children = this.childrenMap.get(current);
      if (!children) continue;
      for (const childId of children) {
        if (!toRemove.has(childId)) {
          toRemove.add(childId);
          stack.push(childId);
        }
      }
    }

    if (item.parent !== null) {
      this.childrenMap.get(item.parent)?.delete(id);
    } else {
      this.roots.delete(id);
    }

    for (const rid of toRemove) {
      this.itemsMap.delete(rid);
      this.childrenMap.delete(rid);
      this.roots.delete(rid);
    }

    this.allItems = this.allItems.filter((it) => !toRemove.has(it.id));

    this.version++;
  }

  updateItem(item: Item): void {
    const existing = this.itemsMap.get(item.id);
    if (!existing) {
      throw new Error(`Item with id "${item.id}" not found`);
    }

    const oldParent = existing.parent;
    const newParent = item.parent;

    Object.assign(existing, item);

    if (oldParent !== newParent) {
      if (oldParent !== null) {
        this.childrenMap.get(oldParent)?.delete(item.id);
      } else {
        this.roots.delete(item.id);
      }

      if (newParent === null || !this.itemsMap.has(newParent)) {
        this.roots.add(item.id);
      } else {
        let bucket = this.childrenMap.get(newParent);
        if (!bucket) {
          bucket = new Set();
          this.childrenMap.set(newParent, bucket);
        }
        bucket.add(item.id);
      }
    }

    this.version++;
  }
}