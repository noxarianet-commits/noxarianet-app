import type { Product, ProductServer, ProductVariant, RequiredField } from '@/api/types';

/**
 * Membersihkan nama produk, kategori, atau varian dari embel-embel nama vendor
 * seperti "(OkeConnect)", "[OkeConnect]", "(Oke Connect)", "- OkeConnect", dll.
 * Menghasilkan nama produk yang bersih dan profesional bagi pengguna.
 */
export function cleanProductName(raw?: string | null): string {
  if (!raw) return '';
  return raw
    // 1. Bersihkan bentuk dalam kurung: (OkeConnect), [OkeConnect], {OkeConnect}, (Oke Connect), (OKECONNECT)
    .replace(/\s*[\(\[\{]\s*oke\s*connect\s*[\)\]\}]/gi, '')
    // 2. Bersihkan bentuk pemisah: " - OkeConnect", " : OkeConnect", " | OkeConnect", " / OkeConnect"
    .replace(/\s*[-:|/]\s*oke\s*connect\b/gi, '')
    // 3. Bersihkan bentuk awalan: "OkeConnect - ", "OkeConnect: ", "(OkeConnect) "
    .replace(/^[\(\[\{]?\s*oke\s*connect\s*[\)\]\}]?\s*[-:|/]?\s*/gi, '')
    // 4. Bersihkan kata mandiri: "OkeConnect" atau "Oke Connect"
    .replace(/\boke\s*connect\b/gi, '')
    // 5. Bersihkan sisa kurung kosong jika ada: "()", "[]"
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    // 6. Bersihkan pemisah gantung di akhir teks: "DANA - " -> "DANA"
    .replace(/\s*[-:|/]\s*$/, '')
    // 7. Bersihkan pemisah gantung di awal teks
    .replace(/^\s*[-:|/]\s*/, '')
    // 8. Rapikan spasi ganda
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Membersihkan nama server dari embel-embel nama vendor pihak ketiga (Sekalipay, Okeconnect, dll.)
 * Menghasilkan nama formal yang bersih seperti "Server 1", "Server 2".
 */
export function cleanServerName(raw?: string | null, index?: number): string {
  const fallback = `Server ${typeof index === 'number' ? index + 1 : 1}`;
  if (!raw) return fallback;

  const lower = raw.toLowerCase().trim();

  if (lower.includes('server 1') || lower.includes('server1') || lower.includes('sekali')) {
    return 'Server 1';
  }
  if (lower.includes('server 2') || lower.includes('server2') || lower.includes('oke') || lower.includes('connect')) {
    return 'Server 2';
  }
  if (lower.includes('server 3') || lower.includes('server3')) {
    return 'Server 3';
  }
  if (lower.includes('server 4') || lower.includes('server4')) {
    return 'Server 4';
  }

  const stripped = raw
    .replace(/sekalipay/gi, '')
    .replace(/okeconnect/gi, '')
    .replace(/digiflazz/gi, '')
    .replace(/apigames/gi, '')
    .replace(/vip/gi, '')
    .replace(/[-_:]/g, ' ')
    .trim();

  if (stripped) {
    if (stripped.toLowerCase().startsWith('server')) return stripped;
    return `Server ${stripped}`;
  }

  return fallback;
}

export function vendorLabel(vendor?: string | null, index?: number) {
  return cleanServerName(vendor, index);
}

export function normalizeVariant(variant: ProductVariant): ProductVariant {
  if (!variant) return variant;
  return {
    ...variant,
    name: cleanProductName(variant.name),
    note: variant.note ? cleanProductName(variant.note) : variant.note,
  };
}

export function normalizeProduct(product: Product): Product {
  if (!product) return product;
  return {
    ...product,
    name: cleanProductName(product.name),
    category: cleanProductName(product.category),
    variants: (product.variants || []).map(normalizeVariant),
    servers: (product.servers || []).map((s, idx) => ({
      ...s,
      server_name: cleanServerName(s.server_name || s.vendor, idx),
      variants: (s.variants || []).map(normalizeVariant),
    })),
  };
}

function serverFromRow(row: Product, index = 0): ProductServer {
  return {
    vendor: row.vendor || '',
    server_name: cleanServerName(row.vendor, index),
    product_id: row.id,
    variants: (row.variants || []).map(normalizeVariant),
  };
}

/**
 * The catalog endpoint returns one row per vendor. Group rows that share a
 * canonical key (or the same name + category when the key is missing) so the
 * app behaves like the web catalog.
 */
export function mergeProductRows(rows: Product[]): Product[] {
  const grouped = new Map<string, Product>();

  for (const rawRow of rows) {
    const row = normalizeProduct(rawRow);

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
      servers.push(serverFromRow(row, servers.length));
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
  if (product.servers?.length) {
    return product.servers.map((s, idx) => ({
      ...s,
      server_name: cleanServerName(s.server_name || s.vendor, idx),
      variants: (s.variants || []).map(normalizeVariant),
    }));
  }
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
  return (product.variants || [])
    .filter((variant) => variant.stock !== 0)
    .map(normalizeVariant);
}

export function billVariantFee(variant?: ProductVariant | null) {
  if (!variant) return 0;
  return Number(variant.admin_fee ?? variant.price ?? 0) || 0;
}

export function getServerVariants(server: ProductServer): ProductVariant[] {
  return (server.variants || [])
    .filter((variant) => variant.stock !== 0)
    .map(normalizeVariant);
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
