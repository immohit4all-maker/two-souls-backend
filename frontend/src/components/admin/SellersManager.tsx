import { useState } from 'react';
import { useAdminData } from '../../context/admin-data-context';
import { errorMessage } from '../../lib/apiClient';
import { formatDate, initials, pluralize, toNumber } from '../../lib/format';
import { createSeller, deleteSeller, updateSeller } from '../../services/sellerService';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { StatusBadge } from '../ui/Badge';
import { useToast } from '../ui/toast-context';
import { SellerFormModal } from './SellerFormModal';
import type { Seller, SellerInput } from '../../types';

export function SellersManager() {
  const { sellers, loading, error, refresh } = useAdminData();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Seller | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Seller[]>([]);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (input: SellerInput) => {
    try {
      if (editing) {
        await updateSeller({ ...input, seller_id: editing.seller_id });
        toast.success('Seller updated', input.store_name);
      } else {
        await createSeller(input);
        toast.success('Seller added', input.store_name);
      }
      setModalOpen(false);
      setEditing(null);
      await refresh();
    } catch (caught) {
      toast.error('Could not save seller', errorMessage(caught));
      // Rethrow so the dialog stays open with the entered values intact.
      throw caught;
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all(pendingDelete.map((seller) => deleteSeller(seller.seller_id)));
      toast.success(
        `${pendingDelete.length} ${pluralize(pendingDelete.length, 'seller')} deleted`,
      );
      setPendingDelete([]);
      await refresh();
    } catch (caught) {
      toast.error('Could not delete', errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Seller>[] = [
    {
      key: 'store',
      header: 'Store',
      primary: true,
      sortValue: (seller) => seller.store_name ?? '',
      render: (seller) => (
        <div className="cell-identity">
          <span className="cell-avatar" aria-hidden="true">
            {initials(seller.store_name)}
          </span>
          <div>
            <p className="cell-title">{seller.store_name}</p>
            <p className="cell-sub">{seller.business_name || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      sortValue: (seller) => seller.name ?? '',
      render: (seller) => (
        <div>
          <p>{seller.name || '—'}</p>
          {seller.email && <p className="cell-sub">{seller.email}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (seller) => seller.status ?? 'ACTIVE',
      render: (seller) => <StatusBadge status={seller.status} fallback="ACTIVE" />,
    },
    {
      key: 'commission',
      header: 'Commission',
      align: 'right',
      sortValue: (seller) => toNumber(seller.commission_rate, 10),
      render: (seller) => `${toNumber(seller.commission_rate, 10)}%`,
    },
    {
      key: 'joined',
      header: 'Joined',
      sortValue: (seller) => seller.created_at ?? '',
      render: (seller) => <span className="cell-sub">{formatDate(seller.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (seller) => (
        <div className="cell-actions">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            iconLeft="edit"
            aria-label={`Edit ${seller.store_name}`}
            onClick={() => {
              setEditing(seller);
              setModalOpen(true);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            iconLeft="trash"
            className="btn-danger-text"
            aria-label={`Delete ${seller.store_name}`}
            onClick={() => setPendingDelete([seller])}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Sellers</h1>
          <p className="page-sub">Merchant partners and their store details.</p>
        </div>
        <Button
          iconLeft="plus"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Add seller
        </Button>
      </header>

      <div className="panel panel-flush">
        <DataTable
          rows={sellers}
          columns={columns}
          rowKey={(seller) => seller.seller_id}
          loading={loading}
          error={error}
          onRetry={() => void refresh()}
          searchText={(seller) =>
            [seller.store_name, seller.business_name, seller.name, seller.email]
              .filter(Boolean)
              .join(' ')
          }
          searchPlaceholder="Search sellers…"
          emptyTitle="No sellers yet"
          emptyDescription="Add your first merchant partner to start building the marketplace."
          emptyAction={
            <Button
              iconLeft="plus"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              Add seller
            </Button>
          }
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
          initialSort={{ key: 'store', direction: 'asc' }}
        />
      </div>

      {modalOpen && (
        <SellerFormModal
          key={editing?.seller_id ?? 'new'}
          initial={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={pendingDelete.length > 0}
        title={pendingDelete.length > 1 ? `Delete ${pendingDelete.length} sellers?` : 'Delete seller?'}
        message={
          pendingDelete.length > 1
            ? `${pendingDelete.length} sellers will be permanently removed. Their products will stay in the catalogue but become unattributed.`
            : `${pendingDelete[0]?.store_name ?? 'This seller'} will be permanently removed. This cannot be undone.`
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete([])}
      />
    </div>
  );
}
