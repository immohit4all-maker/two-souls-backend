import { useState } from 'react';
import { useAdminData } from '../../context/admin-data-context';
import { errorMessage } from '../../lib/apiClient';
import { formatDate, initials, pluralize } from '../../lib/format';
import { createDealer, deleteDealer, updateDealer } from '../../services/dealerService';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { StatusBadge } from '../ui/Badge';
import { useToast } from '../ui/toast-context';
import { DealerFormModal } from './DealerFormModal';
import type { Dealer, DealerInput } from '../../types';

export function DealersManager() {
  const { dealers, products, loading, error, refresh } = useAdminData();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dealer | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Dealer[]>([]);
  const [deleting, setDeleting] = useState(false);

  const itemsFrom = (dealerId: string) =>
    products.filter((product) => product.seller_id === dealerId).length;

  const handleSave = async (input: DealerInput) => {
    try {
      if (editing) {
        await updateDealer({ ...input, seller_id: editing.seller_id });
        toast.success('Dealer updated', input.store_name);
      } else {
        await createDealer(input);
        toast.success('Dealer added', input.store_name);
      }
      setModalOpen(false);
      setEditing(null);
      await refresh();
    } catch (caught) {
      toast.error('Could not save dealer', errorMessage(caught));
      // Rethrow so the dialog stays open with the entered values intact.
      throw caught;
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all(pendingDelete.map((dealer) => deleteDealer(dealer.seller_id)));
      toast.success(`${pendingDelete.length} ${pluralize(pendingDelete.length, 'dealer')} deleted`);
      setPendingDelete([]);
      await refresh();
    } catch (caught) {
      toast.error('Could not delete', errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Dealer>[] = [
    {
      key: 'dealer',
      header: 'Dealer',
      primary: true,
      sortValue: (dealer) => dealer.store_name ?? '',
      render: (dealer) => (
        <div className="cell-identity">
          <span className="cell-avatar" aria-hidden="true">
            {initials(dealer.store_name)}
          </span>
          <div>
            <p className="cell-title">{dealer.store_name}</p>
            <p className="cell-sub">{dealer.business_name || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      sortValue: (dealer) => dealer.name ?? '',
      render: (dealer) => (
        <div>
          <p>{dealer.name || '—'}</p>
          <p className="cell-sub">{dealer.email || dealer.phone_number || 'No contact details'}</p>
        </div>
      ),
    },
    {
      key: 'supplies',
      header: 'Supplies',
      align: 'right',
      sortValue: (dealer) => itemsFrom(dealer.seller_id),
      render: (dealer) => {
        const count = itemsFrom(dealer.seller_id);
        return count === 0 ? (
          <span className="cell-sub">—</span>
        ) : (
          `${count} ${pluralize(count, 'item')}`
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (dealer) => dealer.status ?? 'ACTIVE',
      render: (dealer) => <StatusBadge status={dealer.status} fallback="ACTIVE" />,
    },
    {
      key: 'added',
      header: 'Added',
      sortValue: (dealer) => dealer.created_at ?? '',
      render: (dealer) => <span className="cell-sub">{formatDate(dealer.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (dealer) => (
        <div className="cell-actions">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            iconLeft="edit"
            aria-label={`Edit ${dealer.store_name}`}
            onClick={() => {
              setEditing(dealer);
              setModalOpen(true);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            iconLeft="trash"
            className="btn-danger-text"
            aria-label={`Delete ${dealer.store_name}`}
            onClick={() => setPendingDelete([dealer])}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Dealers</h1>
          <p className="page-sub">Suppliers you source stock from. Never shown to customers.</p>
        </div>
        <Button
          iconLeft="plus"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Add dealer
        </Button>
      </header>

      <div className="panel panel-flush">
        <DataTable
          rows={dealers}
          columns={columns}
          rowKey={(dealer) => dealer.seller_id}
          loading={loading}
          error={error}
          onRetry={() => void refresh()}
          searchText={(dealer) =>
            [dealer.store_name, dealer.business_name, dealer.name, dealer.email]
              .filter(Boolean)
              .join(' ')
          }
          searchPlaceholder="Search dealers…"
          emptyTitle="No dealers yet"
          emptyDescription="Add the suppliers you buy stock from so you can attribute products and orders to them."
          emptyAction={
            <Button
              iconLeft="plus"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              Add dealer
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
          initialSort={{ key: 'dealer', direction: 'asc' }}
        />
      </div>

      {modalOpen && (
        <DealerFormModal
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
        title={pendingDelete.length > 1 ? `Delete ${pendingDelete.length} dealers?` : 'Delete dealer?'}
        message={
          pendingDelete.length > 1
            ? `${pendingDelete.length} dealers will be permanently removed. Products sourced from them stay in your catalogue but lose their dealer.`
            : `${pendingDelete[0]?.store_name ?? 'This dealer'} will be permanently removed. Products sourced from them stay in your catalogue but lose their dealer.`
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete([])}
      />
    </div>
  );
}
