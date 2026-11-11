import type { Product, ProductServer, ProductVariant, RequiredField } from '@/api/types';

const VENDOR_LABELS: Record<string, string> = {
  sekalipay: 'Server 1',
  okeconnect: 'Server 2',
};

export function vendorLabel(vendor?: string | null) {
  if (!vendor) return 'Katalog';
  return VENDOR_LABELS[vendor] || vendor;
}

function serverFromRow(row: Product): ProductServer {
  return {
    vendor: row.vendor || '',
    server_name: vendorLabel(row.vendor),
    product_id: row.id,
    variants: row.variants || [],
  };
}

/**
 * The catalog endpoint returns one row per vendor. Group rows that share a
 * canonical key (or the same name + category when the key is missing) so the
 * app behaves like the web catalog.
 */
export function mergeProductRows(rows: Product[]): Product[] {
  const grouped = new Map<string, Product>();

  for (const row of rows) {
    const key = (
      row.canonical_key ||
      `${row.category}::${row.name}`.trim()
    ).toLowerCase();

    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        ...row,
        servers: row.servers?.length ? row.servers : [serverFromRow(row)],
      });
      continue;
    }

    const servers = [...(existing.servers || [])];
    if (!servers.some((server) => server.product_id === row.id)) {
      servers.push(serverFromRow(row));
    }

    grouped.set(key, {
      ...existing,
      servers,
      variants:
        existing.variants?.length || !row.variants?.length
          ? existing.variants
          : row.variants,
    });
  }

  return Array.from(grouped.values());
}

export function getProductServers(product: Product): ProductServer[] {
  if (product.servers?.length) return product.servers;
  return [serverFromRow(product)];
}

export function isPostpaidProduct(product?: Product | null) {
  if (!product) return false;
  return product.is_postpaid === true || product.product_type === 'postpaid';
}

/**
 * Produk tagihan tidak digabung lintas vendor: satu produk = satu kelompok
 * biller, dan tiap biller (mis. "PBB Kota Denpasar") adalah satu varian.
 */
export function getBillVariants(product: Product): ProductVariant[] {
  return (product.variants || []).filter((variant) => variant.stock !== 0);
}

export function billVariantFee(variant?: ProductVariant | null) {
  if (!variant) return 0;
  return Number(variant.admin_fee ?? variant.price ?? 0) || 0;
}

export function getServerVariants(server: ProductServer): ProductVariant[] {
  return (server.variants || []).filter((variant) => variant.stock !== 0);
}

export function findVariant(
  product: Product | undefined,
  variantId?: string | null,
  vendor?: string | null,
): { server: ProductServer; variant: ProductVariant } | null {
  if (!product || !variantId) return null;
  const servers = getProductServers(product);
  const ordered = vendor
    ? [
        ...servers.filter((server) => server.vendor === vendor),
        ...servers.filter((server) => server.vendor !== vendor),
      ]
    : servers;

  for (const server of ordered) {
    const variant = (server.variants || []).find(
      (item) => String(item.id) === String(variantId),
    );
    if (variant) return { server, variant };
  }
  return null;
}

export function getVariantFields(variant: ProductVariant): RequiredField[] {
  if (variant.required_fields?.length) return variant.required_fields;
  return [
    {
      key: 'customer_id',
      label: 'User ID / Nomor Tujuan',
      type: 'text',
      required: true,
    },
  ];
}

export function isOpenDenom(variant?: ProductVariant | null) {
  return !!variant?.provider_meta?.open_denom;
}

export function variantPrice(variant?: ProductVariant | null) {
  if (!variant) return 0;
  return Number(variant.sell_price ?? variant.price) || 0;
}

export function openDenomMin(variant?: ProductVariant | null) {
  return Number(variant?.provider_meta?.min_qty) || 0;
}

export function openDenomMax(variant?: ProductVariant | null) {
  return Number(variant?.provider_meta?.max_qty) || 0;
}

export function startingPrice(product: Product) {
  const prices = getProductServers(product)
    .flatMap((server) => server.variants || [])
    .filter((variant) => !isOpenDenom(variant))
    .map((variant) => variantPrice(variant))
    .filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : null;
}
