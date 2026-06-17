/**
 * Slug utility — URL-safe string for SEO and public URLs.
 *
 * Use for: Ad, MainCategory, SubCategory, Shop, Country, District, City.
 * Do not use for: AuditLog, Notification, AdMedia, Favorite, etc.
 *
 * **Industrial Standards:**
 * - Handles empty strings and edge cases
 * - Prevents timestamp collisions with random component
 * - Protects against counter overflow
 * - Race condition safe (use with DB unique constraint)
 *
 * @see docs/COMMON_FUNCTIONS_AND_HELPERS_GUIDE.md
 * @see docs/MODULE_IMPLEMENTATION_DEVELOPER_GUIDE.md (Slug Column section)
 */

/**
 * Maximum slug length — matches all tables: Ad, MainCategory, SubCategory, Shop, Country, District, City (VarChar(220)).
 * Standardized length across all tables for consistency.
 */
export const SLUG_MAX_LENGTH = 220;

/** Maximum counter attempts for ensureUniqueSlug (prevents infinite loops). */
const MAX_SLUG_COUNTER = 10000;

/**
 * Generates a URL-safe slug from a string.
 *
 * **Transformation:**
 * - Lowercase, trim whitespace
 * - "&" → "and"
 * - Non-alphanumeric → single hyphen
 * - Leading/trailing hyphens removed
 * - Optionally append unique suffix (timestamp + random)
 *
 * **Edge Cases:**
 * - Empty string → returns "item"
 * - Only special chars → returns "item"
 * - Very long strings → truncated to maxLength
 *
 * @param value - Source string (e.g. title, name)
 * @param options - Optional: addUniqueSuffix (default false), maxLength (default 220 to match VarChar(220) columns)
 * @returns Slug string (never empty); length ≤ maxLength
 *
 * @example
 * slugify('My Ad Title')           // 'my-ad-title'
 * slugify('Electronics & Gadgets')  // 'electronics-and-gadgets'
 * slugify('Hello World', { addUniqueSuffix: true })  // 'hello-world-k3j2x-a7b'
 * slugify('')                      // 'item'
 * slugify('!!!')                   // 'item'
 */
export function slugify(
  value: string,
  options: { addUniqueSuffix?: boolean; maxLength?: number } = {},
): string {
  const { addUniqueSuffix = false, maxLength = SLUG_MAX_LENGTH } = options;

  // Handle empty or invalid input
  if (!value || typeof value !== 'string') {
    return addUniqueSuffix ? `item-${generateUniqueSuffix()}` : 'item';
  }

  // Normalize: lowercase, trim, replace &, replace non-alphanumeric with hyphens
  let base = value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  // Handle case where normalization results in empty string
  if (!base || base.length === 0) {
    base = 'item';
  }

  // Truncate base if needed (leave room for suffix if required)
  const suffixLength = addUniqueSuffix ? 12 : 0; // timestamp(36) + '-' + random(3) = ~12 chars
  const maxBaseLength = Math.max(1, maxLength - suffixLength);
  base = base.substring(0, maxBaseLength);

  if (addUniqueSuffix) {
    const suffix = generateUniqueSuffix();
    const fullSlug = `${base}-${suffix}`;
    return fullSlug.substring(0, maxLength);
  }

  return base;
}

/**
 * Generates a unique suffix combining timestamp and random component.
 * Reduces collision probability in high-concurrency scenarios.
 *
 * Format: `{timestamp36}-{random3chars}`
 * Example: `k3j2x-a7b`
 *
 * @internal
 */
function generateUniqueSuffix(): string {
  const timestamp = Date.now().toString(36);
  // Random 3-character suffix (base36: 0-9, a-z)
  const random = Math.floor(Math.random() * 46656) // 36^3
    .toString(36)
    .padStart(3, '0');
  return `${timestamp}-${random}`;
}

/**
 * Ensures unique slug by appending numeric suffix if needed.
 * Use when DB enforces unique slug and you don't want timestamp in slug.
 *
 * **Race Condition Protection:**
 * - This function checks existence, but between check and create, another request could create the same slug.
 * - **Solution:** Always use with DB unique constraint (`@unique` in Prisma schema).
 * - If unique constraint violation occurs (P2002), catch and retry with new slug.
 *
 * **Counter Overflow Protection:**
 * - Maximum 10,000 attempts to prevent infinite loops.
 * - Throws error if counter exceeds limit (indicates system issue).
 *
 * @param baseSlug - Slug from slugify(value) - must not be empty
 * @param exists - Async function that returns true if slug is taken
 * @returns Unique slug
 * @throws {Error} If counter exceeds MAX_SLUG_COUNTER (10,000)
 *
 * @example
 * ```typescript
 * const baseSlug = slugify('My Title');
 * const uniqueSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
 *   return !!(await prisma.ad.findUnique({ where: { slug } }));
 * });
 * ```
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  // Validate base slug
  if (!baseSlug || baseSlug.trim().length === 0) {
    throw new Error('Base slug cannot be empty');
  }

  const trimmedBaseSlug = baseSlug.trim();
  let slug = trimmedBaseSlug;
  let counter = 1;

  // Check base slug first
  if (!(await exists(slug))) {
    return slug;
  }

  // Try with counter suffix
  while (counter <= MAX_SLUG_COUNTER) {
    slug = `${trimmedBaseSlug}-${counter}`;
    if (!(await exists(slug))) {
      return slug;
    }
    counter++;
  }

  // Counter overflow protection
  throw new Error(
    `Failed to generate unique slug after ${MAX_SLUG_COUNTER} attempts. Base slug: "${baseSlug}". This may indicate a system issue.`,
  );
}

/**
 * Creates a slug with automatic retry on unique constraint violation.
 * Handles race conditions by catching Prisma P2002 errors and retrying.
 *
 * **Use Case:** When multiple users create records with same title/name simultaneously.
 *
 * @param generateSlug - Function that generates slug (e.g., `() => slugify(title, { addUniqueSuffix: true })`)
 * @param createRecord - Async function that creates record with slug, throws on unique constraint violation
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Created record
 * @throws {Error} If max retries exceeded or non-unique constraint error occurs
 *
 * @example
 * ```typescript
 * const ad = await createWithUniqueSlug(
 *   () => slugify(dto.title, { addUniqueSuffix: true }),
 *   async (slug) => {
 *     return await prisma.ad.create({
 *       data: { ...dto, slug },
 *     });
 *   },
 * );
 * ```
 */
export async function createWithUniqueSlug<T>(
  generateSlug: () => string,
  createRecord: (slug: string) => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let attempts = 0;
  let lastError: unknown;

  while (attempts < maxRetries) {
    const slug = generateSlug();
    try {
      return await createRecord(slug);
    } catch (error: any) {
      // Prisma unique constraint violation (P2002)
      if (error?.code === 'P2002' && error?.meta?.target?.includes('slug')) {
        attempts++;
        lastError = error;
        // Generate new slug for retry
        continue;
      }
      // Non-unique constraint error - rethrow immediately
      throw error;
    }
  }

  throw new Error(
    `Failed to create record with unique slug after ${maxRetries} attempts. Last error: ${lastError}`,
  );
}
