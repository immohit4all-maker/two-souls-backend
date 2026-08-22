import { useState } from 'react';
import { useAdminData } from '../../context/admin-data-context';
import { errorMessage } from '../../lib/apiClient';
import { formatCurrency, formatDate, pluralize, titleCase } from '../../lib/format';
import { deleteOrder, updateOrder } from '../../services/orderService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { useToast } from '../ui/toast-context';
import { toneForStatus } from '../ui/statusTone';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { ORDER_STATUSES } from '../../types';
import type { Order, OrderStatus } from '../../types';

export function OrdersManager() {
  const { orders, loading, error, refresh } = useAdminData();
  const toast = useToast();

  const [viewing, setViewing] = useState<Order | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Order[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const label = (order: Order) => order.order_number ?? order.order_id.slice(0, 8);

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setUpdatingId(order.order_id);
    try {
      // PUT replaces the whole item on this backend, so the full record has to go back.
      await updateOrder({ ...order, status });
      toast.success(`Order ${label(order)} is now ${titleCase(status)}`);
      await refresh();
    } catch (caught) {
      toast.error('Could not update the order', errorMessage(caught));
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all(pendingDelete.map((order) => deleteOrder(order.order_id)));
      toast.success(`${pendingDelete.length} ${pluralize(pendingDelete.length, 'order')} deleted`);
      setPendingDelete([]);
      await refresh();
    } catch (caught) {
      toast.error('Could not delete', errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'reference',
      header: 'Order',
      primary: true,
      sortValue: (order) => order.order_number ?? order.order_id,
      render: (order) => (
        <button type="button" className="cell-link text-mono" onClick={() => setViewing(order)}>
          {label(order)}
        </button>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortValue: (order) => order.shipping_address?.full_name ?? order.customer_name ?? '',
      render: (order) => (
        <div>
          <p>{order.shipping_address?.full_name ?? order.customer_name ?? 'Guest'}</p>
          {(order.customer_email ?? order.shipping_address?.email) && (
            <p className="cell-sub">{order.customer_email ?? order.shipping_address?.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'placed',
      header: 'Placed',
      sortValue: (order) => order.placed_at ?? order.created_at ?? '',
      render: (order) => (
        <span className="cell-sub">{formatDate(order.placed_at ?? order.created_at)}</span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      align: 'right',
      sortValue: (order) => order.items?.length ?? 0,
      render: (order) => order.items?.length ?? 0,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      sortValue: (order) => Number(order.total_amount ?? 0),
      render: (order) => (
        <strong>{formatCurrency(order.total_amount, order.currency ?? 'USD')}</strong>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      sortValue: (order) => order.payment_status ?? 'PENDING',
      render: (order) => (
        <Badge tone={toneForStatus(order.payment_status)} dot>
          {titleCase(order.payment_status ?? 'PENDING')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Fulfilment',
      sortValue: (order) => order.status ?? 'PENDING',
      render: (order) => (
        <select
          className="input select status-select"
          value={order.status ?? 'PENDING'}
          disabled={updatingId === order.order_id}
          onChange={(event) => void changeStatus(order, event.target.value as OrderStatus)}
          aria-label={`Fulfilment status for order ${label(order)}`}
        >
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {titleCase(status)}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (order) => (
        <div className="cell-actions">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            iconLeft="eye"
            aria-label={`View order ${label(order)}`}
            onClick={() => setViewing(order)}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            iconLeft="trash"
            className="btn-danger-text"
            aria-label={`Delete order ${label(order)}`}
            onClick={() => setPendingDelete([order])}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">Track payments and move orders through fulfilment.</p>
        </div>
        <Button variant="secondary" iconLeft="refresh" onClick={() => void refresh()}>
          Refresh
        </Button>
      </header>

      <div className="panel panel-flush">
        <DataTable
          rows={orders}
          columns={columns}
          rowKey={(order) => order.order_id}
          loading={loading}
          error={error}
          onRetry={() => void refresh()}
          searchText={(order) =>
            [
              order.order_number,
              order.order_id,
              order.shipping_address?.full_name,
              order.customer_name,
              order.customer_email,
              order.status,
            ]
              .filter(Boolean)
              .join(' ')
          }
          searchPlaceholder="Search by reference, customer…"
          emptyTitle="No orders yet"
          emptyDescription="Orders placed through the storefront will appear here."
          selectable
          renderBulkActions={(selected) => (
            <Button
              variant="danger"
              size="sm"
              iconLeft="trash"
              onClick={() => setPendingDelete(selected)}
            >
              Delete {selected.length}
            </Button>
          )}
          initialSort={{ key: 'placed', direction: 'desc' }}
        />
      </div>

      <OrderDetailDrawer order={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={pendingDelete.length > 0}
        title={pendingDelete.length > 1 ? `Delete ${pendingDelete.length} orders?` : 'Delete order?'}
        message={
          pendingDelete.length > 1
            ? `${pendingDelete.length} order records will be permanently removed.`
            : `Order ${pendingDelete[0] ? label(pendingDelete[0]) : ''} will be permanently removed. This cannot be undone.`
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete([])}
      />
    </div>
  );
}
