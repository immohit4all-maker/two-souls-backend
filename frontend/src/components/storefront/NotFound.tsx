import { Link } from 'react-router-dom';
import { EmptyState } from '../ui/EmptyState';

export function NotFound() {
  return (
    <EmptyState
      icon="search"
      title="We couldn't find that page"
      description="The link may be out of date, or the item may have been taken down."
      action={
        <Link to="/" className="btn btn-primary btn-md">
          Back to the shop
        </Link>
      }
    />
  );
}
