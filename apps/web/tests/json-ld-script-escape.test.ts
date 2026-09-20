import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "../components/JsonLdScript";

describe("serializeJsonLd", () => {
  it("escapes script breakouts so payloads cannot close the JSON-LD script element", () => {
    const payload = {
      name: 'Evil Artist</script><script>alert("xss")</script>',
      description: "<!-- injected comment -->",
    };
    const serialized = serializeJsonLd(payload);

    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<script");
    expect(serialized).not.toContain("<!--");
    expect(serialized).not.toContain("<");
  });

  it("round-trips through JSON.parse with the original values intact", () => {
    const payload = {
      name: "Mara Vale",
      note: "Fine line & blackwork <3",
      nested: { html: "<b>bold</b>" },
    };
    expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
  });

  it("leaves payloads without angle brackets untouched", () => {
    const payload = { name: "InkRoute Demo Studio", rating: 5 };
    expect(serializeJsonLd(payload)).toBe(JSON.stringify(payload));
  });
});
