import { useMemo } from 'react';
import { pluralize } from '../../lib/format';
import { Icon } from '../ui/Icon';
import { ProductImage } from './ProductImage';
import type { Product } from '../../types';

export interface CategoryRailProps {
  products: Product[];
  active: string;
  onPick: (category: string) => void;
}

interface CategoryTile {
  name: string;
  count: number;
  imageUrl?: string;
}

/**
 * "What do they actually sell?" — answered above the fold with real photography.
 *
 * Categories previously existed only as small text chips buried in the catalogue toolbar, which
 * gave a first-time visitor no sense of the range. Each tile borrows the image of a product in
 * that category, so the section builds itself from the catalogue with nothing to maintain.
 */
export function CategoryRail({ products, active, onPick }: CategoryRailProps) {
  const categories = useMemo<CategoryTile[]>(() => {
    const byName = new Map<string, CategoryTile>();

    for (const product of products) {
      const name = product.category?.trim();
      if (!name) continue;

      const existing = byName.get(name);
      if (existing) {
        existing.count += 1;
        existing.imageUrl ??= product.imageUrl;
      } else {
        byName.set(name, { name, count: 1, imageUrl: product.imageUrl });
      }
    }

    return [...byName.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [products]);

  if (categories.length === 0) return null;

  return (
    <section className="categories" aria-labelledby="categories-heading">
      <div className="section-head">
        <div>
          <p className="eyebrow">What we sell</p>
          <h2 className="section-title" id="categories-heading">
            Browse the collection
          </h2>
        </div>
        <p className="section-note">
          {categories.length} {pluralize(categories.length, 'category', 'categories')}
        </p>
      </div>

      <ul className="category-grid">
        {categories.map((category) => {
          const selected = active === category.name;
          return (
            <li key={category.name}>
              <button
                type="button"
                className={selected ? 'category-tile is-active' : 'category-tile'}
                aria-pressed={selected}
                onClick={() => onPick(selected ? 'ALL' : category.name)}
              >
                <span className="category-media">
                  <ProductImage src={category.imageUrl} alt="" />
                </span>
                <span className="category-body">
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">
                    {category.count} {pluralize(category.count, 'piece')}
                  </span>
                </span>
                <Icon name="arrow-right" size={16} className="category-arrow" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
