import { useState } from 'react';
import { cx } from '../../lib/format';
import { Icon } from '../ui/Icon';

export interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  /** Eager-load the handful of images above the fold; lazy-load the rest. */
  eager?: boolean;
}

/**
 * Product photo with a graceful fallback.
 *
 * The old storefront only substituted a placeholder when `imageUrl` was missing — a URL that
 * was present but broken rendered as the browser's torn-image icon. This also covers the load
 * failing, which matters here because image URLs point at a public S3 bucket.
 */
export function ProductImage({ src, alt, className, eager = false }: ProductImageProps) {
  // Remember *which* URL failed rather than a boolean. A new `src` is then automatically
  // considered un-failed, with no effect needed to reset the flag.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = src !== undefined && failedSrc === src;

  if (!src || failed) {
    return (
      <div className={cx('product-image', 'product-image-fallback', className)} role="img" aria-label={alt}>
        <Icon name="image" size={26} />
      </div>
    );
  }

  return (
    <img
      className={cx('product-image', className)}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}
