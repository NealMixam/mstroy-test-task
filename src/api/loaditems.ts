import type { Item } from '../types';

const DELAY_MS = 2000;

export async function loadItems(): Promise<Item[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  const response = await fetch('/items.json');
  return (await response.json()) as Item[];
}