import { describe, expect, it } from "vitest";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  NavBar,
  NavItem,
  SectionHeader,
  Surface,
  inkrouteTheme,
} from "../src/index";

describe("ui design-system contract", () => {
  it("exports accessible layout, field, nav, dialog, and token primitives", () => {
    expect(typeof Surface).toBe("function");
    expect(typeof SectionHeader).toBe("function");
    expect(typeof Field).toBe("function");
    expect(typeof FieldLabel).toBe("function");
    expect(typeof FieldHint).toBe("function");
    expect(typeof FieldError).toBe("function");
    expect(typeof NavBar).toBe("function");
    expect(typeof NavItem).toBe("function");
    expect(typeof Dialog).toBe("function");
    expect(typeof DialogPanel).toBe("function");
    expect(typeof DialogTitle).toBe("function");
    expect(inkrouteTheme.focusRing).toContain("focus-visible");
  });
});
