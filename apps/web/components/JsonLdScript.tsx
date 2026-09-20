interface JsonLdScriptProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Serializes JSON-LD payload data for embedding in a <script> block.
 *
 * Escapes `<` as \u003c so a `</script>` (or `<!--`) sequence inside
 * tenant/user-supplied data cannot break out of the script element and
 * execute arbitrary markup (stored/reflected XSS). The escape is
 * transparent to JSON parsers: JSON.parse reverses \u003c back to `<`.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLdScript({ data }: JsonLdScriptProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
