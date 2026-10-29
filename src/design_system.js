/**
 * First-Party Proprietary UI Design System, W3C Design Tokens (DTCG 2025.10) Compiler,
 * Perceptual OKLCH & APCA Contrast Engine, Utopia Fluid Typography & Web Components Catalog.
 */

export const PROPRIETARY_DESIGN_SYSTEM_CATALOG = Object.freeze({
  track: "design-systems-web-components",
  categories: ["proprietary-design-systems", "ui-ux-interaction", "web-components"],
  designDirections: [
    {
      id: "guantlet-web-monochrome-editorial",
      name: "guantlet-web Monochrome Editorial & High-Craft Precision",
      principles: [
        "Perceptual OKLCH warm obsidian & alabaster surfaces (oklch(0.11 0.005 90) to oklch(0.97 0.004 90))",
        "1px inner specular highlight borders (inset 0 1px 0 0 oklch(1 0 0 / 0.09))",
        "Utopia slope-intercept fluid typography clamp() paired with strict 4px/8px spatial rhythm",
        "Command-first keyboard ergonomics (⌘K palette, sequential chords, roving tabindex)",
      ],
    },
    {
      id: "w3c-dtcg-2025-10",
      name: "W3C Design Tokens Community Group (DTCG 2025.10)",
      principles: [
        "Group-level $type inheritance (color, dimension, cubicBezier, duration, typography)",
        "Cycle-safe curly-brace token alias resolution ({color.primitive.obsidian.950})",
        "Multi-brand & multi-theme ($extends / dark / high-contrast) CSS Custom Property compilation",
      ],
    },
    {
      id: "whatwg-web-components",
      name: "Advanced HTML/CSS & Encapsulated Web Components",
      principles: [
        "Form-Associated Custom Elements (static formAssociated = true) with ElementInternals",
        "CustomStateSet (:state(checked), :state(selected), :state(apca-aaa)) pseudo-classes",
        "Constructable Stylesheets (new CSSStyleSheet() + shadowRoot.adoptedStyleSheets)",
        "Declarative Shadow DOM (<template shadowrootmode=\"open\">), named <slot> projection & ::part()",
      ],
    },
  ],
  customElementsRegistry: [
    { tag: "guantlet-web-task-item", features: ["Shadow DOM", "adoptedStyleSheets", "CustomEvent dispatch"] },
    { tag: "guantlet-web-diff-viewer", features: ["Shadow DOM", "Live line-by-line code diff"] },
    { tag: "guantlet-web-badge", features: ["formAssociated", "ElementInternals", "::part(badge)"] },
    { tag: "guantlet-web-capabilities", features: ["Declarative Shadow DOM hydration", "Platform feature probe"] },
    { tag: "guantlet-web-design-swatch", features: ["formAssociated", "ElementInternals", "CustomStateSet :state()", "::part(swatch)"] },
  ],
});

export const DEFAULT_GUANTLET_WEB_DTCG_TOKENS = Object.freeze({
  color: {
    $type: "color",
    primitive: {
      obsidian950: { $value: "oklch(0.11 0.005 90)" },
      obsidian900: { $value: "oklch(0.15 0.005 90)" },
      slate400: { $value: "oklch(0.68 0.006 90)" },
      alabaster50: { $value: "oklch(0.97 0.004 90)" },
      emerald500: { $value: "oklch(0.72 0.17 155)" },
    },
    semantic: {
      bgSurface: { $value: "{color.primitive.obsidian950}" },
      bgElevated: { $value: "{color.primitive.obsidian900}" },
      inkPrimary: { $value: "{color.primitive.alabaster50}" },
      inkMuted: { $value: "{color.primitive.slate400}" },
      accentPass: { $value: "{color.primitive.emerald500}" },
    },
  },
  spacing: {
    $type: "dimension",
    xs: { $value: "4px" },
    sm: { $value: "8px" },
    md: { $value: "16px" },
    lg: { $value: "24px" },
    xl: { $value: "32px" },
  },
});

/**
 * Compiles a W3C DTCG 2025.10 token tree with group $type inheritance and cycle-safe alias resolution.
 */
