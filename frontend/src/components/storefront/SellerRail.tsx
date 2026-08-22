import { initials, pluralize } from '../../lib/format';
import { Icon } from '../ui/Icon';
import type { Product, Seller } from '../../types';

export interface SellerRailProps {
  sellers: Seller[];
  products: Product[];
}

/**
 * Horizontal rail of makers. Only active sellers appear — a suspended or pending merchant
 * should not be promoted on the shop front, which the previous version did not check.
 */
export function SellerRail({ sellers, products }: SellerRailProps) {
  const active = sellers.filter((seller) => (seller.status ?? 'ACTIVE') === 'ACTIVE');
  if (active.length === 0) return null;

  const countsBySeller = products.reduce<Record<string, number>>((counts, product) => {
    if (product.seller_id) {
      counts[product.seller_id] = (counts[product.seller_id] ?? 0) + 1;
    }
    return counts;
  }, {});

  return (
    <section className="makers" aria-labelledby="makers-heading">
      <div className="section-head">
        <div>
          <p className="eyebrow">Verified partners</p>
          <h2 className="section-title" id="makers-heading">
            Meet the makers
          </h2>
        </div>
        <p className="section-note">
          {active.length} independent {pluralize(active.length, 'studio')} on Two Souls
        </p>
      </div>

      <ul className="maker-rail">
        {active.map((seller) => {
          const count = countsBySeller[seller.seller_id] ?? 0;
          return (
            <li key={seller.seller_id} className="maker-card">
              <span className="maker-avatar" aria-hidden="true">
                {initials(seller.store_name)}
              </span>
              <div className="maker-body">
                <p className="maker-name">{seller.store_name}</p>
                <p className="maker-meta">{seller.business_name || 'Independent creator'}</p>
                {count > 0 && (
                  <p className="maker-count">
                    {count} {pluralize(count, 'piece')}
                  </p>
                )}
              </div>
              <span className="maker-verified" title="Verified seller">
                <Icon name="check-circle" size={16} />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
