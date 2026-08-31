import { Link } from 'react-router-dom';
import { useAdminData } from '../../context/admin-data-context';
import { cx, DEFAULT_CURRENCY, formatCompactCurrency, formatCurrency, formatDate } from '../../lib/format';
import { stockOf } from '../../lib/product';
import {
  countDeltaPercent,
  dailyRevenue,
  lowStockProducts,
  recentOrders,
  revenueByDealer,
  revenueDeltaPercent,
  statusBreakdown,
  totalRevenue,
} from '../../lib/metrics';
import { Badge, StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Skeleton } from '../ui/Skeleton';
import { BarList } from './charts/BarList';
import { DonutChart } from './charts/DonutChart';
import { Sparkline } from './charts/Sparkline';

function DeltaPill({ value }: { value: number | null }) {
  if (value === null) {
    // No prior month to compare against — say so rather than print a fabricated number.
    return <span className="delta delta-none">No prior month</span>;
  }

  const rising = value >= 0;
  return (
    <span className={cx('delta', rising ? 'delta-up' : 'delta-down')}>
      <Icon name={rising ? 'trending-up' : 'trending-down'} size={14} />
      {Math.abs(value).toFixed(1)}% vs last month
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  footnote: React.ReactNode;
  icon: 'receipt' | 'store' | 'package' | 'trending-up';
}

function StatCard({ label, value, footnote, icon }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <p className="stat-label">{label}</p>
        <span className="stat-icon">
          <Icon name={icon} size={17} />
        </span>
      </div>
      <p className="stat-value">{value}</p>
      <div className="stat-foot">{footnote}</div>
    </article>
  );
}

export function Dashboard() {
  const { dealers, products, orders, loading, error, refresh } = useAdminData();

  if (loading) {
    return (
      <div className="admin-page">
        <div className="stats-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} height="132px" radius="var(--radius-lg)" />
          ))}
        </div>
        <Skeleton height="260px" radius="var(--radius-lg)" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        tone="error"
        title="We couldn't load your dashboard"
        description={error}
        action={
          <Button variant="secondary" iconLeft="refresh" onClick={() => void refresh()}>
            Try again
          </Button>
        }
      />
    );
  }

  const revenue = totalRevenue(orders);
  const activeDealers = dealers.filter((dealer) => (dealer.status ?? 'ACTIVE') === 'ACTIVE').length;
  const publishedProducts = products.filter(
    (product) => (product.status ?? 'PUBLISHED') === 'PUBLISHED',
  ).length;

  const lowStock = lowStockProducts(products);
  const trend = dailyRevenue(orders, 30);
  const recent = recentOrders(orders, 5);

  return (
    <div className="admin-page">
      <section className="stats-grid" aria-label="Key figures">
        <StatCard
          label="Total revenue"
          value={formatCompactCurrency(revenue)}
          footnote={<DeltaPill value={revenueDeltaPercent(orders)} />}
          icon="trending-up"
        />
        <StatCard
          label="Orders"
          value={orders.length.toLocaleString()}
          footnote={<DeltaPill value={countDeltaPercent(orders)} />}
          icon="receipt"
        />
        <StatCard
          label="Active dealers"
          value={activeDealers.toLocaleString()}
          footnote={
            <span className="stat-note">
              {dealers.length - activeDealers > 0
                ? `${dealers.length - activeDealers} inactive`
                : 'All dealers active'}
            </span>
          }
          icon="store"
        />
        <StatCard
          label="Published products"
          value={publishedProducts.toLocaleString()}
          footnote={
            <span className={cx('stat-note', lowStock.length > 0 && 'stat-note-warn')}>
              {lowStock.length > 0 ? `${lowStock.length} low on stock` : 'Stock levels healthy'}
            </span>
          }
          icon="package"
        />
      </section>

      <div className="dash-grid">
        <section className="panel panel-wide" aria-labelledby="trend-heading">
          <header className="panel-head">
            <div>
              <h2 className="panel-title" id="trend-heading">
                Revenue, last 30 days
              </h2>
              <p className="panel-sub">Cancelled orders are excluded.</p>
            </div>
            <Badge tone="neutral">{formatCurrency(trend.reduce((sum, d) => sum + d.value, 0))}</Badge>
          </header>
          <Sparkline points={trend} label="Daily revenue over the last 30 days" />
        </section>

        <section className="panel" aria-labelledby="status-heading">
          <header className="panel-head">
            <h2 className="panel-title" id="status-heading">
              Order status
            </h2>
          </header>
          <DonutChart slices={statusBreakdown(orders)} label="Orders by status" />
        </section>

        <section className="panel" aria-labelledby="dealers-heading">
          <header className="panel-head">
            <div>
              <h2 className="panel-title" id="dealers-heading">
                Revenue by dealer
              </h2>
              <p className="panel-sub">Which suppliers' stock is actually selling.</p>
            </div>
            <Link to="/admin/dealers" className="panel-link">
              Manage
              <Icon name="arrow-right" size={14} />
            </Link>
          </header>
          <BarList
            items={revenueByDealer(orders, dealers)}
            emptyMessage="No dealer revenue recorded yet."
          />
        </section>

        <section className="panel" aria-labelledby="stock-heading">
          <header className="panel-head">
            <div>
              <h2 className="panel-title" id="stock-heading">
                Low stock
              </h2>
              <p className="panel-sub">Five units or fewer.</p>
            </div>
            <Link to="/admin/products" className="panel-link">
              Manage
              <Icon name="arrow-right" size={14} />
            </Link>
          </header>

          {lowStock.length === 0 ? (
            <div className="chart-empty" style={{ height: 160 }}>
              <p>Nothing is running low. </p>
            </div>
          ) : (
            <ul className="mini-list">
              {lowStock.slice(0, 6).map((product) => {
                const stock = stockOf(product) ?? 0;
                return (
                  <li key={product.product_id} className="mini-row">
                    <div className="mini-body">
                      <p className="mini-title">{product.title}</p>
                      {product.sku && <p className="mini-meta text-mono">{product.sku}</p>}
                    </div>
                    <Badge tone={stock === 0 ? 'danger' : 'warning'}>
                      {stock === 0 ? 'Out of stock' : `${stock} left`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel panel-wide" aria-labelledby="recent-heading">
          <header className="panel-head">
            <h2 className="panel-title" id="recent-heading">
              Recent orders
            </h2>
            <Link to="/admin/orders" className="panel-link">
              View all
              <Icon name="arrow-right" size={14} />
            </Link>
          </header>

          {recent.length === 0 ? (
            <div className="chart-empty" style={{ height: 140 }}>
              <p>No orders yet. They'll appear here as customers check out.</p>
            </div>
          ) : (
            <ul className="mini-list">
              {recent.map((order) => (
                <li key={order.order_id} className="mini-row">
                  <div className="mini-body">
                    <p className="mini-title text-mono">
                      {order.order_number ?? order.order_id.slice(0, 8)}
                    </p>
                    <p className="mini-meta">
                      {order.shipping_address?.full_name ?? order.customer_name ?? 'Guest'} ·{' '}
                      {formatDate(order.placed_at ?? order.created_at)}
                    </p>
                  </div>
                  <span className="mini-amount">
                    {formatCurrency(order.total_amount, order.currency ?? DEFAULT_CURRENCY)}
                  </span>
                  <StatusBadge status={order.status} fallback="PENDING" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