export function compileDtcgDesignTokens(tokenTree = DEFAULT_GUANTLET_WEB_DTCG_TOKENS, selector = ":root") {
  const flat = new Map();

  function walk(node, pathPrefix = "", inheritedType = "unknown") {
    const groupType = typeof node?.$type === "string" ? node.$type : inheritedType;
    for (const [key, child] of Object.entries(node || {})) {
      if (key.startsWith("$")) continue;
      const path = pathPrefix ? `${pathPrefix}.${key}` : key;
      if (child && typeof child === "object" && "$value" in child) {
        flat.set(path, {
          type: typeof child.$type === "string" ? child.$type : groupType,
          value: child.$value,
        });
      } else if (child && typeof child === "object") {
        walk(child, path, groupType);
      }
    }
  }

  walk(tokenTree);

  function resolvePath(path, visited = new Set()) {
    if (visited.has(path)) {
      throw new Error(`CircularTokenAliasError: ${Array.from(visited).join(" -> ")} -> ${path}`);
    }
    const entry = flat.get(path);
    if (!entry) {
      throw new Error(`UnresolvedTokenAliasError: Unknown token '${path}'`);
    }
    if (typeof entry.value === "string") {
      const m = /^\{([a-zA-Z0-9_.-]+)\}$/.exec(entry.value.trim());
      if (m) {
        const nextVisited = new Set(visited);
        nextVisited.add(path);
        const target = resolvePath(m[1], nextVisited);
        return {
          type: entry.type !== "unknown" ? entry.type : target.type,
          resolvedValue: target.resolvedValue,
          aliasedFrom: m[1],
        };
      }
    }
    return { type: entry.type, resolvedValue: entry.value, aliasedFrom: null };
  }

  const tokens = Array.from(flat.keys())
    .sort()
    .map((path) => {
      const raw = flat.get(path);
      const res = resolvePath(path);
      return {
        path,
        cssVarName: `--${path.replace(/\./g, "-")}`,
        type: res.type,
        rawValue: raw.value,
        resolvedValue: res.resolvedValue,
        aliasedFrom: res.aliasedFrom,
      };
    });

  const cssLines = tokens.map((t) => `  ${t.cssVarName}: ${t.resolvedValue};`);
  return {
    standard: "W3C DTCG 2025.10",
    selector,
    tokenCount: tokens.length,
    tokens,
    cssText: `${selector} {\n${cssLines.join("\n")}\n}`,
  };
}

/**
 * Evaluates perceptual OKLCH contrast (APCA Lc & WCAG 2.2) and auto-remediates foreground lightness.
 */
export function evaluateAndRemediateOklchContrast({
  text = { l: 0.68, c: 0.01, h: 90 },
  surface = { l: 0.11, c: 0.005, h: 90 },
  minApcaLc = 65,
} = {}) {
  const computeMetrics = (fg, bg) => {
    const yText = Math.pow(Math.min(1, Math.max(0, Number(fg.l))), 3);
    const yBg = Math.pow(Math.min(1, Math.max(0, Number(bg.l))), 3);
    const lighter = Math.max(yText, yBg);
    const darker = Math.min(yText, yBg);
    const wcagRatio = Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
    const polarity = yBg >= yText ? "dark-on-light" : "light-on-dark";
    const rawLc =
      polarity === "dark-on-light"
        ? (Math.pow(yBg, 0.56) - Math.pow(yText, 0.57)) * 114
        : (Math.pow(yBg, 0.65) - Math.pow(yText, 0.62)) * 114;
    const apcaLc = Math.round(Math.abs(rawLc) * 10) / 10;
    return { wcagRatio, apcaLc, polarity };
  };

  const initial = computeMetrics(text, surface);
  let current = { l: Number(text.l), c: Number(text.c), h: Number(text.h) };
  let currentMetrics = initial;
  let adjusted = false;

  const moveLight = Number(surface.l) < 0.5;
  for (let i = 0; i < 50 && currentMetrics.apcaLc < minApcaLc; i++) {
    adjusted = true;
    current = {
      l: Math.round((moveLight ? Math.min(0.99, current.l + 0.02) : Math.max(0.05, current.l - 0.02)) * 1000) / 1000,
      c: Math.round(current.c * 0.96 * 1000) / 1000,
      h: current.h,
    };
    currentMetrics = computeMetrics(current, surface);
  }

  return {
    initialApcaLc: initial.apcaLc,
    initialWcagRatio: initial.wcagRatio,
    finalApcaLc: currentMetrics.apcaLc,
    finalWcagRatio: currentMetrics.wcagRatio,
    polarity: currentMetrics.polarity,
    wasAdjusted: adjusted,
    remediatedTextOklch: `oklch(${current.l} ${current.c} ${current.h})`,
    surfaceOklch: `oklch(${surface.l} ${surface.c} ${surface.h})`,
    passesBodyCopy: currentMetrics.apcaLc >= minApcaLc,
  };
}
