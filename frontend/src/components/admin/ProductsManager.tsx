import { useState } from 'react';
import { useAdminData } from '../../context/admin-data-context';
import { errorMessage } from '../../lib/apiClient';
import { dealerLabel } from '../../lib/dealer';
import { formatCurrency, pluralize, toNumber } from '../../lib/format';
import { stockOf } from '../../lib/product';
import { createProduct, deleteProduct, updateProduct } from '../../services/productService';
import { Badge, StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { useToast } from '../ui/toast-context';
import { ProductImage } from '../storefront/ProductImage';
import { ProductFormModal } from './ProductFormModal';
import type { Product, ProductInput } from '../../types';

export function ProductsManager() {
  const { products, dealers, loading, error, refresh } = useAdminData();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product[]>([]);
  const [deleting, setDeleting] = useState(false);

  const dealerName = (id?: string) => {
    if (!id) return 'Unassigned';
    const dealer = dealers.find((candidate) => candidate.seller_id === id);
    return dealer ? dealerLabel(dealer) : 'Unknown';
  };

  const handleSave = async (input: ProductInput) => {
    try {
      if (editing) {
        await updateProduct({ ...input, product_id: editing.product_id });
        toast.success('Product updated', input.title);
      } else {
        await createProduct(input);
        toast.success('Product added', input.title);
      }
      setModalOpen(false);
      setEditing(null);
      await refresh();
    } catch (caught) {
      toast.error('Could not save product', errorMessage(caught));
      throw caught;
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all(pendingDelete.map((product) => deleteProduct(product.product_id)));
      toast.success(`${pendingDelete.length} ${pluralize(pendingDelete.length, 'product')} deleted`);
      setPendingDelete([]);
      await refresh();
    } catch (caught) {
      toast.error('Could not delete', errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Product',
      primary: true,
      sortValue: (product) => product.title ?? '',
      render: (product) => (
        <div className="cell-identity">
          <span className="cell-thumb">
            <ProductImage src={product.imageUrl} alt="" />
          </span>
          <div>
            <p className="cell-title">{product.title}</p>
            <p className="cell-sub">
              {product.sku ? <span className="text-mono">{product.sku}</span> : '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortValue: (product) => product.category ?? '',
      render: (product) => product.category || '—',
    },
    {
      key: 'dealer',
      header: 'Sourced from',
      sortValue: (product) => dealerName(product.seller_id),
      render: (product) => <span className="cell-sub">{dealerName(product.seller_id)}</span>,
    },
    {
      key: 'margin',
      header: 'Cost / Retail',
      align: 'right',
      sortValue: (product) => toNumber(product.sell_price),
      render: (product) => {
        const cost = toNumber(product.buy_price);
        const retail = toNumber(product.sell_price);
        const margin = retail > 0 ? ((retail - cost) / retail) * 100 : 0;
        return (
          <div className="cell-money">
            <p className="cell-title">{formatCurrency(retail)}</p>
            <p className="cell-sub">
              {formatCurrency(cost)} cost · {margin.toFixed(0)}% margin
            </p>
          </div>
        );
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      sortValue: (product) => stockOf(product) ?? -1,
      render: (product) => {
        const stock = stockOf(product);
        if (stock === undefined) return <span className="cell-sub">—</span>;
        if (stock === 0) return <Badge tone="danger">Out</Badge>;
        if (stock <= 5) return <Badge tone="warning">{stock} left</Badge>;
        return stock;
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (product) => product.status ?? 'PUBLISHED',
      render: (product) => <StatusBadge status={product.status} fallback="PUBLISHED" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (product) => (
        <div className="cell-actions">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            iconLeft="edit"
            aria-label={`Edit ${product.title}`}
            onClick={() => {
              setEditing(product);
              setModalOpen(true);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            iconLeft="trash"
            className="btn-danger-text"
            aria-label={`Delete ${product.title}`}
            onClick={() => setPendingDelete([product])}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">What you sell, what it costs you, and which dealer supplies it.</p>
        </div>
        <Button
          iconLeft="plus"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Add product
        </Button>
      </header>

      <div className="panel panel-flush">
        <DataTable
          rows={products}
          columns={columns}
          rowKey={(product) => product.product_id}
          loading={loading}
          error={error}
          onRetry={() => void refresh()}
          searchText={(product) =>
            [product.title, product.sku, product.category, dealerName(product.seller_id)]
              .filter(Boolean)
              .join(' ')
          }
          searchPlaceholder="Search by title, SKU, category, dealer…"
          emptyTitle="No products yet"
          emptyDescription="Add your first listing to open the shop."
          emptyAction={
            <Button
              iconLeft="plus"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              Add product
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
          initialSort={{ key: 'product', direction: 'asc' }}
        />
      </div>

      {modalOpen && (
        <ProductFormModal
          key={editing?.product_id ?? 'new'}
          initial={editing}
          dealers={dealers}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={pendingDelete.length > 0}
        title={
          pendingDelete.length > 1 ? `Delete ${pendingDelete.length} products?` : 'Delete product?'
        }
        message={
          pendingDelete.length > 1
            ? `${pendingDelete.length} listings will be permanently removed from the catalogue.`
            : `${pendingDelete[0]?.title ?? 'This product'} will be permanently removed. This cannot be undone.`
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete([])}
      />
    </div>
  );
}
