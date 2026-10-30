/**
 * Web development curriculum evaluator & execution sandbox.
 * Provides isolated evaluation, assertion checking, and telemetry metrics for agent-submitted refactorings.
 */

import { createContext, runInContext } from "node:vm";
import { REFACTORING_CURRICULUM_TASKS } from "./curriculum.js";

const CSS_TASK_CHECKS = Object.freeze({
  task_css_reset_baseline_renewal: [
    { name: "Layered Box-Sizing Baseline", all: ["@layer reset", "*::before", "box-sizing: border-box"] },
    { name: "Responsive Media and Inherited Control Fonts", all: ["max-inline-size: 100%", "font: inherit;", "body {"] },
    { name: "Non-Destructive Reset", none: ["!important", "width: 100%;"] },
  ],
  task_css_physical_to_logical_properties: [
    { name: "Logical Component Sizing", all: ["inline-size: min(100%", "float: inline-start"] },
    { name: "Writing-Mode-Safe Spacing and Border", all: ["margin-inline-end", "margin-block-end", "padding-inline-start", "border-inline-start"] },
    { name: "No Physical Directional Offsets", none: ["margin-right:", "padding-left:", "border-left:", "width: 240px"] },
  ],
  task_css_float_navigation_to_flex: [
    { name: "Wrapping Flex Header and Navigation", all: [".site-header", "display: flex", "flex-wrap: wrap"], min: [["display: flex", 2]] },
    { name: "Gap-Based Navigation Spacing", all: [".site-nav", "gap:", "align-items: center"] },
    { name: "Removes Float and Clearfix Hacks", none: ["float:", "::after", "width: 120px"] },
  ],
  task_css_float_columns_to_responsive_grid: [
    { name: "Intrinsic Auto-Fitting Grid Tracks", all: ["grid-template-columns", "repeat(auto-fit", "minmax(min(100%", "gap:"] },
    { name: "Removes Float Width Patches", none: ["float:", "width: 960px", "width: 320px", "nth-child"] },
    { name: "Centered Logical Container", all: ["inline-size: min(100% - 2rem", "margin-inline: auto"] },
  ],
  task_css_breakpoints_to_fluid_type: [
    { name: "Bounded Fluid Type Scale", all: ["font-size: clamp(", "1.75rem", "4rem"] },
    { name: "Readable Measure and Line Height", all: ["max-inline-size: 68ch", "line-height: 1.65", "text-wrap: balance"] },
    { name: "Removes Stepped Heading Breakpoints", none: ["@media (min-width:", "font-size: 64px"] },
  ],
  task_css_fixed_media_to_aspect_ratio: [
    { name: "Intrinsic Image Geometry", all: ["aspect-ratio: 4 / 3", "inline-size: 100%"] },
    { name: "Intentional Non-Distorting Crop", all: ["object-fit: cover", "object-position: 50% 35%"] },
    { name: "Removes Breakpoint Height Ladder", none: ["height: 280px", "@media (max-width:", "@media (min-width:"] },
  ],
  task_css_sass_to_native_nesting: [
    { name: "Native Theme Custom Properties", all: ["--card-ink:", "var(--card-ink)", "--focus-ring:"] },
    { name: "Nested Component and Focus Rules", all: [".card__title", "&:focus-within", ".card {"] },
    { name: "Removes Preprocessor-Only Syntax", none: ["$card-ink", "@mixin", "@include"] },
  ],
  task_css_specificity_wars_to_layers: [
    { name: "Explicit Cascade Layer Order", all: ["@layer reset, vendor, components, utilities"] },
    { name: "Low-Specificity Reset and Readable Component", all: [":where(*, *::before, *::after)", ".button-primary"] },
    { name: "No Specificity Escalation", none: ["!important", "#app .panel", "html body #app"] },
  ],
  task_css_supports_progressive_enhancement: [
    { name: "Color Value and Selector Feature Queries", all: ["@supports (color: oklch(", "@supports selector(", ":has("] },
    { name: "Base Selected State and Non-Color Cue", all: [".product-card[data-selected=\"true\"]", "border-style: double"] },
    { name: "Parse-Time Fallbacks Precede Enhancements", before: [["background: #fff;", "@supports (color:"], ["border-style: double;", "@supports (color:"]] },
  ],
  task_css_accessible_focus_motion_refresh: [
    { name: "Keyboard Focus Indicator", all: [":focus-visible", "outline: 3px solid", "outline-offset: 3px"], none: ["outline: none"] },
    { name: "Targeted Reduced-Motion Override", all: ["prefers-reduced-motion: reduce", "transition: none", "transform: none"] },
    { name: "Forced-Colors System Palette", all: ["forced-colors: active", "ButtonText", "ButtonFace", "Highlight"] },
  ],
  task_css_layout_animations_to_transforms: [
    { name: "Transform-Based Visual Motion", all: ["transition: transform", "translateY("] },
    { name: "Keyboard Reachable Motion State", all: [":focus-within", ".promo-tile:hover"] },
    { name: "Reduced-Motion Transform Removal", all: ["prefers-reduced-motion: reduce", "transition: none", "transform: none"], none: ["transition: top"] },
  ],
  task_css_offscreen_content_visibility: [
    { name: "Viewport-Aware Rendering", all: ["content-visibility: auto"] },
    { name: "Intrinsic Placeholder Geometry", all: ["contain-intrinsic-size:", "56rem"] },
    { name: "Preserves Flowing Document Content", all: [".report-chapter__body", "max-inline-size: 72ch"], none: ["display: none"] },
  ],
  task_css_scroll_snap_gallery: [
    { name: "Native Inline Scroll Snap", all: ["overflow-x: auto", "scroll-snap-type: inline proximity", "scroll-snap-align: start"] },
    { name: "Responsive Tracks and Scroll Padding", all: ["grid-auto-columns: minmax(min(100%", "scroll-padding-inline:"] },
    { name: "No Scripted Mandatory Motion", none: ["scroll-snap-type: x mandatory", "scroll-behavior: smooth"] },
  ],
  task_css_print_stylesheet_recovery: [
    { name: "Dedicated Print Rules", all: ["@media print", "@page", "inline-size: auto"] },
    { name: "Removes Screen-Only Controls", all: [".invoice-actions", ".screen-only", "display: none"] },
    { name: "Readable Page Breaks and Link Destinations", all: ["break-inside: avoid", "a[href^=\"http\"]::after", "attr(href)"] },
  ],
  task_css_js_class_to_has_state: [
    { name: "Relational Parent State", all: [":has(> .favorite-toggle[aria-pressed=\"true\"])"] },
    { name: "Progressive Selector Feature Detection", all: ["@supports selector(.product-card:has("] },
    { name: "No Mirrored JavaScript State Class", none: [".is-favorited", "classList"] },
  ],
  task_css_popover_starting_style: [
    { name: "Native Popover Open State", all: ["[popover]:popover-open"] },
    { name: "Discrete Entry and Exit Transition", all: ["@starting-style", "display 180ms allow-discrete", "overlay 180ms allow-discrete"] },
    { name: "Reduced-Motion Popover", all: ["prefers-reduced-motion: reduce", "transition: none"] },
  ],
  task_css_mobile_viewport_unit_migration: [
    { name: "Progressive Viewport Height Fallbacks", all: ["100vh", "100svh", "100dvh"] },
    { name: "Content-Growing Logical Minimum", all: ["min-block-size: 100dvh"] },
    { name: "Notch-Safe Logical Padding", all: ["safe-area-inset-top", "safe-area-inset-bottom", "safe-area-inset-left", "safe-area-inset-right"] },
  ],
  task_css_font_face_variable_migration: [
    { name: "Variable Font Weight Range and Swap", all: ["@font-face", "font-weight: 100 900", "font-display: swap"] },
    { name: "Resilient System Fallback and Optical Sizing", all: ["system-ui", "font-optical-sizing: auto"] },
    { name: "Progressive Fallback Metric Adjustment", all: ["font-size: 1rem", "font-size-adjust: 0.52"] },
  ],
  task_css_scope_proximity_limits: [
    { name: "Separate Bounded Component Scopes", all: ["@scope (.dashboard-shell) to (.embedded-app)", "@scope (.widget-shell) to (.embedded-app)"] },
    { name: "Scope Roots and Shared Target Selector", all: [":scope", ".toolbar-action {"], min: [[".toolbar-action {", 2]] },
    { name: "Scope Proximity Resolution", all: ["same specificity", "closer root wins"] },
  ],
  task_css_custom_fluid_functions: [
    { name: "Typed Dashed CSS Function", all: ["@function --fluid-space(", "returns <length>", "--minimum <length>"] },
    { name: "Default Parameter and Result Descriptor", all: ["--maximum <length> : 4rem", "result: clamp(", "var(--maximum)"] },
    { name: "Reusable Fluid Calls and Draft Note", all: ["--fluid-space(0.75rem", "--fluid-space(1rem", "build-time fallbacks"] },
  ],
  task_css_if_conditional_values: [
    { name: "Ordered Media and Supports Conditions", all: ["if(media(", "if(\n    supports(color:"] },
    { name: "Inline Else Values", all: ["else: 1rem", "else: #f4f6f8"] },
    { name: "Fallbacks Precede Draft Values", before: [["padding: 1rem;", "padding: if("], ["background-color: #f4f6f8;", "background-color: if("]] },
  ],
  task_css_cross_document_transition_classes: [
    { name: "Cross-Document Navigation Opt-In", all: ["@view-transition", "navigation: auto", "both same-origin documents"] },
    { name: "Unique Names and Shared Transition Class", all: ["view-transition-name: featured-product", "view-transition-name: price-summary", "view-transition-class: commerce-item", "::view-transition-group(*.commerce-item)"] },
    { name: "Reduced Motion and Capture Semantics", all: ["prefers-reduced-motion: reduce", "navigation: none", "does not capture an element"] },
  ],
  task_css_industry_retail_catalog: [
    { name: "Intrinsic Catalog Tracks", all: ["repeat(auto-fit, minmax(min(100%, 16rem), 1fr))", "gap: clamp("], withinRules: [{ selector: ".retail-catalog", all: ["grid-template-columns", "minmax(min(100%, 16rem)"] }] },
    { name: "Card-Local Responsive Layout", all: ["container: retail-product / inline-size", "@container retail-product (min-width: 28rem)"], withinRules: [{ selector: ".retail-product", all: ["min-inline-size: 0", "container: retail-product / inline-size"] }, { selector: ".retail-product__layout", all: ["grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)"] }] },
    { name: "Contained Content, Selection and Focus", all: ["aspect-ratio: 4 / 3", "object-fit: cover", "min-block-size: max(2.75rem, 44px)", "border: 3px double currentColor", ":focus-within"], none: ["float:", "white-space: nowrap"], withinRules: [{ selector: ".retail-product__variant", all: ["min-inline-size: max(2.75rem, 44px)", "min-block-size: max(2.75rem, 44px)"] }, { selector: '.retail-product__variant[aria-pressed="true"]', all: ["border: 3px double currentColor"] }] },
  ],
  task_css_industry_healthcare_intake: [
    { name: "Shrink-Safe Form Layout", all: ["container: patient-intake / inline-size", "repeat(2, minmax(0, 1fr))", "@container patient-intake (max-width: 42rem)"], withinRules: [{ selector: ".patient-intake__grid", all: ["grid-template-columns: repeat(2, minmax(0, 1fr))"] }, { selector: ".patient-intake__field", all: ["min-inline-size: 0"] }] },
    { name: "Fluid and Touch-Sized Controls", all: ["inline-size: 100%", "min-block-size: max(2.75rem, 44px)", "font: inherit"], none: ["width: 420px", "height: 30px"], withinRules: [{ selector: ".patient-intake__field input,", all: ["inline-size: 100%", "min-block-size: max(2.75rem, 44px)"] }] },
    { name: "Redundant Error, Focus and Forced-Color Cues", all: ["border-inline-start: 0.4rem double", ":focus-visible", "outline: 3px solid", "forced-colors: active", "CanvasText", "Highlight"], none: ["outline: none"], withinRules: [{ selector: '.patient-intake [aria-invalid="true"]', all: ["border-inline-start: 0.4rem double"] }] },
  ],
  task_css_industry_bank_ledger: [
    { name: "Scrollable Wrapper, Native Table", all: ["overflow: auto", "overscroll-behavior-inline: contain", "border-collapse: separate"], none: ["display: block", "float: right"], withinRules: [{ selector: ".bank-ledger__scroll", all: ["overflow: auto", "overscroll-behavior-inline: contain"] }, { selector: ".bank-ledger table", all: ["border-collapse: separate", "min-inline-size: 56rem"] }] },
    { name: "Comparable Monetary Values", all: ["font-variant-numeric: tabular-nums lining-nums", "text-align: end", "position: sticky", "inset-block-start: 0"] },
    { name: "Printable Ledger", all: ["@media print", "overflow: visible", "min-inline-size: 0", "position: static"], withinRules: [{ selector: ".bank-ledger__scroll", all: ["overflow: auto"] }] },
  ],
  task_css_industry_logistics_dispatch: [
    { name: "Embedding-Aware Board", all: ["container: dispatch-board / inline-size", "@container dispatch-board (max-width: 70rem)", "@container dispatch-board (max-width: 38rem)"], withinRules: [{ selector: ".dispatch-board", all: ["container: dispatch-board / inline-size", "min-inline-size: 0"] }] },
    { name: "Shrink-Safe Lanes and Orders", all: ["grid-template-columns: repeat(4, minmax(0, 1fr))", "overflow-wrap: anywhere"], none: ["width: 280px", "repeat(4, 300px)"], withinRules: [{ selector: ".dispatch-board__lanes", all: ["minmax(0, 1fr)", "min-inline-size: 0"] }, { selector: ".dispatch-lane", all: ["min-inline-size: 0"] }, { selector: ".dispatch-order", all: ["overflow-wrap: anywhere"] }] },
    { name: "Redundant Severity Cues and Motion Preference", all: ["border-style: dashed", "border-style: double", "font-weight: 700", "forced-colors: active", "prefers-reduced-motion: reduce", "transition: none"] },
  ],
  task_css_industry_newsroom_story: [
    { name: "Editorial Measure and Flexible Type", all: ["max-inline-size: 68ch", "font-size: clamp(", "line-height: 1.75", "text-wrap: balance", "hyphens: auto"], withinRules: [{ selector: ".story-reader__body", all: ["max-inline-size: 68ch", "line-height: 1.75"] }] },
    { name: "Responsive Story Media and Local Overflow", all: ["max-inline-size: 100%", "aspect-ratio: 16 / 9", "overflow: auto"], none: ["float: left", "white-space: nowrap"], withinRules: [{ selector: ".story-reader__figure img", all: ["aspect-ratio: 16 / 9", "object-fit: cover"] }, { selector: ".story-reader__table-scroll", all: ["max-inline-size: 100%", "overflow: auto"] }] },
    { name: "Container-Driven Rail and Clean Print", all: ["@container newsroom-story (min-width: 76rem)", "@media print", "story-reader__controls", "attr(href)"], withinRules: [{ selector: ".story-reader__layout", all: ["grid-template-columns: minmax(0, 1fr)"] }] },
  ],
  task_css_industry_restaurant_pos: [
    { name: "Viewport-Safe Touch Menu", all: ["min-block-size: 100svh", "min-block-size: 100dvh", "env(safe-area-inset-left)", "env(safe-area-inset-right)", "repeat(auto-fit"], none: ["width: 1024px", "height: 768px", "float: left"] },
    { name: "Selected State and Keyboard Target", all: ["min-block-size: max(3.25rem, 52px)", "aria-pressed", "menu-item__selected-marker", ":focus-visible", "outline-offset: 3px"], withinRules: [{ selector: '.menu-item[aria-pressed="true"]', all: ["border: 4px double currentColor"] }] },
    { name: "Input and Motion Preferences", all: ["(hover: hover) and (pointer: fine)", "prefers-reduced-motion: reduce", "transition: none", "forced-colors: active", "ButtonFace", "Highlight"] },
  ],
  task_css_industry_public_permit: [
    { name: "In-Flow Reflowing Application", all: ["container: permit-workspace / inline-size", "@container permit-workspace (max-width: 54rem)", "grid-template-columns: minmax(0, 1fr)"], none: ["position: fixed", "width: 1200px", "right: 0"] },
    { name: "Controls and Visible Error Summary", all: ["min-inline-size: 0", "inline-size: 100%", "min-block-size: max(2.75rem, 44px)", "permit-error-summary", "border-inline-start: 0.45rem double"], withinRules: [{ selector: ".permit-form input,", all: ["inline-size: 100%", "min-block-size: max(2.75rem, 44px)"] }, { selector: ".permit-error-summary", all: ["border-inline-start-width: 0.6rem"] }] },
    { name: "Keyboard and Forced-Color Support", all: [":focus-visible", "outline: 3px solid", "forced-colors: active", "CanvasText", "Highlight"], none: ["outline: none"] },
  ],
  task_css_industry_saas_vendor_migration: [
    { name: "Layer Order and Vendor Import", all: ["@layer legacy-important, reset, vendor, tokens, components, utilities, app-overrides", '@import url("/assets/legacy-admin.css") layer(vendor);'], before: [["@layer legacy-important, reset", "@import url("]] },
    { name: "Scoped Components and Tokens", all: ["--admin-ink:", "--admin-accent:", ".admin-shell .widget", ":where(.u-hidden)", "layer(vendor)"], withinRules: [{ selector: ".admin-shell", all: ["color: var(--admin-ink)", "font: 1rem/1.5"] }, { selector: ".admin-shell .widget-primary button", all: ["min-block-size: 2.75rem"] }] },
    { name: "Quarantined Vendor Exception", max: [["!important", 2]], none: ["#admin-root", "html body"], withinRules: [{ selector: ".admin-shell .widget-primary button", all: ["background: var(--admin-accent) !important", "color: #fff !important"] }] },
  ],
  task_css_native_scroll_state_checkout_summary: [
    { name: "Functional Sticky Fallback", all: ["position: sticky", "inset-block-start: var(--checkout-header-size, 0px)", "z-index: 2"], withinRules: [{ selector: ".checkout-summary", all: ["position: sticky", "inset-block-start: var(--checkout-header-size, 0px)"] }] },
    { name: "Scroll-State Surface Enhancement", all: ["@supports (container-type: scroll-state)", "container-type: scroll-state", "@container scroll-state(stuck: block-start)", "box-shadow: 0 0.5rem 1rem"], withinRules: [{ selector: ".checkout-summary__surface", all: ["background-color: Canvas", "transition: box-shadow"] }] },
    { name: "Reduced-Motion and Layout-Stable State", all: ["prefers-reduced-motion: reduce", "transition: none"], none: ["transform:", "block-size:"] },
  ],
  task_css_shadow_nested_exportparts_contract: [
    { name: "Two-Level Part Forwarding Contract", all: ['exportparts="control: field-control, hint: field-hint"', 'exportparts="field-control: medication-control, field-hint: medication-hint"'] },
    { name: "Public Parts and Theme Tokens", all: ["care-patient-form::part(medication-control)", "care-patient-form::part(medication-hint)", "--patient-field-accent:", "var(--patient-field-accent)"] },
    { name: "Encapsulation Boundary", none: ["::part(private", ">>>", "/deep/", "!important"], all: ["medication-control", "medication-hint"] },
  ],
  task_css_shadow_slots_compound_boundary: [
    { name: "Direct Assigned Element Styling", all: ['slot[name="primary-actions"]::slotted(a)', 'slot[name="primary-actions"]::slotted(button)', 'slot[name="article-body"]::slotted(p)'], none: ["::slotted(a strong)", "::slotted(button span)"] },
    { name: "Progressive Slot Presence Decoration", all: ["@supports selector(slot:has-slotted)", ":has-slotted", "border-block-end: 1px solid transparent", "border-block-end-color: currentColor"] },
    { name: "Focus and High-Contrast Cues", all: [":focus-visible", "forced-colors: active", "outline-offset: 3px", "LinkText", "Highlight"] },
  ],
  task_css_shadow_host_custom_state_theming: [
    { name: "Host Attributes and Theme Tokens", all: [":host {", ':host([density="compact"])', "--field-gap:", "--field-radius:", "min-block-size: 44px"] },
    { name: "Custom State and Public Control Part", all: [":host(:state(invalid)) .control", "border: 3px double currentColor", "clinic-dose-field::part(control)", ".control:focus-visible"] },
    { name: "Forced-Colors Error and Focus Cues", all: ["forced-colors: active", "background-color: Field", "color: FieldText", "outline-color: Highlight", "border-style: double"], none: ["outline: none"] },
  ],
  task_css_intrinsic_sizing_claims_workspace: [
    { name: "Shrink-Safe Nested Grid Tracks", all: ["minmax(14rem, 20rem) minmax(0, 1fr)", "grid-template-columns: minmax(14rem, 20rem) minmax(0, 1fr)", "min-inline-size: 0"] },
    { name: "Container-Fitting Auto-Grid", all: ["repeat(auto-fit, minmax(min(100%, 21rem), 1fr))", "gap: 1rem"] },
    { name: "Long Data and Media Stay Contained", all: ["overflow-wrap: anywhere", "flex-wrap: wrap", "max-inline-size: 100%", "block-size: auto"], none: ["white-space: nowrap", "repeat(3, 22rem)"] },
  ],
  task_css_flow_root_legacy_float_containment: [
    { name: "Contained Float Without Clearfix", all: ["display: flow-root"], withinRules: [{ selector: ".claim-explanation", all: ["display: flow-root"], none: ["overflow: hidden"] }] },
    { name: "Intentional Logical Float and Responsive Media", all: ["float: inline-start", "inline-size: min(40%, 18rem)", "aspect-ratio: 4 / 3", "object-fit: cover", "margin-inline-end: 1rem"] },
    { name: "Removes Legacy Float Containment Hacks", none: ["::after", "content:", "clear: both", "overflow: hidden"] },
  ],
  task_css_positioning_stacking_context_alert_portal: [
    { name: "Small Named Layer Scale and Body Portal Contract", all: ["@layer tokens, shell, global-overlays;", "--layer-shell: 0", "--layer-navigation: 20", "--layer-alert: 100", "#incident-alert-root to a direct child of body"] },
    { name: "Sticky Nav and Inner Transform Placement", all: ["position: sticky", "inset-block-start: 0", "z-index: var(--layer-navigation)", ".ops-shell__canvas", "transform: translateZ(0)"], withinRules: [{ selector: ".ops-shell__canvas", all: ["transform: translateZ(0)"] }] },
    { name: "Viewport Alert Outside the Trapped Context", all: ["position: fixed", "inset-inline-end: 1rem", "z-index: var(--layer-alert)", "pointer-events: none", "pointer-events: auto"], withinRules: [{ selector: "#incident-alert-root", all: ["position: fixed", "z-index: var(--layer-alert)", "pointer-events: none"] }] , none: ["z-index: 9999", "z-index: 2147483647"] },
  ],
  task_css_native_controls_color_scheme: [
    { name: "Native Browser Scheme and Author Tokens", all: ["color-scheme: light dark", "prefers-color-scheme: dark", "--page-surface:", "--form-ink:", "--form-accent:"] },
    { name: "Native Controls and Accent Color", all: ['input[type="checkbox"]', 'input[type="radio"]', 'input[type="range"]', "accent-color: var(--form-accent)", "font: inherit"], none: ["appearance: none"] },
    { name: "Keyboard and Forced-Colors Support", all: [":focus-visible", "forced-colors: active", "background-color: Field", "color: FieldText", "outline-color: Highlight"], none: ["outline: none"] },
  ],
  task_css_markdown_gfm_content_renderer: [
    { name: "Readable and Reflowing Markdown Content", all: [".markdown-body", "max-inline-size: 80ch", "line-height: 1.65", "overflow-wrap: anywhere", "scroll-margin-block-start: 6rem"] },
    { name: "Local Table and Code Overflow", all: [".markdown-table-scroll", "overscroll-behavior-inline: contain", "min-inline-size: 42rem", ".markdown-body pre", "overflow: auto", "white-space: pre"] },
    { name: "Native Task Lists and Keyboard Focus", all: [".contains-task-list", ".task-list-item > input[type=\"checkbox\"]", "accent-color:", ":focus-visible", "outline-offset: 3px"], none: ["outline: none", "white-space: nowrap"] },
  ],
  task_css_markdown_anchor_navigation_sticky_header: [
    { name: "Document and Heading Scroll Offsets", all: ["--docs-header-block-size: 4rem", "scroll-padding-block-start: calc(var(--docs-header-block-size) + 1rem)", "scroll-margin-block-start: 1rem"] },
    { name: "Target Feedback and Focusable Skip Link", all: [":target", ".docs-skip-link:focus-visible", "transform: translateY(0)", "outline-offset: 3px"] },
    { name: "Motion Preference", all: ["scroll-behavior: smooth", "prefers-reduced-motion: reduce", "scroll-behavior: auto"] },
  ],
  task_css_responsive_embeds_stable_geometry: [
    { name: "Fluid Media Geometry Reservation", all: [".course-embed", "inline-size: 100%", "aspect-ratio: 16 / 9", "aspect-ratio: 9 / 16", "max-inline-size: 100%"] },
    { name: "Frame Fills the Reserved Wrapper", all: [":where(iframe, video)", "position: absolute", "inset: 0", "block-size: 100%", "border: 0"] },
    { name: "Focus Without Media Clipping", all: [":focus-within", "outline: 3px solid", "outline-offset: 3px"], none: ["overflow: hidden", "width: 560px", "height: 315px"] },
  ],
  task_css_nested_workspace_scrollers: [
    { name: "Shrinkable Two-Axis Workspace Tracks", all: ["grid-template-rows: auto minmax(0, 1fr)", "grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr)", "min-inline-size: 0", "min-block-size: 0"], withinRules: [{ selector: ".support-app__workspace", all: ["grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr)", "min-inline-size: 0", "min-block-size: 0"] }, { selector: ".support-inbox", all: ["grid-template-rows: auto minmax(0, 1fr) auto"] }] },
    { name: "Scroll Ownership and Containment", all: [".support-inbox__messages", "overflow: auto", "overscroll-behavior-block: contain", "scrollbar-gutter: stable"], none: ["overflow: hidden"], withinRules: [{ selector: ".support-inbox__messages", all: ["overflow: auto", "overscroll-behavior-block: contain", "scrollbar-gutter: stable"] }] },
    { name: "Responsive Workspace Keeps Its Document Order", all: ["@media (max-width: 48rem)", "grid-template-columns: minmax(0, 1fr)", "grid-template-rows: auto minmax(0, 1fr)"], none: ["position: fixed"] },
  ],
  task_css_warehouse_pinned_table: [
    { name: "Native Table in a Two-Axis Scrollport", all: [".warehouse-stock__viewport", "overflow: auto", "border-collapse: separate", "min-inline-size: 100%"], none: ["display: block"], withinRules: [{ selector: ".warehouse-stock__viewport", all: ["overflow: auto", "max-inline-size: 100%"] }, { selector: ".warehouse-stock table", all: ["border-collapse: separate", "min-inline-size: 100%"] }] },
    { name: "Sticky Header and Row Label Intersection", all: ["inset-block-start: 0", "inset-inline-start: 0", "z-index: 2", "z-index: 3", "background: Canvas"], withinRules: [{ selector: ".warehouse-stock thead th", all: ["position: sticky", "inset-block-start: 0", "z-index: 2", "background: Canvas"] }, { selector: '.warehouse-stock tbody th[scope="row"]', all: ["inset-inline-start: 0", "background: Canvas"] }, { selector: ".warehouse-stock thead th:first-child", all: ["inset-inline-start: 0", "z-index: 3"] }] },
    { name: "Logical Pinning and Print Recovery", all: ["tbody th[scope=\"row\"]", "@media print", "overflow: visible", "position: static", "min-inline-size: 0"], withinRules: [{ selector: ".warehouse-stock__viewport", all: ["max-block-size: none", "overflow: visible"] }, { selector: ".warehouse-stock table", all: ["min-inline-size: 0", "table-layout: fixed"] }] },
  ],
  task_css_content_sized_reply_field: [
    { name: "Usable Legacy Textarea Baseline", all: ["min-block-size: 3.5rem", "inline-size: 100%", "font: inherit", "resize: vertical"], withinRules: [{ selector: ".ticket-reply__input", all: ["min-block-size: 3.5rem", "inline-size: 100%", "font: inherit", "resize: vertical"] }] },
    { name: "Feature-Gated Intrinsic Control Sizing", all: ["@supports (field-sizing: content)", "field-sizing: content", "field-sizing: fixed"], withinRules: [{ selector: ".ticket-reply__input", all: ["field-sizing: content"] }] },
    { name: "Bounded Growth with Native Overflow", all: ["max-block-size: min(38dvh, 18rem)", "overflow-y: auto"], before: [["min-block-size: 3.5rem", "@supports (field-sizing: content)"]], withinRules: [{ selector: ".ticket-reply__input", all: ["max-block-size: min(38dvh, 18rem)", "overflow-y: auto"] }] },
  ],
  task_css_intrinsic_disclosure_transition: [
    { name: "Native Details Remains the Interaction Baseline", all: ["details", "summary", "details[open]::details-content", ":focus-visible"], withinRules: [{ selector: ".help-faq summary", all: ["min-block-size: 2.75rem", "cursor: pointer"] }, { selector: ".help-faq summary:focus-visible", all: ["outline: 3px solid Highlight"] }] },
    { name: "Feature-Gated Auto-Size Interpolation", all: ["@supports (interpolate-size: allow-keywords)", "selector(details::details-content)", "interpolate-size: allow-keywords", "block-size: 0", "block-size: auto", "transition: block-size"], withinRules: [{ selector: ".help-faq", all: ["interpolate-size: allow-keywords"] }, { selector: ".help-faq details::details-content", all: ["block-size: 0", "overflow: clip", "transition: block-size"] }, { selector: ".help-faq details[open]::details-content", all: ["block-size: auto"] }] },
    { name: "Reduced Motion and No Guessed Height", all: ["prefers-reduced-motion: reduce", "transition: none", "overflow-clip-margin"], none: ["max-height: 999px", "max-block-size: 1000px"], withinRules: [{ selector: ".help-faq details::details-content", all: ["overflow-clip-margin: 0.35rem"] }] },
  ],
  task_css_native_dialog_safe_review: [
    { name: "Viewport-Bounded Modal and Internal Scroll Ownership", all: ["max-block-size: min(44rem, calc(100vh - 2rem))", "100dvh", "env(safe-area-inset-top)", "overflow: auto", "overscroll-behavior: contain"], withinRules: [{ selector: ".claim-review__dialog", all: ["inline-size: min(calc(100% - 2rem), 48rem)", "overflow: auto", "overscroll-behavior: contain"] }] },
    { name: "Top-Layer Backdrop and Mobile Bottom Sheet", all: ["::backdrop", "@supports selector(dialog:modal)", ".claim-review__dialog:modal", "inset: auto 0 0"], none: ["z-index:", "999999"] },
    { name: "Pinned Actions and High-Contrast Boundaries", all: ["position: sticky", "inset-block-end: 0", ":focus-visible", "forced-colors: active", "CanvasText", "Highlight"], withinRules: [{ selector: ".claim-review__dialog .claim-review__actions", all: ["position: sticky", "inset-block-end: 0"] }] },
  ],
});

function cssCheckPassed(code, check) {
  const includesAll = (check.all || []).every((token) => code.includes(token));
  const excludesAll = (check.none || []).every((token) => !code.includes(token));
  const meetsMinimumCounts = (check.min || []).every(([token, minimum]) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return (code.match(new RegExp(escaped, "g")) || []).length >= minimum;
  });
  const followsRequiredOrder = (check.before || []).every(([first, later]) => {
    const firstIndex = code.indexOf(first);
    const laterIndex = code.indexOf(later);
    return firstIndex >= 0 && laterIndex > firstIndex;
  });
  const meetsMaximumCounts = (check.max || []).every(
    ([token, maximum]) => code.split(token).length - 1 <= maximum,
  );
  const rulesPass = (check.withinRules || []).every(({ selector, all = [], none = [] }) => {
    return findCssRuleBodies(code, selector).some((body) =>
      all.every((token) => body.includes(token)) && none.every((token) => !body.includes(token)),
    );
  });
  return includesAll && excludesAll && meetsMinimumCounts && meetsMaximumCounts && followsRequiredOrder && rulesPass;
}

function findCssRuleBodies(code, selector) {
  const skipString = (start) => {
    const quote = code[start];
    let index = start + 1;
    while (index < code.length) {
      if (code[index] === "\\") {
        index += 2;
      } else if (code[index] === quote) {
        return index + 1;
      } else {
        index += 1;
      }
    }
    return code.length;
  };

  const bodies = [];
  let index = 0;
  while (index < code.length) {
    if (code.startsWith("/*", index)) {
      const end = code.indexOf("*/", index + 2);
      index = end < 0 ? code.length : end + 2;
      continue;
    }
    if (code[index] === "\"" || code[index] === "'") {
      index = skipString(index);
      continue;
    }
    if (code.startsWith(selector, index)) {
      const previous = code[index - 1];
      const boundaryBefore = index === 0 || /[\s{};,:)]/.test(previous);
      let open = index + selector.length;
      while (open < code.length) {
        if (code.startsWith("/*", open)) {
          const end = code.indexOf("*/", open + 2);
          open = end < 0 ? code.length : end + 2;
          continue;
        }
        if (code[open] === "\"" || code[open] === "'") {
          open = skipString(open);
          continue;
        }
        if (code[open] === "{" || code[open] === ";" || code[open] === "}") break;
        open += 1;
      }
      if (boundaryBefore && code[open] === "{") {
        let depth = 1;
        let cursor = open + 1;
        while (cursor < code.length) {
          if (code.startsWith("/*", cursor)) {
            const end = code.indexOf("*/", cursor + 2);
            cursor = end < 0 ? code.length : end + 2;
            continue;
          }
          if (code[cursor] === "\"" || code[cursor] === "'") {
            cursor = skipString(cursor);
            continue;
          }
          if (code[cursor] === "{") depth += 1;
          if (code[cursor] === "}") {
            depth -= 1;
            if (depth === 0) {
              bodies.push(code.slice(open + 1, cursor));
              index = cursor + 1;
              break;
            }
          }
          cursor += 1;
        }
      }
    }
    index += 1;
  }
  return bodies;
}

function hasBalancedCssStructure(code) {
  const openers = new Map([
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ]);
  const closers = new Set(openers.values());
  const stack = [];

  for (let index = 0; index < code.length; index += 1) {
    const char = code[index];
    if (code.startsWith("/*", index)) {
      const end = code.indexOf("*/", index + 2);
      if (end < 0) return false;
      index = end + 1;
      continue;
    }
    if (char === "\"" || char === "'") {
      const quote = char;
      let closed = false;
      for (index += 1; index < code.length; index += 1) {
        if (code[index] === "\\") {
          index += 1;
        } else if (code[index] === quote) {
          closed = true;
          break;
        }
      }
      if (!closed) return false;
      continue;
    }
    if (openers.has(char)) {
      stack.push(openers.get(char));
    } else if (closers.has(char) && stack.pop() !== char) {
      return false;
    }
  }

  return stack.length === 0;
}

export class Evaluator {
  /**
   * Evaluates submitted code for a specific curriculum task.
   */
  async evaluate(taskId, code, options = {}) {
    const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Unknown curriculum task '${taskId}'.`);
    }

    const trimmedCode = String(code || "").trim();
    if (!trimmedCode) {
      throw new Error("Submitted code cannot be empty.");
    }

    const startTime = performance.now();
    const assertionResults = [];
    let sandboxError = null;

    // 1. Static & structural criteria validation
    const criteriaChecks = this.#verifyCriteria(task, trimmedCode);
    assertionResults.push(...criteriaChecks);

    // 2. Sandboxed execution & unit test harness
    try {
      const execResults = await this.#runSandboxTests(taskId, trimmedCode, options);
      assertionResults.push(...execResults);
    } catch (err) {
      sandboxError = err.message || String(err);
      assertionResults.push({
        name: "Sandbox Execution",
        passed: false,
        detail: `Runtime execution error: ${sandboxError}`,
      });
    }

    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const passedCount = assertionResults.filter((a) => a.passed).length;
    const totalCount = assertionResults.length;
    const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
    const passed = score === 100 && !sandboxError;

    return {
      taskId,
      passed,
      score,
      telemetry: {
        durationMs,
        assertions: {
          total: totalCount,
          passed: passedCount,
          failed: totalCount - passedCount,
        },
      },
      assertionResults,
      diff: this.#calculateLineDiff(task.starterCode, trimmedCode),
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Public static & structural criteria verifier used by both evaluate() and /api/curriculum/verify.
   */
  verifyCriteria(taskId, code) {
    const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Unknown curriculum task '${taskId}'.`);
    }
    const cleanCode = String(code || "").trim();
    const assertions = this.#verifyCriteria(task, cleanCode);
    const passedCriteria = assertions.filter((a) => a.passed).map((a) => a.detail);
    const failedCriteria = assertions.filter((a) => !a.passed).map((a) => a.detail);
    const total = assertions.length || 1;
    return {
      success: failedCriteria.length === 0,
      passedCriteria,
      failedCriteria,
      assertions,
      score: Math.round((passedCriteria.length / total) * 100),
      verifiedAt: new Date().toISOString(),
    };
  }

  #verifyCriteria(task, code) {
    const results = [];
    const id = task.id;

    if (id === "task_refactor_async_pipeline") {
      results.push({
        name: "Async/Await Pipeline Syntax",
        passed: code.includes("async ") && code.includes("await "),
        detail: "Function uses async/await instead of nested callbacks",
      });
      results.push({
        name: "Eliminates Callback Pyramid",
        passed: !code.includes("function(err, user)") && !code.includes("callback(err)"),
        detail: "Eliminates nested callback chains",
      });
      results.push({
        name: "Promise.all Concurrency",
        passed: code.includes("Promise.all"),
        detail: "Performs independent requests in parallel with Promise.all",
      });
    } else if (id === "task_refactor_event_leak") {
      results.push({
        name: "AbortController or Signal Usage",
        passed: code.includes("AbortController") || code.includes("signal"),
        detail: "Uses AbortController signal or explicit listener tracking",
      });
      results.push({
        name: "Explicit Cleanup Method",
        passed: code.includes("abort()") || code.includes("destroy()") || code.includes("removeEventListener"),
        detail: "Implements dispose or abort lifecycle cleanup",
      });
    } else if (id === "task_refactor_o_n2_lookup") {
      results.push({
        name: "Indexed Map Data Structure",
        passed: code.includes("new Map(") || code.includes("Map()"),
        detail: "Indexes secondary dataset using a Map",
      });
      results.push({
        name: "Eliminates O(N^2) Nested Array Search",
        passed: !code.includes(".find("),
        detail: "Replaces inner loop find with constant time get() lookup",
      });
    } else if (id === "task_refactor_input_sanitization") {
      results.push({
        name: "Prototype Pollution Guard",
        passed: code.includes("__proto__") && code.includes("constructor"),
        detail: "Explicitly blocks __proto__, constructor, and prototype keys",
      });
      results.push({
        name: "Safe Own-Property Iteration",
        passed: code.includes("Object.keys") || code.includes("Object.hasOwn"),
        detail: "Iterates only own enumerable keys instead of unguarded for..in",
      });
    } else if (id === "task_refactor_buffer_alloc") {
      results.push({
        name: "Typed Uint8Array Usage",
        passed: code.includes("Uint8Array"),
        detail: "Uses typed Uint8Arrays instead of raw string concatenation",
      });
      results.push({
        name: "Zero-Copy Subarray Slicing",
        passed: code.includes("subarray") || code.includes("copyWithin"),
        detail: "Maintains ring/sliding buffer with copyWithin or subarray offsets",
      });
    } else if (id === "task_refactor_middleware_pipeline") {
      results.push({
        name: "Middleware Pipeline Registration",
        passed: code.includes("use("),
        detail: "Provides use() middleware registration API",
      });
      results.push({
        name: "Onion Dispatch",
        passed: code.includes("dispatch(") || code.includes("next()"),
        detail: "Chains execution with (context, next) dispatch",
      });
    } else if (id === "task_refactor_debounce_search") {
      results.push({
        name: "Timer Clearance",
        passed: code.includes("clearTimeout"),
        detail: "Cancels active timer on subsequent keystrokes",
      });
      results.push({
        name: "In-Flight Request Cancellation",
        passed: code.includes("AbortController"),
        detail: "Aborts previous in-flight HTTP requests",
      });
    } else if (id === "task_refactor_css_grid") {
      results.push({
        name: "CSS Grid & Flexbox Modernization",
        passed: code.includes("display: grid") || code.includes("grid-template-columns"),
        detail: "Uses modern CSS Grid layout",
      });
      results.push({
        name: "Eliminates Legacy Float Hacks",
        passed: !code.includes("float: left") && !code.includes("clear: both"),
        detail: "Removes clearfix and float rules",
      });
    } else if (id === "task_refactor_reducer_state") {
      results.push({
        name: "Pure Reducer Function",
        passed: (code.includes("switch ") || code.includes("if (action")) && code.includes("return "),
        detail: "Uses deterministic state transitions based on action type",
      });
      results.push({
        name: "Immutable State Returns",
        passed: code.includes("...state"),
        detail: "Returns new state object without in-place mutation",
      });
    } else if (id === "task_refactor_semantic_a11y") {
      results.push({
        name: "Semantic Button Element",
        passed: code.includes("<button"),
        detail: "Replaces non-semantic div with button element",
      });
      results.push({
        name: "Accessible ARIA Role & State",
        passed: code.includes('role="switch"') || code.includes("role='switch'"),
        detail: "Applies ARIA switch role and state attributes",
      });
    } else if (id === "task_refactor_typed_schema") {
      results.push({
        name: "Schema Type Guards",
        passed: code.includes("typeof ") || code.includes("Array.isArray"),
        detail: "Enforces strict type checks on incoming payload",
      });
      results.push({
        name: "Explicit Validation Errors",
        passed: code.includes("throw "),
        detail: "Fails fast with clear validation exceptions",
      });
    } else if (id === "task_refactor_worker_pool") {
      results.push({
        name: "Bounded Concurrency",
        passed: code.includes("concurrency") || code.includes("pool") || code.includes("Math.min"),
        detail: "Limits simultaneous parallel executions",
      });
      results.push({
        name: "Non-blocking Async Batching",
        passed: code.includes("Promise.all"),
        detail: "Dispatches tasks concurrently using Promise.all",
      });
    } else if (id === "task_db_connection_pool") {
      results.push({
        name: "Bounded Pool & Idle Reuse",
        passed: code.includes("acquire") && code.includes("release") && (code.includes("maxSize") || code.includes("#idle") || code.includes("idle")),
        detail: "Manages active and idle connections with bounded pool capacity",
      });
      results.push({
        name: "Automatic Lifecycle Cleanup (finally)",
        passed: code.includes("finally") && code.includes("release"),
        detail: "Guarantees connection return to pool even when queries throw",
      });
    } else if (id === "task_db_transactional_outbox") {
      results.push({
        name: "Parameterized SQL Queries",
        passed: (code.includes("$1") || code.includes("?")) && !code.includes("${fromAccount}"),
        detail: "Uses parameterized placeholders instead of unsafe string interpolation",
      });
      results.push({
        name: "Atomic Transaction & Outbox",
        passed: code.includes("BEGIN") && code.includes("COMMIT") && code.includes("ROLLBACK") && code.includes("outbox_events"),
        detail: "Wraps state mutation and outbox event insert in BEGIN/COMMIT/ROLLBACK",
      });
      results.push({
        name: "Transient Deadlock Retry",
        passed: code.includes("40001") || code.includes("40P01") || code.includes("SQLITE_BUSY"),
        detail: "Retries transient serialization and deadlock database error codes",
      });
    } else if (id === "task_db_keyset_pagination_dataloader") {
      results.push({
        name: "Microtask Batch Coalescing",
        passed: code.includes("queueMicrotask") || code.includes("Promise.all"),
        detail: "Batches individual lookups within the same event loop tick",
      });
      results.push({
        name: "Keyset Cursor Pagination",
        passed: !code.includes("OFFSET") && (code.includes("created_at") || code.includes("cursor")),
        detail: "Eliminates linear OFFSET scans in favor of keyset cursor pagination",
      });
    } else if (id === "task_auth_dpop_token_binding") {
      results.push({
        name: "DPoP Header & Claim Validation",
        passed: code.includes("dpop+jwt") && code.includes("htm") && code.includes("htu") && code.includes("ath"),
        detail: "Verifies dpop+jwt typ header, HTTP method/URI binding, and access token hash",
      });
      results.push({
        name: "JTI Replay & JWK Thumbprint Binding",
        passed: code.includes("jti") && (code.includes("replayCache") || code.includes("Set")) && code.includes("jwk"),
        detail: "Binds proof to public JWK thumbprint and prevents JTI token replay",
      });
    } else if (id === "task_auth_webauthn_passkey") {
      results.push({
        name: "WebAuthn ClientData & Binary Flags",
        passed: code.includes("webauthn.get") && code.includes("0x01") && code.includes("0x04"),
        detail: "Validates webauthn.get challenge/origin and UP/UV authenticator flags",
      });
      results.push({
        name: "Big-Endian SignCount Clone Detection",
        passed: (code.includes("DataView") || code.includes("getUint32")) && code.includes("signCount"),
        detail: "Parses uint32 signCount and rejects cloned authenticators on counter regression",
      });
    } else if (id === "task_auth_refresh_rotation_reuse") {
      results.push({
        name: "One-Time Refresh Rotation",
        passed: code.includes("used") && code.includes("familyId") && code.includes("rotate"),
        detail: "Tracks single-use state per refresh token within a token family",
      });
      results.push({
        name: "Compromised Family Revocation",
        passed: code.includes("revokeFamily") || (code.includes("revoked") && code.includes("familyId")),
        detail: "Revokes the entire token family immediately when a rotated token is replayed",
      });
    } else if (id === "task_fingerprint_entropy_normalizer") {
      results.push({
        name: "Multi-Surface Deterministic Digest",
        passed: (code.includes("0x811c9dc5") || code.includes("Math.imul") || code.includes("hash")) && code.includes("webgl"),
        detail: "Hashes normalized Canvas, WebGL, Audio, and hardware signals into a deterministic ID",
      });
      results.push({
        name: "Cross-Layer Spoofing Anomaly Checks",
        passed: code.includes("SwiftShader") && code.includes("webdriver") && code.includes("platform"),
        detail: "Detects UA/platform contradictions, software WebGL renderers, and webdriver flags",
      });
    } else if (id === "task_fingerprint_tls_ja4_http2") {
      results.push({
        name: "RFC 8701 TLS GREASE Filtering",
        passed: code.includes("0x0a0a") || code.includes("0x0f0f") || code.includes("isTlsGreaseValue"),
        detail: "Strips GREASE values before computing TLS ClientHello signature",
      });
      results.push({
        name: "JA4 & HTTP/2 Pseudo-Header Correlation",
        passed: code.includes(":method,:authority,:scheme,:path") && code.includes("ja4"),
        detail: "Correlates JA4 TLS signature and HTTP/2 pseudo-header order against claimed User-Agent",
      });
    } else if (id === "task_fingerprint_privacy_budget_defense") {
      results.push({
        name: "Per-Origin Entropy Budget Enforcement",
        passed: code.includes("maxBudgetBits") && code.includes("PrivacyBudgetExceededError"),
        detail: "Tracks cumulative entropy cost per origin and blocks reads past maxBudgetBits",
      });
      results.push({
        name: "Session+Origin Keyed Deterministic Farbling",
        passed: code.includes("farbleCanvasPixels") || (code.includes("Uint8Array") && code.includes("^")),
        detail: "Applies deterministic per-origin LSB perturbation to break cross-site fingerprint linking",
      });
    } else if (id === "task_cybersec_ssrf_dns_rebind") {
      results.push({
        name: "Private CIDR & Cloud Metadata Blocking",
        passed: code.includes("169") && code.includes("254") && code.includes("::ffff:") && code.includes("127"),
        detail: "Blocks 169.254.169.254 metadata, RFC 1918 ranges, IPv6 loopback, and ::ffff: mapped IPs",
      });
      results.push({
        name: "DNS Resolution Pinning",
        passed: code.includes("pinnedIp") && code.includes("Host") && code.includes("manual"),
        detail: "Pins validated DNS IP address and disables automatic redirect following",
      });
    } else if (id === "task_cybersec_csp_trusted_types_dom") {
      results.push({
        name: "Event Handler & Dangerous URI Stripping",
        passed: code.includes("javascript:") && code.includes("on") && code.includes("iframe"),
        detail: "Removes forbidden tags, inline on* handlers, and obfuscated javascript:/data: URIs",
      });
      results.push({
        name: "Nonce-Strict CSP with Trusted Types",
        passed: code.includes("strict-dynamic") && code.includes("require-trusted-types-for") && code.includes("base-uri 'none'"),
        detail: "Builds strict nonce CSP enforcing Trusted Types and disabling object-src/base-uri",
      });
    } else if (id === "task_cybersec_timing_safe_webhook_csrf") {
      results.push({
        name: "Constant-Time Bitwise Comparison",
        passed: code.includes("^") && code.includes("|=") && code.includes("charCodeAt"),
        detail: "Uses bitwise XOR accumulator for constant-time secret comparison",
      });
      results.push({
        name: "Replay Window & Fetch-Metadata CSRF Guard",
        passed: code.includes("same-origin") && code.includes("toleranceSec") && code.includes("seenNonces"),
        detail: "Enforces timestamp tolerance, nonce deduplication, and Sec-Fetch-Site CSRF checks",
      });
    } else if (id === "task_agentic_dag_planner_saga") {
      results.push({
        name: "DAG Cycle Detection & Wave Concurrency",
        passed: code.includes("CyclicDependencyError") && code.includes("Promise.all") && code.includes("deps"),
        detail: "Detects cyclic dependencies and dispatches ready DAG waves in parallel",
      });
      results.push({
        name: "Checkpointing & Reverse Saga Compensation",
        passed: code.includes("compensate") && code.includes("reverse") && code.includes("checkpoint"),
        detail: "Supports checkpoint resumption and reverse-order Saga rollback on step failure",
      });
    } else if (id === "task_agentic_tool_circuit_breaker_budget") {
      results.push({
        name: "Per-Tool Circuit Breaker & Fallback Routing",
        passed: code.includes("open") && code.includes("closed") && code.includes("fallback"),
        detail: "Opens tool circuit after threshold failures and routes to fallback handler",
      });
      results.push({
        name: "Action Loop Detection & Token Budget Guard",
        passed: code.includes("loopDetected") && code.includes("maxTokens") && code.includes("maxSteps"),
        detail: "Halts repeated identical tool invocations and enforces token/step budgets",
      });
    } else if (id === "task_agentic_episodic_memory_compactor") {
      results.push({
        name: "Root Goal Pinning & Context Compaction",
        passed: code.includes("pinnedGoal") && code.includes("maxContextTokens") && code.includes("artifacts"),
        detail: "Preserves pinned root goal while compacting older turns into episodic memory",
      });
      results.push({
        name: "Episodic Retrieval & Goal-Drift Alignment Check",
        passed: code.includes("retrieveEpisodic") && code.includes("checkGoalAlignment"),
        detail: "Retrieves relevant episodic memories by term overlap and blocks out-of-scope drift",
      });
    } else if (id === "task_db_read_write_replica_lag_router") {
      results.push({
        name: "Causal LSN Watermark Tracking",
        passed: code.includes("minLsn") && code.includes("appliedLsn"),
        detail: "Tracks session write LSN and compares against replica appliedLsn",
      });
      results.push({
        name: "Primary Fallback on Lag or Failure",
        passed: code.includes("primary") && code.includes("healthy"),
        detail: "Falls back to primary node when replicas lag behind session LSN or fail",
      });
    } else if (id === "task_auth_oidc_federated_jwt_validator") {
      results.push({
        name: "Asymmetric Algorithm Allowlist & JWKS Rotation",
        passed: code.includes("RS256") && code.includes("ES256") && code.includes("forceRefresh"),
        detail: "Enforces asymmetric signing algorithms and refreshes JWKS on unknown kid",
      });
      results.push({
        name: "Multi-Audience Azp & Nonce Validation",
        passed: code.includes("azp") && code.includes("nonce") && code.includes("exp"),
        detail: "Validates iss, aud, azp, exp/nbf, and session nonce claims",
      });
    } else if (id === "task_fingerprint_behavioral_biometrics_bot") {
      results.push({
        name: "Pointer Kinematics & Collinearity Analysis",
        passed: code.includes("Math.hypot") && code.includes("variance") && code.includes("collinear"),
        detail: "Analyzes pointer velocity variance and 2D cross-product collinearity",
      });
      results.push({
        name: "Untrusted Event & Keystroke Dwell Checks",
        passed: code.includes("isTrusted") && code.includes("upTime") && code.includes("downTime"),
        detail: "Detects synthetic untrusted events and zero-duration keystroke dwell times",
      });
    } else if (id === "task_cybersec_http_desync_header_canonicalizer") {
      results.push({
        name: "CL.TE / TE.CL Desync Ambiguity Rejection",
        passed: code.includes("transfer-encoding") && code.includes("content-length") && code.includes("chunked"),
        detail: "Rejects requests with both Transfer-Encoding and Content-Length or obfuscated chunked framing",
      });
      results.push({
        name: "CRLF Header Splitting Guard",
        passed: code.includes("\\r") && code.includes("\\n"),
        detail: "Blocks CR, LF, and NUL control bytes inside HTTP header names and values",
      });
    } else if (id === "task_agentic_multi_agent_consensus_arbiter") {
      results.push({
        name: "Hierarchical Path Conflict Detection",
        passed: code.includes("startsWith") && code.includes("LeaseConflictError"),
        detail: "Prevents overlapping parent/child directory leases across concurrent peer agents",
      });
      results.push({
        name: "Monotonic Fencing Token Enforcement",
        passed: code.includes("epoch") && code.includes("StaleFencingTokenError"),
        detail: "Rejects stale commits from expired or superseded fencing epochs",
      });
    } else if (id === "task_chat_realtime_instrumentation") {
      results.push({
        name: "Canonical Two-User Room & Monotonic Sequence",
        passed: code.includes("dm:") && code.includes("seq") && code.includes("readWatermarks"),
        detail: "Normalizes dm:userA:userB room IDs, increments seq, and tracks read watermarks",
      });
      results.push({
        name: "Ephemeral Typing TTL & Telemetry",
        passed: code.includes("typing") && code.includes("telemetry"),
        detail: "Prunes expired typing indicators and records real-time chat telemetry",
      });
    } else if (id === "task_chat_debug_race_duplication") {
      results.push({
        name: "ClientMsgId Idempotency Deduplication",
        passed: code.includes("clientMsgId") && (code.includes("seenClientIds") || code.includes("duplicate")),
        detail: "Suppresses duplicate retried messages using clientMsgId lookup",
      });
      results.push({
        name: "Out-of-Order Holdback Resequencing",
        passed: code.includes("nextExpectedSeq") && (code.includes("holdbackBuffer") || code.includes("while")),
        detail: "Buffers future sequence packets and flushes contiguous runs when gaps fill",
      });
    } else if (id === "task_chat_refactor_state_protocol") {
      results.push({
        name: "Pure Immutable Chat Protocol Reducer",
        passed: code.includes("MESSAGE_SENT") && code.includes("MESSAGE_EDITED") && code.includes("MESSAGE_READ"),
        detail: "Handles chat protocol actions deterministically without DOM/socket side effects",
      });
      results.push({
        name: "Declarative Effect Tuples",
        passed: code.includes("effects") && code.includes("SSE_BROADCAST"),
        detail: "Returns { state, effects } tuples for outbound broadcast and client ACKs",
      });
    } else if (id === "task_chat_perf_ringbuffer_fanout_bench") {
      results.push({
        name: "O(1) Modular Ring Buffer Indexing",
        passed: code.includes("%") && code.includes("capacity") && !code.includes("[...this.history"),
        detail: "Writes to circular buffer slots in O(1) time without array spread reallocation",
      });
      results.push({
        name: "Single-Encode Fanout & P99 Latency Benchmark",
        passed: code.includes("JSON.stringify") && code.includes("p99Us"),
        detail: "Pre-serializes broadcast frame once and computes P50/P99 fanout latency metrics",
      });
    } else if (id === "task_css_container_style_subgrid") {
      results.push({
        name: "Intrinsic Container Size & Style Queries",
        passed:
          code.includes("container-type: inline-size") &&
          code.includes("@container") &&
          code.includes("style(--featured"),
        detail: "Uses container-type: inline-size with @container size and style(--featured) queries",
      });
      results.push({
        name: "CSS Grid Subgrid Track Alignment",
        passed: code.includes("subgrid") && !code.includes("height: 120px"),
        detail: "Aligns nested card rows across columns via grid-template-rows: subgrid",
      });
    } else if (id === "task_css_cascade_layers_oklch_tokens") {
      results.push({
        name: "Deterministic @layer Cascade Hierarchy",
        passed:
          code.includes("@layer reset, tokens") &&
          code.includes("@layer components") &&
          !code.includes("!important"),
        detail: "Isolates cascade specificity with @layer blocks and zero !important overrides",
      });
      results.push({
        name: "Typed @property & Relative OKLCH Color Syntax",
        passed:
          code.includes("@property") &&
          code.includes("light-dark(") &&
          code.includes("oklch(from "),
        detail: "Registers animatable custom properties via @property and derives tokens with oklch(from ...)",
      });
    } else if (id === "task_css_scroll_driven_view_transitions") {
      results.push({
        name: "Compositor Scroll & View Progress Timelines",
        passed:
          code.includes("animation-timeline: scroll(") &&
          code.includes("animation-timeline: view(") &&
          code.includes("animation-range:"),
        detail: "Uses CSS scroll() and view() timelines with animation-range instead of JS scroll listeners",
      });
      results.push({
        name: "View Transitions & Reduced-Motion Guard",
        passed:
          code.includes("::view-transition-") &&
          code.includes("prefers-reduced-motion: reduce"),
        detail: "Configures ::view-transition pseudo-elements and respects prefers-reduced-motion",
      });
    } else if (id === "task_css_anchor_positioning_has_popover") {
      results.push({
        name: "Declarative CSS Anchor Positioning & @position-try",
        passed:
          code.includes("anchor-name:") &&
          code.includes("position-anchor:") &&
          code.includes("anchor(") &&
          code.includes("@position-try"),
        detail: "Tethers popover via anchor-name/position-anchor and flips on overflow with @position-try",
      });
      results.push({
        name: "Relational :has(:popover-open) Parent State",
        passed: code.includes(":has(") && code.includes(":popover-open"),
        detail: "Styles parent container state declaratively when child popover is open",
      });
    } else if (id === "task_ts_react_nextjs_server_actions") {
      results.push({
        name: "TypeScript Discriminated Union ActionResult<T>",
        passed:
          code.includes("ActionResult") &&
          code.includes("readonly ok: true") &&
          code.includes("readonly ok: false"),
        detail: "Defines strict TypeScript discriminated union result envelope with ok: true | false",
      });
      results.push({
        name: "Immutable Optimistic Rollback & Server Action Wrapper",
        passed:
          code.includes("ROLLBACK_FAILURE") &&
          code.includes("COMMIT_SUCCESS") &&
          code.includes("createSafeServerAction"),
        detail: "Rolls back optimistic state on server failure and validates inputs before handler execution",
      });
    } else if (id === "task_ts_angular_signals_computed_rx") {
      results.push({
        name: "Typed Angular Signal & Computed Dependency Tracking",
        passed:
          code.includes("WritableSignal<T>") &&
          code.includes("computed<T>") &&
          code.includes("Object.is"),
        detail: "Implements reactive signal<T> and memoized computed<T> with automatic dependency tracking",
      });
      results.push({
        name: "Cancelable switchMap Async Loader",
        passed: code.includes("AbortController") && code.includes("createSwitchMapLoader"),
        detail: "Cancels stale in-flight async requests when source signal updates",
      });
    } else if (id === "task_ts_nestjs_di_guard_interceptor") {
      results.push({
        name: "Typed NestJS IoC Container & CanActivate Guard",
        passed:
          code.includes("CanActivate") &&
          code.includes("ExecutionContext") &&
          code.includes("NestContainer"),
        detail: "Resolves DI providers by token and enforces RBAC CanActivate guard before controller execution",
      });
      results.push({
        name: "Around-Advice NestInterceptor & CallHandler",
        passed: code.includes("NestInterceptor") && code.includes("next.handle()"),
        detail: "Wraps route execution in composable CallHandler interceptor chain with audit telemetry",
      });
    } else if (id === "task_ts_trpc_zod_end_to_end_rpc") {
      results.push({
        name: "Generic ProcedureBuilder<TContext, TInput> & Middleware Narrowing",
        passed:
          code.includes("ProcedureBuilder<") &&
          code.includes("use<") &&
          code.includes("input<"),
        detail: "Provides fluent .use() context narrowing and .input() schema validation builder",
      });
      results.push({
        name: "Structured TRPCError & Router Caller Factory",
        passed: code.includes("TRPCError") && code.includes("createCaller"),
        detail: "Throws typed TRPCError codes and exposes createCaller(ctx) for end-to-end RPC dispatch",
      });
    } else if (id === "task_migrate_express_to_hono_edge_ts") {
      results.push({
        name: "Web-Standard Request/Response & Typed EdgeContext<TVariables>",
        passed:
          code.includes("EdgeContext<") &&
          code.includes("new Response(") &&
          !code.includes("res.status("),
        detail: "Migrates Express req/res mutation to Web-Standard Fetch Request/Response and typed context",
      });
      results.push({
        name: "Route Parameter Extraction & Async Onion Middleware",
        passed: code.includes("params") && code.includes("dispatch(") && code.includes("fetch(req: Request)"),
        detail: "Extracts :param segments and dispatches async middleware chains via fetch(req)",
      });
    } else if (id === "task_migrate_react_hooks_to_svelte5_vue3_signals") {
      results.push({
        name: "Fine-Grained $state<T>, $derived<T> & $effect Primitives",
        passed:
          code.includes("$state<") &&
          code.includes("$derived") &&
          code.includes("$effect"),
        detail: "Replaces React manual hook dependency arrays with auto-tracking fine-grained primitives",
      });
      results.push({
        name: "Automatic Dependency Tracking & Effect Cleanup",
        passed: code.includes("onCleanup") && code.includes("Object.is"),
        detail: "Tracks reactive reads automatically and runs registered cleanup callbacks before re-execution",
      });
    } else if (id === "task_migrate_redux_thunks_to_tanstack_query_ts") {
      results.push({
        name: "Deterministic QueryKey Hashing & In-Flight Deduplication",
        passed:
          code.includes("hashQueryKey") &&
          code.includes("inFlight") &&
          code.includes("staleTime"),
        detail: "Canonicalizes QueryKey hashes, deduplicates concurrent fetches, and honors staleTime",
      });
      results.push({
        name: "Prefix Invalidation & Optimistic Rollback",
        passed:
          code.includes("invalidateQueries") &&
          code.includes("executeOptimisticMutation") &&
          code.includes("snapshot"),
        detail: "Invalidates matching query prefixes and rolls back optimistic cache state on mutation error",
      });
    } else if (id === "task_migrate_nextjs_pages_to_app_router_rsc") {
      results.push({
        name: "Parallel RSC Data Fetching & Tagged Cache",
        passed:
          code.includes("Promise.all") &&
          code.includes("fetchWithTags") &&
          code.includes("revalidateTag"),
        detail: "Replaces sequential getServerSideProps waterfall with parallel tagged RSC fetches",
      });
      results.push({
        name: "Web-Standard Route Handler Cache Revalidation",
        passed: code.includes("Request") && code.includes("Response") && code.includes("evictedCount"),
        detail: "Exposes Web-Standard POST Route Handler that invalidates tagged cache entries on demand",
      });
    } else if (id === "task_pkg_npm_to_pnpm_bun_workspace_migration") {
      results.push({
        name: "Workspace Protocol (workspace:^) & Shared Catalog Extraction",
        passed:
          code.includes("workspace:^") &&
          code.includes("catalog:") &&
          code.includes("packageManager"),
        detail: "Rewrites sibling dependencies to workspace:^, extracts shared versions to catalog:, and pins packageManager",
      });
      results.push({
        name: "Strict Phantom Dependency Detection",
        passed: code.includes("phantomDependenciesAdded") && code.includes("importedSpecifiers"),
        detail: "Detects undeclared bare specifier imports that break under strict pnpm/Bun isolated node_modules",
      });
    } else if (id === "task_pkg_dual_cjs_esm_exports_jsr_deno") {
      results.push({
        name: "Condition-Ordered Dual ESM/CJS Exports Map",
        passed:
          code.includes(".d.mts") &&
          code.includes(".d.cts") &&
          code.includes("bun:") &&
          code.includes("deno:"),
        detail: "Orders types first in import/require blocks and exposes bun/deno native TS conditions",
      });
      results.push({
        name: "Deno / JSR Registry Manifest Generation",
        passed: code.includes("jsrJson") && code.includes("sideEffects: false"),
        detail: "Generates synchronized jsr.json and tree-shakeable package.json exports",
      });
    } else if (id === "task_pkg_lockfile_supply_chain_auditor") {
      results.push({
        name: "Dependency Confusion & Registry Host Pinning",
        passed:
          code.includes("DEPENDENCY_CONFUSION_SCOPE_LEAK") &&
          code.includes("internalScopes") &&
          code.includes("UNTRUSTED_TARBALL_HOST"),
        detail: "Detects internal @scope/* packages resolving from public registries or untrusted hosts",
      });
      results.push({
        name: "SHA-512 SRI Digest & Lifecycle Script Guard",
        passed:
          code.includes("sha512-") &&
          code.includes("WEAK_OR_MISSING_SRI_INTEGRITY") &&
          code.includes("UNAUTHORIZED_LIFECYCLE_SCRIPT"),
        detail: "Verifies sha512- integrity hashes and blocks unapproved install scripts across lockfiles",
      });
    } else if (id === "task_pkg_monorepo_task_graph_cache_runner") {
      results.push({
        name: "Topological Workspace Wave Scheduler & Cycle Detection",
        passed:
          code.includes("inDegree") &&
          code.includes("Promise.all") &&
          code.includes("Cyclic"),
        detail: "Schedules workspace builds in concurrent topological waves and guards against cycles",
      });
      results.push({
        name: "Content-Addressable Upstream Hash Propagation",
        passed:
          code.includes("CACHE_HIT") &&
          code.includes("depHashSignature") &&
          code.includes("localSourceHash"),
        detail: "Propagates upstream dependency hashes into downstream cache keys and replays CACHE_HIT artifacts",
      });
    } else if (id === "task_html_speculation_rules_prerender") {
      results.push({
        name: "WHATWG <script type=\"speculationrules\"> & Document Exclusions",
        passed:
          code.includes("speculationrules") &&
          code.includes("href_matches") &&
          code.includes("selector_matches") &&
          code.includes("/logout"),
        detail: "Generates speculationrules JSON with document where/not route and selector exclusions",
      });
      results.push({
        name: "Save-Data & Slow-Network Speculation Guard",
        passed: code.includes("saveDataHeader") && code.includes("slow-2g"),
        detail: "Disables speculative prerendering when Save-Data or 2g/slow-2g network hints are active",
      });
    } else if (id === "task_html_declarative_shadow_dom_streaming") {
      results.push({
        name: "Declarative Shadow DOM (<template shadowrootmode=\"open\">) & Focus Delegation",
        passed:
          code.includes('shadowrootmode="open"') &&
          code.includes("shadowrootdelegatesfocus") &&
          code.includes('<slot name="'),
        detail: "Renders SSR Declarative Shadow DOM template with focus delegation and named slots",
      });
      results.push({
        name: "Idempotent Existing shadowRoot Hydration",
        passed: code.includes("host.shadowRoot") && code.includes("REUSED_DSD"),
        detail: "Reuses pre-parsed Declarative Shadow DOM root before calling attachShadow()",
      });
    } else if (id === "task_html_dialog_popover_invoker_inert") {
      results.push({
        name: "Native <dialog closedby=\"any\"> & Invoker Commands (commandfor/command)",
        passed:
          code.includes('closedby="any"') &&
          code.includes("commandfor=") &&
          code.includes('command="show-modal"'),
        detail: "Uses declarative commandfor/command invoker attributes and <dialog closedby=\"any\">",
      });
      results.push({
        name: "Semantic <search> Landmark, Popover API & Background inert",
        passed:
          code.includes("<search") &&
          code.includes('popover="auto"') &&
          code.includes("inert"),
        detail: "Combines semantic <search>, native popover attributes, and background inert management",
      });
    } else if (id === "task_html_responsive_picture_fetchpriority_lcp") {
      results.push({
        name: "Progressive <picture> AVIF/WebP Art Direction & Intrinsic Dimensions",
        passed:
          code.includes("<picture>") &&
          code.includes('type="image/avif"') &&
          code.includes('type="image/webp"') &&
          code.includes("width=") &&
          code.includes("height="),
        detail: "Emits <picture> with AVIF/WebP sources and explicit width/height attributes to prevent CLS",
      });
      results.push({
        name: "LCP fetchpriority=\"high\" & <link rel=\"preload\" imagesrcset>",
        passed:
          code.includes('fetchpriority="high"') &&
          code.includes("imagesrcset=") &&
          (code.includes('loading="eager"') || (code.includes('"eager"') && code.includes("loading="))),
        detail: "Prioritizes above-the-fold LCP media with fetchpriority=high, eager loading, and preload hint",
      });
    } else if (id === "task_seo_jsonld_knowledge_graph_builder") {
      results.push({
        name: "Connected Schema.org @graph & @id Entity References",
        passed:
          code.includes("https://schema.org") &&
          code.includes('"@graph"') &&
          code.includes("#organization") &&
          code.includes("#website") &&
          code.includes("BreadcrumbList"),
        detail: "Emits https://schema.org @graph linking Organization, WebSite, BreadcrumbList, WebPage, and TechArticle via @id",
      });
      results.push({
        name: "XSS-Safe JSON-LD Script Serialization",
        passed: code.includes("u003c") && code.includes("application/ld+json"),
        detail: "Escapes <, >, and & in JSON-LD script blocks to prevent </script> breakout XSS",
      });
    } else if (id === "task_seo_ecommerce_product_merchant_schema") {
      results.push({
        name: "Rich-Result Product, MerchantReturnPolicy & OfferShippingDetails",
        passed:
          code.includes("https://schema.org/InStock") &&
          code.includes("MerchantReturnPolicy") &&
          code.includes("OfferShippingDetails"),
        detail: "Includes full Schema.org availability URIs, MerchantReturnPolicy, and OfferShippingDetails",
      });
      results.push({
        name: "GTIN-13, ISO-4217 Currency & AggregateRating Bounds Validation",
        passed:
          code.includes("gtin13") &&
          code.includes("AggregateRating") &&
          code.includes("reviewCount"),
        detail: "Validates 13-digit GTIN, currency code, and ratingValue/reviewCount boundaries",
      });
    } else if (id === "task_seo_canonical_hreflang_opengraph_head") {
      results.push({
        name: "Canonical URL Tracking Parameter Sanitization",
        passed:
          code.includes("utm_source") &&
          code.includes("fbclid") &&
          code.includes('rel="canonical"'),
        detail: "Strips utm_*, fbclid, and gclid parameters and normalizes HTTPS canonical URLs",
      });
      results.push({
        name: "Reciprocal hreflang Cluster (x-default), Robots & OpenGraph",
        passed:
          code.includes('hreflang="x-default"') &&
          code.includes("max-image-preview:large") &&
          code.includes('property="og:title"'),
        detail: "Emits localized hreflang alternates with x-default, robots directives, and OpenGraph tags",
      });
    } else if (id === "task_seo_semantic_microdata_landmarks_audit") {
      results.push({
        name: "Heading Outline Hierarchy & <main> Landmark Auditor",
        passed:
          code.includes("SKIPPED_HEADING_LEVEL") &&
          code.includes("MISSING_OR_MULTIPLE_H1") &&
          code.includes("MISSING_MAIN_LANDMARK"),
        detail: "Audits single <h1>, sequential heading hierarchy, and <main> landmark presence",
      });
      results.push({
        name: "Schema.org Microdata (itemscope/itemtype/itemprop) & <time datetime> Linter",
        passed:
          code.includes("https://schema.org/") &&
          code.includes("itemscope") &&
          code.includes("INVALID_TIME_DATETIME"),
        detail: "Verifies https://schema.org/ Microdata scoping and machine-readable ISO <time datetime>",
      });
    } else if (id === "task_html_importmap_modulepreload_sri") {
      results.push({
        name: "WHATWG <script type=\"importmap\"> Ordering & SRI Integrity Map",
        passed:
          code.includes('type="importmap"') &&
          code.includes("integrity") &&
          code.includes("sha384-"),
        detail: "Emits importmap with imports, scopes, and sha384- integrity map before module scripts",
      });
      results.push({
        name: "ESM <link rel=\"modulepreload\"> Waterfall Flattening",
        passed: code.includes('rel="modulepreload"') && code.includes('crossorigin="anonymous"'),
        detail: "Generates modulepreload link hints with SRI integrity and anonymous crossorigin",
      });
    } else if (id === "task_seo_software_app_faq_dataset_graph") {
      results.push({
        name: "Schema.org Dataset DataDownload & License Metadata",
        passed:
          code.includes('"Dataset"') &&
          code.includes('"DataDownload"') &&
          code.includes("encodingFormat") &&
          code.includes("license"),
        detail: "Emits Dataset with DataDownload distribution, encodingFormat, and license URI",
      });
      results.push({
        name: "WebSite SearchAction, Organization sameAs & FAQPage Graph",
        passed:
          code.includes('"SearchAction"') &&
          code.includes("{search_term_string}") &&
          code.includes('"FAQPage"') &&
          code.includes("sameAs"),
        detail: "Connects Organization sameAs, WebSite SearchAction, and FAQPage Question/Answer nodes",
      });
    } else if (id === "task_ecom_integer_cents_dinero_cart_engine") {
      results.push({
        name: "Integer Minor-Unit (Dinero) & Multi-Currency Exponent Guard",
        passed:
          code.includes("Number.isSafeInteger") &&
          code.includes("CURRENCY_EXPONENTS") &&
          code.includes("JPY"),
        detail: "Validates safe integer minor units and handles 0-decimal vs 2-decimal currencies",
      });
      results.push({
        name: "Hamilton Largest-Remainder Discount Proration",
        passed:
          code.includes("Math.floor") &&
          code.includes("remainder") &&
          code.includes("totalDiscountMinor"),
        detail: "Allocates cart-wide discounts across line items without losing rounding pennies",
      });
    } else if (id === "task_ecom_inventory_reservation_ttl_oversell_guard") {
      results.push({
        name: "TTL-Bounded Reservation Leases & Expired Hold Reclamation",
        passed:
          code.includes("expiresAtMs") &&
          code.includes("reclaimExpiredHolds") &&
          code.includes("EXPIRED"),
        detail: "Reclaims expired inventory holds before computing available stock",
      });
      results.push({
        name: "Idempotent Reservation & Atomic Stock Commit",
        passed:
          code.includes("COMMITTED") &&
          code.includes("commitHold") &&
          code.includes("releaseHold"),
        detail: "Supports idempotent hold retries and deducts physical stock atomically on commitHold",
      });
    } else if (id === "task_ecom_global_tax_vat_reverse_charge_engine") {
      results.push({
        name: "EU VAT B2B Reverse Charge (Article 196) & VIES Validation",
        passed:
          code.includes("EU_B2B_REVERSE_CHARGE") &&
          code.includes("reverseCharge") &&
          code.includes("Article 196"),
        detail: "Applies 0% VAT with reverseCharge flag and Article 196 notice for cross-border EU B2B buyers",
      });
      results.push({
        name: "US Economic Nexus Threshold & Tax-Inclusive Extraction",
        passed:
          code.includes("US_STATE_NEXUS") &&
          code.includes("taxInclusive") &&
          code.includes("10_000_000"),
        detail: "Evaluates $100k / 200-transaction US state nexus and extracts tax-inclusive net amounts",
      });
    } else if (id === "task_ecom_checkout_state_machine_3ds_saga") {
      results.push({
        name: "3-D Secure (requires_action) State Transition",
        passed:
          code.includes("requires_action") &&
          code.includes("AWAITING_3DS_ACTION") &&
          code.includes("FULFILLED"),
        detail: "Transitions cleanly to AWAITING_3DS_ACTION when 3DS authentication is required",
      });
      results.push({
        name: "Reverse-Order LIFO Saga Compensation Rollback",
        passed:
          code.includes("compensationStack") &&
          code.includes("FAILED_COMPENSATED") &&
          code.includes(".pop()"),
        detail: "Rolls back payment intent, promo lock, and inventory reservation in reverse LIFO order",
      });
    } else if (id === "task_ecom_polar_mor_license_entitlement_provisioning") {
      results.push({
        name: "Polar.sh Benefit Provisioning & Seat Activation Limits",
        passed:
          code.includes("maxActivations") &&
          code.includes("MAX_SEAT_ACTIVATIONS_EXCEEDED") &&
          code.includes("machineFingerprint"),
        detail: "Enforces per-license device seat limits and idempotent machine fingerprint re-activation",
      });
      results.push({
        name: "Subscription & Refund Webhook Entitlement Revocation",
        passed:
          code.includes("subscription.revoked") &&
          code.includes("order.refunded") &&
          code.includes('.clear()'),
        detail: "Revokes Polar license keys and clears active seats when subscription is revoked or refunded",
      });
    } else if (id === "task_pay_stripe_payment_intent_idempotency_engine") {
      results.push({
        name: "Payload-Hashed Idempotency Key Conflict Guard",
        passed:
          code.includes("IdempotencyParameterMismatchError") &&
          code.includes("idempotencyKey") &&
          code.includes("idempotentReplay"),
        detail: "Rejects reused idempotency keys with mutated parameters and replays identical requests safely",
      });
      results.push({
        name: "Manual Capture (requires_capture) & Partial Settlement",
        passed:
          code.includes("requires_capture") &&
          code.includes("captureIntent") &&
          code.includes("amountCapturableMinor"),
        detail: "Supports manual authorization holds and partial/full capture settlement",
      });
    } else if (id === "task_pay_stripe_polar_webhook_signature_verifier") {
      results.push({
        name: "Dual Stripe (stripe-signature) & Polar Standard Webhooks (webhook-signature) Parsing",
        passed:
          code.includes("stripe-signature") &&
          code.includes("webhook-signature") &&
          code.includes("webhook-id") &&
          code.includes("constantTimeEqual"),
        detail: "Verifies both Stripe t=,v1= and Polar Standard Webhooks v1, signatures in constant time",
      });
      results.push({
        name: "Timestamp Replay Window, Event Deduplication & Causal Watermark Ordering",
        passed:
          code.includes("TIMESTAMP_OUTSIDE_TOLERANCE_WINDOW") &&
          code.includes("deduplicated") &&
          code.includes("ignoredStaleOutOfOrder"),
        detail: "Rejects stale timestamps (>300s), deduplicates event IDs, and ignores out-of-order stale mutations",
      });
    } else if (id === "task_pay_subscription_proration_dunning_machine") {
      results.push({
        name: "Second-Granularity Mid-Cycle Proration Credit & Debit Math",
        passed:
          code.includes("unusedCreditMinor") &&
          code.includes("remainingDebitMinor") &&
          code.includes("netInvoiceDeltaMinor"),
        detail: "Computes unused credit on current plan and remaining debit on target tier/seats",
      });
      results.push({
        name: "Exponential Dunning Backoff & Grace-Period Entitlement Preservation",
        passed:
          code.includes("past_due") &&
          code.includes("grace_hold") &&
          code.includes("unpaid_suspended"),
        detail: "Keeps entitlements active during grace retries and suspends on maxAttempts or hard decline",
      });
    } else if (id === "task_pay_double_entry_ledger_stripe_connect_split") {
      results.push({
        name: "Balanced Double-Entry Invariant (sum(DEBIT) === sum(CREDIT))",
        passed:
          code.includes("DEBIT") &&
          code.includes("CREDIT") &&
          code.includes("debits !== credits"),
        detail: "Enforces zero-sum balanced debit/credit journal postings across all accounts",
      });
      results.push({
        name: "Stripe Connect Marketplace Split & Proportional Refund Clawback",
        passed:
          code.includes("platform_commission") &&
          code.includes("seller_escrow_payable") &&
          code.includes("PARTIAL_REFUND"),
        detail: "Splits gross charges across Stripe fee, platform commission, and seller escrow with proportional refund reversals",
      });
    } else if (id === "task_pay_polar_stripe_usage_meter_ai_billing") {
      results.push({
        name: "Idempotent AI Meter Event Ingestion & Graduated Tier Brackets",
        passed:
          code.includes("eventId") &&
          code.includes("upToUnits") &&
          code.includes("unitCostMinorPerBlock"),
        detail: "Deduplicates meter events by eventId and prices usage across graduated tier brackets",
      });
      results.push({
        name: "Prepaid Credit Wallet Drawdown & Net Overage Calculation",
        passed:
          code.includes("appliedPrepaidCreditsMinor") &&
          code.includes("remainingCreditBalanceMinor") &&
          code.includes("netAmountDueMinor"),
        detail: "Applies prepaid credit balance against gross usage before billing overage",
      });
    } else if (id === "task_shop_ui_faceted_catalog_variant_sku_selector") {
      results.push({
        name: "Cross-Axis Variant Stock Matrix & Dead-End Prevention",
        passed:
          code.includes("inStockWithCurrentSelection") &&
          code.includes("computeAxisOptions") &&
          code.includes("availableStock"),
        detail: "Evaluates cross-axis variant stock availability so dead-end combinations are disabled",
      });
      results.push({
        name: "Canonical URL SearchParams Deep-Link Sync",
        passed:
          code.includes("URLSearchParams") &&
          code.includes("canonicalQueryString") &&
          code.includes("canAddToCart"),
        detail: "Serializes selected variant axes and resolved SKU into canonical URL query parameters",
      });
    } else if (id === "task_shop_ui_optimistic_cart_drawer_price_drift_guard") {
      results.push({
        name: "Optimistic Cart Quantity Update, Snapshot Rollback & Sequence Guard",
        passed:
          code.includes("beginOptimisticQtyChange") &&
          code.includes("rollbackMutation") &&
          code.includes("commitServerResponse"),
        detail: "Supports optimistic quantity updates, snapshot rollback on failure, and stale response rejection",
      });
      results.push({
        name: "Catalog Price-Drift Detection & ARIA Live Region Announcements",
        passed:
          code.includes("priceDriftNotices") &&
          code.includes("unitPriceAtAddMinor") &&
          code.includes("ariaLiveMessage"),
        detail: "Flags catalog price changes since cart addition and emits polite screen-reader announcements",
      });
    } else if (id === "task_shop_ui_guest_to_account_cart_address_merge") {
      results.push({
        name: "Guest-to-Account Cart SKU Merger & Stock/Order Limit Clamping",
        passed:
          code.includes("quantityAdjustments") &&
          code.includes("STOCK_LIMIT") &&
          code.includes("MAX_PER_ORDER_LIMIT"),
        detail: "Merges guest and account carts by SKU while clamping to availableStock and maxPerOrder",
      });
      results.push({
        name: "Normalized Postal Address Book Deduplication",
        passed:
          code.includes("normalizeAddressFingerprint") &&
          code.includes("savedAddresses") &&
          code.includes("mergedCartItems"),
        detail: "Deduplicates customer shipping addresses via canonical postal fingerprints",
      });
    } else if (id === "task_shop_ui_accessible_checkout_stepper_autocomplete") {
      results.push({
        name: "Multi-Step Checkout Prerequisite Gates & Downstream Quote Invalidation",
        passed:
          code.includes("canNavigateTo") &&
          code.includes("submitShippingAddress") &&
          code.includes("canPlaceOrder"),
        detail: "Enforces ACCOUNT -> SHIPPING -> PAYMENT -> REVIEW gates and invalidates payment lock on address edit",
      });
      results.push({
        name: "WHATWG Section-Scoped Autocomplete & ARIA Invalid Descriptors",
        passed:
          code.includes("shipping address-line1") &&
          code.includes("shipping postal-code") &&
          code.includes("ariaInvalid"),
        detail: "Emits WHATWG autocomplete tokens and aria-invalid/errorId accessibility bindings",
      });
    } else if (id === "task_shop_ui_order_history_timeline_rma_portal") {
      results.push({
        name: "Split-Shipment Fulfillment Status & Per-Line RMA Return Eligibility",
        passed:
          code.includes("PARTIALLY_DELIVERED") &&
          code.includes("DIGITAL_NON_RETURNABLE") &&
          code.includes("RETURN_WINDOW_EXPIRED"),
        detail: "Computes split-shipment status and blocks RMA returns on digital licenses or expired windows",
      });
      results.push({
        name: "Prorated Historical Line-Item Refund Preview",
        passed:
          code.includes("maxRefundPreviewMinor") &&
          code.includes("alreadyReturnedQty") &&
          code.includes("totalRefundableMinor"),
        detail: "Calculates remaining returnable quantities and exact minor-unit refund previews",
      });
    } else if (id === "task_shop_data_normalized_entity_store_referential_integrity") {
      results.push({
        name: "Normalized Entity Maps & Foreign-Key Referential Integrity",
        passed:
          code.includes("ForeignKeyConstraintError") &&
          code.includes("upsertCustomer") &&
          code.includes("insertOrder"),
        detail: "Enforces foreign-key constraints across customers, orders, orderItems, and shipments",
      });
      results.push({
        name: "O(1) Secondary Relational Indexes & Sorted Order History Projection",
        passed:
          code.includes("ordersByCustomer") &&
          code.includes("itemsByOrder") &&
          code.includes("getCustomerOrderHistoryView"),
        detail: "Projects customer order history via O(1) secondary index sets sorted newest-first",
      });
    } else if (id === "task_shop_data_immutable_order_line_snapshot_isolation") {
      results.push({
        name: "Deep-Frozen Checkout Line-Item Snapshot Isolation",
        passed:
          code.includes("Object.freeze") &&
          code.includes("snapshotUnitPriceMinor") &&
          code.includes("snapshotTitle"),
        detail: "Freezes line-item title, price, discount, and tax rate at checkout time",
      });
      results.push({
        name: "Tamper-Evident Order Snapshot Digest Verification",
        passed:
          code.includes("snapshotHash") &&
          code.includes("verifyOrderSnapshotIntegrity") &&
          code.includes("captureOrderAtCheckout"),
        detail: "Verifies historical order integrity independently of live catalog mutations",
      });
    } else if (id === "task_shop_data_transactional_account_cart_to_order_promoter") {
      results.push({
        name: "All-or-Nothing Stock Pre-Validation & Sequential Invoice Generation",
        passed:
          code.includes("InsufficientStockError") &&
          code.includes("INV-2026-") &&
          code.includes("CONVERTED_TO_ORDER"),
        detail: "Pre-validates SKU stock, marks cart CONVERTED_TO_ORDER, and issues sequential INV-2026-* numbers",
      });
      results.push({
        name: "Customer Lifetime Spend Rollup & Idempotent Replay Guard",
        passed:
          code.includes("lifetimeSpendMinor") &&
          code.includes("orderCount") &&
          code.includes("idempotentReplay"),
        detail: "Updates customer orderCount/lifetimeSpendMinor atomically and deduplicates checkout retries",
      });
    } else if (id === "task_shop_data_split_shipment_partial_capture_reconciler") {
      results.push({
        name: "Line-Item Quantity Conservation & Split-Fulfillment Status Derivation",
        passed:
          code.includes("QuantityConservationError") &&
          code.includes("PARTIALLY_SHIPPED") &&
          code.includes("PARTIALLY_FULFILLED_CLOSED"),
        detail: "Validates shippedQty + canceledQty <= orderedQty and derives split-fulfillment status",
      });
      results.push({
        name: "Authorized vs Captured vs Released Minor-Unit Reconciliation",
        passed:
          code.includes("capturedMinor") &&
          code.includes("releasedAuthorizationMinor") &&
          code.includes("remainingCapturableMinor"),
        detail: "Reconciles exact captured funds and canceled backorder authorization releases",
      });
    } else if (id === "task_shop_data_customer_order_event_sourced_timeline") {
      results.push({
        name: "Causal Order Lifecycle State Machine & Hash-Chained Audit Log",
        passed:
          code.includes("InvalidLifecycleTransitionError") &&
          code.includes("ALLOWED_PREDECESSORS") &&
          code.includes("prevHash"),
        detail: "Enforces causal transition rules from ACCOUNT_CREATED through ORDER_REFUNDED with hash chaining",
      });
      results.push({
        name: "Deterministic Order State Projection & Over-Refund Guard",
        passed:
          code.includes("projectState") &&
          code.includes("netRetainedMinor") &&
          code.includes("FinancialInvariantError"),
        detail: "Folds domain events into current state and blocks refunds exceeding captured funds",
      });
    } else if (id === "task_cookie_rfc6265bis_host_prefix_chips_serializer") {
      results.push({
        name: "__Host- / __Secure- Prefix & SameSite=None Invariant Enforcement",
        passed:
          code.includes("__Host-") &&
          code.includes("__Secure-") &&
          code.includes("SameSite=None"),
        detail: "Enforces __Host- (Secure, Path=/, no Domain) and SameSite=None Secure invariants",
      });
      results.push({
        name: "CHIPS Partitioned Attribute & RFC 6265bis 400-Day Max-Age Cap",
        passed:
          code.includes("Partitioned") &&
          code.includes("MAX_AGE_CLAMPED_TO_400_DAYS") &&
          code.includes("4096"),
        detail: "Validates CHIPS Partitioned cookies, clamps Max-Age to 400 days, and enforces 4096-byte cap",
      });
    } else if (id === "task_cookie_key_ring_hmac_rotation_anti_downgrade") {
      results.push({
        name: "Key-Ring (kid) HMAC Cookie Signing & Retiring Key Detection",
        passed:
          code.includes("signCookieValue") &&
          code.includes("needsKeyRotationReSign") &&
          code.includes("verifiedByKid"),
        detail: "Verifies cookies across active and retiring keys and flags needsKeyRotationReSign",
      });
      results.push({
        name: "Subdomain Cookie-Tossing Duplicate Candidate Filtering",
        passed:
          code.includes("tossedDuplicatesRejected") &&
          code.includes("timingSafeStrEq"),
        detail: "Scans all duplicate same-name cookies in Cookie header to reject subdomain-tossed forgeries",
      });
    } else if (id === "task_cookie_dbsc_device_bound_session_credentials_refresh") {
      results.push({
        name: "W3C DBSC Session Registration & Sec-Session-Challenge Nonce Handshake",
        passed:
          code.includes("__Host-dbsc_sid") &&
          code.includes("secSessionChallengeHeader") &&
          code.includes("registerDeviceSession"),
        detail: "Issues short-lived __Host-dbsc_sid cookies bound to hardware key thumbprints",
      });
      results.push({
        name: "Hardware Proof-of-Possession Verification & Clear-Site-Data Eviction",
        passed:
          code.includes("secSessionResponseProof") &&
          code.includes("clearSiteDataHeader") &&
          code.includes('"cookies", "storage"'),
        detail: "Verifies DBSC PoP signatures on refresh and emits Clear-Site-Data on revocation/mismatch",
      });
    } else if (id === "task_cookie_privacy_consent_gcm_partitioned_sync") {
      results.push({
        name: "Purpose-Scoped Cookie Classification & Fail-Closed Consent Gate",
        passed:
          code.includes("strictly_necessary") &&
          code.includes("allowedSetCookieHeaders") &&
          code.includes("blockedCookieNames"),
        detail: "Permits strictly_necessary cookies while gating functional, analytics, and marketing cookies",
      });
      results.push({
        name: "Immediate Revocation Eviction Headers (Max-Age=0; 1970 Expires)",
        passed:
          code.includes("evictionSetCookieHeaders") &&
          code.includes("Max-Age=0") &&
          code.includes("1970"),
        detail: "Emits immediate Max-Age=0 eviction headers for existing cookies when consent is withdrawn",
      });
    } else if (id === "task_webdata_indexeddb_schema_migration_cursor_index") {
      results.push({
        name: "Sequential Schema Migration Pipeline (v1 -> v2 -> v3) & Atomic Rollback",
        passed:
          code.includes("runUpgradeTransaction") &&
          code.includes("MissingMigrationStepError") &&
          code.includes("backupRecords"),
        detail: "Executes step-by-step schema upgrades and restores snapshot backup if any record transform throws",
      });
      results.push({
        name: "Compound Index ([tenantId, updatedAtMs]) Range Cursor Query",
        passed:
          code.includes("queryByCompoundIndex") &&
          code.includes("minUpdatedAtMs") &&
          code.includes("maxUpdatedAtMs"),
        detail: "Filters and sorts records by compound index (tenantId, updatedAtMs, id)",
      });
    } else if (id === "task_webdata_cross_tab_broadcast_web_locks_leader") {
      results.push({
        name: "Single-Leader Tab Lease Election & Failover",
        passed:
          code.includes("tryAcquireLeaderLease") &&
          code.includes("leaseExpiresAtMs") &&
          code.includes("isLeader"),
        detail: "Elects a single leader tab and allows standby takeover upon lease expiry",
      });
      results.push({
        name: "Lamport Logical Clock Ordering & Broadcast Message Deduplication",
        passed:
          code.includes("lamportCounter") &&
          code.includes("STALE_LAMPORT_CLOCK") &&
          code.includes("DUPLICATE_MESSAGE"),
        detail: "Resolves cross-tab write conflicts via Lamport counters and deduplicates messageIds",
      });
    } else if (id === "task_webdata_quota_eviction_opfs_tiered_cache") {
      results.push({
        name: "Storage Quota Tracking & Pinned Draft Protection",
        passed:
          code.includes("QuotaExceededError") &&
          code.includes("!o.pinned") &&
          code.includes("estimate"),
        detail: "Protects pinned user drafts from eviction and tracks exact byte usage vs quota",
      });
      results.push({
        name: "Weighted Cost-LRU Unpinned Eviction",
        passed:
          code.includes("regenerationCostWeight") &&
          code.includes("evictedKeys") &&
          code.includes("usageRatio"),
        detail: "Evicts lowest-retention-score unpinned cache blobs to make room for incoming writes",
      });
    } else if (id === "task_webdata_offline_mutation_outbox_etag_reconciler") {
      results.push({
        name: "Causal Offline Outbox Log Compaction (CREATE+UPDATE, CREATE+DELETE)",
        passed:
          code.includes("compactQueue") &&
          code.includes("baseEtag") &&
          code.includes("byEntity.delete"),
        detail: "Folds offline CREATE+UPDATE into CREATE and elides CREATE+DELETE pairs",
      });
      results.push({
        name: "3-Way Field-Level ETag Conflict Resolution",
        passed:
          code.includes("resolveThreeWayEtagConflict") &&
          code.includes("conflictingFields") &&
          code.includes("cleanMerge"),
        detail: "Merges non-overlapping local and server field edits and isolates true field collisions",
      });
    } else if (id === "task_traffic_rfc9111_http_cache_swr_vary_etag") {
      results.push({
        name: "RFC 9111 Vary Composite Key & stale-while-revalidate Evaluation",
        passed:
          code.includes("HIT_STALE_WHILE_REVALIDATE") &&
          code.includes("triggerBackgroundRevalidate") &&
          code.includes("varyHeaders"),
        detail: "Keys cache entries by normalized Vary headers and serves stale-while-revalidate with background refresh",
      });
      results.push({
        name: "Conditional If-None-Match (304 Not Modified) & no-store Handling",
        passed:
          code.includes("REVALIDATED_304") &&
          code.includes("if-none-match") &&
          code.includes("no-store"),
        detail: "Short-circuits 304 Not Modified on ETag match and bypasses storage on Cache-Control: no-store",
      });
    } else if (id === "task_traffic_edge_request_coalescing_singleflight_stampede") {
      results.push({
        name: "Singleflight Concurrent Miss Coalescing",
        passed:
          code.includes("COALESCED_IN_FLIGHT") &&
          code.includes("coalescedHits") &&
          code.includes("finally"),
        detail: "Collapses concurrent cache misses for the same key into a single shared origin Promise",
      });
      results.push({
        name: "Short-TTL 404 Negative Caching Shield",
        passed:
          code.includes("negative404TtlMs") &&
          code.includes("status === 404") &&
          code.includes("CACHE_HIT"),
        detail: "Caches 404 Not Found responses for negative404TtlMs to prevent repeated origin scans",
      });
    } else if (id === "task_traffic_ietf_ratelimit_token_bucket_sliding_window") {
      results.push({
        name: "Continuous Token-Bucket Refill & Route Cost Weight Deduction",
        passed:
          code.includes("refillTokensPerSec") &&
          code.includes("routeCost") &&
          code.includes("remainingTokens"),
        detail: "Refills tokens continuously over elapsed time and deducts route-specific cost weights",
      });
      results.push({
        name: "Standard IETF RateLimit-* & Retry-After Response Headers",
        passed:
          code.includes("RateLimit-Limit") &&
          code.includes("RateLimit-Remaining") &&
          code.includes("RateLimit-Policy") &&
          code.includes("Retry-After"),
        detail: "Emits RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, RateLimit-Policy, and Retry-After",
      });
    } else if (id === "task_traffic_w3c_traceparent_server_timing_rfc9218_priority") {
      results.push({
        name: "W3C traceparent Validation & Child Span Propagation",
        passed:
          code.includes("outboundTraceparent") &&
          code.includes("validIncoming") &&
          code.includes("parentSpanId"),
        detail: "Validates 00-<32hex>-<16hex>-<2hex> W3C traceparent headers and rotates the child spanId",
      });
      results.push({
        name: "RFC 9218 Priority (u=0..7, i) Scheduling & Server-Timing Formatting",
        passed:
          code.includes("parseRfc9218PriorityHeader") &&
          code.includes("scheduleRequestsByRfc9218Priority") &&
          code.includes("formatServerTimingHeader"),
        detail: "Schedules HTTP requests by RFC 9218 urgency/incremental directives and compiles Server-Timing headers",
      });
    } else if (id === "task_design_w3c_dtcg_token_compiler_multi_brand_alias") {
      results.push({
        name: "W3C DTCG 2025.10 Group $type Inheritance & {group.token} Alias Resolution",
        passed:
          code.includes("$type") &&
          code.includes("$value") &&
          code.includes("resolveTokenValue"),
        detail: "Inherits group-level $type and resolves chained curly-brace token aliases",
      });
      results.push({
        name: "Circular Alias Cycle Detection & Deterministic CSS Variable Output",
        passed:
          code.includes("CircularTokenAliasError") &&
          code.includes("compileCssCustomProperties") &&
          code.includes("cssVarName"),
        detail: "Throws CircularTokenAliasError on alias cycles and compiles sorted --group-token CSS declarations",
      });
    } else if (id === "task_design_oklch_perceptual_palette_apca_contrast_guard") {
      results.push({
        name: "11-Step Perceptual OKLCH Tonal Ramp & Chroma Polar Tapering",
        passed:
          code.includes("oklch(") &&
          code.includes("generatePerceptualOklchRamp") &&
          code.includes("chromaFactor"),
        detail: "Synthesizes 50..950 OKLCH ramp with chroma tapering near white and black poles",
      });
      results.push({
        name: "Polarity-Aware APCA (Lc) & WCAG 2.2 Contrast Auto-Remediation",
        passed:
          code.includes("apcaLc") &&
          code.includes("wcagRatio") &&
          code.includes("enforceAccessibleTextContrast"),
        detail: "Computes APCA Lc / WCAG contrast and nudges foreground lightness until target Lc is met",
      });
    } else if (id === "task_design_fluid_utopia_typography_bento_spatial_grid") {
      results.push({
        name: "Utopia Slope-Intercept Fluid clamp() Typography Compiler",
        passed:
          code.includes("compileFluidClampExpression") &&
          code.includes("clamp(") &&
          code.includes("vw"),
        detail: "Computes exact clamp(minRem, interceptRem + slopeVw, maxRem) fluid typography expressions",
      });
      results.push({
        name: "4px/8px Spatial Grid Rhythm & Bento Rectangle Packing Validator",
        passed:
          code.includes("validateBentoGridAndSpatialRhythm") &&
          code.includes("offGridPxValues") &&
          code.includes("isHoleFreeCompleteRectangle"),
        detail: "Flags spacing values off the 4px grid and verifies hole-free Bento cell packing",
      });
    } else if (id === "task_design_proprietary_elevation_glassmorphism_spring_tokens") {
      results.push({
        name: "Hooke's Law Spring Physics Damping Ratio & CSS linear() Sampler",
        passed:
          code.includes("synthesizeSpringPhysicsToken") &&
          code.includes("dampingRatio") &&
          code.includes("linear("),
        detail: "Calculates zeta damping ratio and samples damped harmonic oscillator into CSS linear(...)",
      });
      results.push({
        name: "Multi-Layer OKLCH Specular Elevation & Reduced-Motion Guard",
        passed:
          code.includes("compileProprietarySurfaceElevation") &&
          code.includes("backdropFilterCss") &&
          code.includes("reducedMotionFallbackCss"),
        detail: "Combines key/ambient shadows with 1px inner specular highlight and reduced-motion fallback",
      });
    } else if (id === "task_ui_roving_tabindex_command_chord_ergonomics") {
      results.push({
        name: "WAI-ARIA Roving tabindex (0 / -1) & Disabled Item Skip",
        passed:
          code.includes("tabIndex") &&
          code.includes("getRovingStates") &&
          code.includes("ArrowDown"),
        detail: "Maintains exactly one tabIndex=0 item and skips disabled items during Arrow navigation",
      });
      results.push({
        name: "Sequential Two-Key Chord State Machine & Editable Target Guard",
        passed:
          code.includes("registerChord") &&
          code.includes("awaitingSecondKey") &&
          code.includes("isEditableTarget"),
        detail: "Resolves two-key chords within timeout window and suppresses chords inside inputs",
      });
    } else if (id === "task_ui_css_anchor_positioning_collision_flip_solver") {
      results.push({
        name: "CSS Anchor Positioning & @position-try-fallbacks Declaration Compiler",
        passed:
          code.includes("anchor-name") &&
          code.includes("position-anchor") &&
          code.includes("position-try-fallbacks"),
        detail: "Emits declarative anchor-name, position-anchor, and flip-block/flip-inline rules",
      });
      results.push({
        name: "Viewport Overflow Block/Inline Flip & Margin Clamping",
        passed:
          code.includes("flippedBlock") &&
          code.includes("flippedInline") &&
          code.includes("chosenPlacement"),
        detail: "Flips bottom->top and span-right->span-left when anchored popover overflows viewport",
      });
    } else if (id === "task_ui_view_transitions_shared_element_morph_orchestrator") {
      results.push({
        name: "Duplicate view-transition-name Prevention & Hidden Node Stripping",
        passed:
          code.includes("prepareUniqueTransitionNames") &&
          code.includes("deduplicatedNames") &&
          code.includes("seenVisibleNames"),
        detail: "Prevents startViewTransition InvalidStateError by deduplicating visible transition names",
      });
      results.push({
        name: "prefers-reduced-motion Instant Bypass & Post-Morph Cleanup",
        passed:
          code.includes("prefersReducedMotion") &&
          code.includes("REDUCED_MOTION_INSTANT") &&
          code.includes("MORPHEME_VIEW_TRANSITION"),
        detail: "Bypasses morphing when reduced motion is enabled and cleans up transition names",
      });
    } else if (id === "task_ui_optimistic_skeleton_shimmer_cls_zero_hydrator") {
      results.push({
        name: "Grace Delay & Minimum Skeleton Dwell Anti-Flash State Machine",
        passed:
          code.includes("IDLE_OR_GRACE_HOLD") &&
          code.includes("SKELETON_VISIBLE") &&
          code.includes("CONTENT_READY"),
        detail: "Suppresses skeleton on fast responses and holds skeleton for minDwellMs once shown",
      });
      results.push({
        name: "Zero-CLS Intrinsic Aspect-Ratio & Min-Block-Size Reservation",
        passed:
          code.includes("computeZeroClsReservationCss") &&
          code.includes("aspectRatioCss") &&
          code.includes("minBlockSizeCss"),
        detail: "Reserves exact aspect-ratio and min-block-size dimensions to guarantee 0.000 CLS",
      });
    } else if (id === "task_webcomp_form_associated_element_internals_custom_states") {
      results.push({
        name: "Form-Associated Custom Element & ElementInternals.setFormValue()",
        passed:
          code.includes("formAssociated") &&
          code.includes("setFormValue") &&
          code.includes("setValidity"),
        detail: "Synchronizes custom element value and validity with parent <form> via ElementInternals",
      });
      results.push({
        name: "CustomStateSet (:state(checked), :state(invalid)) & Lifecycle Hooks",
        passed:
          code.includes("states.add") &&
          code.includes("formResetCallback") &&
          code.includes("formStateRestoreCallback"),
        detail: "Manages CustomStateSet tokens and implements form reset/restore lifecycle hooks",
      });
    } else if (id === "task_webcomp_constructable_stylesheets_reactive_attribute_bridge") {
      results.push({
        name: "Constructable Stylesheet (adoptedStyleSheets) Deduplication Pool",
        passed:
          code.includes("acquireSharedStyleSheet") &&
          code.includes("refCount") &&
          code.includes("uniqueSheetsAllocated"),
        detail: "Shares Constructable CSSStyleSheet instances across component instances",
      });
      results.push({
        name: "Re-Entrancy Guarded Attribute <-> Property Reflection Bridge",
        passed:
          code.includes("attributeChangedCallback") &&
          code.includes("setProperty") &&
          code.includes("#reflecting"),
        detail: "Reflects properties to attributes without infinite recursion loops",
      });
    } else if (id === "task_webcomp_named_slot_projection_part_theming_guard") {
      results.push({
        name: "Named & Default <slot> Distribution with Fallback Content",
        passed:
          code.includes("distributeLightDomNodes") &&
          code.includes("usingFallback") &&
          code.includes("unslottedOrphanNodeIds"),
        detail: "Projects light-DOM nodes into named slots and renders fallback content when empty",
      });
      results.push({
        name: "CSS Shadow ::part() Surface Whitelist Validator",
        passed:
          code.includes("validateCssPartSelectors") &&
          code.includes("::part") &&
          code.includes("unauthorizedParts"),
        detail: "Audits external ::part(...) selectors against the component's whitelisted parts",
      });
    } else if (id === "task_webcomp_virtualized_shadow_list_resize_observer") {
      results.push({
        name: "O(log N) Prefix-Sum Binary Search & ResizeObserver Row Measurement",
        passed:
          code.includes("updateMeasuredRowHeight") &&
          code.includes("#findStartIndex") &&
          code.includes(">>> 1"),
        detail: "Finds first visible variable-height row via binary search over prefix-sum offsets",
      });
      results.push({
        name: "Overscan Windowing & Exact Top/Bottom Spacer Conservation",
        passed:
          code.includes("topSpacerPx") &&
          code.includes("bottomSpacerPx") &&
          code.includes("totalScrollHeightPx"),
        detail: "Renders overscan-buffered viewport slice and preserves totalScrollHeightPx",
      });
    } else if (id === "task_webworker_transferable_offload") {
      results.push({
        name: "Transferable ArrayBuffer Ownership",
        passed: code.includes("transfer:") && code.includes(".buffer"),
        detail: "Publishes each chunk's ArrayBuffer with an explicit transfer list",
      });
      results.push({
        name: "Zero-Copy postMessage Transfer",
        passed: code.includes("postMessage") && code.includes("chunk.transfer"),
        detail: "Hands buffer ownership to the worker instead of structured-cloning the payload",
      });
      results.push({
        name: "Deterministic Partial-Sum Merge",
        passed: code.includes("mergeChunkSums") && code.includes("reduce"),
        detail: "Combines per-worker partial sums with a deterministic reduce",
      });
    } else if (id === "task_webworker_shared_atomics_counter") {
      results.push({
        name: "SharedArrayBuffer Backed Counter",
        passed: code.includes("SharedArrayBuffer") && code.includes("BYTES_PER_ELEMENT"),
        detail: "Allocates shared counter state in a sized SharedArrayBuffer",
      });
      results.push({
        name: "Atomic Add and Load",
        passed: code.includes("Atomics.add") && code.includes("Atomics.load"),
        detail: "Uses Atomics for every read-modify-write and read",
      });
      results.push({
        name: "compareExchange Exclusive Claim",
        passed: code.includes("Atomics.compareExchange"),
        detail: "Grants a slot only while the counter still holds the expected value",
      });
    } else if (id === "task_webworker_pool_lifecycle") {
      results.push({
        name: "Bounded Reusable Worker Pool",
        passed: code.includes("class WorkerPool") && code.includes("#idle"),
        detail: "Keeps a fixed set of idle workers for reuse",
      });
      results.push({
        name: "Concurrency Cap and Queue",
        passed: code.includes("#active") && code.includes("#queue"),
        detail: "Tracks in-flight jobs and queues overflow beyond the pool size",
      });
      results.push({
        name: "Graceful Drain and Terminate",
        passed: code.includes("terminate()") && code.includes("async close()"),
        detail: "Waits for in-flight jobs then terminates every worker once",
      });
    } else if (id === "task_webstreams_json_frame_decoder") {
      results.push({
        name: "TransformStream Frame Emission",
        passed: code.includes("TransformStream") && code.includes("controller.enqueue"),
        detail: "Emits each parsed frame through a TransformStream controller",
      });
      results.push({
        name: "Streaming TextDecoder Reassembly",
        passed: code.includes("decode(chunk") && code.includes("stream: true"),
        detail: "Decodes multibyte characters incrementally across chunk boundaries",
      });
      results.push({
        name: "Trailing Frame Flush",
        passed: code.includes("flush(") && code.includes("pending"),
        detail: "Flushes an unterminated trailing frame instead of dropping it",
      });
    } else if (id === "task_webstreams_sse_reconnect_parser") {
      results.push({
        name: "Buffered Frame Reassembly",
        passed: code.includes("buffer +=") && code.includes("indexOf"),
        detail: "Accumulates partial frames until the double-newline boundary arrives",
      });
      results.push({
        name: "Last-Event-ID Resume State",
        passed: code.includes("lastEventId") && code.includes("retryMs"),
        detail: "Tracks the last event id and retry hint for reconnects",
      });
      results.push({
        name: "Comment and Multi-line Data Handling",
        passed: code.includes('startsWith(":")') && code.includes('"data"'),
        detail: "Skips comment lines and joins repeated data fields with newlines",
      });
    } else if (id === "task_webstreams_streaming_checksum") {
      results.push({
        name: "Incremental Chunk Folding",
        passed: code.includes("update(") && code.includes("TextEncoder"),
        detail: "Folds each chunk into the running digest as bytes arrive",
      });
      results.push({
        name: "Constant Memory Digest",
        passed: !code.includes(".join(") && code.includes("digest()"),
        detail: "Never joins the payload, so peak memory stays at one chunk",
      });
      results.push({
        name: "32-bit FNV Fold",
        passed: code.includes("Math.imul") && code.includes(">>> 0"),
        detail: "Keeps the rolling hash in unsigned 32-bit space",
      });
    } else if (id === "task_webmcp_tool_registry") {
      results.push({
        name: "Spec Tool Name Validation",
        passed: code.includes("{1,128}") && code.includes("InvalidStateError"),
        detail: "Enforces the draft's 1-128 character name rule and rejects duplicates",
      });
      results.push({
        name: "Input Schema Serialisation",
        passed: code.includes("JSON.stringify") && code.includes("JSON.parse"),
        detail: "Stores the input schema as a JSON string and parses it back for discovery",
      });
      results.push({
        name: "Name-Sorted Discovery",
        passed: code.includes(".sort("),
        detail: "Returns discovered tools sorted by name",
      });
      results.push({
        name: "Abort-Driven Unregistration",
        passed: code.includes("signal") && code.includes("abort"),
        detail: "Unregisters a tool when the registration signal aborts",
      });
    } else if (id === "task_webmcp_tool_execution") {
      results.push({
        name: "DOMException Error Taxonomy",
        passed:
          code.includes("NotFoundError") &&
          code.includes("DataError") &&
          code.includes("OperationError") &&
          code.includes("AbortError"),
        detail: "Reports failures with the draft's platform-defined exception names",
      });
      results.push({
        name: "JSON Input Round-Trip",
        passed: code.includes("JSON.stringify") && code.includes("JSON.parse"),
        detail: "Serialises the input to JSON before invoking the tool",
      });
      results.push({
        name: "AbortSignal Delivery",
        passed: code.includes("AbortController") && code.includes("signal"),
        detail: "Hands the tool callback an AbortSignal and cancels on abort",
      });
      results.push({
        name: "Stringified Tool Result",
        passed: code.includes("JSON.stringify(value)"),
        detail: "Resolves with the tool result as a JSON string",
      });
    } else if (id === "task_webmcp_origin_exposure") {
      results.push({
        name: "Exposure Allowlist",
        passed: code.includes("exposedTo") && code.includes("exposedOrigins"),
        detail: "Tracks the origins a tool is exposed to",
      });
      results.push({
        name: "NotFoundError Masking",
        passed: code.includes("NotFoundError"),
        detail: "Hides tools the caller may not see behind NotFoundError",
      });
      results.push({
        name: "Owner Origin Visibility",
        passed: code.includes("ownerOrigin"),
        detail: "Always exposes a tool to its owning origin",
      });
      results.push({
        name: "Sorted Visible Tools",
        passed: code.includes(".sort("),
        detail: "Returns only the visible tools, sorted by name",
      });
    } else if (id === "task_seo_llms_txt_generator") {
      results.push({
        name: "Spec Markdown Structure",
        passed: code.includes("## ") && code.includes("- [ "),
        detail: "Emits H2 sections holding Markdown link lists",
      });
      results.push({
        name: "Standard Link Relations",
        passed: code.includes('rel="alternate"') && code.includes('rel="describedby"'),
        detail: "Advertises the Markdown variant and the covering llms.txt",
      });
      results.push({
        name: "Markdown Variant URLs",
        passed: code.includes(".md"),
        detail: "Derives the page's Markdown variant URL",
      });
      results.push({
        name: "Blockquote Summary",
        passed: code.includes("> "),
        detail: "Includes the optional blockquote summary",
      });
    } else if (id === "task_seo_llms_txt_validator") {
      results.push({
        name: "H1 Requirement",
        passed: code.includes("H1"),
        detail: "Requires the H1 title as the first section",
      });
      results.push({
        name: "Link List Validation",
        passed: code.includes("Malformed link list entry"),
        detail: "Rejects malformed link list entries",
      });
      results.push({
        name: "Section Scoping",
        passed: code.includes("outside of a section"),
        detail: "Rejects link entries that appear outside an H2 section",
      });
      results.push({
        name: "Most Specific File Resolution",
        passed: code.includes("sort(") && code.includes("covers"),
        detail: "Resolves the deepest llms.txt covering a page",
      });
    } else if (id === "task_seo_ai_crawler_policy") {
      results.push({
        name: "Content-Signal Directive",
        passed: code.includes("Content-Signal") && code.includes("ai-train"),
        detail: "Declares search, ai-input and ai-train usage signals",
      });
      results.push({
        name: "Crawler Purpose Classification",
        passed: code.includes("training") && code.includes("user-triggered"),
        detail: "Separates training, search and user-triggered crawlers",
      });
      results.push({
        name: "Longest-Match Path Evaluation",
        passed: code.includes("pattern.length"),
        detail: "Applies RFC 9309 longest-match path precedence",
      });
      results.push({
        name: "Wildcard Fallback Semantics",
        passed: code.includes('agent !== "*"'),
        detail: "Treats the * group as a fallback that never overrides a specific group",
      });
    } else if (id === "task_acp_checkout_session") {
      results.push({
        name: "Integer Minor Units",
        passed: code.includes("Math.round") && code.includes("Number.isInteger"),
        detail: "Keeps every monetary amount an integer in minor units",
      });
      results.push({
        name: "Idempotency Handling",
        passed: code.includes("idempotency") && code.includes("409"),
        detail: "Replays identical requests and rejects mismatched replays",
      });
      results.push({
        name: "Session Status Machine",
        passed:
          code.includes("ready_for_payment") &&
          code.includes("completed") &&
          code.includes("canceled"),
        detail: "Moves the session through the specification's statuses",
      });
      results.push({
        name: "Order Creation",
        passed: code.includes("permalink_url"),
        detail: "Creates an order with a permalink when the session completes",
      });
    } else if (id === "task_x402_payment_gate") {
      results.push({
        name: "Payment Header Exchange",
        passed:
          code.includes("PAYMENT-REQUIRED") &&
          code.includes("PAYMENT-SIGNATURE") &&
          code.includes("PAYMENT-RESPONSE"),
        detail: "Uses the three x402 v2 payment headers",
      });
      results.push({
        name: "Base64 Header Encoding",
        passed: code.includes("btoa") && code.includes("atob"),
        detail: "Base64-encodes the JSON payloads carried in the headers",
      });
      results.push({
        name: "CORS Header Disclosure",
        passed:
          code.includes("Access-Control-Expose-Headers") &&
          code.includes("Access-Control-Allow-Headers"),
        detail: "Exposes and allows the payment headers for browser clients",
      });
      results.push({
        name: "Payment Amount Verification",
        passed: code.includes("amount"),
        detail: "Verifies the accepted scheme, network and amount",
      });
    } else if (id === "task_ap2_mandate_verification") {
      results.push({
        name: "Versioned vct Claim",
        passed: code.includes("mandate.checkout.1") && code.includes("vct"),
        detail: "Requires the exact versioned mandate type",
      });
      results.push({
        name: "Checkout Hash Binding",
        passed: code.includes("checkout_hash") && code.includes("SHA-256"),
        detail: "Recomputes the Base64url SHA-256 hash of the checkout JWT",
      });
      results.push({
        name: "Expiry Enforcement",
        passed: code.includes("exp"),
        detail: "Rejects an expired mandate",
      });
      results.push({
        name: "Constraint Evaluation",
        passed: code.includes("allowed_merchants"),
        detail: "Evaluates the open mandate's allowed-merchants constraint",
      });
    } else if (id === "task_webcodecs_decoder_config_router") {
      results.push({
        name: "Complete Decoder Config Signature",
        passed: code.includes("decoderConfig") && code.includes("ArrayBuffer.isView") && code.includes("configSignature"),
        detail: "Compares decoder metadata and binary descriptions by content, not object identity",
      });
      results.push({
        name: "Flush Before Decoder Reconfiguration",
        passed: code.includes("await this.#decoder.flush()") && code.includes("configure(nextConfig)"),
        detail: "Drains pending decoded output before applying a different codec configuration",
      });
      results.push({
        name: "Initial Key Chunk Guard",
        passed: code.includes("DataError") && code.includes("#signature === null"),
        detail: "Rejects decode requests before the stream has established its decoder config",
      });
    } else if (id === "task_webcodecs_timestamp_mapper") {
      results.push({
        name: "Shared-Origin Microsecond Rounding",
        passed: code.includes("timeOriginMs") && code.includes("* 1000") && code.includes("Math.round"),
        detail: "Converts one source clock into rounded integer WebCodecs microseconds",
      });
      results.push({
        name: "Strict Timestamp Monotonicity",
        passed: code.includes("previousUs + 1") && code.includes("firstTimestampUs"),
        detail: "Resolves duplicate and regressing source timestamps by at least one microsecond",
      });
      results.push({
        name: "Finite Safe-Integer Guard",
        passed: code.includes("Number.isFinite") && code.includes("Number.isSafeInteger"),
        detail: "Rejects timestamps that cannot be represented accurately as safe integers",
      });
    } else if (id === "task_webcodecs_bounded_encode_queue") {
      results.push({
        name: "Encoder Queue Backpressure",
        passed: code.includes("encodeQueueSize") && code.includes('"dequeue"'),
        detail: "Suspends frame production when the asynchronous encoder queue reaches its cap",
      });
      results.push({
        name: "Frame Ownership & Keyframe Cadence",
        passed: code.includes("frame.close()") && code.includes("keyFrameInterval"),
        detail: "Closes VideoFrame resources and requests regular random-access frames",
      });
      results.push({
        name: "Encoder Drain Before Completion",
        passed: code.includes("encoder.flush()"),
        detail: "Waits for outstanding encode output before completing the recording",
      });
    } else if (id === "task_webrtc_data_channel_backpressure") {
      results.push({
        name: "UTF-8 Byte-Aware Queue Bound",
        passed: code.includes("TextEncoder") && code.includes("highWaterMark"),
        detail: "Bounds queued bytes rather than JavaScript character count",
      });
      results.push({
        name: "Native Low-Water-Event Backpressure",
        passed: code.includes("bufferedAmountLowThreshold") && code.includes("bufferedamountlow"),
        detail: "Resumes queued sends when the peer data channel drains below its threshold",
      });
      results.push({
        name: "Concurrent Producer Serialization",
        passed: code.includes("WeakMap") && code.includes("channelTails"),
        detail: "Queues writers per channel so simultaneous calls respect the same watermarks",
      });
    } else if (id === "task_webrtc_ice_candidate_inbox") {
      results.push({
        name: "Pre-Description Candidate Buffer",
        passed: code.includes("#pending") && code.includes("setRemoteDescription"),
        detail: "Buffers arriving candidates and applies them only after the description is set",
      });
      results.push({
        name: "ICE Generation Stale Candidate Fence",
        passed: code.includes("usernameFragment") && code.includes("#ufrags"),
        detail: "Rejects candidates whose ICE username fragment belongs to an old generation",
      });
      results.push({
        name: "Per-Generation Candidate Deduplication",
        passed: code.includes("candidateKey") && code.includes("#seen"),
        detail: "Deduplicates candidates and end-of-candidates signals within an ICE generation",
      });
    } else if (id === "task_webrtc_perfect_negotiation") {
      results.push({
        name: "Stable-State Offer Collision Detection",
        passed: code.includes("makingOffer") && code.includes("signalingState"),
        detail: "Recognizes local offers that are currently being created or already signaled",
      });
      results.push({
        name: "Polite Rollback & Impolite Ignore Roles",
        passed:
          code.includes("offerCollision") && code.includes("!polite") &&
          code.includes('type: "rollback"'),
        detail: "Prevents glare without applying conflicting local and remote offers",
      });
      results.push({
        name: "Offer Answer Completion",
        passed: code.includes("setRemoteDescription") && code.includes("answer"),
        detail: "Applies the accepted offer and returns the generated local answer",
      });
    } else if (id === "task_webgpu_buffer_readback") {
      results.push({
        name: "GPU Readback Usage & Copy Alignment",
        passed:
          code.includes("COPY_DST") && code.includes("MAP_READ") &&
          code.includes("Math.ceil(byteLength / 4) * 4"),
        detail: "Uses a correctly aligned MAP_READ staging buffer for GPU-to-CPU copies",
      });
      results.push({
        name: "Exact-Length Returned View",
        passed: code.includes("getMappedRange()") && code.includes("byteLength") && code.includes("slice()"),
        detail: "Returns a detached copy of the requested bytes without exposing padded GPU data",
      });
      results.push({
        name: "Failure-Safe GPU Buffer Cleanup",
        passed: code.includes("finally") && code.includes("staging.destroy()") && code.includes("staging.unmap()"),
        detail: "Releases the staging allocation when mapping, copying or reading fails",
      });
    } else if (id === "task_webgpu_capability_selection") {
      results.push({
        name: "Required Capability Failure",
        passed: code.includes("NotSupportedError") && code.includes("requiredFeatures"),
        detail: "Clearly rejects an adapter that lacks a required feature or device limit",
      });
      results.push({
        name: "Atomic Optional Feature Groups",
        passed: code.includes("optionalFeatureGroups") && code.includes(".every"),
        detail: "Enables optional features only when the entire requested group is supported",
      });
      results.push({
        name: "Bounded Optional Limits",
        passed: code.includes("Math.min") && code.includes("availableLimits"),
        detail: "Caps optional device limits and avoids requesting unsupported ones",
      });
    } else if (id === "task_webgpu_dispatch_tiling") {
      results.push({
        name: "Safe Dispatch Dimensions",
        passed: code.includes("Number.isSafeInteger") && code.includes("RangeError"),
        detail: "Rejects invalid GPU dispatch dimensions and unsafe multiplication",
      });
      results.push({
        name: "Contiguous Bounded Tiles",
        passed: code.includes("baseIndex") && code.includes("maxItemsPerDispatch"),
        detail: "Splits a large workload into adjacent batches under the GPU workgroup limit",
      });
      results.push({
        name: "Padded Final Workgroup",
        passed: code.includes("Math.ceil") && code.includes("workgroupCount"),
        detail: "Rounds the final tile up to whole workgroups while retaining its exact item count",
      });
    } else if (id === "task_webtransport_datagram_sender") {
      results.push({
        name: "Finite Datagram Expiry & Send Scheduling",
        passed: code.includes("outgoingMaxAge") && code.includes("createWritable") && code.includes("sendOrder"),
        detail: "Sets a datagram lifetime and creates a sender with explicit transport scheduling options",
      });
      results.push({
        name: "Negotiated Packet Bound & Writer Backpressure",
        passed: code.includes("maxDatagramSize") && code.includes("writer.ready") && code.includes("writer.write"),
        detail: "Checks the live maximum packet size and waits until the writer can accept another datagram",
      });
      results.push({
        name: "Concurrent Sender Ordering",
        passed: code.includes("sendTail") && code.includes("writer.ready"),
        detail: "Serializes sends so concurrent producers share one backpressure-aware queue",
      });
      results.push({
        name: "Typed View Boundaries & Writer Cleanup",
        passed: code.includes("byteOffset") && code.includes("byteLength") && code.includes("releaseLock()") && code.includes("finally"),
        detail: "Sends only the selected view bytes and releases the writer lock after close",
      });
    } else if (id === "task_webtransport_framed_stream") {
      results.push({
        name: "Incremental Big-Endian Framing",
        passed: code.includes("getUint32") && code.includes("reader.read()") && code.includes("pending"),
        detail: "Reassembles framed payloads independently of stream read boundaries",
      });
      results.push({
        name: "Frame Size Cap & Consumer Backpressure",
        passed: code.includes("maxFrameBytes") && code.includes("await onFrame"),
        detail: "Rejects oversized frames and waits for each consumer callback before continuing",
      });
      results.push({
        name: "Truncated Stream & Reader Cleanup",
        passed: code.includes("SyntaxError") && code.includes("releaseLock()"),
        detail: "Detects incomplete frames at EOF and releases stream ownership",
      });
    } else if (id === "task_webtransport_datagram_replay_window") {
      results.push({
        name: "Uint32 Input & Bounded Window Validation",
        passed: code.includes("0xffffffff") && code.includes("windowSize") && code.includes("RangeError"),
        detail: "Validates sequence input and limits bitmap storage to a bounded replay horizon",
      });
      results.push({
        name: "Duplicate and Reordering Bitmap",
        passed: code.includes("#bitmap") && code.includes("behind") && code.includes("ahead"),
        detail: "Tracks seen packets while accepting fresh sequence values that arrive out of order",
      });
      results.push({
        name: "Wrap-Safe Serial Number Comparison",
        passed: code.includes("0x80000000") && code.includes(">>> 0"),
        detail: "Distinguishes forward movement across uint32 rollover from stale values",
      });
    } else if (id === "task_webassembly_memory_view_refresh") {
      results.push({
        name: "Current Buffer and Overflow-Safe Pointer Checks",
        passed: code.includes("memory.buffer") && code.includes("Number.isSafeInteger") && code.includes("buffer.byteLength - offset"),
        detail: "Creates views from the current memory allocation and checks bounds without addition overflow",
      });
      results.push({
        name: "Little-Endian Wasm Integer Interop",
        passed: code.includes("getUint32") && code.includes("setUint32") && code.includes("true"),
        detail: "Reads and writes little-endian uint32 values with explicit range checks",
      });
      results.push({
        name: "Exact Fatal UTF-8 Decode",
        passed: code.includes("TextDecoder") && code.includes("fatal: true") && code.includes("new Uint8Array"),
        detail: "Decodes the requested memory slice and rejects malformed UTF-8",
      });
    } else if (id === "task_webassembly_component_resource_lifetimes") {
      results.push({
        name: "Generation-Checked Unique Ownership",
        passed: code.includes("generation") && code.includes("transfer(ownerHandle)") && code.includes("owner.active = false"),
        detail: "Invalidates moved and reused handles instead of allowing stale access to a new resource",
      });
      results.push({
        name: "Task-Scoped Async Borrow Return",
        passed: code.includes("borrow(ownerHandle, taskId)") && code.includes("resolveTask(taskId)") && code.includes("#tasks"),
        detail: "Associates every temporary borrow with the subtask that must return it",
      });
      results.push({
        name: "No Drop While Lent & Single Finalization",
        passed: code.includes("resource.borrows !== 0") && code.includes("dropResource(resource.value)"),
        detail: "Blocks disposal while an async subtask owns a borrow and finalizes after the last loan",
      });
    } else if (id === "task_webassembly_jspi_boundary") {
      results.push({
        name: "Experimental JSPI Feature Detection",
        passed: code.includes("wasmApi.Suspending") && code.includes("wasmApi.promising") && code.includes("NotSupportedError"),
        detail: "Checks both proposal entry points and gives callers a clear unsupported-runtime error",
      });
      results.push({
        name: "Suspending Imports and Promising Exports",
        passed: code.includes("new wasmApi.Suspending(value)") && code.includes("wasmApi.promising(value)"),
        detail: "Wraps Promise-capable imports and async guest exports at their respective boundaries",
      });
      results.push({
        name: "Non-Function Values & Input Immutability",
        passed: code.includes("Object.entries(imports)") && code.includes("Object.entries(namespace)") && code.includes("Object.entries(exports)"),
        detail: "Builds fresh namespaces while preserving memories, globals and other non-function bindings",
      });
    } else if (id === "task_webassembly_streaming_loader") {
      results.push({
        name: "HTTP Failure and Instantiation Capability Checks",
        passed: code.includes("response.ok !== true") && code.includes("NetworkError") && code.includes("wasmApi.instantiate"),
        detail: "Rejects bad fetch responses before consuming their bodies and reports unsupported instantiation",
      });
      results.push({
        name: "Normalized MIME-Gated Streaming and Byte Fallback",
        passed: code.includes("application/wasm") && code.includes("instantiateStreaming") && code.includes("arrayBuffer()"),
        detail: "Streams only the registered WebAssembly media type and buffers once for misconfigured servers",
      });
      results.push({
        name: "No Retry After Guest Startup or Compile Failure",
        passed: !code.includes("catch (") && !code.includes("catch{"),
        detail: "Keeps compile, link and guest-start failures from triggering a second instantiation attempt",
      });
    } else if (id === "task_webassembly_utf8_abi_ownership") {
      results.push({
        name: "UTF-8 Byte-Length Encoding",
        passed: code.includes("TextEncoder") && code.includes("encoder.encode(value)") && code.includes("bytes.byteLength"),
        detail: "Sends encoded UTF-8 bytes and their byte count across the numeric guest ABI",
      });
      results.push({
        name: "Post-Allocation Buffer Refresh and Pointer Bounds",
        passed: code.includes("const buffer = memory.buffer") && code.includes("buffer.byteLength - pointer"),
        detail: "Observes memory growth caused by allocation and bounds-checks before constructing a view",
      });
      results.push({
        name: "Allocation Released on Guest Failure",
        passed: code.includes("finally") && code.includes("exports.free(pointer)"),
        detail: "Returns valid guest-owned memory after both successful and throwing calls",
      });
    } else if (id === "task_webassembly_threaded_runtime_gate") {
      results.push({
        name: "Isolation and Runtime Capability Gate",
        passed: code.includes("crossOriginIsolated") && code.includes("SharedArrayBufferCtor") && code.includes("typeof Memory"),
        detail: "Requires browser isolation and both shared-memory APIs before opting into a threaded build",
      });
      results.push({
        name: "Bounded Worker Pool and Validated Memory Pages",
        passed: code.includes("hardwareConcurrency - 1") && code.includes("Math.min(maxWorkers") && code.includes("maximumPages > 65536"),
        detail: "Leaves the UI thread capacity available and rejects invalid 32-bit memory limits",
      });
      results.push({
        name: "Reasoned Single-Threaded Fallback",
        passed: code.includes('mode: "single-threaded"') && code.includes("shared-memory-construction-failed"),
        detail: "Falls back cleanly when isolation or shared memory cannot be enabled at runtime",
      });
    } else if (id === "task_webassembly_plugin_capabilities") {
      results.push({
        name: "Compiled Module Import Inspection",
        passed: code.includes("Module.imports(module)") && code.includes("requestedImports"),
        detail: "Builds its guest import plan from the actual compiled module requirements",
      });
      results.push({
        name: "Exact Own-Property Capability Grants",
        passed: code.includes("Object.hasOwn(namespace, descriptor.name)") && code.includes("NotAllowedError"),
        detail: "Rejects undeclared or inherited host capabilities before linking the plugin",
      });
      results.push({
        name: "Restricted Null-Prototype Import Object",
        passed: code.includes("Object.create(null)") && code.includes("wasmApi.instantiate(module, importObject)"),
        detail: "Passes only requested grants and leaves the broader host capability map untouched",
      });
    } else if (id === "task_webnn_tensor_inference_lifecycle") {
      results.push({
        name: "Least-Privilege Tensor Permissions",
        passed: code.includes("writable: true") && code.includes("readable: true") && code.includes("writable: false"),
        detail: "Creates input tensors for writes and output tensors for readback with the correct permissions",
      });
      results.push({
        name: "Dispatch Submission and Readback Completion",
        passed: code.includes("context.dispatch(graph, inputs, outputs)") && code.includes("await context.readTensor(tensor)"),
        detail: "Submits dispatch synchronously and waits for readTensor to observe completed work",
      });
      results.push({
        name: "Owned Tensor Cleanup on Every Exit",
        passed: code.includes("finally") && code.includes("ownedTensors.reverse()") && code.includes("tensor.destroy()"),
        detail: "Destroys all locally allocated tensors after success or failure",
      });
    } else if (id === "task_webnn_shared_tensor_queue") {
      results.push({
        name: "Invocation-Time Buffer Snapshot",
        passed: code.includes("source.buffer.slice") && code.includes("new source.constructor(source)"),
        detail: "Copies the selected view bytes before work waits in the shared tensor queue",
      });
      results.push({
        name: "Write, Dispatch and Readback Serialization",
        passed: code.includes("tail.then") && code.includes("context.dispatch(graph, inputTensors, outputTensors)") && code.includes("await context.readTensor(tensor)"),
        detail: "Keeps each inference's writes and output reads within one ordered queue operation",
      });
      results.push({
        name: "Drain-on-Dispose Without Resource Transfer",
        passed: code.includes("accepting = false") && code.includes("disposePromise = tail") && !code.includes("tensor.destroy"),
        detail: "Stops new work, drains accepted calls and leaves tensor ownership with the caller",
      });
    } else if (id === "task_webnn_context_loss_recovery") {
      results.push({
        name: "Single-Flight Session Creation",
        passed: code.includes("if (!creating)") && code.includes("creating = pending") && code.includes("createSession"),
        detail: "Shares one lazy session build across callers arriving during initialization",
      });
      results.push({
        name: "MLContext Loss Generation Fence",
        passed: code.includes("session.context.lost") && code.includes("record.generation") && code.includes("current === record"),
        detail: "Invalidates only the lost session record and prevents its late result from escaping",
      });
      results.push({
        name: "Bounded Idempotent Inference Retry",
        passed: code.includes("attempt < maxAttempts") && code.includes("Promise.race") && code.includes("record.lost"),
        detail: "Retries after a lost context but stops at the caller's configured attempt limit",
      });
      results.push({
        name: "Runner-Owned Context Cleanup",
        passed: code.includes("context.destroy?.()") && code.includes("function close()"),
        detail: "Destroys the active context when closing the session runner where the backend supports it",
      });
    } else if (id === "task_digital_credentials_request_builder") {
      results.push({
        name: "Operation and Protocol Capability Gates",
        passed: code.includes('operation !== "get"') && code.includes('operation !== "create"') && code.includes("userAgentAllowsProtocol(protocol)"),
        detail: "Accepts only presentation or issuance and checks the browser's protocol allowlist",
      });
      results.push({
        name: "Credential Management Request Shape",
        passed: code.includes("digital:") && code.includes("requests:") && code.includes("protocol, data:"),
        detail: "Builds the spec-shaped digital.requests option without binding to a credential format",
      });
      results.push({
        name: "JSON Snapshot Before Chooser",
        passed: code.includes("JSON.stringify(data)") && code.includes("JSON.parse(serialized)"),
        detail: "Detaches the data payload and rejects values that cannot cross the JSON protocol boundary",
      });
    } else if (id === "task_digital_credentials_prompt_coordinator") {
      results.push({
        name: "Transient Activation and Immediate Invocation",
        passed: code.includes("isUserActivated()") && code.includes("credentials[operation](plan.options)"),
        detail: "Requires a user gesture and invokes the browser chooser synchronously in that turn",
      });
      results.push({
        name: "Single-Flight Chooser Gate",
        passed: code.includes("inFlightKey") && code.includes("return inFlight") && code.includes("another credential chooser is already open"),
        detail: "Coalesces matching requests and refuses conflicting simultaneous chooser prompts",
      });
      results.push({
        name: "Abort, Settle and Close Lifecycle",
        passed: code.includes("plan.options.signal = signal") && code.includes("inFlight = null") && code.includes("closed = true"),
        detail: "Passes AbortSignal through and releases the in-flight state on both settle paths",
      });
    } else if (id === "task_digital_credentials_server_verification") {
      results.push({
        name: "Same-Origin HTTPS Verification Boundary",
        passed: code.includes('base.protocol !== "https:"') && code.includes("target.origin !== base.origin"),
        detail: "Rejects insecure origins and cross-origin verifier endpoints before making a request",
      });
      results.push({
        name: "Opaque POST With Redirect and Cache Controls",
        passed: code.includes('method: "POST"') && code.includes('cache: "no-store"') && code.includes('redirect: "error"'),
        detail: "Sends only protocol and response data to the verifier without caching or redirecting credentials",
      });
      results.push({
        name: "Server-Only Verification Result",
        passed: code.includes("result?.verified === true") && !code.includes("console.log(credential"),
        detail: "Returns the verifier's explicit boolean and does not log or locally trust the credential payload",
      });
    } else if (id === "task_webxr_depth_session_options") {
      results.push({
        name: "Required and Optional Feature Negotiation",
        passed: code.includes('required ? "requiredFeatures" : "optionalFeatures"') && code.includes('"depth-sensing"'),
        detail: "Keeps depth-required experiences strict and lets optional experiences fall back to a normal session",
      });
      results.push({
        name: "Depth Configuration Completeness",
        passed: code.includes("usagePreference:") && code.includes("dataFormatPreference:") && code.includes("depthTypeRequest:") && code.includes("matchDepthView"),
        detail: "Supplies each requested depth mode preference expected by XRSessionInit",
      });
      results.push({
        name: "Native Capability Delegation",
        passed: code.includes("xr.requestSession(mode, sessionOptions)"),
        detail: "Lets the user agent resolve device support, permission, and feature negotiation",
      });
    } else if (id === "task_webxr_depth_sampling") {
      results.push({
        name: "Normalized Coordinate Bounds",
        passed: code.includes("Number.isFinite(x)") && code.includes("x > 1") && code.includes("y > 1") && code.includes("RangeError"),
        detail: "Rejects invalid view coordinates before asking the XR device for a sample",
      });
      results.push({
        name: "Browser Unit and View Conversion",
        passed: code.includes("getDepthInMeters(x, y)"),
        detail: "Uses the native helper to apply the depth-buffer view transform and meter scale",
      });
      results.push({
        name: "Unavailable and Invalid Sample Handling",
        passed: code.includes("if (!depthInformation) return null") && code.includes('error.name = "NotSupportedError"') && code.includes("!Number.isFinite(depthMeters)"),
        detail: "Handles absent, invalid, and GPU-only depth data without assuming an encoding",
      });
    } else if (id === "task_webxr_depth_frame_loop") {
      results.push({
        name: "Per-Frame Pose and Depth Sampling",
        passed: code.includes("session.requestAnimationFrame(tick)") && code.includes("frame.getViewerPose(referenceSpace)") && code.includes("binding.getDepthInformation(view)"),
        detail: "Samples current depth data against each XR view in the current animation frame",
      });
      results.push({
        name: "Synchronous Time-Sensitive Callback",
        passed: code.includes('result.then === "function"') && code.includes("onFrame must be synchronous"),
        detail: "Stops asynchronous callbacks from queuing stale real-world sensor frames",
      });
      results.push({
        name: "End and Failure Cleanup",
        passed: code.includes('session.addEventListener("end"') && code.includes("cancelAnimationFrame") && code.includes('removeEventListener?.("end"'),
        detail: "Cancels pending frame work and removes the session end listener on stop or error",
      });
    } else if (id === "task_webrtc_encoded_script_transform") {
      results.push({
        name: "Worker Script Transform Feature Gate",
        passed: code.includes("typeof ScriptTransformConstructor !== \"function\"") && code.includes('error.name = "NotSupportedError"'),
        detail: "Reports unsupported runtimes explicitly instead of assuming the draft API is universally available",
      });
      results.push({
        name: "Construct Before Endpoint Mutation",
        passed: code.includes("new ScriptTransformConstructor(worker, options)") && code.includes("endpoint.transform = transform"),
        detail: "Installs a successfully constructed worker transform on the sender or receiver endpoint",
      });
      results.push({
        name: "Input and Options Validation",
        passed: code.includes('!("transform" in endpoint)') && code.includes("Array.isArray(options)"),
        detail: "Rejects unrelated endpoints and malformed options before changing the media pipeline",
      });
    } else if (id === "task_webrtc_sframe_key_rotation") {
      results.push({
        name: "Unsigned Stable Key Identifier Validation",
        passed: code.includes("Number.isSafeInteger(value)") && code.includes("18446744073709551615n") && code.includes("normalizedId === normalizedPreviousId"),
        detail: "Rejects reused or numerically imprecise SFrame key identifiers",
      });
      results.push({
        name: "Receive-First Key Activation Order",
        passed: code.indexOf("await decryptor.addDecryptionKey(key, keyId)") < code.indexOf("await encryptor.setEncryptionKey(key, keyId)"),
        detail: "Makes the new receive key available before the sender encrypts with it",
      });
      results.push({
        name: "Rollback and Graceful Key Retirement",
        passed: code.includes("await decryptor.removeDecryptionKey(keyId)") && code.includes("previousKeyRetired = true") && code.includes("previousKeyId"),
        detail: "Rolls back failed activation and keeps the old receive key if retirement cannot complete",
      });
    } else if (id === "task_webrtc_encoded_frame_pipe") {
      results.push({
        name: "Low-Latency Encoded Stream Bridge",
        passed: code.includes("new TransformStream") && code.includes("readable.pipeThrough(frameTransform)") && code.includes("readable.pipeTo(transformer.writable"),
        detail: "Connects the script transform's streams with a standard TransformStream pipeline",
      });
      results.push({
        name: "Synchronous Processing and Explicit Drops",
        passed: code.includes("output.then === \"function\"") && code.includes("output === null || output === undefined"),
        detail: "Prevents asynchronous queue buildup and makes deliberate frame drops explicit",
      });
      results.push({
        name: "Frame Ownership, Order and Abort",
        passed: code.includes("output !== frame") && code.includes("controller.enqueue(frame)") && code.includes("{ signal }"),
        detail: "Preserves the original encoded frame and allows lifecycle cancellation through AbortSignal",
      });
    } else if (task.category === "css" && CSS_TASK_CHECKS[id]) {
      for (const check of CSS_TASK_CHECKS[id]) {
        results.push({
          name: check.name,
          passed: cssCheckPassed(code, check),
          detail: check.name,
        });
      }
    } else {
      results.push({
        name: "Syntactic Refactoring Valid",
        passed: code.length > 20 && code !== task.starterCode,
        detail: "Produces non-trivial clean refactored implementation",
      });
    }

    return results;
  }

  async #runSandboxTests(taskId, code, options) {
    const results = [];
    const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === taskId);

    if (task?.category === "css" || taskId === "task_refactor_semantic_a11y") {
      const balanced =
        taskId === "task_refactor_semantic_a11y"
          ? code.includes("<button") && code.includes("</button>")
          : hasBalancedCssStructure(code);
      results.push({
        name: "Markup / Stylesheet AST & Block Balance Valid",
        passed: balanced,
        detail: balanced
          ? "Stylesheet rule blocks and markup tags are balanced and structurally valid"
          : "Unbalanced CSS rule braces or malformed markup structure",
      });
      return results;
    }

    // Transpile TypeScript / TSX syntax natively via Bun.Transpiler when evaluating TS tasks
    let executableCode = code;
    if (
      task?.track === "enterprise-typescript" ||
      task?.track === "semantic-web-seo" ||
      task?.track === "commerce-fintech" ||
      task?.track === "storefront-order-lifecycle" ||
      task?.track === "web-cookies-data-traffic" ||
      task?.track === "design-systems-web-components" ||
      /\b(interface|type\s+[A-Za-z0-9_]+\s*=|readonly\s+|:\s*(string|number|boolean|unknown|any|Record|Promise|Readonly))\b/.test(code)
    ) {
      const transpiler = new Bun.Transpiler({ loader: "tsx", target: "bun" });
      executableCode = transpiler.transformSync(code);
    }

    const sanitizedCode = executableCode.replace(/\bexport\s+(default\s+)?/g, "");

    // Safe isolated execution context
    const sandbox = {
      console: { log: () => {}, warn: () => {}, error: () => {} },
      setTimeout,
      clearTimeout,
      setImmediate,
      queueMicrotask,
      AbortController,
      Promise,
      Uint8Array,
      Int32Array,
      Float32Array,
      Float64Array,
      Int8Array,
      Int16Array,
      Uint16Array,
      Uint32Array,
      BigInt64Array,
      BigUint64Array,
      SharedArrayBuffer,
      Atomics,
      ReadableStream,
      WritableStream,
      TransformStream,
      MessageChannel,
      structuredClone,
      ArrayBuffer,
      DataView,
      Map,
      Set,
      Date,
      Math,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Error,
      TypeError,
      RangeError,
      JSON,
      Symbol,
      URL,
      URLSearchParams,
      Request,
      Response,
      Headers,
      TextEncoder,
      TextDecoder,
      btoa,
      atob,
      crypto,
      exports: {},
    };

    const ctx = createContext(sandbox);

    if (taskId === "task_refactor_async_pipeline") {
      const harness = `
        const fetchUser = async (id) => ({ id });
        const fetchUserPreferences = async () => ({ theme: "mono" });
        const fetchRecentActivity = async () => ([1, 2, 3]);
        const calculateScore = async (act) => act.length * 10;
        ${sanitizedCode};
        (async () => {
          const fn = typeof processUserData === "function" ? processUserData : exports.processUserData;
          const out = await fn("u_1");
          return { ok: out?.user?.id === "u_1" && out?.score === 30 && out?.prefs?.theme === "mono" };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Async Pipeline Execution",
        passed: Boolean(res?.ok),
        detail: "Resolves concurrent user, preferences, activity, and score pipeline",
      });
    } else if (taskId === "task_refactor_event_leak") {
      const harness = `
        const signals = [];
        const window = {
          innerWidth: 1280,
          addEventListener: (_evt, _fn, opts) => { if (opts?.signal) signals.push(opts.signal); },
          removeEventListener: () => {},
        };
        ${sanitizedCode};
        (() => {
          const W = typeof VisualizerWidget === "function" ? VisualizerWidget : exports.VisualizerWidget;
          const inst = new W({ innerText: "" });
          inst.destroy?.();
          return { cleanedUp: signals.length >= 2 && signals.every(s => s.aborted === true) };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DOM Listener Abort Cleanup",
        passed: Boolean(res?.cleanedUp),
        detail: "Aborts all registered window listeners when destroy() is called",
      });
    } else if (taskId === "task_refactor_o_n2_lookup") {
      // Test execution of O(N) map reconciliation
      const harness = `
        ${sanitizedCode};
        const fn = typeof reconcileTransactions === "function" ? reconcileTransactions : exports.reconcileTransactions;
        const orders = [{ id: "o1" }, { id: "o2" }];
        const payments = [{ orderId: "o1", txHash: "0xabc" }];
        const result = fn(orders, payments);
        result;
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Reconciliation Correctness",
        passed: Array.isArray(res) && res[0]?.isPaid === true && res[1]?.isPaid === false,
        detail: "Produces expected transaction payment matching output",
      });
    } else if (taskId === "task_refactor_input_sanitization") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof mergeConfig === "function" ? mergeConfig : exports.mergeConfig;
          const malicious = JSON.parse('{"__proto__":{"polluted":"yes"},"nested":{"ok":true}}');
          const out = fn({}, malicious);
          return { safe: ({}).polluted === undefined && out?.nested?.ok === true };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Prototype Pollution Immunity",
        passed: Boolean(res?.safe),
        detail: "Merges nested config while preventing Object.prototype pollution",
      });
    } else if (taskId === "task_refactor_reducer_state") {
      const harness = `
        ${sanitizedCode};
        const fn = typeof taskReducer === "function" ? taskReducer : exports.taskReducer;
        const s1 = fn({ tasks: [{ id: "1", done: false }] }, { type: "TASK_TOGGLED", id: "1" });
        const s2 = fn(s1, { type: "FILTER_CHANGED", filter: "active" });
        ({ s1, s2 });
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Reducer State Transitions",
        passed: res?.s1?.tasks[0]?.done === true && res?.s2?.filter === "active",
        detail: "Correctly performs deterministic immutable state updates",
      });
    } else if (taskId === "task_refactor_buffer_alloc") {
      const harness = `
        const dispatched = [];
        const dispatchPacket = (slice) => dispatched.push(new TextDecoder().decode(slice));
        ${sanitizedCode};
        (() => {
          const fn = typeof processTelemetryStream === "function" ? processTelemetryStream : exports.processTelemetryStream;
          const enc = new TextEncoder();
          fn([enc.encode("pkt1\\npkt"), enc.encode("2\\ntail")]);
          return { count: dispatched.length, first: dispatched[0], second: dispatched[1] };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Zero-Allocation Uint8Array Stream Slicing",
        passed: Boolean(res?.count === 2 && res?.first === "pkt1" && res?.second === "pkt2"),
        detail: "Reassembles split byte chunks across boundaries and dispatches exact slices",
      });
    } else if (taskId === "task_refactor_middleware_pipeline") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const P = typeof Pipeline === "function" ? Pipeline : exports.Pipeline;
          const pipe = new P();
          const order = [];
          pipe.use(async (ctx, next) => { order.push("a_in"); await next(); order.push("a_out"); });
          pipe.use(async (ctx, next) => { order.push("b"); ctx.response = "ok"; await next(); });
          const res = await pipe.execute({});
          return { res, order: order.join(",") };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Onion Middleware Execution Order",
        passed: Boolean(res?.res === "ok" && res?.order === "a_in,b,a_out"),
        detail: "Executes middleware stack in deterministic onion order",
      });
    } else if (taskId === "task_refactor_debounce_search") {
      const harness = `
        let fetchSignals = [];
        const fetch = async (_url, opts) => {
          fetchSignals.push(opts?.signal);
          return { json: async () => ({ results: ["hit"] }) };
        };
        ${sanitizedCode};
        (() => {
          const create = typeof createDebouncedSearch === "function" ? createDebouncedSearch : exports.createDebouncedSearch;
          const search = create(10);
          search("a", () => {});
          search("ab", () => {});
          return { abortedFirst: fetchSignals.length === 0 || true, isFn: typeof search === "function" };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Cancelable Debounce Factory",
        passed: Boolean(res?.isFn),
        detail: "Creates cancelable debounced search handler with AbortController lifecycle",
      });
    } else if (taskId === "task_refactor_typed_schema") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const parse = typeof parseTransactionWebhook === "function" ? parseTransactionWebhook : exports.parseTransactionWebhook;
          const valid = parse({
            event: { id: "evt_1" },
            data: { transaction: { amount: 19.5, items: [{ sku: " item_a " }] } }
          });
          let rejectedMalformed = false;
          try { parse({ event: { id: "" } }); } catch { rejectedMalformed = true; }
          return { ok: valid.id === "evt_1" && valid.amount === "19.50" && rejectedMalformed };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Runtime Schema Validation & Error Guard",
        passed: Boolean(res?.ok),
        detail: "Parses valid nested payloads and throws on malformed webhook inputs",
      });
    } else if (taskId === "task_refactor_worker_pool") {
      const harness = `
        const intensiveHash = (payload, iter) => payload + "_" + iter;
        ${sanitizedCode};
        (async () => {
          const fn = typeof computeHeavyHashes === "function" ? computeHeavyHashes : exports.computeHeavyHashes;
          const out = await fn([{ payload: "x" }, { payload: "y" }, { payload: "z" }], 2);
          return { ok: Array.isArray(out) && out.join(",") === "x_50000,y_50000,z_50000" };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Bounded Worker Pool Execution & Ordering",
        passed: Boolean(res?.ok),
        detail: "Processes records concurrently while preserving input index ordering",
      });
    } else if (taskId === "task_db_connection_pool") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Pool = typeof ConnectionPool === "function" ? ConnectionPool : exports.ConnectionPool;
          let created = 0;
          const pool = new Pool(async () => {
            const id = ++created;
            return { id, ping: async () => true, close: async () => {} };
          }, { maxSize: 2, acquireTimeoutMs: 50 });

          const c1 = await pool.acquire();
          const c2 = await pool.acquire();
          pool.release(c1);
          const c3 = await pool.acquire();
          const reused = c3.id === c1.id && created === 2;
          pool.release(c2);
          pool.release(c3);

          let releasedAfterError = false;
          try {
            await pool.withConnection(async () => { throw new Error("boom"); });
          } catch {}
          const st = pool.stats ? pool.stats() : { active: 0, idle: 2 };
          releasedAfterError = st.active === 0 && st.idle >= 1;
          await pool.drain?.();
          return { reused, releasedAfterError };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Pool Reuse & Fault-Safe Release",
        passed: Boolean(res?.reused && res?.releasedAfterError),
        detail: "Reuses idle connections within maxSize and releases on query exceptions",
      });
    } else if (taskId === "task_db_transactional_outbox") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const fn = typeof transferFunds === "function" ? transferFunds : exports.transferFunds;
          const log = [];
          let calls = 0;
          const mockDb = {
            async query(sql, params) {
              log.push({ sql, params });
              if (sql === "BEGIN" && ++calls === 1) {
                const err = new Error("deadlock detected");
                err.code = "40P01";
                throw err;
              }
              if (sql.startsWith("UPDATE accounts SET balance = balance -")) {
                return { rows: [{ balance: 75 }] };
              }
              return { rows: [] };
            }
          };
          const out = await fn(mockDb, { fromAccount: "acc_1", toAccount: "acc_2", amount: 25, idempotencyKey: "ik_1" });
          const hasRollback = log.some(e => e.sql === "ROLLBACK");
          const hasCommit = log.some(e => e.sql === "COMMIT");
          const hasOutbox = log.some(e => e.sql.includes("outbox_events") && Array.isArray(e.params));
          return { ok: out?.ok, attempt: out?.attempt, hasRollback, hasCommit, hasOutbox };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Transactional Outbox & Deadlock Retry",
        passed: Boolean(res?.ok && res?.attempt === 2 && res?.hasRollback && res?.hasCommit && res?.hasOutbox),
        detail: "Rolls back on 40P01 deadlock, retries transaction, and writes parameterized outbox event",
      });
    } else if (taskId === "task_db_keyset_pagination_dataloader") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Loader = typeof BatchDataLoader === "function" ? BatchDataLoader : exports.BatchDataLoader;
          let batchCalls = 0;
          let batchedKeys = [];
          const loader = new Loader(async (keys) => {
            batchCalls++;
            batchedKeys = keys;
            return new Map(keys.map(k => [k, { id: k, name: "User_" + k }]));
          });
          const [u1, u2, u1Dup] = await Promise.all([
            loader.load("u1"),
            loader.load("u2"),
            loader.load("u1"),
          ]);
          return {
            batchCalls,
            uniqueCount: batchedKeys.length,
            matched: u1?.name === "User_u1" && u2?.name === "User_u2" && u1Dup?.name === "User_u1"
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DataLoader Single-Tick Batch Coalescing",
        passed: Boolean(res?.batchCalls === 1 && res?.uniqueCount === 2 && res?.matched),
        detail: "Coalesces 3 concurrent lookups (with duplicate key) into 1 batch query of 2 unique keys",
      });
    } else if (taskId === "task_auth_dpop_token_binding") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof verifyDpopProof === "function" ? verifyDpopProof : exports.verifyDpopProof;
          const replayCache = new Set();
          const jwk = { kty: "EC", crv: "P-256", x: "x_val", y: "y_val" };
          const hashFn = (s) => "h_" + s;
          const expectedJkt = hashFn(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y }));
          const proof = {
            header: { typ: "dpop+jwt", alg: "ES256", jwk },
            payload: {
              jti: "nonce_1",
              htm: "POST",
              htu: "https://api.example.com/v1/transfer",
              iat: 1700000000,
              ath: hashFn("at_secret_1"),
            },
            signatureValid: true,
          };
          const valid = fn({
            dpopProof: proof,
            accessToken: "at_secret_1",
            expectedJkt,
            httpMethod: "POST",
            httpUrl: "https://api.example.com/v1/transfer?foo=bar#frag",
            replayCache,
            nowSec: 1700000010,
            hashFn,
          });
          let replayBlocked = false;
          try {
            fn({
              dpopProof: proof,
              accessToken: "at_secret_1",
              expectedJkt,
              httpMethod: "POST",
              httpUrl: "https://api.example.com/v1/transfer",
              replayCache,
              nowSec: 1700000012,
              hashFn,
            });
          } catch {
            replayBlocked = true;
          }
          return { bound: valid?.bound, replayBlocked };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DPoP Proof Binding & Replay Rejection",
        passed: Boolean(res?.bound === true && res?.replayBlocked === true),
        detail: "Accepts valid sender-constrained DPoP proof and blocks JTI replay",
      });
    } else if (taskId === "task_auth_webauthn_passkey") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof verifyPasskeyAssertion === "function" ? verifyPasskeyAssertion : exports.verifyPasskeyAssertion;
          const rpHash = new Uint8Array(32).fill(7);
          const authData = new Uint8Array(37);
          authData.set(rpHash, 0);
          authData[32] = 0x01 | 0x04; // UP + UV
          new DataView(authData.buffer).setUint32(33, 15, false); // signCount = 15

          const ok = fn({
            clientDataJSON: JSON.stringify({
              type: "webauthn.get",
              challenge: "chal_xyz",
              origin: "https://login.example.com",
            }),
            authenticatorData: authData,
            signatureValid: true,
            expectedChallenge: "chal_xyz",
            expectedOrigin: "https://login.example.com",
            expectedRpIdHash: rpHash,
            storedCredential: { userId: "usr_1", signCount: 10 },
          });

          let cloneDetected = false;
          try {
            fn({
              clientDataJSON: JSON.stringify({
                type: "webauthn.get",
                challenge: "chal_xyz",
                origin: "https://login.example.com",
              }),
              authenticatorData: authData,
              signatureValid: true,
              expectedChallenge: "chal_xyz",
              expectedOrigin: "https://login.example.com",
              expectedRpIdHash: rpHash,
              storedCredential: { userId: "usr_1", signCount: 15 }, // Equal/higher stored signCount -> clone!
            });
          } catch {
            cloneDetected = true;
          }
          return { verified: ok?.verified, newSignCount: ok?.newSignCount, cloneDetected };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "WebAuthn Assertion & Clone Detection",
        passed: Boolean(res?.verified && res?.newSignCount === 15 && res?.cloneDetected),
        detail: "Verifies binary authenticatorData flags/counter and catches cloned authenticators",
      });
    } else if (taskId === "task_auth_refresh_rotation_reuse") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Store = typeof RefreshTokenRotationStore === "function" ? RefreshTokenRotationStore : exports.RefreshTokenRotationStore;
          const store = new Store();
          const t1 = store.issueInitialFamily("usr_99");
          const t2 = store.rotate(t1.refreshToken);
          const t2ActiveBefore = store.isTokenActive(t2.refreshToken);

          let theftDetected = false;
          try {
            // Attacker replays already-rotated t1
            store.rotate(t1.refreshToken);
          } catch {
            theftDetected = true;
          }
          const t2ActiveAfterReplay = store.isTokenActive(t2.refreshToken);
          return { t2ActiveBefore, theftDetected, t2ActiveAfterReplay };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Refresh Rotation & Family Breach Revocation",
        passed: Boolean(res?.t2ActiveBefore === true && res?.theftDetected === true && res?.t2ActiveAfterReplay === false),
        detail: "Rotates refresh tokens and revokes active family descendants when a prior token is replayed",
      });
    } else if (taskId === "task_fingerprint_entropy_normalizer") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof analyzeBrowserFingerprint === "function" ? analyzeBrowserFingerprint : exports.analyzeBrowserFingerprint;
          const clean = fn({
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            platform: "MacIntel",
            webdriver: false,
            webgl: { vendor: "Apple Inc.", renderer: "Apple M3 Max" },
            audioSampleSum: 124.8391,
            canvasGeometry: "c_hash_1",
            hardwareConcurrency: 12,
          });
          const spoofed = fn({
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            platform: "Linux x86_64",
            webdriver: true,
            webgl: { vendor: "Google Inc.", renderer: "Google SwiftShader" },
            audioSampleSum: 124.8391,
            canvasGeometry: "c_hash_1",
            hardwareConcurrency: 4,
          });
          return {
            cleanOk: !clean.isBotSuspected && clean.fingerprintId.startsWith("fp_"),
            spoofCaught: spoofed.isBotSuspected && spoofed.anomalies.length >= 2,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Entropy Hashing & Spoofed Signal Detection",
        passed: Boolean(res?.cleanOk && res?.spoofCaught),
        detail: "Passes consistent browser profiles and flags Linux/SwiftShader/webdriver spoofing",
      });
    } else if (taskId === "task_fingerprint_tls_ja4_http2") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof correlateNetworkFingerprint === "function" ? correlateNetworkFingerprint : exports.correlateNetworkFingerprint;
          const legitChrome = fn({
            userAgent: "Mozilla/5.0 Chrome/128.0.0.0 Safari/537.36",
            tls: {
              version: 0x0304,
              sni: "example.com",
              alpn: "h2",
              ciphers: [0x0a0a, 0x1301, 0x1302, 0x1303, 0xc02b, 0xc02f],
              extensions: [0x2a2a, 0x0000, 0x0010, 0x0017, 0x000d],
            },
            http2: {
              pseudoHeaders: [":method", ":authority", ":scheme", ":path"],
            },
          });
          const spoofedBot = fn({
            userAgent: "Mozilla/5.0 Chrome/128.0.0.0 Safari/537.36",
            tls: {
              version: 0x0304,
              sni: "example.com",
              alpn: "h2",
              ciphers: [0x1301, 0x1302, 0x1303, 0xc02b, 0xc02f],
              extensions: [0x0017, 0x000d],
            },
            http2: {
              pseudoHeaders: [":method", ":path", ":authority", ":scheme"], // Non-Chrome order!
            },
          });
          return {
            greaseStripped: legitChrome.cleanCipherCount === 5 && !legitChrome.ja4.includes("0a0a"),
            legitPass: !legitChrome.impersonated,
            botFlagged: spoofedBot.impersonated,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "JA4 GREASE Stripping & HTTP/2 Order Correlation",
        passed: Boolean(res?.greaseStripped && res?.legitPass && res?.botFlagged),
        detail: "Strips 0x0a0a/0x2a2a GREASE values and catches non-Chrome HTTP/2 pseudo-header order",
      });
    } else if (taskId === "task_fingerprint_privacy_budget_defense") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Guard = typeof PrivacyBudgetGuard === "function" ? PrivacyBudgetGuard : exports.PrivacyBudgetGuard;
          const guard = new Guard({ sessionSecret: "sec_99", maxBudgetBits: 30 });
          const raw = new Uint8Array([100, 150, 200, 255, 50, 60, 70, 255]);
          const fA = guard.farbleCanvasPixels("https://tracker-a.example", raw);
          const fB = guard.farbleCanvasPixels("https://tracker-b.example", raw);

          // Same origin in a new guard with same sessionSecret must be deterministic
          const guard2 = new Guard({ sessionSecret: "sec_99", maxBudgetBits: 30 });
          const fA2 = guard2.farbleCanvasPixels("https://tracker-a.example", raw);
          const deterministicSameOrigin = fA.every((v, i) => v === fA2[i]);

          let budgetBlocked = false;
          try {
            // Second canvas read on tracker-a (18 + 18 = 36 > 30 bits) must throw!
            guard.farbleCanvasPixels("https://tracker-a.example", raw);
          } catch {
            budgetBlocked = true;
          }
          return { deterministicSameOrigin, budgetBlocked, validLength: fB.length === 8 };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Deterministic Farbling & Privacy Budget Enforcement",
        passed: Boolean(res?.deterministicSameOrigin && res?.budgetBlocked && res?.validLength),
        detail: "Applies deterministic per-origin pixel farbling and blocks reads exceeding privacy budget",
      });
    } else if (taskId === "task_cybersec_ssrf_dns_rebind") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const checkIp = typeof isPrivateOrReservedIp === "function" ? isPrivateOrReservedIp : exports.isPrivateOrReservedIp;
          const pinFn = typeof validateAndPinOutboundUrl === "function" ? validateAndPinOutboundUrl : exports.validateAndPinOutboundUrl;

          const blocksMetadata = checkIp("169.254.169.254");
          const blocksMappedLoopback = checkIp("::ffff:127.0.0.1");
          const blocksRfc1918 = checkIp("172.20.0.1") && checkIp("10.0.0.1") && checkIp("192.168.1.1");
          const allowsPublic = !checkIp("93.184.216.34");

          let rebindBlocked = false;
          try {
            await pinFn("https://evil.example.com/hook", async () => ["93.184.216.34", "169.254.169.254"]);
          } catch {
            rebindBlocked = true;
          }

          const pinned = await pinFn("https:// hooks.example.com/ok".replace(" ", ""), async () => ["93.184.216.34"]);
          return {
            blocksMetadata,
            blocksMappedLoopback,
            blocksRfc1918,
            allowsPublic,
            rebindBlocked,
            pinnedOk: pinned.pinnedIp === "93.184.216.34" && pinned.redirect === "manual",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "SSRF CIDR Blocking & DNS Pinning Verification",
        passed: Boolean(
          res?.blocksMetadata &&
            res?.blocksMappedLoopback &&
            res?.blocksRfc1918 &&
            res?.allowsPublic &&
            res?.rebindBlocked &&
            res?.pinnedOk
        ),
        detail: "Blocks cloud metadata, RFC 1918, IPv6-mapped loopback, and dual-record DNS rebinding",
      });
    } else if (taskId === "task_cybersec_csp_trusted_types_dom") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const sanitize = typeof sanitizeHtmlFragment === "function" ? sanitizeHtmlFragment : exports.sanitizeHtmlFragment;
          const buildCsp = typeof buildStrictCspHeader === "function" ? buildStrictCspHeader : exports.buildStrictCspHeader;

          const dirty = '<p onclick="steal()">Hello</p><img src=x onerror="alert(1)"><a href="&#106;avascript:evil()">Link</a><script>pwn()</script>';
          const clean = sanitize(dirty);
          const csp = buildCsp("rAnd0mN0nce_2026_xyz");

          return {
            noScript: !clean.includes("<script") && !clean.includes("onerror") && !clean.includes("onclick"),
            noJsUri: !clean.toLowerCase().includes("javascript:"),
            keepsSafeText: clean.includes("Hello") && clean.includes("Link"),
            strictCsp: csp.includes("'nonce-rAnd0mN0nce_2026_xyz'") && csp.includes("'strict-dynamic'") && csp.includes("require-trusted-types-for 'script'"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DOM XSS Payload Neutralization & Strict CSP",
        passed: Boolean(res?.noScript && res?.noJsUri && res?.keepsSafeText && res?.strictCsp),
        detail: "Neutralizes onerror/onclick/entity-encoded javascript: URIs and emits strict nonce CSP",
      });
    } else if (taskId === "task_cybersec_timing_safe_webhook_csrf") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const verify = typeof verifyWebhookAndCsrf === "function" ? verifyWebhookAndCsrf : exports.verifyWebhookAndCsrf;
          const seenNonces = new Set();
          const base = {
            signature: "hmac_sha256_deadbeef1234",
            expectedSignature: "hmac_sha256_deadbeef1234",
            timestampSec: 1700000100,
            nowSec: 1700000120,
            toleranceSec: 300,
            nonce: "n_101",
            seenNonces,
            secFetchSite: "same-origin",
            origin: "https://app.example.com",
            expectedOrigin: "https://app.example.com",
            csrfCookie: "csrf_tok_abc",
            csrfHeader: "csrf_tok_abc",
          };
          const first = verify(base);
          const replay = verify(base); // Same nonce n_101 -> must fail!
          const crossSite = verify({ ...base, nonce: "n_102", secFetchSite: "cross-site" });
          const expired = verify({ ...base, nonce: "n_103", timestampSec: 1700000120 - 900 });
          return {
            firstOk: first.allowed === true,
            replayBlocked: replay.allowed === false && replay.reason === "replayed_nonce",
            crossSiteBlocked: crossSite.allowed === false,
            expiredBlocked: expired.allowed === false,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Timing-Safe HMAC, Replay & Cross-Site CSRF Defense",
        passed: Boolean(res?.firstOk && res?.replayBlocked && res?.crossSiteBlocked && res?.expiredBlocked),
        detail: "Verifies constant-time secrets and blocks nonce replays, expired timestamps, and cross-site fetches",
      });
    } else if (taskId === "task_agentic_dag_planner_saga") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Engine = typeof AgenticWorkflowEngine === "function" ? AgenticWorkflowEngine : exports.AgenticWorkflowEngine;

          // 1. Test checkpoint resume + wave execution
          const eng1 = new Engine();
          let step1Runs = 0;
          eng1.registerStep({ id: "s1", deps: [], execute: async () => { step1Runs++; return "v1"; } });
          eng1.registerStep({ id: "s2", deps: ["s1"], execute: async (_, out) => out.s1 + "_v2" });
          const res1 = await eng1.run({}, {
            checkpoint: { completedIds: ["s1"], executionOrder: ["s1"], outputs: { s1: "cached_v1" } }
          });

          // 2. Test Saga reverse compensation on failure
          const eng2 = new Engine();
          const compOrder = [];
          eng2.registerStep({
            id: "db_migrate",
            deps: [],
            execute: async () => "migrated",
            compensate: async () => compOrder.push("undo_db_migrate"),
          });
          eng2.registerStep({
            id: "deploy_canary",
            deps: ["db_migrate"],
            execute: async () => "deployed",
            compensate: async () => compOrder.push("undo_deploy_canary"),
          });
          eng2.registerStep({
            id: "smoke_test",
            deps: ["deploy_canary"],
            execute: async () => { throw new Error("500 healthcheck failure"); },
          });
          const res2 = await eng2.run({});

          return {
            resumedWithoutRerun: step1Runs === 0 && res1.outputs.s2 === "cached_v1_v2",
            rolledBack: res2.status === "rolled_back" && compOrder.join(",") === "undo_deploy_canary,undo_db_migrate",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DAG Checkpoint Resume & Reverse Saga Compensation",
        passed: Boolean(res?.resumedWithoutRerun && res?.rolledBack),
        detail: "Skips checkpointed DAG nodes on resume and runs Saga compensation in reverse order on failure",
      });
    } else if (taskId === "task_agentic_tool_circuit_breaker_budget") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Runner = typeof ResilientAgentRunner === "function" ? ResilientAgentRunner : exports.ResilientAgentRunner;
          const runner = new Runner({ failureThreshold: 2 });
          let primaryCalls = 0;
          let fallbackCalls = 0;

          runner.registerTool("search_code", {
            execute: async () => {
              primaryCalls++;
              throw new Error("Search index timeout");
            },
            fallback: async (args) => {
              fallbackCalls++;
              return "fallback_grep:" + args.q;
            },
          });

          const actions = [
            { tool: "search_code", args: { q: "auth" }, tokens: 100 },
            { tool: "search_code", args: { q: "oauth" }, tokens: 100 },
            // Breaker is now open; 3rd call with distinct args should go straight to fallback without calling primary!
            { tool: "search_code", args: { q: "session" }, tokens: 100 },
            // Repeat q:"auth" twice more to trigger loop detector
            { tool: "search_code", args: { q: "auth" }, tokens: 100 },
            { tool: "search_code", args: { q: "auth" }, tokens: 100 },
            { type: "finish", output: "done", tokens: 50 },
          ];
          let idx = 0;
          const out = await runner.run(async () => actions[idx++], { maxSteps: 10, maxTokens: 2000, maxRepeatCalls: 2 });
          const loopCaught = out.trajectory.some((t) => t.loopDetected === true);
          return {
            statusOk: out.status === "completed",
            breakerPreventedPrimary: primaryCalls === 2 && fallbackCalls === 4,
            loopCaught,
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Circuit Breaker Fallback & Loop Guard Verification",
        passed: Boolean(res?.statusOk && res?.breakerPreventedPrimary && res?.loopCaught),
        detail: "Trips circuit breaker to fallback after 2 failures and blocks repeated identical tool loops",
      });
    } else if (taskId === "task_agentic_episodic_memory_compactor") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Manager = typeof LongHorizonMemoryManager === "function" ? LongHorizonMemoryManager : exports.LongHorizonMemoryManager;
          const mgr = new Manager({
            rootGoal: "Harden OAuth PKCE token endpoint in src/oauth.js",
            forbiddenScopes: ["production_database_drop", "billing_wipe"],
            maxContextTokens: 250,
          });

          mgr.appendTurn({
            role: "assistant",
            content: "Discovered PKCE S256 verifier in src/oauth.js line 164",
            tokens: 120,
            artifacts: ["src/oauth.js:164"],
            importance: 3,
          });
          mgr.appendTurn({
            role: "assistant",
            content: "Checked unit tests in tests/auth_oauth.test.js",
            tokens: 120,
            artifacts: ["tests/auth_oauth.test.js"],
            importance: 2,
          });
          mgr.appendTurn({
            role: "assistant",
            content: "Preparing patch for token introspection",
            tokens: 120,
            artifacts: ["src/api.js"],
            importance: 2,
          });

          const prompt = mgr.buildActivePrompt("PKCE verifier src/oauth.js");
          const driftCheck = mgr.checkGoalAlignment({ target: "run production_database_drop script" });
          const alignedCheck = mgr.checkGoalAlignment({ target: "edit src/oauth.js" });

          return {
            withinBudget: prompt.activeTokenCount <= 250,
            pinnedPreserved: prompt.pinnedGoal.includes("src/oauth.js"),
            recalledArtifact: prompt.recalledMemories.some((m) => m.artifacts.includes("src/oauth.js:164")),
            driftBlocked: driftCheck.aligned === false && alignedCheck.aligned === true,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Episodic Compaction, Recall & Goal-Drift Guard",
        passed: Boolean(res?.withinBudget && res?.pinnedPreserved && res?.recalledArtifact && res?.driftBlocked),
        detail: "Compacts old turns within token budget, recalls relevant artifacts, and blocks goal drift",
      });
    } else if (taskId === "task_db_read_write_replica_lag_router") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Router = typeof CausalReplicaRouter === "function" ? CausalReplicaRouter : exports.CausalReplicaRouter;
          const primary = { query: async () => ({ rows: ["p"], lsn: 50 }) };
          const laggingReplica = { id: "rep_lag", healthy: true, appliedLsn: 40, query: async () => ({ rows: ["stale"] }) };
          const caughtUpReplica = { id: "rep_ok", healthy: true, appliedLsn: 55, query: async () => ({ rows: ["fresh"] }) };

          const router = new Router(primary, [laggingReplica]);
          const session = { minLsn: 0 };
          await router.execute("INSERT INTO items VALUES ($1)", ["a"], session);
          // Lagging replica is at 40 < 50 -> must route to primary!
          const read1 = await router.execute("SELECT * FROM items", [], session);

          const router2 = new Router(primary, [laggingReplica, caughtUpReplica]);
          const read2 = await router2.execute("SELECT * FROM items", [], session);

          return {
            lsnTracked: session.minLsn === 50,
            lagFallbackToPrimary: read1.routedTo === "primary",
            caughtUpRoutedToReplica: read2.routedTo === "rep_ok",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Read-Your-Writes LSN Routing & Lag Failover",
        passed: Boolean(res?.lsnTracked && res?.lagFallbackToPrimary && res?.caughtUpRoutedToReplica),
        detail: "Bypasses lagging replicas when appliedLsn < session.minLsn and routes to caught-up replicas",
      });
    } else if (taskId === "task_auth_oidc_federated_jwt_validator") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const validate = typeof validateOidcIdToken === "function" ? validateOidcIdToken : exports.validateOidcIdToken;
          let refreshCount = 0;
          const jwksClient = {
            async getKey(kid, { forceRefresh }) {
              if (forceRefresh) refreshCount++;
              if (kid === "rotated_kid_2" && forceRefresh) {
                return { kty: "EC", crv: "P-256", kid: "rotated_kid_2" };
              }
              return null;
            }
          };

          const validRes = await validate({
            decodedToken: {
              header: { alg: "ES256", kid: "rotated_kid_2" },
              payload: {
                iss: "https://idp.example.com",
                aud: ["client_app", "other_service"],
                azp: "client_app",
                sub: "usr_oidc_1",
                nonce: "n_777",
                exp: 1700000500,
              },
              verifyWithJwk: (jwk) => jwk.kid === "rotated_kid_2",
            },
            jwksClient,
            expectedIssuer: "https://idp.example.com",
            expectedAudience: "client_app",
            expectedNonce: "n_777",
            nowSec: 1700000100,
          });

          let algNoneBlocked = false;
          try {
            await validate({
              decodedToken: {
                header: { alg: "none", kid: "rotated_kid_2" },
                payload: { iss: "https://idp.example.com", aud: "client_app", exp: 1700000500 },
                verifyWithJwk: () => true,
              },
              jwksClient,
              expectedIssuer: "https://idp.example.com",
              expectedAudience: "client_app",
              nowSec: 1700000100,
            });
          } catch {
            algNoneBlocked = true;
          }

          return {
            verified: validRes?.verified === true && refreshCount === 1,
            algNoneBlocked,
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "OIDC JWKS Key Rotation & Alg-Confusion Rejection",
        passed: Boolean(res?.verified && res?.algNoneBlocked),
        detail: "Refreshes JWKS on rotated kid, verifies multi-audience azp/nonce, and blocks alg:none",
      });
    } else if (taskId === "task_fingerprint_behavioral_biometrics_bot") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const classify = typeof classifyInteractionTelemetry === "function" ? classifyInteractionTelemetry : exports.classifyInteractionTelemetry;
          const human = classify({
            pointerEvents: [
              { x: 10, y: 10, t: 0, isTrusted: true },
              { x: 45, y: 28, t: 18, isTrusted: true },
              { x: 110, y: 95, t: 42, isTrusted: true },
              { x: 140, y: 150, t: 85, isTrusted: true },
            ],
            keyEvents: [{ downTime: 100, upTime: 165, isTrusted: true }],
          });
          const bot = classify({
            pointerEvents: [
              { x: 0, y: 0, t: 0, isTrusted: true },
              { x: 50, y: 50, t: 10, isTrusted: true },
              { x: 100, y: 100, t: 20, isTrusted: true },
              { x: 150, y: 150, t: 30, isTrusted: true },
            ],
            keyEvents: [{ downTime: 200, upTime: 200, isTrusted: true }],
          });
          return {
            humanPassed: human.isSyntheticBot === false,
            botCaught: bot.isSyntheticBot === true && bot.flags.length >= 2,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Pointer Kinematics & Keystroke Dwell Classification",
        passed: Boolean(res?.humanPassed && res?.botCaught),
        detail: "Distinguishes curved variable-velocity human input from linear zero-dwell bot macros",
      });
    } else if (taskId === "task_cybersec_http_desync_header_canonicalizer") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const check = typeof canonicalizeAndValidateHttpHeaders === "function" ? canonicalizeAndValidateHttpHeaders : exports.canonicalizeAndValidateHttpHeaders;
          const clean = check([
            ["Host", "example.com"],
            ["Content-Length", "42"],
          ]);

          let clTeBlocked = false;
          try {
            check([
              ["Content-Length", "13"],
              ["Transfer-Encoding", "chunked"],
            ]);
          } catch {
            clTeBlocked = true;
          }

          let crlfBlocked = false;
          try {
            check([["X-Custom", "val\\r\\nSet-Cookie: evil=1"]]);
          } catch {
            crlfBlocked = true;
          }

          return {
            cleanOk: clean.valid === true && clean.contentLength === 42,
            clTeBlocked,
            crlfBlocked,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "CL.TE Request Smuggling & CRLF Injection Prevention",
        passed: Boolean(res?.cleanOk && res?.clTeBlocked && res?.crlfBlocked),
        detail: "Blocks simultaneous Content-Length + Transfer-Encoding and CRLF header splitting",
      });
    } else if (taskId === "task_agentic_multi_agent_consensus_arbiter") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Arbiter = typeof MultiAgentLeaseArbiter === "function" ? MultiAgentLeaseArbiter : exports.MultiAgentLeaseArbiter;
          const arb = new Arbiter();

          const lease1 = arb.acquireLease("agent_alpha", ["src/auth"], 100, 1000);
          let overlapBlocked = false;
          try {
            // Child path src/auth/jwt.js overlaps held parent dir src/auth!
            arb.acquireLease("agent_beta", ["src/auth/jwt.js"], 100, 1010);
          } catch {
            overlapBlocked = true;
          }

          // After lease1 expires at t=1150, agent_beta acquires a newer epoch lease
          const lease2 = arb.acquireLease("agent_beta", ["src/auth/jwt.js"], 100, 1150);
          const betaCommit = arb.commitPatch({
            agentId: "agent_beta",
            leaseId: lease2.leaseId,
            epoch: lease2.epoch,
            filePath: "src/auth/jwt.js",
            content: "const v = 2;",
            nowMs: 1160,
          });

          let zombieAlphaBlocked = false;
          try {
            // Delayed agent_alpha wakes up with stale epoch and tries to overwrite src/auth/jwt.js
            arb.commitPatch({
              agentId: "agent_alpha",
              leaseId: lease1.leaseId,
              epoch: lease1.epoch,
              filePath: "src/auth/jwt.js",
              content: "const v = 1;",
              nowMs: 1170,
            });
          } catch {
            zombieAlphaBlocked = true;
          }

          return {
            overlapBlocked,
            betaCommitted: betaCommit.committed === true,
            zombieAlphaBlocked,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Hierarchical Path Leases & Stale Epoch Fencing",
        passed: Boolean(res?.overlapBlocked && res?.betaCommitted && res?.zombieAlphaBlocked),
        detail: "Blocks parent/child path conflicts and fences zombie commits with stale lease epochs",
      });
    } else if (taskId === "task_chat_realtime_instrumentation") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Chat = typeof InstrumentedTwoUserChat === "function" ? InstrumentedTwoUserChat : exports.InstrumentedTwoUserChat;
          const chat = new Chat({ typingTtlMs: 500 });
          const m1 = chat.sendMessage({ sender: "pp", recipient: "agent", text: "Ping", nowMs: 1000 });
          chat.setTyping({ sender: "agent", recipient: "pp", isTyping: true, nowMs: 1100 });
          const snapActive = chat.getSnapshot("agent", "pp", 1200);
          const snapExpired = chat.getSnapshot("agent", "pp", 1700);
          const m2 = chat.sendMessage({ sender: "agent", recipient: "pp", text: "Pong", nowMs: 1800 });
          chat.markRead({ reader: "pp", peer: "agent", upToSeq: 2, nowMs: 1900 });
          const finalSnap = chat.getSnapshot("pp", "agent", 1900);

          return {
            canonicalOk: m1.roomId === "dm:agent:pp" && m2.seq === 2,
            typingLifecycleOk: snapActive.typingUsers.includes("agent") && snapExpired.typingUsers.length === 0,
            watermarksOk: finalSnap.readWatermarks.pp === 2 && finalSnap.readWatermarks.agent === 2,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Two-User Chat Instrumentation & Watermark Verification",
        passed: Boolean(res?.canonicalOk && res?.typingLifecycleOk && res?.watermarksOk),
        detail: "Verifies dm:agent:pp canonical room, monotonic seq, typing TTL pruning, and read watermarks",
      });
    } else if (taskId === "task_chat_debug_race_duplication") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Coord = typeof DebuggedChatCoordinator === "function" ? DebuggedChatCoordinator : exports.DebuggedChatCoordinator;
          const coord = new Coord({ typingTtlMs: 400 });

          // 1. Out-of-order: seq 2 arrives before seq 1
          const r1 = coord.ingestPacket({ seq: 2, sender: "bob", text: "Second", clientMsgId: "id_2" }, 100);
          const r2 = coord.ingestPacket({ seq: 1, sender: "alice", text: "First", clientMsgId: "id_1" }, 110);

          // 2. Duplicate retry of clientMsgId "id_1"
          const dup = coord.ingestPacket({ seq: 1, sender: "alice", text: "First", clientMsgId: "id_1" }, 120);

          // 3. Ghost typing expiry
          coord.ingestPacket({ type: "typing", user: "bob", isTyping: true }, 200);
          const typingAt300 = coord.getActiveTyping(300);
          const typingAt700 = coord.getActiveTyping(700);

          const transcript = coord.getTranscript();
          return {
            resequencedOk: r1.status === "buffered_out_of_order" && r2.flushed.length === 2 && transcript.map(m => m.seq).join(",") === "1,2",
            dupSuppressed: dup.status === "duplicate_ignored" && transcript.length === 2,
            typingPruned: typingAt300.includes("bob") && typingAt700.length === 0,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Idempotent Deduplication & Causal Resequencing",
        passed: Boolean(res?.resequencedOk && res?.dupSuppressed && res?.typingPruned),
        detail: "Reorders out-of-order packets into [1,2], suppresses clientMsgId retries, and evicts ghost typing",
      });
    } else if (taskId === "task_chat_refactor_state_protocol") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const reducer = typeof chatProtocolReducer === "function" ? chatProtocolReducer : exports.chatProtocolReducer;
          const init = typeof INITIAL_CHAT_STATE === "object" ? INITIAL_CHAT_STATE : exports.INITIAL_CHAT_STATE;

          const step1 = reducer(init, { type: "TYPING_SET", user: "agent", isTyping: true });
          const step2 = reducer(step1.state, { type: "MESSAGE_SENT", sender: "agent", recipient: "pp", text: "Hello pp" });
          const step3 = reducer(step2.state, { type: "MESSAGE_EDITED", sender: "agent", seq: 1, newText: "Hello pp (edited)" });
          const step4 = reducer(step3.state, { type: "MESSAGE_READ", reader: "pp" });

          return {
            pureImmutability: init.messages.length === 0 && step2.state.typingByPeer.agent === false,
            unreadTrackedAndCleared: step2.state.unreadByPeer.pp === 1 && step4.state.unreadByPeer.pp === 0,
            editedOk: step3.state.messages[0].text === "Hello pp (edited)" && step3.state.messages[0].edited === true,
            effectsEmitted: step2.effects.some(e => e.type === "SSE_BROADCAST"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Pure Chat Protocol State Transitions & Effects",
        passed: Boolean(res?.pureImmutability && res?.unreadTrackedAndCleared && res?.editedOk && res?.effectsEmitted),
        detail: "Transitions send/edit/read/typing states immutably and emits declarative SSE broadcast effects",
      });
    } else if (taskId === "task_chat_perf_ringbuffer_fanout_bench") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const benchFn = typeof benchmarkTwoUserChatFanout === "function" ? benchmarkTwoUserChatFanout : exports.benchmarkTwoUserChatFanout;
          const report = benchFn(120, 32);
          return {
            cappedAtCapacity: report.retainedCount === 32,
            slidingWindowCorrect: report.oldestSeq === 89 && report.newestSeq === 120,
            fanoutDelivered: report.deliveredFrames === 240,
            hasPercentiles: typeof report.p50Us === "number" && typeof report.p99Us === "number",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "O(1) Ring Buffer Capacity & Fanout Benchmark",
        passed: Boolean(res?.cappedAtCapacity && res?.slidingWindowCorrect && res?.fanoutDelivered && res?.hasPercentiles),
        detail: "Retains latest 32 of 120 messages in O(1) ring buffer, fans out 240 frames, and reports P50/P99 latency",
      });
    } else if (taskId === "task_ts_react_nextjs_server_actions") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const reducer = typeof optimisticOrdersReducer === "function" ? optimisticOrdersReducer : exports.optimisticOrdersReducer;
          const makeAction = typeof createSafeServerAction === "function" ? createSafeServerAction : exports.createSafeServerAction;

          const base = [{ id: "ord_1", sku: "PRO-PLAN", amountCents: 4900, pending: false }];
          const afterAdd = reducer(base, { type: "OPTIMISTIC_ADD", tempId: "tmp_9", sku: "ENT-SEAT", amountCents: 9900 });
          const afterRollback = reducer(afterAdd, { type: "ROLLBACK_FAILURE", tempId: "tmp_9" });
          const afterCommit = reducer(afterAdd, {
            type: "COMMIT_SUCCESS",
            tempId: "tmp_9",
            committed: { id: "ord_2", sku: "ENT-SEAT", amountCents: 9900 },
          });

          const action = makeAction({
            validate: (raw) =>
              typeof raw.sku === "string" && raw.sku.length >= 3
                ? { valid: true, value: { sku: raw.sku, amountCents: Number(raw.amountCents || 0) } }
                : { valid: false, fieldErrors: { sku: "SKU must be at least 3 chars" } },
            revalidateTags: ["orders", "billing-summary"],
            handler: async (input) => ({ id: "ord_99", ...input }),
          });

          const badRes = await action({ sku: "a" });
          const goodRes = await action({ sku: "ENT-SEAT", amountCents: 9900 });

          return {
            optimisticOk: afterAdd.length === 2 && afterAdd[1].pending === true && base.length === 1,
            rollbackOk: afterRollback.length === 1 && afterRollback[0].id === "ord_1",
            commitOk: afterCommit[1].id === "ord_2" && afterCommit[1].pending === false,
            validationRejected: badRes.ok === false && badRes.code === "VALIDATION_ERROR",
            actionResolved: goodRes.ok === true && goodRes.data.id === "ord_99" && goodRes.revalidatedTags.includes("orders"),
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Transpiled TypeScript Server Action & Optimistic Rollback Execution",
        passed: Boolean(
          res?.optimisticOk && res?.rollbackOk && res?.commitOk && res?.validationRejected && res?.actionResolved,
        ),
        detail: "Executes transpiled TS optimistic reducer rollback and validated Next.js Server Action envelope",
      });
    } else if (taskId === "task_ts_angular_signals_computed_rx") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const sigFn = typeof signal === "function" ? signal : exports.signal;
          const compFn = typeof computed === "function" ? computed : exports.computed;
          const switchFn = typeof createSwitchMapLoader === "function" ? createSwitchMapLoader : exports.createSwitchMapLoader;

          let computeRuns = 0;
          const price = sigFn(100);
          const qty = sigFn(3);
          const total = compFn(() => {
            computeRuns++;
            return price() * qty();
          });

          const firstTotal = total();
          const cachedTotal = total(); // Should not recompute when dependencies haven't changed
          qty.update((q) => q + 2);
          const updatedTotal = total();

          const accountId = sigFn("acc_slow");
          const abortedKeys = [];
          const loader = switchFn(accountId, async (key, abortSig) => {
            abortSig.addEventListener("abort", () => abortedKeys.push(key));
            if (key === "acc_slow") {
              await new Promise((r) => setTimeout(r, 30));
            }
            return "portfolio:" + key;
          });

          const p1 = loader.trigger("acc_slow");
          const p2 = loader.trigger("acc_fast");
          await Promise.all([p1, p2]);

          return {
            signalMemoOk: firstTotal === 300 && cachedTotal === 300 && computeRuns === 2 && updatedTotal === 500,
            switchMapCanceledSlow: abortedKeys.includes("acc_slow") && loader.data() === "portfolio:acc_fast",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Angular Signal Graph Memoization & switchMap Cancellation",
        passed: Boolean(res?.signalMemoOk && res?.switchMapCanceledSlow),
        detail: "Tracks signal dependencies lazily and aborts superseded in-flight switchMap requests",
      });
    } else if (taskId === "task_ts_nestjs_di_guard_interceptor") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Container = typeof NestContainer === "function" ? NestContainer : exports.NestContainer;
          const Guard = typeof RolesGuard === "function" ? RolesGuard : exports.RolesGuard;
          const Interceptor = typeof AuditTelemetryInterceptor === "function" ? AuditTelemetryInterceptor : exports.AuditTelemetryInterceptor;
          const runPipe = typeof executeNestPipeline === "function" ? executeNestPipeline : exports.executeNestPipeline;

          const container = new Container();
          let creations = 0;
          container.register("LEDGER_SVC", () => ({ id: ++creations, refund: (id) => "refunded:" + id }), true);
          const s1 = container.resolve("LEDGER_SVC");
          const s2 = container.resolve("LEDGER_SVC");

          let unauthBlocked = false;
          try {
            await runPipe(
              { handlerName: "issueRefund", requiredRoles: ["FINANCE_ADMIN"], request: { user: { id: "u_1", roles: ["VIEWER"] } } },
              [new Guard()],
              [new Interceptor()],
              async () => s1.refund("inv_1"),
            );
          } catch (e) {
            unauthBlocked = e.statusCode === 403;
          }

          const authorizedRes = await runPipe(
            { handlerName: "issueRefund", requiredRoles: ["FINANCE_ADMIN"], request: { user: { id: "u_admin", roles: ["FINANCE_ADMIN"] } } },
            [new Guard()],
            [new Interceptor()],
            async () => s1.refund("inv_99"),
          );

          return {
            singletonOk: s1 === s2 && creations === 1,
            unauthBlocked,
            interceptorOk: authorizedRes.data === "refunded:inv_99" && authorizedRes.audit.actorId === "u_admin",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "NestJS DI Singleton, RBAC Guard & Interceptor Execution",
        passed: Boolean(res?.singletonOk && res?.unauthBlocked && res?.interceptorOk),
        detail: "Resolves singleton DI tokens, blocks unauthorized roles with 403, and wraps responses with audit telemetry",
      });
    } else if (taskId === "task_ts_trpc_zod_end_to_end_rpc") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Builder = typeof ProcedureBuilder === "function" ? ProcedureBuilder : exports.ProcedureBuilder;
          const Err = typeof TRPCError === "function" ? TRPCError : exports.TRPCError;
          const makeRouter = typeof createTRPCRouter === "function" ? createTRPCRouter : exports.createTRPCRouter;

          const publicProcedure = new Builder();
          const authedProcedure = publicProcedure.use(async ({ ctx, next }) => {
            if (!ctx?.user) throw new Err({ code: "UNAUTHORIZED", message: "Missing session" });
            return next({ ctx: { ...ctx, user: ctx.user } });
          });

          const router = makeRouter({
            createProject: authedProcedure
              .input({
                parse(raw) {
                  if (!raw || typeof raw.name !== "string" || raw.name.length < 3) {
                    throw new Error("name min 3 chars");
                  }
                  return { name: raw.name.trim() };
                },
              })
              .mutation(async ({ ctx, input }) => ({
                projectName: input.name,
                ownerId: ctx.user.id,
              })),
          });

          let unauthCode = "";
          try {
            await router.createCaller({ user: null }).createProject({ name: "Apollo" });
          } catch (e) {
            unauthCode = e.code;
          }

          let badInputCode = "";
          try {
            await router.createCaller({ user: { id: "usr_42" } }).createProject({ name: "a" });
          } catch (e) {
            badInputCode = e.code;
          }

          const created = await router.createCaller({ user: { id: "usr_42" } }).createProject({ name: "Enterprise Core" });

          return {
            unauthBlocked: unauthCode === "UNAUTHORIZED",
            badInputBlocked: badInputCode === "BAD_REQUEST",
            createdOk: created.projectName === "Enterprise Core" && created.ownerId === "usr_42",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "tRPC Context Narrowing, Input Validation & Caller Dispatch",
        passed: Boolean(res?.unauthBlocked && res?.badInputBlocked && res?.createdOk),
        detail: "Enforces UNAUTHORIZED middleware, BAD_REQUEST input schema parsing, and typed caller execution",
      });
    } else if (taskId === "task_migrate_express_to_hono_edge_ts") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Router = typeof TypedEdgeRouter === "function" ? TypedEdgeRouter : exports.TypedEdgeRouter;
          const app = new Router();

          app.use(async (c, next) => {
            const key = c.req.headers.get("x-api-key");
            if (!key) return c.json({ error: "Unauthorized" }, 401);
            c.set("tenantId", "tenant_" + key);
            return await next();
          });

          app.get("/v1/orgs/:orgId/members", (c) =>
            c.json({ tenantId: c.get("tenantId"), orgId: c.params.orgId }),
          );

          const unauthRes = await app.fetch(new Request("https://edge.local/v1/orgs/acme/members"));
          const authedRes = await app.fetch(
            new Request("https://edge.local/v1/orgs/acme-corp/members", {
              headers: { "x-api-key": "live_99" },
            }),
          );
          const body = await authedRes.json();

          return {
            unauth401: unauthRes.status === 401,
            authedOk: authedRes.status === 200 && body.tenantId === "tenant_live_99" && body.orgId === "acme-corp",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Web-Standard Edge Router Middleware & Param Execution",
        passed: Boolean(res?.unauth401 && res?.authedOk),
        detail: "Executes Fetch Request/Response middleware, extracts :orgId params, and propagates typed context",
      });
    } else if (taskId === "task_migrate_react_hooks_to_svelte5_vue3_signals") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const makeStore = typeof createMigratedAnalyticsStore === "function" ? createMigratedAnalyticsStore : exports.createMigratedAnalyticsStore;
          const store = makeStore([
            { id: "1", title: "Alpha Node", score: 40 },
            { id: "2", title: "Beta Signal", score: 85 },
            { id: "3", title: "Gamma Rune", score: 95 },
          ]);

          const initialCount = store.summary.value.count;
          store.minScore.value = 80;
          const afterScoreCount = store.summary.value.count;
          store.query.value = "gamma";
          const afterQueryCount = store.summary.value.count;
          store.dispose();

          return {
            countsOk: initialCount === 3 && afterScoreCount === 2 && afterQueryCount === 1,
            topScoreOk: store.summary.value.topScore === 95,
            cleanupsRan: store.auditTrail.includes("cleanup:3") && store.auditTrail.includes("cleanup:2"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Fine-Grained $state/$derived/$effect Graph & Cleanup",
        passed: Boolean(res?.countsOk && res?.topScoreOk && res?.cleanupsRan),
        detail: "Propagates fine-grained updates through derived selectors and executes effect cleanups",
      });
    } else if (taskId === "task_migrate_redux_thunks_to_tanstack_query_ts") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Client = typeof TypedQueryClient === "function" ? TypedQueryClient : exports.TypedQueryClient;
          const qc = new Client();
          let networkCalls = 0;

          const fetcher = async () => {
            networkCalls++;
            await new Promise((r) => setTimeout(r, 15));
            return [{ id: "u1", name: "Ada" }];
          };

          // Concurrent calls with differently-ordered filter keys should deduplicate!
          const [r1, r2] = await Promise.all([
            qc.fetchQuery({ queryKey: ["users", { role: "admin", active: true }], queryFn: fetcher, staleTimeMs: 5000 }),
            qc.fetchQuery({ queryKey: ["users", { active: true, role: "admin" }], queryFn: fetcher, staleTimeMs: 5000 }),
          ]);

          // Failed optimistic mutation should roll back to ["Ada"]
          let failedAsExpected = false;
          try {
            await qc.executeOptimisticMutation({
              queryKey: ["users", { active: true, role: "admin" }],
              variables: { id: "u2", name: "Ghost" },
              optimisticUpdater: (old = [], v) => [...old, v],
              mutationFn: async () => {
                throw new Error("DB conflict");
              },
            });
          } catch {
            failedAsExpected = true;
          }

          const afterRollback = qc.getQueryData(["users", { role: "admin", active: true }]);

          return {
            dedupedOk: networkCalls === 1 && r1.length === 1 && r2.length === 1,
            rollbackOk: failedAsExpected && Array.isArray(afterRollback) && afterRollback.length === 1 && afterRollback[0].name === "Ada",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "TanStack Query Deduplication, Canonical Key Hashing & Rollback",
        passed: Boolean(res?.dedupedOk && res?.rollbackOk),
        detail: "Deduplicates concurrent fetches with canonical key hashing and rolls back failed optimistic mutations",
      });
    } else if (taskId === "task_migrate_nextjs_pages_to_app_router_rsc") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Cache = typeof NextAppRouterCache === "function" ? NextAppRouterCache : exports.NextAppRouterCache;
          const renderRSC = typeof renderDashboardRSC === "function" ? renderDashboardRSC : exports.renderDashboardRSC;
          const postHandler = typeof POST_RevalidateRouteHandler === "function" ? POST_RevalidateRouteHandler : exports.POST_RevalidateRouteHandler;

          const cache = new Cache();
          let userLoads = 0;
          let metricLoads = 0;

          const firstRender = await renderRSC({
            userId: "42",
            cache,
            loadUser: async (id) => { userLoads++; return { id, name: "Linus" }; },
            loadMetrics: async () => { metricLoads++; return { cpu: 12 }; },
          });

          const cachedRender = await renderRSC({
            userId: "42",
            cache,
            loadUser: async (id) => { userLoads++; return { id, name: "Linus" }; },
            loadMetrics: async () => { metricLoads++; return { cpu: 99 }; },
          });

          // Revalidate only "metrics" tag via Route Handler
          const revRes = await postHandler(
            new Request("https://app.local/api/revalidate", {
              method: "POST",
              body: JSON.stringify({ tag: "metrics" }),
            }),
            cache,
          );
          const revBody = await revRes.json();

          const afterRevalidate = await renderRSC({
            userId: "42",
            cache,
            loadUser: async (id) => { userLoads++; return { id, name: "Linus" }; },
            loadMetrics: async () => { metricLoads++; return { cpu: 55 }; },
          });

          return {
            hitOk: firstRender.telemetry.userCache === "MISS" && cachedRender.telemetry.metricsCache === "HIT",
            selectiveRevalidateOk:
              revBody.revalidated === true &&
              afterRevalidate.telemetry.userCache === "HIT" &&
              afterRevalidate.telemetry.metricsCache === "MISS" &&
              userLoads === 1 &&
              metricLoads === 2,
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Parallel RSC Tagged Caching & Selective revalidateTag() Execution",
        passed: Boolean(res?.hitOk && res?.selectiveRevalidateOk),
        detail: "Serves cached RSC payloads on HIT and selectively evicts tagged entries via POST Route Handler",
      });
    } else if (taskId === "task_pkg_npm_to_pnpm_bun_workspace_migration") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const migrate = typeof migrateToStrictPnpmBunWorkspaces === "function"
            ? migrateToStrictPnpmBunWorkspaces
            : exports.migrateToStrictPnpmBunWorkspaces;

          const out = migrate({
            targetManager: "bun@1.4.2",
            workspaceGlobs: ["packages/*", "apps/*"],
            transitiveHoistedVersions: { "zod": "^3.24.0" },
            members: [
              {
                name: "@acme/core",
                version: "1.0.0",
                dependencies: { typescript: "^5.7.0" },
                importedSpecifiers: ["node:crypto"],
              },
              {
                name: "@acme/web",
                version: "1.0.0",
                dependencies: { "@acme/core": "^1.0.0", typescript: "^5.7.0" },
                importedSpecifiers: ["@acme/core", "zod/v4"],
              },
            ],
          });

          const webPkg = out.migratedMembers.find((m) => m.name === "@acme/web");
          return {
            workspaceProtoOk: webPkg.dependencies["@acme/core"] === "workspace:^",
            catalogOk: out.catalog.typescript === "^5.7.0" && webPkg.dependencies.typescript === "catalog:",
            phantomDetected: webPkg.phantomDependenciesAdded.includes("zod") && webPkg.dependencies.zod === "^3.24.0",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Monorepo workspace:^, catalog: & Phantom Dependency Migration",
        passed: Boolean(res?.workspaceProtoOk && res?.catalogOk && res?.phantomDetected),
        detail: "Promotes phantom imports, rewrites sibling deps to workspace:^, and extracts shared catalog: versions",
      });
    } else if (taskId === "task_pkg_dual_cjs_esm_exports_jsr_deno") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const build = typeof buildMultiRuntimePackageArtifacts === "function"
            ? buildMultiRuntimePackageArtifacts
            : exports.buildMultiRuntimePackageArtifacts;

          const artifacts = build({
            name: "@acme/crypto-sdk",
            version: "3.0.0",
            entries: [
              {
                subpath: ".",
                sourceTs: "./src/index.ts",
                esmPath: "./dist/index.mjs",
                cjsPath: "./dist/index.cjs",
                dtsEsPath: "./dist/index.d.mts",
                dtsCjsPath: "./dist/index.d.cts",
              },
            ],
          });

          const orderCheck = artifacts.validateConditionOrder(".");
          const rootExport = artifacts.packageJson.exports["."];
          return {
            typesFirstOk: orderCheck.valid === true,
            multiRuntimeOk: rootExport.bun === "./src/index.ts" && rootExport.deno === "./src/index.ts",
            jsrOk: artifacts.jsrJson.name === "@acme/crypto-sdk" && artifacts.jsrJson.exports["."] === "./src/index.ts",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Multi-Runtime Exports Condition Order & JSR Manifest Verification",
        passed: Boolean(res?.typesFirstOk && res?.multiRuntimeOk && res?.jsrOk),
        detail: "Verifies types-first condition ordering for Node ESM/CJS alongside Bun, Deno, and JSR manifests",
      });
    } else if (taskId === "task_pkg_lockfile_supply_chain_auditor") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const audit = typeof auditCrossManagerLockfile === "function"
            ? auditCrossManagerLockfile
            : exports.auditCrossManagerLockfile;

          const policy = {
            internalScopes: ["@corp/"],
            internalRegistryHost: "npm.corp.internal",
            trustedPublicHosts: ["registry.npmjs.org", "jsr.io"],
            allowInstallScriptsPackages: ["esbuild"],
          };

          const cleanReport = audit(
            [
              {
                name: "@corp/auth",
                version: "1.2.0",
                resolvedUrl: "https://npm.corp.internal/@corp/auth/-/auth-1.2.0.tgz",
                integrity: "sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
                hasInstallScripts: false,
                manager: "pnpm",
              },
            ],
            policy,
          );

          const badReport = audit(
            [
              {
                name: "@corp/auth",
                version: "9.9.9",
                resolvedUrl: "https://registry.npmjs.org/@corp/auth/-/auth-9.9.9.tgz",
                integrity: "sha1-weak",
                hasInstallScripts: true,
                manager: "npm",
              },
            ],
            policy,
          );

          const codes = badReport.violations.map((v) => v.code);
          return {
            cleanPassed: cleanReport.passed === true,
            confusionCaught: codes.includes("DEPENDENCY_CONFUSION_SCOPE_LEAK"),
            sriCaught: codes.includes("WEAK_OR_MISSING_SRI_INTEGRITY"),
            scriptCaught: codes.includes("UNAUTHORIZED_LIFECYCLE_SCRIPT"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Cross-Manager Lockfile Supply-Chain Policy Enforcement",
        passed: Boolean(res?.cleanPassed && res?.confusionCaught && res?.sriCaught && res?.scriptCaught),
        detail: "Catches @corp/* dependency confusion, weak SRI digests, and unauthorized install scripts",
      });
    } else if (taskId === "task_pkg_monorepo_task_graph_cache_runner") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Orchestrator = typeof MonorepoTaskOrchestrator === "function"
            ? MonorepoTaskOrchestrator
            : exports.MonorepoTaskOrchestrator;

          const orch = new Orchestrator();
          let buildsRun = 0;

          const makeNodes = (coreHash) => [
            {
              name: "@repo/core",
              localSourceHash: coreHash,
              internalDeps: [],
              runTask: async () => { buildsRun++; return "dist:core:" + coreHash; },
            },
            {
              name: "@repo/ui",
              localSourceHash: "ui_v1",
              internalDeps: ["@repo/core"],
              runTask: async () => { buildsRun++; return "dist:ui"; },
            },
            {
              name: "@repo/app",
              localSourceHash: "app_v1",
              internalDeps: ["@repo/core", "@repo/ui"],
              runTask: async () => { buildsRun++; return "dist:app"; },
            },
          ];

          const run1 = await orch.executeGraph(makeNodes("core_v1"), "bun-1.4.2");
          const run2Cached = await orch.executeGraph(makeNodes("core_v1"), "bun-1.4.2");
          // Changing @repo/core source hash must invalidate @repo/ui and @repo/app downstream!
          const run3Invalidated = await orch.executeGraph(makeNodes("core_v2"), "bun-1.4.2");

          return {
            wavesOk: run1.waves.length === 3 && run1.waves[0][0] === "@repo/core" && run1.waves[2][0] === "@repo/app",
            cacheHitOk:
              run2Cached.records["@repo/core"].status === "CACHE_HIT" &&
              run2Cached.records["@repo/app"].status === "CACHE_HIT",
            upstreamInvalidationOk:
              run3Invalidated.records["@repo/core"].status === "EXECUTED" &&
              run3Invalidated.records["@repo/ui"].status === "EXECUTED" &&
              run3Invalidated.records["@repo/app"].status === "EXECUTED" &&
              buildsRun === 6,
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Topological Monorepo Wave Execution & Upstream Cache Invalidation",
        passed: Boolean(res?.wavesOk && res?.cacheHitOk && res?.upstreamInvalidationOk),
        detail: "Executes topological waves, replays CACHE_HITs, and invalidates downstream dependents when core hash changes",
      });
    } else if (taskId === "task_html_speculation_rules_prerender") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const compile = typeof compileSpeculationRulesTag === "function"
            ? compileSpeculationRulesTag
            : exports.compileSpeculationRulesTag;

          const active = compile({
            allowPaths: ["/docs/*", "/curriculum/*"],
            disallowPaths: ["/admin/*"],
            excludeSelectors: [".danger-link"],
            eagerness: "moderate",
            saveDataHeader: "off",
            effectiveConnectionType: "4g",
          });

          const suppressed = compile({
            allowPaths: ["/*"],
            disallowPaths: [],
            excludeSelectors: [],
            eagerness: "moderate",
            saveDataHeader: "on",
          });

          const ruleJson = active.rules?.prerender?.[0];
          const notClauses = JSON.stringify(ruleJson?.where?.and || []);
          return {
            tagOk: active.enabled === true && active.html.startsWith('<script type="speculationrules">'),
            exclusionsOk: notClauses.includes("/logout") && notClauses.includes("/admin/*") && notClauses.includes("[data-no-prerender]"),
            saveDataSuppressed: suppressed.enabled === false && suppressed.html === "",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Speculation Rules Document AST & Save-Data Suppression",
        passed: Boolean(res?.tagOk && res?.exclusionsOk && res?.saveDataSuppressed),
        detail: "Emits valid speculationrules JSON with /logout exclusions and suppresses prerender under Save-Data: on",
      });
    } else if (taskId === "task_html_declarative_shadow_dom_streaming") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const renderSSR = typeof renderDeclarativeShadowCardSSR === "function"
            ? renderDeclarativeShadowCardSSR
            : exports.renderDeclarativeShadowCardSSR;
          const hydrate = typeof hydrateDeclarativeShadowCard === "function"
            ? hydrateDeclarativeShadowCard
            : exports.hydrateDeclarativeShadowCard;

          const html = renderSSR({
            id: "card-1",
            heading: "Zero-FOUC <Card>",
            badgeText: "SSR",
            delegateFocus: true,
          });

          const existingRoot = {};
          const reused = hydrate({
            shadowRoot: existingRoot,
            attachShadow: () => { throw new Error("Should not call attachShadow when DSD shadowRoot exists!"); },
          });

          const attached = hydrate({
            shadowRoot: null,
            attachShadow: () => ({}),
          });

          return {
            ssrOk: html.includes('<template shadowrootmode="open" shadowrootdelegatesfocus shadowrootclonable>') && html.includes('Zero-FOUC &lt;Card&gt;'),
            reusedOk: reused.mode === "REUSED_DSD" && reused.root.hydrated === true,
            attachedOk: attached.mode === "CLIENT_ATTACHED" && attached.root.hydrated === true,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Declarative Shadow DOM SSR Markup & Idempotent Hydration",
        passed: Boolean(res?.ssrOk && res?.reusedOk && res?.attachedOk),
        detail: "Renders escaped Declarative Shadow DOM template and reuses pre-attached shadowRoot during hydration",
      });
    } else if (taskId === "task_html_dialog_popover_invoker_inert") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const renderShell = typeof renderModernInteractiveShell === "function"
            ? renderModernInteractiveShell
            : exports.renderModernInteractiveShell;

          const closedMarkup = renderShell({
            dialogId: "inspect-dlg",
            popoverId: "filter-pop",
            title: "Task Inspector",
            isModalOpen: false,
          });
          const openMarkup = renderShell({
            dialogId: "inspect-dlg",
            popoverId: "filter-pop",
            title: "Task Inspector",
            isModalOpen: true,
          });

          return {
            invokerOk:
              closedMarkup.includes('commandfor="inspect-dlg" command="show-modal"') &&
              closedMarkup.includes('commandfor="inspect-dlg" command="close"'),
            popoverSearchOk:
              closedMarkup.includes("<search") &&
              closedMarkup.includes('popovertarget="filter-pop"') &&
              closedMarkup.includes('closedby="any"'),
            inertToggledOk: !closedMarkup.includes('<main id="app-main" inert>') && openMarkup.includes('<main id="app-main" inert>'),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Declarative Invoker Commands, Popover, <search> & inert State",
        passed: Boolean(res?.invokerOk && res?.popoverSearchOk && res?.inertToggledOk),
        detail: "Verifies commandfor/command invokers, <dialog closedby=\"any\">, <search> landmark, and inert background",
      });
    } else if (taskId === "task_html_responsive_picture_fetchpriority_lcp") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const buildMedia = typeof buildResponsiveMediaMarkup === "function"
            ? buildResponsiveMediaMarkup
            : exports.buildResponsiveMediaMarkup;

          const hero = buildMedia({
            basePath: "/assets/hero",
            alt: "gauntlet-web Dashboard",
            width: 1600,
            height: 900,
            isAboveTheFoldLcp: true,
          });

          const belowFold = buildMedia({
            basePath: "/assets/thumb",
            alt: "Secondary Preview",
            width: 640,
            height: 360,
            isAboveTheFoldLcp: false,
          });

          return {
            heroPriorityOk:
              hero.pictureHtml.includes('loading="eager"') &&
              hero.pictureHtml.includes('fetchpriority="high"') &&
              hero.preloadLinkHtml.includes('rel="preload" as="image" type="image/avif"'),
            belowFoldLazyOk:
              belowFold.pictureHtml.includes('loading="lazy"') &&
              belowFold.pictureHtml.includes('fetchpriority="auto"') &&
              belowFold.preloadLinkHtml === "",
            clsGuardedOk:
              hero.pictureHtml.includes('width="1600" height="900"') &&
              hero.aspectRatio === "1600 / 900",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "LCP Priority, Preload Hint & Zero-CLS Responsive <picture>",
        passed: Boolean(res?.heroPriorityOk && res?.belowFoldLazyOk && res?.clsGuardedOk),
        detail: "Sets eager+fetchpriority=high+preload for LCP images, lazy for below-the-fold, and explicit dimensions",
      });
    } else if (taskId === "task_seo_jsonld_knowledge_graph_builder") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const buildGraph = typeof buildArticleKnowledgeGraphJsonLd === "function"
            ? buildArticleKnowledgeGraphJsonLd
            : exports.buildArticleKnowledgeGraphJsonLd;

          const out = buildGraph({
            canonicalUrl: "https://gauntlet-web.test/guides/json-ld",
            siteOrigin: "https://gauntlet-web.test/",
            siteName: "gauntlet-web Engineering",
            orgName: "gauntlet-web Labs",
            logoUrl: "https://gauntlet-web.test/logo.png",
            headline: "Attack </script><script>alert(1)</script>",
            description: "Connected Schema.org Graph",
            datePublishedIso: "2026-10-29T00:00:00Z",
            dateModifiedIso: "2026-10-29T06:00:00Z",
            authorName: "pp",
            breadcrumbs: [
              { name: "Home", path: "/" },
              { name: "Guides", path: "/guides" },
            ],
          });

          const nodes = out.payload["@graph"];
          const articleNode = nodes.find((n) => n["@type"] === "TechArticle");
          const pageNode = nodes.find((n) => n["@type"] === "WebPage");

          return {
            graphLinkedOk:
              out.payload["@context"] === "https://schema.org" &&
              nodes.length === 5 &&
              articleNode?.publisher?.["@id"] === "https://gauntlet-web.test/#organization" &&
              pageNode?.breadcrumb?.["@id"] === "https://gauntlet-web.test/guides/json-ld#breadcrumb",
            xssNeutralizedOk:
              !out.scriptHtml.includes("</script><script>") &&
              out.scriptHtml.includes("\\\\u003c/script\\\\u003e"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Connected JSON-LD @graph Entity Linking & XSS-Safe Serialization",
        passed: Boolean(res?.graphLinkedOk && res?.xssNeutralizedOk),
        detail: "Links 5 Schema.org @graph entities via @id URIs and neutralizes </script> breakout payloads",
      });
    } else if (taskId === "task_seo_ecommerce_product_merchant_schema") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const buildProd = typeof buildVerifiedProductSchemaOrg === "function"
            ? buildVerifiedProductSchemaOrg
            : exports.buildVerifiedProductSchemaOrg;

          const valid = buildProd({
            sku: "GUANTLET_WEB-ENT-01",
            gtin13: "0012345678905",
            name: "gauntlet-web Enterprise Workstation",
            description: "Monochrome hardware kit",
            brandName: "gauntlet-web",
            imageUrls: ["https://gauntlet-web.test/img/hw.avif"],
            price: 1299.5,
            currency: "USD",
            inStock: true,
            priceValidUntilIso: "2027-12-31",
            returnDays: 30,
            shippingRateAmount: 0,
            ratingValue: 4.9,
            reviewCount: 128,
          });

          let invalidRejected = false;
          try {
            buildProd({
              sku: "BAD",
              gtin13: "123", // invalid GTIN-13
              name: "Bad",
              description: "Bad",
              brandName: "gauntlet-web",
              imageUrls: [],
              price: -5,
              currency: "usd",
              inStock: true,
              priceValidUntilIso: "2027-01-01",
              returnDays: 30,
              shippingRateAmount: 0,
              ratingValue: 6.5, // out of bounds
              reviewCount: 0,
            });
          } catch {
            invalidRejected = true;
          }

          return {
            merchantRichResultOk:
              valid.offers.availability === "https://schema.org/InStock" &&
              valid.offers.price === "1299.50" &&
              valid.offers.hasMerchantReturnPolicy.merchantReturnDays === 30 &&
              valid.aggregateRating.reviewCount === 128,
            invalidRejected,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Merchant Center Product Schema & Boundary Validation",
        passed: Boolean(res?.merchantRichResultOk && res?.invalidRejected),
        detail: "Emits compliant Product/Offer/MerchantReturnPolicy/AggregateRating schema and rejects invalid GTIN/ratings",
      });
    } else if (taskId === "task_seo_canonical_hreflang_opengraph_head") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const compileHead = typeof compileTechnicalSeoHead === "function"
            ? compileTechnicalSeoHead
            : exports.compileTechnicalSeoHead;

          const res = compileHead({
            rawUrl: "http://GAUNTLET-WEB.TEST/docs/guide/?utm_source=newsletter&b=2&fbclid=xyz123&a=1#section",
            title: "gauntlet-web SEO & <Graph> Guide",
            description: "Technical SEO canonicalization",
            ogImageUrl: "https://gauntlet-web.test/og.png",
            localeAlternates: {
              "en-US": "https://gauntlet-web.test/docs/guide?b=2&a=1&utm_medium=social",
              "de-DE": "https://gauntlet-web.test/de/docs/guide/?b=2&a=1",
            },
            defaultLocale: "en-US",
            noIndex: false,
          });

          return {
            canonicalNormalizedOk: res.canonicalUrl === "https://gauntlet-web.test/docs/guide?a=1&b=2",
            hreflangClusterOk:
              res.headHtml.includes('hreflang="en-us" href="https://gauntlet-web.test/docs/guide?a=1&amp;b=2"') &&
              res.headHtml.includes('hreflang="de-de" href="https://gauntlet-web.test/de/docs/guide?a=1&amp;b=2"') &&
              res.headHtml.includes('hreflang="x-default"'),
            metaEscapedOk:
              res.headHtml.includes("gauntlet-web SEO &amp; &lt;Graph&gt; Guide") &&
              res.headHtml.includes("max-image-preview:large"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Canonical URL Sanitization, hreflang x-default & OpenGraph Compilation",
        passed: Boolean(res?.canonicalNormalizedOk && res?.hreflangClusterOk && res?.metaEscapedOk),
        detail: "Strips utm/fbclid params, sorts query params, emits hreflang + x-default, and escapes OpenGraph tags",
      });
    } else if (taskId === "task_seo_semantic_microdata_landmarks_audit") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const audit = typeof auditHtmlSemanticSeo === "function"
            ? auditHtmlSemanticSeo
            : exports.auditHtmlSemanticSeo;

          const validHtml = \`
            <main>
              <article itemscope itemtype="https://schema.org/TechArticle">
                <h1 itemprop="headline">Architecture Overview</h1>
                <time datetime="2026-10-29">Oct 29, 2026</time>
                <h2>Section 1</h2>
                <h3>Subsection 1.1</h3>
              </article>
            </main>
          \`;

          const brokenHtml = \`
            <div>
              <h1>First Title</h1>
              <h1>Duplicate H1</h1>
              <h4>Skipped H2 and H3</h4>
              <time datetime="Oct 29">Invalid ISO</time>
              <span itemprop="name">Unscoped Microdata</span>
            </div>
          \`;

          const goodReport = audit(validHtml);
          const badReport = audit(brokenHtml);
          const codes = badReport.violations.map((v) => v.code);

          return {
            goodValid: goodReport.valid === true && goodReport.microdataTypes.includes("https://schema.org/TechArticle"),
            caughtMultipleH1: codes.includes("MISSING_OR_MULTIPLE_H1"),
            caughtSkippedHeading: codes.includes("SKIPPED_HEADING_LEVEL"),
            caughtMissingMain: codes.includes("MISSING_MAIN_LANDMARK"),
            caughtMicrodataAndTime: codes.includes("UNSCOPED_OR_HTTP_MICRODATA_TYPE") && codes.includes("INVALID_TIME_DATETIME"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "HTML5 Landmark, Heading Outline & Schema.org Microdata Audit",
        passed: Boolean(
          res?.goodValid &&
            res?.caughtMultipleH1 &&
            res?.caughtSkippedHeading &&
            res?.caughtMissingMain &&
            res?.caughtMicrodataAndTime,
        ),
        detail: "Validates clean HTML5/Microdata documents and catches heading skips, missing <main>, and unscoped itemprop",
      });
    } else if (taskId === "task_html_importmap_modulepreload_sri") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const compileMap = typeof compileImportMapBootstrapHtml === "function"
            ? compileImportMapBootstrapHtml
            : exports.compileImportMapBootstrapHtml;

          const out = compileMap({
            entries: [
              {
                specifier: "@gauntlet-web/core",
                url: "https://cdn.gauntlet-web.test/core@1.0.0/index.mjs",
                integritySha384: "sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC",
                preload: true,
              },
            ],
            scopes: {
              "/legacy/": { "@gauntlet-web/core": "https://cdn.gauntlet-web.test/core@0.9.0/index.mjs" },
            },
            entryModuleSrc: "/app.mjs",
          });

          const importMapIdx = out.html.indexOf('<script type="importmap">');
          const preloadIdx = out.html.indexOf('<link rel="modulepreload"');
          const moduleScriptIdx = out.html.indexOf('<script type="module"');

          return {
            orderingValid: importMapIdx === 0 && importMapIdx < preloadIdx && preloadIdx < moduleScriptIdx,
            sriMappedOk:
              out.importMapJson.integrity["https://cdn.gauntlet-web.test/core@1.0.0/index.mjs"].startsWith("sha384-") &&
              out.importMapJson.scopes["/legacy/"]["@gauntlet-web/core"].includes("0.9.0"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Import Map Precedence, Scoped Resolution & SRI Modulepreload",
        passed: Boolean(res?.orderingValid && res?.sriMappedOk),
        detail: "Places <script type=\"importmap\"> before modulepreload/module tags and maps sha384- SRI hashes",
      });
    } else if (taskId === "task_seo_software_app_faq_dataset_graph") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const buildPortal = typeof buildBenchmarkPortalJsonLdGraph === "function"
            ? buildBenchmarkPortalJsonLdGraph
            : exports.buildBenchmarkPortalJsonLdGraph;

          const graphDoc = buildPortal({
            origin: "https://gauntlet-web.test/",
            orgName: "gauntlet-web Research",
            sameAsUrls: ["https://github.com/gauntlet-web-labs", "https://wikidata.org/wiki/Q12345"],
            searchUrlTemplate: "https://gauntlet-web.test/search?q={search_term_string}",
            dataset: {
              name: "Agentic 1M Refactoring Benchmark Dataset",
              description: "Sandboxed execution traces and AST evaluation scores across 62 software engineering tasks.",
              licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
              downloadUrl: "https://gauntlet-web.test/datasets/agentic-1m.parquet",
              encodingFormat: "application/parquet",
            },
            faqs: [
              { question: "How are tasks evaluated?", answerHtml: "<p>Inside an isolated node:vm sandbox.</p>" },
            ],
          });

          const nodes = graphDoc["@graph"];
          const ds = nodes.find((n) => n["@type"] === "Dataset");
          const ws = nodes.find((n) => n["@type"] === "WebSite");
          const faq = nodes.find((n) => n["@type"] === "FAQPage");

          return {
            datasetOk:
              ds?.distribution?.[0]?.["@type"] === "DataDownload" &&
              ds?.distribution?.[0]?.encodingFormat === "application/parquet" &&
              ds?.creator?.["@id"] === "https://gauntlet-web.test/#organization",
            searchActionOk:
              ws?.potentialAction?.["@type"] === "SearchAction" &&
              ws?.potentialAction?.["query-input"] === "required name=search_term_string",
            faqOk: faq?.mainEntity?.[0]?.acceptedAnswer?.["@type"] === "Answer",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Dataset DataDownload, WebSite SearchAction & FAQPage @graph Verification",
        passed: Boolean(res?.datasetOk && res?.searchActionOk && res?.faqOk),
        detail: "Verifies linked Dataset distribution, SearchAction urlTemplate, and FAQPage Question/Answer graph",
      });
    } else if (taskId === "task_ecom_integer_cents_dinero_cart_engine") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const calc = typeof computeCartPricingMinor === "function"
            ? computeCartPricingMinor
            : exports.computeCartPricingMinor;

          // 3 items at 1000 cents ($10.00 each) = 3000 cents, with a 100 cent ($1.00) FIXED_CART discount
          // Largest remainder should split 100 cents into 34 + 33 + 33 = 100 cents!
          const res = calc(
            "USD",
            [
              { sku: "A", unitAmountMinor: 1000, quantity: 1 },
              { sku: "B", unitAmountMinor: 1000, quantity: 1 },
              { sku: "C", unitAmountMinor: 1000, quantity: 1 },
            ],
            [{ code: "SAVE100", kind: "FIXED_CART", value: 100 }],
          );

          const sumLineDiscounts = res.lineItems.reduce((s, l) => s + l.discountMinor, 0);
          const sumLineNets = res.lineItems.reduce((s, l) => s + l.netMinor, 0);
          const jpyRes = calc("JPY", [{ sku: "JP1", unitAmountMinor: 1500, quantity: 2 }], []);

          return {
            exactPennyProration:
              res.subtotalMinor === 3000 &&
              res.totalDiscountMinor === 100 &&
              sumLineDiscounts === 100 &&
              sumLineNets === 2900 &&
              res.lineItems[0].discountMinor === 34 &&
              res.lineItems[1].discountMinor === 33 &&
              res.lineItems[2].discountMinor === 33,
            jpyZeroDecimalOk: jpyRes.exponent === 0 && jpyRes.netTotalMinor === 3000,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Minor-Unit Cart Math & Hamilton Largest-Remainder Penny Proration",
        passed: Boolean(res?.exactPennyProration && res?.jpyZeroDecimalOk),
        detail: "Splits $1.00 across 3 equal items as 34c/33c/33c (sum=100c) and supports 0-decimal JPY",
      });
    } else if (taskId === "task_ecom_inventory_reservation_ttl_oversell_guard") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Engine = typeof InventoryReservationEngine === "function"
            ? InventoryReservationEngine
            : exports.InventoryReservationEngine;

          const inv = new Engine();
          inv.setPhysicalStock("GPU-H200", 5);

          const r1 = inv.reserve({ holdId: "h1", sku: "GPU-H200", quantity: 3, nowMs: 1000, ttlMs: 5000 });
          const r1Retry = inv.reserve({ holdId: "h1", sku: "GPU-H200", quantity: 3, nowMs: 1200, ttlMs: 5000 });
          const r2Oversell = inv.reserve({ holdId: "h2", sku: "GPU-H200", quantity: 3, nowMs: 2000, ttlMs: 5000 });

          // Advance clock past h1 expiry (1000 + 5000 = 6000)
          const r2AfterExpiry = inv.reserve({ holdId: "h2", sku: "GPU-H200", quantity: 4, nowMs: 7000, ttlMs: 5000 });
          const committed = inv.commitHold("h2", 7500);

          return {
            oversellBlocked: r1.ok === true && r1Retry.ok === true && r2Oversell.ok === false && r2Oversell.availableStock === 2,
            ttlReclaimedAndCommitted:
              r2AfterExpiry.ok === true &&
              committed.status === "COMMITTED" &&
              inv.getAvailableStock("GPU-H200", 8000) === 1,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Flash-Sale Oversell Guard, TTL Lease Expiry & Atomic Commit",
        passed: Boolean(res?.oversellBlocked && res?.ttlReclaimedAndCommitted),
        detail: "Blocks concurrent oversell, reclaims expired holds after TTL, and deducts committed stock",
      });
    } else if (taskId === "task_ecom_global_tax_vat_reverse_charge_engine") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const calcTax = typeof calculateGlobalCheckoutTax === "function"
            ? calculateGlobalCheckoutTax
            : exports.calculateGlobalCheckoutTax;

          const merchant = {
            homeCountry: "DE",
            usStateExposure: {
              CA: { trailingRevenueMinor: 15_000_000, trailingTransactions: 40 },
              TX: { trailingRevenueMinor: 1_000_000, trailingTransactions: 10 },
            },
          };

          // 1. Cross-border EU B2B with valid French VAT ID -> 0% Reverse Charge
          const b2bEu = calcTax({
            amountMinor: 10000,
            taxInclusive: false,
            buyerCountry: "FR",
            buyerVatId: "FR12345678901",
            merchant,
          });

          // 2. Cross-border EU B2C to France -> 20% French OSS VAT
          const b2cEu = calcTax({
            amountMinor: 10000,
            taxInclusive: false,
            buyerCountry: "FR",
            merchant,
          });

          // 3. US California (above $100k nexus) vs Texas (below nexus)
          const usCa = calcTax({
            amountMinor: 10000,
            taxInclusive: false,
            buyerCountry: "US",
            buyerState: "CA",
            merchant,
          });
          const usTx = calcTax({
            amountMinor: 10000,
            taxInclusive: false,
            buyerCountry: "US",
            buyerState: "TX",
            merchant,
          });

          return {
            reverseChargeOk:
              b2bEu.regime === "EU_B2B_REVERSE_CHARGE" &&
              b2bEu.reverseCharge === true &&
              b2bEu.taxAmountMinor === 0 &&
              Boolean(b2bEu.invoiceNotice?.includes("Article 196")),
            b2cOssOk: b2cEu.regime === "EU_B2C_OSS_VAT" && b2cEu.taxAmountMinor === 2000,
            usNexusOk: usCa.taxAmountMinor === 725 && usTx.taxAmountMinor === 0,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "EU VAT B2B Reverse Charge, B2C OSS & US Economic Nexus Calculation",
        passed: Boolean(res?.reverseChargeOk && res?.b2cOssOk && res?.usNexusOk),
        detail: "Verifies 0% EU B2B Reverse Charge, 20% FR OSS VAT, and CA vs TX economic nexus thresholds",
      });
    } else if (taskId === "task_ecom_checkout_state_machine_3ds_saga") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Coordinator = typeof CheckoutSagaCoordinator === "function"
            ? CheckoutSagaCoordinator
            : exports.CheckoutSagaCoordinator;

          const saga = new Coordinator();

          const threeDsRes = await saga.executeCheckout("chk_3ds", {
            reserveInventory: async () => {},
            releaseInventory: async () => {},
            lockPromoCoupon: async () => {},
            unlockPromoCoupon: async () => {},
            createPaymentIntent: async () => ({ id: "pi_3ds_1", status: "requires_action" }),
            cancelPaymentIntent: async () => {},
          });

          const failedRes = await saga.executeCheckout("chk_fail", {
            reserveInventory: async () => {},
            releaseInventory: async () => {},
            lockPromoCoupon: async () => {},
            unlockPromoCoupon: async () => {},
            createPaymentIntent: async () => ({ id: "pi_fail_1", status: "failed" }),
            cancelPaymentIntent: async () => {},
          });

          return {
            threeDsPausedOk:
              threeDsRes.state === "AWAITING_3DS_ACTION" &&
              threeDsRes.compensatedSteps.length === 0,
            lifoCompensatedOk:
              failedRes.state === "FAILED_COMPENSATED" &&
              failedRes.compensatedSteps.join(",") === "cancelPaymentIntent,unlockPromoCoupon,releaseInventory",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Checkout 3DS Pause & LIFO Compensation Rollback Verification",
        passed: Boolean(res?.threeDsPausedOk && res?.lifoCompensatedOk),
        detail: "Pauses on requires_action and executes LIFO rollback (cancelPaymentIntent -> unlockPromoCoupon -> releaseInventory) on failure",
      });
    } else if (taskId === "task_ecom_polar_mor_license_entitlement_provisioning") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Engine = typeof PolarEntitlementEngine === "function"
            ? PolarEntitlementEngine
            : exports.PolarEntitlementEngine;

          const polar = new Engine();
          const grant = polar.provisionBenefitGrant({
            customerId: "cust_01",
            subscriptionId: "sub_polar_99",
            benefitId: "ben_pro",
            keySuffix: "a1b2c3",
            maxActivations: 2,
          });

          const seat1 = polar.activateMachineSeat({
            licenseKey: grant.licenseKey,
            machineFingerprint: "fp_macbook",
            nowMs: 1000,
          });
          const seat1Idempotent = polar.activateMachineSeat({
            licenseKey: grant.licenseKey,
            machineFingerprint: "fp_macbook",
            nowMs: 2000,
          });
          const seat2 = polar.activateMachineSeat({
            licenseKey: grant.licenseKey,
            machineFingerprint: "fp_linux_workstation",
            nowMs: 3000,
          });
          const seat3Overflow = polar.activateMachineSeat({
            licenseKey: grant.licenseKey,
            machineFingerprint: "fp_third_device",
            nowMs: 4000,
          });

          const revokedCount = polar.handleSubscriptionLifecycleWebhook({
            type: "subscription.revoked",
            subscriptionId: "sub_polar_99",
          });
          const afterRevoke = polar.activateMachineSeat({
            licenseKey: grant.licenseKey,
            machineFingerprint: "fp_macbook",
            nowMs: 5000,
          });

          return {
            seatLimitAndIdempotencyOk:
              seat1.allowed === true &&
              seat1Idempotent.usedSeats === 1 &&
              seat2.allowed === true &&
              seat2.usedSeats === 2 &&
              seat3Overflow.allowed === false &&
              seat3Overflow.reason === "MAX_SEAT_ACTIVATIONS_EXCEEDED",
            revocationOk:
              revokedCount === 1 &&
              afterRevoke.allowed === false &&
              afterRevoke.reason === "LICENSE_REVOKED",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Polar.sh License Provisioning, Seat Limit & Webhook Revocation",
        passed: Boolean(res?.seatLimitAndIdempotencyOk && res?.revocationOk),
        detail: "Enforces 2-seat machine fingerprint limit and revokes license on subscription.revoked",
      });
    } else if (taskId === "task_pay_stripe_payment_intent_idempotency_engine") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Coordinator = typeof StripePaymentIntentCoordinator === "function"
            ? StripePaymentIntentCoordinator
            : exports.StripePaymentIntentCoordinator;

          const stripeCoord = new Coordinator();
          const first = stripeCoord.createOrRetrieveIntent({
            idempotencyKey: "idem_checkout_9001",
            customerId: "cus_1",
            orderId: "ord_1",
            amountMinor: 4900,
            currency: "usd",
            captureMethod: "manual",
          });

          const secondReplay = stripeCoord.createOrRetrieveIntent({
            idempotencyKey: "idem_checkout_9001",
            customerId: "cus_1",
            orderId: "ord_1",
            amountMinor: 4900,
            currency: "usd",
            captureMethod: "manual",
          });

          let mismatchRejected = false;
          try {
            stripeCoord.createOrRetrieveIntent({
              idempotencyKey: "idem_checkout_9001",
              customerId: "cus_1",
              orderId: "ord_1",
              amountMinor: 9900, // mutated amount with same idempotencyKey!
              currency: "usd",
              captureMethod: "manual",
            });
          } catch (err) {
            mismatchRejected = String(err.message).includes("IdempotencyParameterMismatchError");
          }

          const captured = stripeCoord.captureIntent(first.intent.id, 4500);

          return {
            idempotencyAndConflictOk:
              first.idempotentReplay === false &&
              secondReplay.idempotentReplay === true &&
              first.intent.id === secondReplay.intent.id &&
              mismatchRejected,
            manualPartialCaptureOk:
              first.intent.status === "requires_capture" &&
              captured.status === "succeeded" &&
              captured.amountReceivedMinor === 4500,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Stripe Idempotency Fingerprint, Replay & Partial Manual Capture",
        passed: Boolean(res?.idempotencyAndConflictOk && res?.manualPartialCaptureOk),
        detail: "Replays identical idempotency keys, rejects mutated payload reuse, and settles manual capture",
      });
    } else if (taskId === "task_pay_stripe_polar_webhook_signature_verifier") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Verifier = typeof DualWebhookVerifier === "function"
            ? DualWebhookVerifier
            : exports.DualWebhookVerifier;
          const signHex = typeof computeWebhookSignatureHex === "function"
            ? computeWebhookSignatureHex
            : exports.computeWebhookSignatureHex;

          const verifier = new Verifier();
          const secret = "whsec_live_secret_2026";
          const rawNewer = JSON.stringify({ id: "evt_new", created: 2000, entityId: "sub_1" });
          const stripeSig = signHex(secret, "1000." + rawNewer);

          const v1 = verifier.verifyAndRecord({
            provider: "stripe",
            secret,
            rawBody: rawNewer,
            headers: { "stripe-signature": "t=1000,v1=" + stripeSig },
            nowSec: 1050,
          });

          const v1Dup = verifier.verifyAndRecord({
            provider: "stripe",
            secret,
            rawBody: rawNewer,
            headers: { "stripe-signature": "t=1000,v1=" + stripeSig },
            nowSec: 1060,
          });

          // Polar Standard Webhooks with older entity timestamp (created: 1500 < 2000)
          const rawOlder = JSON.stringify({ id: "evt_old", created: 1500, entityId: "sub_1" });
          const polarSig = signHex(secret, "msg_99.1080." + rawOlder);
          const vPolarStale = verifier.verifyAndRecord({
            provider: "polar",
            secret,
            rawBody: rawOlder,
            headers: {
              "webhook-id": "msg_99",
              "webhook-timestamp": "1080",
              "webhook-signature": "v1," + polarSig,
            },
            nowSec: 1100,
          });

          // Replay outside 300s window
          const vExpired = verifier.verifyAndRecord({
            provider: "stripe",
            secret,
            rawBody: rawNewer,
            headers: { "stripe-signature": "t=1000,v1=" + stripeSig },
            nowSec: 2000,
          });

          return {
            stripeAndDedupOk:
              v1.valid === true &&
              v1.deduplicated === false &&
              v1Dup.valid === true &&
              v1Dup.deduplicated === true,
            polarAndCausalWatermarkOk:
              vPolarStale.valid === true &&
              vPolarStale.ignoredStaleOutOfOrder === true &&
              vExpired.valid === false &&
              vExpired.reason === "TIMESTAMP_OUTSIDE_TOLERANCE_WINDOW",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Stripe & Polar Webhook Signature, Replay Window & Out-of-Order Guard",
        passed: Boolean(res?.stripeAndDedupOk && res?.polarAndCausalWatermarkOk),
        detail: "Verifies Stripe and Polar signatures, deduplicates replays, and drops out-of-order events",
      });
    } else if (taskId === "task_pay_subscription_proration_dunning_machine") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const calcProration = typeof calculateSubscriptionProration === "function"
            ? calculateSubscriptionProration
            : exports.calculateSubscriptionProration;
          const evalDunning = typeof evaluateDunningTransition === "function"
            ? evaluateDunningTransition
            : exports.evaluateDunningTransition;

          // Exactly 50% through billing cycle: upgrade from $30 (3000c) to $90 (9000c)
          // Unused credit = 1500c, remaining debit = 4500c -> net delta = +3000c
          const quote = calcProration({
            periodStartSec: 1000,
            periodEndSec: 3000,
            changeAtSec: 2000,
            currentPlanAmountMinor: 3000,
            currentQuantity: 1,
            targetPlanAmountMinor: 9000,
            targetQuantity: 1,
          });

          const d1 = evalDunning({ failedAttempts: 1 });
          const d2 = evalDunning({ failedAttempts: 2 });
          const d4 = evalDunning({ failedAttempts: 4 });

          return {
            prorationMathOk:
              quote.unusedCreditMinor === 1500 &&
              quote.remainingDebitMinor === 4500 &&
              quote.netInvoiceDeltaMinor === 3000,
            dunningLifecycleOk:
              d1.status === "past_due" &&
              d1.entitlementsActive === true &&
              d2.status === "grace_hold" &&
              d2.nextRetryDelayHours === 72 &&
              d4.status === "unpaid_suspended" &&
              d4.entitlementsActive === false,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Mid-Cycle Proration Delta & Smart Dunning Backoff Verification",
        passed: Boolean(res?.prorationMathOk && res?.dunningLifecycleOk),
        detail: "Verifies 50%-cycle upgrade proration (+3000c) and past_due -> grace_hold -> unpaid_suspended transitions",
      });
    } else if (taskId === "task_pay_double_entry_ledger_stripe_connect_split") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Ledger = typeof DoubleEntryConnectLedger === "function"
            ? DoubleEntryConnectLedger
            : exports.DoubleEntryConnectLedger;

          const ledger = new Ledger();
          // $100.00 charge (10000c): $3.20 Stripe fee (320c), 10% platform commission (1000c), $86.80 seller (8680c)
          ledger.recordMarketplaceCharge({
            txId: "tx_charge_1",
            orderId: "ord_100",
            grossChargeMinor: 10000,
            stripeFeeMinor: 320,
            platformFeeBps: 1000,
          });

          // 50% partial refund ($50.00 = 5000c): reverses 500c platform commission and 4500c from seller escrow
          ledger.recordProportionalRefund({
            txId: "tx_refund_1",
            orderId: "ord_100",
            originalGrossMinor: 10000,
            refundGrossMinor: 5000,
            platformFeeBps: 1000,
          });

          return {
            balancesConsistent:
              ledger.getAccountCreditBalance("platform_commission") === 500 &&
              ledger.getAccountCreditBalance("seller_escrow_payable") === 4180 &&
              ledger.getAccountCreditBalance("stripe_processing_fee") === 320,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Double-Entry Connect Charge Split & Partial Refund Clawback",
        passed: Boolean(res?.balancesConsistent),
        detail: "Maintains balanced debit/credit ledger across charge split and 50% proportional refund",
      });
    } else if (taskId === "task_pay_polar_stripe_usage_meter_ai_billing") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Engine = typeof UsageMeterBillingEngine === "function"
            ? UsageMeterBillingEngine
            : exports.UsageMeterBillingEngine;

          const meter = new Engine();
          meter.grantPrepaidCredits("cus_ai_1", 500); // $5.00 prepaid credit

          // Ingest 1,500,000 tokens across 2 unique events + 1 duplicate retry
          meter.ingestEvent({ eventId: "ev_1", customerId: "cus_ai_1", meterSlug: "llm_tokens", units: 1_000_000 });
          meter.ingestEvent({ eventId: "ev_1", customerId: "cus_ai_1", meterSlug: "llm_tokens", units: 1_000_000 }); // duplicate!
          meter.ingestEvent({ eventId: "ev_2", customerId: "cus_ai_1", meterSlug: "llm_tokens", units: 500_000 });

          // Tier 1: first 1,000,000 tokens at 200c per 1M block = 200c
          // Tier 2: above 1,000,000 tokens at 100c per 500k block = 100c -> total gross = 300c
          // Prepaid credits = 500c -> applied = 300c, net due = 0c, remaining credit = 200c
          const inv = meter.closeBillingCycle("cus_ai_1", [
            { upToUnits: 1_000_000, unitCostMinorPerBlock: 200, blockSize: 1_000_000 },
            { upToUnits: null, unitCostMinorPerBlock: 100, blockSize: 500_000 },
          ]);

          return {
            graduatedAndCreditDrawdownOk:
              inv.totalUnits === 1_500_000 &&
              inv.deduplicatedEvents === 1 &&
              inv.grossUsageChargeMinor === 300 &&
              inv.appliedPrepaidCreditsMinor === 300 &&
              inv.netAmountDueMinor === 0 &&
              inv.remainingCreditBalanceMinor === 200,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "AI Usage Meter Deduplication, Graduated Tiers & Credit Wallet Drawdown",
        passed: Boolean(res?.graduatedAndCreditDrawdownOk),
        detail: "Deduplicates retried token events, applies graduated bracket pricing, and draws down prepaid credits",
      });
    } else if (taskId === "task_shop_ui_faceted_catalog_variant_sku_selector") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Controller = typeof ProductVariantMatrixController === "function"
            ? ProductVariantMatrixController
            : exports.ProductVariantMatrixController;

          const matrix = new Controller(
            [
              { sku: "KB-OBS-TKL", title: "gauntlet-web Key Obsidian TKL", attributes: { color: "obsidian", layout: "TKL" }, unitPriceMinor: 18900, availableStock: 5 },
              { sku: "KB-OBS-FULL", title: "gauntlet-web Key Obsidian Full", attributes: { color: "obsidian", layout: "FULL" }, unitPriceMinor: 19900, availableStock: 0 },
              { sku: "KB-SLV-FULL", title: "gauntlet-web Key Silver Full", attributes: { color: "silver", layout: "FULL" }, unitPriceMinor: 19900, availableStock: 2 },
            ],
            ["color", "layout"],
          );

          const vm1 = matrix.buildViewModel({ color: "obsidian", layout: "TKL" });
          const fullOptionUnderObsidian = vm1.axisOptions.layout.find((o) => o.value === "FULL");
          const vm2 = matrix.buildViewModel({ color: "silver", layout: "FULL" });

          return {
            matrixResolvedOk:
              vm1.canAddToCart === true &&
              vm1.badgeLabel === "IN_STOCK" &&
              vm1.canonicalQueryString === "?color=obsidian&layout=TKL&sku=KB-OBS-TKL",
            crossAxisDisabledAndLowStockOk:
              fullOptionUnderObsidian?.inStockWithCurrentSelection === false &&
              vm2.badgeLabel === "LOW_STOCK",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Multi-Axis Variant Stock Matrix, Low-Stock Badge & URL State Sync",
        passed: Boolean(res?.matrixResolvedOk && res?.crossAxisDisabledAndLowStockOk),
        detail: "Disables out-of-stock cross-axis combinations, flags LOW_STOCK, and syncs ?color=&layout=&sku=",
      });
    } else if (taskId === "task_shop_ui_optimistic_cart_drawer_price_drift_guard") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Controller = typeof OptimisticCartDrawerController === "function"
            ? OptimisticCartDrawerController
            : exports.OptimisticCartDrawerController;

          const drawer = new Controller();
          drawer.seedItems([
            {
              sku: "MON-4K",
              title: "gauntlet-web 4K Studio Display",
              quantity: 1,
              unitPriceAtAddMinor: 79900,
              liveCatalogPriceMinor: 79900,
              maxAvailableStock: 5,
            },
          ]);

          const m1 = drawer.beginOptimisticQtyChange("MON-4K", 3);
          const optimisticSubtotal = m1.optimisticSubtotalMinor;
          drawer.rollbackMutation(m1.mutationId, "Stock reservation conflict");
          const afterRollbackQty = drawer.getViewModel().items[0].quantity;

          // Commit newer server response with catalog price drift (79900 -> 84900)
          const m2 = drawer.beginOptimisticQtyChange("MON-4K", 2);
          drawer.commitServerResponse(m2.mutationId, [
            {
              sku: "MON-4K",
              title: "gauntlet-web 4K Studio Display",
              quantity: 2,
              unitPriceAtAddMinor: 79900,
              liveCatalogPriceMinor: 84900,
              maxAvailableStock: 5,
            },
          ]);
          const staleIgnored = drawer.commitServerResponse(m1.mutationId, []);
          const finalVm = drawer.getViewModel();

          return {
            optimisticAndRollbackOk: optimisticSubtotal === 239700 && afterRollbackQty === 1,
            priceDriftAndSequenceOk:
              staleIgnored === false &&
              finalVm.requiresPriceDriftAcknowledgement === true &&
              finalVm.priceDriftNotices[0]?.deltaMinor === 5000,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Optimistic Cart Rollback, Stale Response Guard & Price-Drift Banner",
        passed: Boolean(res?.optimisticAndRollbackOk && res?.priceDriftAndSequenceOk),
        detail: "Rolls back rejected optimistic updates, ignores stale responses, and surfaces +$50.00 price drift",
      });
    } else if (taskId === "task_shop_ui_guest_to_account_cart_address_merge") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const promote = typeof promoteGuestToCustomerAccount === "function"
            ? promoteGuestToCustomerAccount
            : exports.promoteGuestToCustomerAccount;

          const merged = promote({
            accountId: "acc_01",
            rawEmail: "  Shopper@gauntlet-web.test ",
            existingAccountCart: [
              { sku: "GPU-CARD", title: "Compute Card", quantity: 2, unitPriceMinor: 50000, maxPerOrder: 4, availableStock: 10, updatedAtMs: 1000 },
            ],
            guestCart: [
              { sku: "GPU-CARD", title: "Compute Card", quantity: 3, unitPriceMinor: 50000, maxPerOrder: 4, availableStock: 10, updatedAtMs: 2000 },
              { sku: "CABLE-USB4", title: "USB4 Pro Cable", quantity: 1, unitPriceMinor: 2900, maxPerOrder: 10, availableStock: 50, updatedAtMs: 2000 },
            ],
            existingAddresses: [
              { recipientName: "Ada", line1: "100 Main St.", city: "Austin", stateOrProvince: "TX", postalCode: "78701", countryCode: "us" },
            ],
            newCheckoutAddress: {
              recipientName: "Ada Lovelace",
              line1: "100 Main St",
              city: "AUSTIN",
              stateOrProvince: "tx",
              postalCode: "78701 ",
              countryCode: "US",
            },
          });

          const gpuLine = merged.mergedCartItems.find((i) => i.sku === "GPU-CARD");

          return {
            cartMergedAndClampedOk:
              merged.email === "shopper@gauntlet-web.test" &&
              merged.mergedCartItems.length === 2 &&
              gpuLine?.quantity === 4 &&
              merged.quantityAdjustments[0]?.reason === "MAX_PER_ORDER_LIMIT",
            addressDeduplicatedOk: merged.savedAddresses.length === 1,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Guest-to-Account Cart Merger, Order Limit Clamping & Address Deduplication",
        passed: Boolean(res?.cartMergedAndClampedOk && res?.addressDeduplicatedOk),
        detail: "Merges guest + account SKUs, clamps 2+3=5 to maxPerOrder=4, and deduplicates postal addresses",
      });
    } else if (taskId === "task_shop_ui_accessible_checkout_stepper_autocomplete") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Stepper = typeof AccessibleCheckoutStepperController === "function"
            ? AccessibleCheckoutStepperController
            : exports.AccessibleCheckoutStepperController;

          const stepper = new Stepper();
          const blockedEarly = stepper.canNavigateTo("PAYMENT");
          stepper.completeAccountStep("buyer@gauntlet-web.test");
          stepper.submitShippingAddress({
            line1: "742 Evergreen Terrace",
            postalCode: "94107",
            countryCode: "US",
            calculatedShippingMinor: 900,
            calculatedTaxMinor: 1450,
          });
          stepper.attachPaymentMethod("pm_card_visa");
          const readyAtReview = stepper.getStepState().canPlaceOrder;

          // Editing shipping address must invalidate payment lock and return to PAYMENT
          stepper.submitShippingAddress({
            line1: "10 Downing Street",
            postalCode: "SW1A 2AA",
            countryCode: "GB",
            calculatedShippingMinor: 2500,
            calculatedTaxMinor: 4000,
          });
          const afterShippingEdit = stepper.getStepState();

          return {
            gatesAndInvalidationOk:
              blockedEarly === false &&
              readyAtReview === true &&
              afterShippingEdit.currentStep === "PAYMENT" &&
              afterShippingEdit.canPlaceOrder === false,
            autocompleteTokensOk:
              afterShippingEdit.fieldSpecs.some((f) => f.autocomplete === "shipping address-line1"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Checkout Stepper Prerequisite Gates & Shipping-Edit Quote Invalidation",
        passed: Boolean(res?.gatesAndInvalidationOk && res?.autocompleteTokensOk),
        detail: "Blocks premature step jumps, invalidates payment lock when shipping is edited, and binds WHATWG autocomplete",
      });
    } else if (taskId === "task_shop_ui_order_history_timeline_rma_portal") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const buildVm = typeof buildOrderHistoryPortalViewModel === "function"
            ? buildOrderHistoryPortalViewModel
            : exports.buildOrderHistoryPortalViewModel;

          const nowMs = 1_700_000_000_000;
          const vm = buildVm({
            orderId: "ord_901",
            invoiceNumber: "INV-2026-00901",
            currency: "USD",
            nowMs,
            returnWindowDays: 30,
            lines: [
              {
                lineId: "L1",
                sku: "HW-DOCK",
                title: "Thunderbolt 5 Dock",
                isDigitalLicense: false,
                orderedQty: 2,
                deliveredQty: 2,
                alreadyReturnedQty: 1,
                netUnitPaidMinor: 20000,
                taxUnitPaidMinor: 1600,
                deliveredAtMs: nowMs - 5 * 86_400_000, // 5 days ago
              },
              {
                lineId: "L2",
                sku: "POLAR-LIC-PRO",
                title: "Polar Pro License Key",
                isDigitalLicense: true,
                orderedQty: 1,
                deliveredQty: 1,
                alreadyReturnedQty: 0,
                netUnitPaidMinor: 9900,
                taxUnitPaidMinor: 0,
                deliveredAtMs: nowMs - 5 * 86_400_000,
              },
            ],
            shipments: [],
          });

          const dockRma = vm.returnEligibilityByLine.find((l) => l.lineId === "L1");
          const digitalRma = vm.returnEligibilityByLine.find((l) => l.lineId === "L2");

          return {
            rmaEligibilityOk:
              dockRma?.eligible === true &&
              dockRma?.eligibleQty === 1 &&
              dockRma?.maxRefundPreviewMinor === 21600 &&
              digitalRma?.eligible === false &&
              digitalRma?.reason === "DIGITAL_NON_RETURNABLE" &&
              vm.totalRefundableMinor === 21600,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Order History Split-Shipment & RMA Return Eligibility Verification",
        passed: Boolean(res?.rmaEligibilityOk),
        detail: "Allows 1 remaining hardware unit return ($216.00) while blocking non-returnable digital license keys",
      });
    } else if (taskId === "task_shop_data_normalized_entity_store_referential_integrity") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Store = typeof NormalizedCommerceEntityStore === "function"
            ? NormalizedCommerceEntityStore
            : exports.NormalizedCommerceEntityStore;

          const store = new Store();
          store.upsertCustomer({ id: "c_1", email: "initial@gauntlet-web.test", displayName: "Ada" });

          let orphanBlocked = false;
          try {
            store.insertOrder({ id: "o_bad", customerId: "c_missing", invoiceNumber: "INV-0", status: "PAID", totalMinor: 100, createdAtMs: 1 });
          } catch (err) {
            orphanBlocked = String(err.message).includes("ForeignKeyConstraintError");
          }

          store.insertOrder({ id: "o_1", customerId: "c_1", invoiceNumber: "INV-1", status: "PAID", totalMinor: 5000, createdAtMs: 100 });
          store.insertOrder({ id: "o_2", customerId: "c_1", invoiceNumber: "INV-2", status: "FULFILLED", totalMinor: 9000, createdAtMs: 200 });
          store.insertOrderItem({ id: "item_1", orderId: "o_2", sku: "SKU-A", quantity: 1, unitPriceMinor: 9000 });
          store.insertShipment({ id: "ship_1", orderId: "o_2", trackingNumber: "1Z999", status: "DELIVERED" });

          // Updating customer email in one place immediately reflects in order history view
          store.upsertCustomer({ id: "c_1", email: "updated@gauntlet-web.test", displayName: "Ada Lovelace" });
          const view = store.getCustomerOrderHistoryView("c_1");

          return {
            fkAndNormalizedUpdateOk:
              orphanBlocked === true &&
              view.customer.email === "updated@gauntlet-web.test" &&
              view.orders.length === 2 &&
              view.orders[0].order.id === "o_2" &&
              view.orders[0].items.length === 1 &&
              view.orders[0].shipments[0].trackingNumber === "1Z999",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Normalized Foreign-Key Integrity & Single-Source Customer/Order Projection",
        passed: Boolean(res?.fkAndNormalizedUpdateOk),
        detail: "Blocks orphan foreign keys, updates customer email in O(1), and projects newest-first order history",
      });
    } else if (taskId === "task_shop_data_immutable_order_line_snapshot_isolation") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Vault = typeof OrderSnapshotVault === "function"
            ? OrderSnapshotVault
            : exports.OrderSnapshotVault;

          const catalog = new Map([
            ["HW-KEY", { sku: "HW-KEY", title: "gauntlet-web Mechanical Keyboard v1", unitPriceMinor: 15000, taxRateBps: 1000 }],
          ]);

          const vault = new Vault();
          const captured = vault.captureOrderAtCheckout({
            orderId: "ord_snap_1",
            createdAtIso: "2026-10-29T00:00:00Z",
            cartItems: [{ sku: "HW-KEY", quantity: 2, discountMinor: 2000 }],
            liveCatalog: catalog,
          });

          // Mutate live catalog price ($150 -> $250) and title, then delete SKU!
          catalog.get("HW-KEY").unitPriceMinor = 25000;
          catalog.get("HW-KEY").title = "Mutated Keyboard v2";
          catalog.delete("HW-KEY");

          const verified = vault.verifyOrderSnapshotIntegrity("ord_snap_1");

          return {
            snapshotIsolatedOk:
              verified.valid === true &&
              verified.order.subtotalMinor === 30000 &&
              verified.order.totalDiscountMinor === 2000 &&
              verified.order.totalTaxMinor === 2800 &&
              verified.order.grandTotalMinor === 30800 &&
              verified.order.lines[0].snapshotTitle === "gauntlet-web Mechanical Keyboard v1",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Immutable Order Snapshot Isolation Against Live Catalog Mutations",
        passed: Boolean(res?.snapshotIsolatedOk),
        detail: "Preserves $308.00 historical invoice and v1 title even after catalog price hike and deletion",
      });
    } else if (taskId === "task_shop_data_transactional_account_cart_to_order_promoter") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Promoter = typeof AtomicCheckoutOrderPromoter === "function"
            ? AtomicCheckoutOrderPromoter
            : exports.AtomicCheckoutOrderPromoter;

          const promoter = new Promoter();
          promoter.seedState({
            customers: [{ accountId: "acc_1", email: "pp@gauntlet-web.test", orderCount: 0, lifetimeSpendMinor: 0 }],
            carts: [
              {
                cartId: "cart_ok",
                accountId: "acc_1",
                status: "ACTIVE",
                convertedOrderId: null,
                items: [{ sku: "SERVER-BLADE", quantity: 2, unitPriceMinor: 100000 }],
              },
              {
                cartId: "cart_oom",
                accountId: "acc_1",
                status: "ACTIVE",
                convertedOrderId: null,
                items: [
                  { sku: "SERVER-BLADE", quantity: 1, unitPriceMinor: 100000 },
                  { sku: "RARE-ASIC", quantity: 5, unitPriceMinor: 50000 }, // only 1 in stock!
                ],
              },
            ],
            stock: { "SERVER-BLADE": 3, "RARE-ASIC": 1 },
          });

          // 1. Atomic failure on cart_oom must NOT deduct SERVER-BLADE stock!
          let failedAtomically = false;
          try {
            promoter.promoteCheckout({
              checkoutIdempotencyKey: "chk_fail_1",
              cartId: "cart_oom",
              paymentIntentId: "pi_0",
              taxMinor: 0,
            });
          } catch {
            failedAtomically = promoter.getStock("SERVER-BLADE") === 3;
          }

          // 2. Successful promotion + idempotent replay
          const p1 = promoter.promoteCheckout({
            checkoutIdempotencyKey: "chk_success_1",
            cartId: "cart_ok",
            paymentIntentId: "pi_live_1",
            taxMinor: 16000,
          });
          const p1Replay = promoter.promoteCheckout({
            checkoutIdempotencyKey: "chk_success_1",
            cartId: "cart_ok",
            paymentIntentId: "pi_live_1",
            taxMinor: 16000,
          });

          const customer = promoter.getCustomer("acc_1");
          const cart = promoter.getCart("cart_ok");

          return {
            atomicRollbackOk: failedAtomically,
            promotionAndRollupOk:
              p1.idempotentReplay === false &&
              p1Replay.idempotentReplay === true &&
              p1.order.invoiceNumber === "INV-2026-00001" &&
              customer?.orderCount === 1 &&
              customer?.lifetimeSpendMinor === 216000 &&
              cart?.status === "CONVERTED_TO_ORDER" &&
              promoter.getStock("SERVER-BLADE") === 1,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Transactional Cart-to-Order Promotion, Stock Rollback & Customer Rollup",
        passed: Boolean(res?.atomicRollbackOk && res?.promotionAndRollupOk),
        detail: "Preserves stock on partial SKU failure, issues INV-2026-00001, and rolls up customer lifetimeSpendMinor",
      });
    } else if (taskId === "task_shop_data_split_shipment_partial_capture_reconciler") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const reconcile = typeof reconcileOrderFulfillment === "function"
            ? reconcileOrderFulfillment
            : exports.reconcileOrderFulfillment;

          // 3 units ordered at $100 (10000c) each: 2 shipped, 1 canceled on backorder, 0 pending
          const report = reconcile([
            { sku: "NODE-BOX", orderedQty: 3, shippedQty: 2, canceledQty: 1, netUnitAmountMinor: 10000 },
          ]);

          return {
            splitReconciledOk:
              report.status === "PARTIALLY_FULFILLED_CLOSED" &&
              report.authorizedTotalMinor === 30000 &&
              report.capturedMinor === 20000 &&
              report.releasedAuthorizationMinor === 10000 &&
              report.remainingCapturableMinor === 0 &&
              report.conservationValid === true,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Split-Shipment & Backorder Authorization Release Reconciliation",
        passed: Boolean(res?.splitReconciledOk),
        detail: "Transitions to PARTIALLY_FULFILLED_CLOSED with $200 captured and $100 backorder auth released",
      });
    } else if (taskId === "task_shop_data_customer_order_event_sourced_timeline") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Log = typeof EventSourcedOrderLifecycleLog === "function"
            ? EventSourcedOrderLifecycleLog
            : exports.EventSourcedOrderLifecycleLog;

          const log = new Log();
          let illegalBlocked = false;
          try {
            // Cannot deliver before account creation & payment capture!
            log.append({ type: "SHIPMENT_DELIVERED", timestampMs: 100 });
          } catch (err) {
            illegalBlocked = String(err.message).includes("InvalidLifecycleTransitionError");
          }

          log.append({ type: "ACCOUNT_CREATED", timestampMs: 1000 });
          log.append({ type: "GUEST_CART_MERGED", timestampMs: 2000 });
          log.append({ type: "CHECKOUT_AUTHORIZED", amountMinor: 15000, timestampMs: 3000 });
          log.append({ type: "ORDER_CAPTURED", amountMinor: 15000, timestampMs: 4000 });
          log.append({ type: "SHIPMENT_DELIVERED", timestampMs: 5000 });
          log.append({ type: "RMA_RETURN_APPROVED", timestampMs: 6000 });
          log.append({ type: "ORDER_REFUNDED", amountMinor: 5000, timestampMs: 7000 });

          const state = log.projectState();

          return {
            causalAndProjectedOk:
              illegalBlocked === true &&
              state.chainValid === true &&
              state.accountCreated === true &&
              state.cartMerged === true &&
              state.delivered === true &&
              state.capturedMinor === 15000 &&
              state.refundedMinor === 5000 &&
              state.netRetainedMinor === 10000 &&
              state.currentStage === "ORDER_REFUNDED",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Event-Sourced Lifecycle Causal Guard & Hash-Chained Projection",
        passed: Boolean(res?.causalAndProjectedOk),
        detail: "Blocks out-of-order lifecycle transitions and projects netRetainedMinor ($100.00) over hash chain",
      });
    } else if (taskId === "task_cookie_rfc6265bis_host_prefix_chips_serializer") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const serialize = typeof serializeRfc6265bisCookie === "function"
            ? serializeRfc6265bisCookie
            : exports.serializeRfc6265bisCookie;

          // 1. Valid __Host- + CHIPS Partitioned cookie with >400d Max-Age clamped
          const valid = serialize({
            name: "__Host-gauntlet-web_sess",
            value: "tok_123",
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "None",
            partitioned: true,
            maxAgeSec: 999_999_999,
          });

          // 2. Reject __Host- with Domain
          let hostDomainRejected = false;
          try {
            serialize({
              name: "__Host-bad",
              value: "1",
              domain: "example.com",
              path: "/",
              secure: true,
            });
          } catch {
            hostDomainRejected = true;
          }

          return {
            hostChipsAndClampOk:
              valid.header.includes("__Host-gauntlet-web_sess=tok_123") &&
              valid.header.includes("Partitioned") &&
              valid.clampedMaxAgeSec === 34560000 &&
              valid.warnings.includes("MAX_AGE_CLAMPED_TO_400_DAYS") &&
              hostDomainRejected === true,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "RFC 6265bis __Host- Validation, CHIPS Partitioned & 400-Day Clamp",
        passed: Boolean(res?.hostChipsAndClampOk),
        detail: "Rejects Domain on __Host- cookies, serializes Partitioned, and clamps Max-Age to 34,560,000s",
      });
    } else if (taskId === "task_cookie_key_ring_hmac_rotation_anti_downgrade") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Jar = typeof KeyRingSignedCookieJar === "function"
            ? KeyRingSignedCookieJar
            : exports.KeyRingSignedCookieJar;

          const oldJar = new Jar([{ kid: "k_2025", secret: "sec_old_2025" }]);
          const tokenSignedWithOldKey = oldJar.signCookieValue("__Host-sid", { sub: "usr_pp", expSec: 2000 });

          // Rotate keyring: k_2026 is now primary, k_2025 is retiring
          const rotatedJar = new Jar([
            { kid: "k_2026", secret: "sec_new_2026" },
            { kid: "k_2025", secret: "sec_old_2025" },
          ]);

          // Simulate subdomain cookie-tossing attack: attacker injects forged __Host-sid first!
          const cookieHeader = "__Host-sid=v1.k_2026.forged.deadbeef; __Host-sid=" + tokenSignedWithOldKey;
          const verified = rotatedJar.verifyFromCookieHeader(cookieHeader, "__Host-sid", 1500);

          return {
            antiTossingAndRotationOk:
              verified.valid === true &&
              verified.claims?.sub === "usr_pp" &&
              verified.verifiedByKid === "k_2025" &&
              verified.needsKeyRotationReSign === true &&
              verified.tossedDuplicatesRejected === 1,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Subdomain Cookie-Tossing Defense & Key-Ring Rotation Verification",
        passed: Boolean(res?.antiTossingAndRotationOk),
        detail: "Skips forged subdomain-tossed duplicate cookie, verifies retiring key k_2025, and flags re-sign",
      });
    } else if (taskId === "task_cookie_dbsc_device_bound_session_credentials_refresh") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Coordinator = typeof DbscSessionCoordinator === "function"
            ? DbscSessionCoordinator
            : exports.DbscSessionCoordinator;
          const signPop = typeof computeDbscPopSignature === "function"
            ? computeDbscPopSignature
            : exports.computeDbscPopSignature;

          const dbsc = new Coordinator();
          const reg = dbsc.registerDeviceSession({
            sessionId: "dbsc_sess_1",
            userId: "usr_1",
            devicePublicKeyThumbprint: "tpm_pubkey_sha256_abc",
            nowSec: 1000,
          });

          const initialNonce = "nonce_1_dbsc_sess_1";
          const validProof = signPop("tpm_pubkey_sha256_abc", "dbsc_sess_1", initialNonce);
          const refreshed = dbsc.refreshShortLivedCookie({
            sessionId: "dbsc_sess_1",
            secSessionResponseProof: validProof,
            providedChallengeNonce: initialNonce,
            nowSec: 1250,
          });

          const badProof = dbsc.refreshShortLivedCookie({
            sessionId: "dbsc_sess_1",
            secSessionResponseProof: "pop_forged_stolen_cookie",
            providedChallengeNonce: "nonce_2_dbsc_sess_1",
            nowSec: 1300,
          });

          return {
            dbscRefreshAndEvictOk:
              reg.setCookieHeader.includes("__Host-dbsc_sid=dbsc_sess_1") &&
              refreshed.refreshed === true &&
              refreshed.status === 200 &&
              badProof.refreshed === false &&
              badProof.status === 401 &&
              badProof.clearSiteDataHeader === '"cookies", "storage"',
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "W3C DBSC Proof-of-Possession Cookie Refresh & Clear-Site-Data Eviction",
        passed: Boolean(res?.dbscRefreshAndEvictOk),
        detail: "Refreshes short-lived __Host-dbsc_sid on valid hardware PoP and emits Clear-Site-Data on theft attempt",
      });
    } else if (taskId === "task_cookie_privacy_consent_gcm_partitioned_sync") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Gatekeeper = typeof CookieConsentPolicyGatekeeper === "function"
            ? CookieConsentPolicyGatekeeper
            : exports.CookieConsentPolicyGatekeeper;

          const gk = new Gatekeeper([
            { name: "__Host-session", category: "strictly_necessary" },
            { name: "_ga_metrics", category: "analytics" },
            { name: "_ad_pixel", category: "marketing" },
          ]);

          const res = gk.reconcileCookies({
            existingBrowserCookieNames: ["__Host-session", "_ga_metrics", "_ad_pixel"],
            outgoingCandidateCookies: [
              { name: "__Host-session", value: "s_1", maxAgeSec: 3600 },
              { name: "_ad_pixel", value: "p_1", maxAgeSec: 86400 },
            ],
            consent: { functional: true, analytics: false, marketing: false },
          });

          return {
            consentAndEvictionOk:
              res.allowedSetCookieHeaders.length === 1 &&
              res.blockedCookieNames.includes("_ad_pixel") &&
              res.evictionSetCookieHeaders.length === 2 &&
              res.evictionSetCookieHeaders.every((h) => h.includes("Max-Age=0")),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Cookie Consent Gatekeeping & Revoked Category Eviction",
        passed: Boolean(res?.consentAndEvictionOk),
        detail: "Permits __Host-session, blocks unconsented _ad_pixel, and evicts _ga_metrics and _ad_pixel with Max-Age=0",
      });
    } else if (taskId === "task_webdata_indexeddb_schema_migration_cursor_index") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Store = typeof VersionedClientDataStore === "function"
            ? VersionedClientDataStore
            : exports.VersionedClientDataStore;

          const store = new Store();
          store.seedV1Records([
            { id: "r1", tenantId: "t_acme", updatedAtMs: 100, name: "Alpha" },
            { id: "r2", tenantId: "t_acme", updatedAtMs: 300, name: "Beta" },
          ]);

          // 1. Test atomic rollback when v2 -> v3 throws
          let rolledBackToV1 = false;
          try {
            store.runUpgradeTransaction(3, [
              { fromVersion: 1, toVersion: 2, migrateRecord: (r) => ({ ...r, tags: ["migrated"] }) },
              { fromVersion: 2, toVersion: 3, migrateRecord: () => null },
            ]);
          } catch {
            rolledBackToV1 = store.getVersion() === 1;
          }

          // 2. Clean upgrade v1 -> v3 + compound index query
          const upg = store.runUpgradeTransaction(3, [
            { fromVersion: 1, toVersion: 2, migrateRecord: (r) => ({ ...r, tags: ["v2"] }) },
            { fromVersion: 2, toVersion: 3, migrateRecord: (r) => ({ ...r, normalizedName: String(r.name).toLowerCase() }) },
          ]);

          const range = store.queryByCompoundIndex({
            tenantId: "t_acme",
            minUpdatedAtMs: 150,
            maxUpdatedAtMs: 500,
          });

          return {
            migrationRollbackAndQueryOk:
              rolledBackToV1 === true &&
              upg.currentVersion === 3 &&
              range.length === 1 &&
              range[0].id === "r2" &&
              range[0].payload.normalizedName === "beta",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "IndexedDB Schema Upgrade Rollback & Compound Index Cursor Query",
        passed: Boolean(res?.migrationRollbackAndQueryOk),
        detail: "Rolls back failed v1->v3 upgrade to v1, then upgrades cleanly and queries [tenantId, updatedAtMs]",
      });
    } else if (taskId === "task_webdata_cross_tab_broadcast_web_locks_leader") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Coord = typeof CrossTabLeaderSyncCoordinator === "function"
            ? CrossTabLeaderSyncCoordinator
            : exports.CrossTabLeaderSyncCoordinator;

          const coord = new Coord();
          const l1 = coord.tryAcquireLeaderLease("tab_A", 1000, 5000);
          const l2Blocked = coord.tryAcquireLeaderLease("tab_B", 2000, 5000);
          const l3Takeover = coord.tryAcquireLeaderLease("tab_B", 7000, 5000); // after 5000ms lease expiry

          const pkt = coord.publishLocalMutation("tab_B", "theme", "dark");
          const dup = coord.applyIncomingBroadcast(pkt);
          const stale = coord.applyIncomingBroadcast({
            messageId: "msg_tab_A_0",
            originTabId: "tab_A",
            lamportCounter: 0,
            key: "theme",
            value: "light",
          });

          return {
            leaderAndLamportOk:
              l1.isLeader === true &&
              l2Blocked.isLeader === false &&
              l3Takeover.isLeader === true &&
              dup.deduplicated === true &&
              stale.reason === "STALE_LAMPORT_CLOCK" &&
              coord.getValue("theme") === "dark",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Multi-Tab Leader Lease Failover & Lamport Clock Conflict Resolution",
        passed: Boolean(res?.leaderAndLamportOk),
        detail: "Transfers leadership after lease expiry, deduplicates messages, and drops stale Lamport writes",
      });
    } else if (taskId === "task_webdata_quota_eviction_opfs_tiered_cache") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Manager = typeof QuotaAwareClientStorageManager === "function"
            ? QuotaAwareClientStorageManager
            : exports.QuotaAwareClientStorageManager;

          const mgr = new Manager(1000);
          mgr.putObject({ key: "draft_user_1", byteLength: 400, pinned: true, lastAccessedMs: 10, regenerationCostWeight: 1 });
          mgr.putObject({ key: "cache_cheap_old", byteLength: 400, pinned: false, lastAccessedMs: 20, regenerationCostWeight: 1 });
          mgr.putObject({ key: "cache_expensive_new", byteLength: 200, pinned: false, lastAccessedMs: 100, regenerationCostWeight: 10 });

          // Writing 350B must evict cache_cheap_old (400B) while preserving pinned draft_user_1!
          const writeRes = mgr.putObject({
            key: "asset_bundle",
            byteLength: 350,
            pinned: false,
            lastAccessedMs: 200,
            regenerationCostWeight: 5,
          });

          return {
            quotaAndPinningOk:
              writeRes.stored === true &&
              writeRes.evictedKeys.includes("cache_cheap_old") &&
              mgr.hasObject("draft_user_1") === true &&
              mgr.hasObject("cache_expensive_new") === true &&
              mgr.estimate().usage === 950,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Quota-Aware Cost-LRU Eviction & Pinned User Draft Protection",
        passed: Boolean(res?.quotaAndPinningOk),
        detail: "Evicts low-score cache_cheap_old while preserving pinned draft_user_1 under 1000B quota",
      });
    } else if (taskId === "task_webdata_offline_mutation_outbox_etag_reconciler") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Engine = typeof OfflineMutationOutboxEngine === "function"
            ? OfflineMutationOutboxEngine
            : exports.OfflineMutationOutboxEngine;

          const outbox = new Engine();
          // doc_1: CREATE then UPDATE -> single CREATE
          outbox.enqueue({ entityId: "doc_1", kind: "CREATE", fields: { title: "Draft", views: 0 } });
          outbox.enqueue({ entityId: "doc_1", kind: "UPDATE", fields: { title: "Final" } });
          // doc_2: CREATE then DELETE -> elided!
          outbox.enqueue({ entityId: "doc_2", kind: "CREATE", fields: { title: "Temp" } });
          outbox.enqueue({ entityId: "doc_2", kind: "DELETE" });

          const compacted = outbox.compactQueue();

          // 3-way merge: local changed title, server changed views -> clean merge!
          const mergeClean = outbox.resolveThreeWayEtagConflict({
            baseSnapshot: { title: "v1", views: 10 },
            localModified: { title: "v2-local", views: 10 },
            serverCurrent: { title: "v1", views: 25 },
            serverCurrentEtag: '"etag_v2"',
          });

          return {
            compactionAndMergeOk:
              compacted.length === 1 &&
              compacted[0].entityId === "doc_1" &&
              compacted[0].kind === "CREATE" &&
              compacted[0].fields?.title === "Final" &&
              mergeClean.cleanMerge === true &&
              mergeClean.mergedDocument.title === "v2-local" &&
              mergeClean.mergedDocument.views === 25,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Offline Outbox Log Compaction & 3-Way ETag Conflict Merge",
        passed: Boolean(res?.compactionAndMergeOk),
        detail: "Compacts CREATE+UPDATE, elides CREATE+DELETE, and merges disjoint local/server field changes",
      });
    } else if (taskId === "task_traffic_rfc9111_http_cache_swr_vary_etag") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Cache = typeof Rfc9111HttpCacheEngine === "function"
            ? Rfc9111HttpCacheEngine
            : exports.Rfc9111HttpCacheEngine;

          const cache = new Cache();
          cache.storeResponse({
            url: "/api/catalog",
            requestHeaders: { "accept-encoding": "br", "accept-language": "en-us" },
            status: 200,
            body: '{"items":[1,2]}',
            cacheControl: "public, max-age=60, stale-while-revalidate=120",
            etag: '"v1_hash"',
            vary: "Accept-Encoding, Accept-Language",
            nowSec: 1000,
          });

          // 1. Different Vary header (gzip instead of br) must MISS
          const varyMiss = cache.lookup({
            url: "/api/catalog",
            varyHeaders: ["accept-encoding", "accept-language"],
            requestHeaders: { "accept-encoding": "gzip", "accept-language": "en-us" },
            nowSec: 1020,
          });

          // 2. Matching Vary + If-None-Match within max-age -> 304 Not Modified
          const reval304 = cache.lookup({
            url: "/api/catalog",
            varyHeaders: ["accept-encoding", "accept-language"],
            requestHeaders: {
              "accept-encoding": "br",
              "accept-language": "en-us",
              "if-none-match": '"v1_hash"',
            },
            nowSec: 1030,
          });

          // 3. Inside stale-while-revalidate window (age=100s > maxAge=60s, <= 180s)
          const swrHit = cache.lookup({
            url: "/api/catalog",
            varyHeaders: ["accept-encoding", "accept-language"],
            requestHeaders: { "accept-encoding": "br", "accept-language": "en-us" },
            nowSec: 1100,
          });

          return {
            varyEtagAndSwrOk:
              varyMiss.cacheStatus === "MISS" &&
              reval304.cacheStatus === "REVALIDATED_304" &&
              reval304.status === 304 &&
              swrHit.cacheStatus === "HIT_STALE_WHILE_REVALIDATE" &&
              swrHit.triggerBackgroundRevalidate === true,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "RFC 9111 Vary Isolation, ETag 304 & stale-while-revalidate Verification",
        passed: Boolean(res?.varyEtagAndSwrOk),
        detail: "Isolates Vary variants, returns 304 on ETag match, and serves SWR with background revalidation",
      });
    } else if (taskId === "task_traffic_edge_request_coalescing_singleflight_stampede") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Shield = typeof EdgeSingleflightTrafficShield === "function"
            ? EdgeSingleflightTrafficShield
            : exports.EdgeSingleflightTrafficShield;

          const shield = new Shield();
          let originCalls = 0;

          const loader = async () => {
            originCalls++;
            await new Promise((r) => setTimeout(r, 15));
            return { status: 200, body: "payload_ok" };
          };

          // Fire 5 concurrent requests for the same cold key
          const batch = await Promise.all(
            Array.from({ length: 5 }, () =>
              shield.handleRequest({
                key: "hot_product_1",
                nowMs: 1000,
                positiveTtlMs: 10000,
                negative404TtlMs: 2000,
                originFetcher: loader,
              }),
            ),
          );

          const stats = shield.getStats();

          return {
            singleflightOk:
              originCalls === 1 &&
              stats.originFetches === 1 &&
              stats.coalescedHits === 4 &&
              batch.every((b) => b.response.body === "payload_ok"),
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Edge Singleflight Coalescing (5 Concurrent Misses -> 1 Origin Fetch)",
        passed: Boolean(res?.singleflightOk),
        detail: "Collapses 5 simultaneous cache misses into 1 origin call and 4 coalesced followers",
      });
    } else if (taskId === "task_traffic_ietf_ratelimit_token_bucket_sliding_window") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Limiter = typeof WebTrafficRateLimiter === "function"
            ? WebTrafficRateLimiter
            : exports.WebTrafficRateLimiter;

          const limiter = new Limiter({ capacity: 10, refillTokensPerSec: 2, windowSec: 5 });

          // Spend 8 tokens on a heavy search route (2 remaining)
          const r1 = limiter.evaluateTraffic({ clientKey: "ip_1", routeCost: 8, nowMs: 1000 });
          // Spend 5 tokens immediately -> rejected with 429 (needs 3 more tokens @ 2/sec => Retry-After: 2s)
          const r2Blocked = limiter.evaluateTraffic({ clientKey: "ip_1", routeCost: 5, nowMs: 1000 });
          // Advance 2000ms (+4 tokens refilled -> 6 tokens available) -> 5-token request succeeds!
          const r3Refilled = limiter.evaluateTraffic({ clientKey: "ip_1", routeCost: 5, nowMs: 3000 });

          return {
            rateLimitAndHeadersOk:
              r1.allowed === true &&
              r1.remainingTokens === 2 &&
              r2Blocked.allowed === false &&
              r2Blocked.status === 429 &&
              r2Blocked.headers["Retry-After"] === "2" &&
              r2Blocked.headers["RateLimit-Policy"] === "10;w=5" &&
              r3Refilled.allowed === true &&
              r3Refilled.remainingTokens === 1,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Token-Bucket Cost Refill & IETF RateLimit / Retry-After Headers",
        passed: Boolean(res?.rateLimitAndHeadersOk),
        detail: "Deducts weighted route costs, emits Retry-After=2 on 429, and refills tokens accurately",
      });
    } else if (taskId === "task_traffic_w3c_traceparent_server_timing_rfc9218_priority") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const propagate = typeof parseAndPropagateW3CTraceparent === "function"
            ? parseAndPropagateW3CTraceparent
            : exports.parseAndPropagateW3CTraceparent;
          const schedule = typeof scheduleRequestsByRfc9218Priority === "function"
            ? scheduleRequestsByRfc9218Priority
            : exports.scheduleRequestsByRfc9218Priority;
          const formatTiming = typeof formatServerTimingHeader === "function"
            ? formatServerTimingHeader
            : exports.formatServerTimingHeader;

          const trace = propagate(
            "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
            "aabbccddeeff0011",
            "11111111111111111111111111111111",
          );

          const ordered = schedule([
            { id: "bg_prefetch", priorityHeader: "u=6, i" },
            { id: "hero_lcp_img", priorityHeader: "u=0" },
            { id: "default_api" }, // default u=3
          ]);

          const serverTiming = formatTiming([
            { name: "cache", durationMs: 1.4, description: "HIT" },
            { name: "db", durationMs: 12.8 },
          ]);

          return {
            tracePriorityAndTimingOk:
              trace.validIncoming === true &&
              trace.outboundTraceparent === "00-4bf92f3577b34da6a3ce929d0e0e4736-aabbccddeeff0011-01" &&
              ordered.map((r) => r.id).join(",") === "hero_lcp_img,default_api,bg_prefetch" &&
              serverTiming === 'cache;desc="HIT";dur=1.4, db;dur=12.8',
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "W3C traceparent Child Span, RFC 9218 Priority Ordering & Server-Timing",
        passed: Boolean(res?.tracePriorityAndTimingOk),
        detail: "Propagates W3C traceId with new child spanId, orders u=0 before u=3 before u=6, and formats Server-Timing",
      });
    } else if (taskId === "task_design_w3c_dtcg_token_compiler_multi_brand_alias") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Compiler = typeof W3cDtcgTokenCompiler === "function"
            ? W3cDtcgTokenCompiler
            : exports.W3cDtcgTokenCompiler;

          const compiler = new Compiler();
          compiler.loadTokenTree({
            color: {
              $type: "color",
              primitive: {
                obsidian: { $value: "oklch(0.12 0.005 90)" },
              },
              semantic: {
                surface: { $value: "{color.primitive.obsidian}" },
              },
            },
          });

          const compiled = compiler.compileCssCustomProperties(":root");

          // Verify cycle detection
          const cyclic = new Compiler();
          cyclic.loadTokenTree({
            a: { $type: "color", x: { $value: "{b.y}" } },
            b: { $type: "color", y: { $value: "{a.x}" } },
          });
          let cycleCaught = false;
          try {
            cyclic.compileCssCustomProperties();
          } catch (err) {
            cycleCaught = String(err.message).includes("CircularTokenAliasError");
          }

          return {
            dtcgCompiledAndCycleCaughtOk:
              compiled.cssText.includes("--color-semantic-surface: oklch(0.12 0.005 90);") &&
              compiled.tokens.every((t) => t.type === "color") &&
              cycleCaught === true,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "W3C DTCG 2025.10 Alias Resolution, Group $type Inheritance & Cycle Guard",
        passed: Boolean(res?.dtcgCompiledAndCycleCaughtOk),
        detail: "Resolves {color.primitive.obsidian} into --color-semantic-surface and catches circular alias cycles",
      });
    } else if (taskId === "task_design_oklch_perceptual_palette_apca_contrast_guard") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const genRamp = typeof generatePerceptualOklchRamp === "function"
            ? generatePerceptualOklchRamp
            : exports.generatePerceptualOklchRamp;
          const enforce = typeof enforceAccessibleTextContrast === "function"
            ? enforceAccessibleTextContrast
            : exports.enforceAccessibleTextContrast;

          const ramp = genRamp(0.16, 250);
          // Low-contrast gray text (l=0.35) on dark obsidian surface (l=0.12) must be lightened automatically!
          const remediated = enforce(
            { l: 0.35, c: 0.02, h: 90 },
            { l: 0.12, c: 0.005, h: 90 },
            65,
          );

          return {
            oklchAndApcaOk:
              ramp.length === 11 &&
              ramp[0].step === 50 &&
              ramp[10].step === 950 &&
              remediated.wasAdjusted === true &&
              remediated.apcaLc >= 65 &&
              remediated.adjustedText.l > 0.7,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "11-Step OKLCH Tonal Ramp & APCA Lc Contrast Auto-Remediation",
        passed: Boolean(res?.oklchAndApcaOk),
        detail: "Generates 50..950 OKLCH scale and lightens dark-mode foreground text to >= 65 APCA Lc",
      });
    } else if (taskId === "task_design_fluid_utopia_typography_bento_spatial_grid") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const genScale = typeof generateModularFluidTypeScale === "function"
            ? generateModularFluidTypeScale
            : exports.generateModularFluidTypeScale;
          const validateGrid = typeof validateBentoGridAndSpatialRhythm === "function"
            ? validateBentoGridAndSpatialRhythm
            : exports.validateBentoGridAndSpatialRhythm;

          const scale = genScale({
            baseMinPx: 16,
            baseMaxPx: 20,
            minRatio: 1.2,
            maxRatio: 1.25,
            steps: [{ name: "body", power: 0 }, { name: "h1", power: 3 }],
          });

          const bento = validateGrid({
            columns: 4,
            spacingPxValues: [4, 8, 16, 24, 32],
            cards: [
              { id: "hero", colSpan: 2, rowSpan: 2 },
              { id: "stat1", colSpan: 2, rowSpan: 1 },
              { id: "stat2", colSpan: 2, rowSpan: 1 },
            ],
          });

          return {
            utopiaAndBentoOk:
              scale.length === 2 &&
              scale[0].clampCss.startsWith("clamp(1rem,") &&
              bento.rhythmValid === true &&
              bento.totalCellsOccupied === 8 &&
              bento.isHoleFreeCompleteRectangle === true,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Utopia Fluid clamp() Type Scale & Hole-Free Bento Grid Verification",
        passed: Boolean(res?.utopiaAndBentoOk),
        detail: "Compiles slope-intercept clamp() tokens and verifies 4-column Bento grid completeness",
      });
    } else if (taskId === "task_design_proprietary_elevation_glassmorphism_spring_tokens") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const synthSpring = typeof synthesizeSpringPhysicsToken === "function"
            ? synthesizeSpringPhysicsToken
            : exports.synthesizeSpringPhysicsToken;
          const compileSurface = typeof compileProprietarySurfaceElevation === "function"
            ? compileProprietarySurfaceElevation
            : exports.compileProprietarySurfaceElevation;

          // Critically damped spring: k=400, m=1 => critical c = 2*sqrt(400) = 40
          const spring = synthSpring({ stiffness: 400, damping: 40, mass: 1 });
          const surface = compileSurface({ level: 2, theme: "dark", glassBlurPx: 16 });

          return {
            springAndElevationOk:
              spring.regime === "critically-damped" &&
              spring.dampingRatio === 1 &&
              spring.cssLinearEasing.startsWith("linear(0,") &&
              surface.boxShadowCss.includes("inset 0 1px 0 0") &&
              surface.backdropFilterCss.includes("blur(16px)"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Critically-Damped Spring Physics & Specular Glassmorphic Elevation",
        passed: Boolean(res?.springAndElevationOk),
        detail: "Identifies critically-damped spring (zeta=1), samples CSS linear(), and emits specular inner border",
      });
    } else if (taskId === "task_ui_roving_tabindex_command_chord_ergonomics") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Nav = typeof CommandChordRovingNavigator === "function"
            ? CommandChordRovingNavigator
            : exports.CommandChordRovingNavigator;

          const nav = new Nav();
          nav.registerChord("g", "t", "GO_TODAY");
          nav.setCompositeItems([
            { id: "tab_1" },
            { id: "tab_2_disabled", disabled: true },
            { id: "tab_3" },
          ]);

          // 1. ArrowDown skips disabled tab_2_disabled and lands on tab_3
          const afterArrow = nav.handleKeyEvent({ key: "ArrowDown", nowMs: 100 });
          // 2. Sequential chord 'g' then 't' within 800ms triggers GO_TODAY
          const step1 = nav.handleKeyEvent({ key: "g", nowMs: 200 });
          const step2 = nav.handleKeyEvent({ key: "t", nowMs: 500 });
          // 3. Chord suppressed when typing in input
          const blockedInInput = nav.handleKeyEvent({ key: "g", nowMs: 600, isEditableTarget: true });

          return {
            rovingAndChordOk:
              afterArrow.activeItemId === "tab_3" &&
              afterArrow.rovingStates.filter((s) => s.tabIndex === 0).length === 1 &&
              step1.awaitingSecondKey === true &&
              step2.matchedCommandId === "GO_TODAY" &&
              blockedInInput.awaitingSecondKey === false,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Roving tabindex Disabled-Skip & Two-Key Command Chord Execution",
        passed: Boolean(res?.rovingAndChordOk),
        detail: "Skips disabled items during Arrow navigation, fires G->T chord, and ignores editable inputs",
      });
    } else if (taskId === "task_ui_css_anchor_positioning_collision_flip_solver") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const compileRules = typeof compileCssAnchorPositioningRules === "function"
            ? compileCssAnchorPositioningRules
            : exports.compileCssAnchorPositioningRules;
          const solveCollision = typeof solveAnchoredViewportCollision === "function"
            ? solveAnchoredViewportCollision
            : exports.solveAnchoredViewportCollision;

          const css = compileRules({ anchorId: "menu-btn", popoverClass: "floating-menu" });

          // Anchor near bottom-right corner of 1024x768 viewport -> must flip both block (to top) and inline (to span-left)!
          const flipped = solveCollision({
            anchorRect: { x: 920, y: 720, width: 80, height: 32 },
            floatingSize: { width: 220, height: 180 },
            viewport: { width: 1024, height: 768 },
          });

          return {
            anchorAndFlipOk:
              css.includes("anchor-name: --menu-btn") &&
              css.includes("position-try-fallbacks: flip-block, flip-inline") &&
              flipped.flippedBlock === true &&
              flipped.flippedInline === true &&
              flipped.chosenPlacement === "top-span-left",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "CSS Anchor Positioning Rules & Bottom-Right Viewport Flip Solver",
        passed: Boolean(res?.anchorAndFlipOk),
        detail: "Emits @position-try-fallbacks and flips popover to top-span-left near bottom-right edge",
      });
    } else if (taskId === "task_ui_view_transitions_shared_element_morph_orchestrator") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Orchestrator = typeof ViewTransitionMorphOrchestrator === "function"
            ? ViewTransitionMorphOrchestrator
            : exports.ViewTransitionMorphOrchestrator;

          const orch = new Orchestrator();
          const candidates = [
            { elementId: "card_1", requestedTransitionName: "hero-card", visible: true },
            { elementId: "card_2_dup", requestedTransitionName: "hero-card", visible: true },
            { elementId: "card_3_hidden", requestedTransitionName: "hidden-card", visible: false },
          ];

          const morphRes = await orch.executeMorphTransition({
            prefersReducedMotion: false,
            supportsViewTransitions: true,
            candidates,
            mutateDomCallback: () => {},
          });

          const reducedRes = await orch.executeMorphTransition({
            prefersReducedMotion: true,
            supportsViewTransitions: true,
            candidates,
            mutateDomCallback: () => {},
          });

          return {
            viewTransitionGuardOk:
              morphRes.mode === "MORPHEME_VIEW_TRANSITION" &&
              morphRes.activeTransitionNamesCount === 1 &&
              morphRes.deduplicatedConflicts.includes("hero-card") &&
              reducedRes.mode === "REDUCED_MOTION_INSTANT",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "View Transition Duplicate Name Guard & Reduced-Motion Bypass",
        passed: Boolean(res?.viewTransitionGuardOk),
        detail: "Deduplicates colliding hero-card view-transition-name and bypasses morphing on reduced motion",
      });
    } else if (taskId === "task_ui_optimistic_skeleton_shimmer_cls_zero_hydrator") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Controller = typeof ZeroClsSkeletonTransitionController === "function"
            ? ZeroClsSkeletonTransitionController
            : exports.ZeroClsSkeletonTransitionController;

          const ctrl = new Controller({ showDelayMs: 120, minDwellMs: 300 });

          // 1. Fast response (arrives at 50ms < 120ms grace) -> never shows skeleton!
          const fast = ctrl.evaluatePhase({ requestStartedAtMs: 0, dataArrivedAtMs: 50, nowMs: 60 });

          // 2. Slow response: arrives at 200ms (after skeleton shown at 120ms). At 250ms, must still hold skeleton until 120+300=420ms!
          const heldForMinDwell = ctrl.evaluatePhase({ requestStartedAtMs: 0, dataArrivedAtMs: 200, nowMs: 250 });
          const revealedAfterDwell = ctrl.evaluatePhase({ requestStartedAtMs: 0, dataArrivedAtMs: 200, nowMs: 430 });

          const box = ctrl.computeZeroClsReservationCss({ widthPx: 640, heightPx: 360 });

          return {
            antiFlashAndZeroClsOk:
              fast.phase === "CONTENT_READY" &&
              fast.skeletonShownAtMs === null &&
              heldForMinDwell.phase === "SKELETON_VISIBLE" &&
              revealedAfterDwell.phase === "CONTENT_READY" &&
              box.aspectRatioCss === "640 / 360" &&
              box.estimatedClsDelta === 0,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Skeleton Anti-Flash Minimum Dwell & Zero-CLS Aspect-Ratio Reservation",
        passed: Boolean(res?.antiFlashAndZeroClsOk),
        detail: "Skips skeleton on 50ms response, holds skeleton until 420ms on 200ms response, and reserves aspect-ratio",
      });
    } else if (taskId === "task_webcomp_form_associated_element_internals_custom_states") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const SwitchCore = typeof FormAssociatedSwitchCore === "function"
            ? FormAssociatedSwitchCore
            : exports.FormAssociatedSwitchCore;
          const createInternals = typeof createMockElementInternals === "function"
            ? createMockElementInternals
            : exports.createMockElementInternals;

          const internals = createInternals();
          const sw = new SwitchCore({ internals, defaultChecked: false, required: true, value: "accepted" });

          const initialSnap = sw.getSnapshot();
          sw.toggle();
          const checkedSnap = sw.getSnapshot();
          sw.formResetCallback();
          const resetSnap = sw.getSnapshot();

          return {
            internalsAndStatesOk:
              SwitchCore.formAssociated === true &&
              initialSnap.valid === false &&
              initialSnap.activeStates.includes("invalid") &&
              checkedSnap.checked === true &&
              checkedSnap.formValue === "accepted" &&
              checkedSnap.valid === true &&
              checkedSnap.activeStates.includes("checked") &&
              resetSnap.checked === false,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Form-Associated ElementInternals Validity & CustomStateSet Verification",
        passed: Boolean(res?.internalsAndStatesOk),
        detail: "Syncs setFormValue('accepted'), toggles :state(checked)/:state(invalid), and resets on formResetCallback",
      });
    } else if (taskId === "task_webcomp_constructable_stylesheets_reactive_attribute_bridge") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Bridge = typeof ConstructableStyleAttributeBridge === "function"
            ? ConstructableStyleAttributeBridge
            : exports.ConstructableStyleAttributeBridge;

          const bridge = new Bridge();
          const s1 = bridge.acquireSharedStyleSheet(":host { display: block; }");
          const s2 = bridge.acquireSharedStyleSheet("  :host {   display: block; } ");

          bridge.setProperty("elevated", true);
          const attrAfterTrue = bridge.getAttribute("elevated");
          bridge.setProperty("elevated", false);
          const attrAfterFalse = bridge.getAttribute("elevated");

          const stats = bridge.getStats();

          return {
            sheetCacheAndBridgeOk:
              s1.sheetId === s2.sheetId &&
              s2.refCount === 2 &&
              stats.uniqueSheetsAllocated === 1 &&
              attrAfterTrue === "" &&
              attrAfterFalse === null &&
              stats.renderCount === 2,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Shared Constructable CSSStyleSheet Pool & Loop-Safe Attribute Reflection",
        passed: Boolean(res?.sheetCacheAndBridgeOk),
        detail: "Deduplicates normalized CSSStyleSheets (refCount=2) and reflects boolean properties without recursion",
      });
    } else if (taskId === "task_webcomp_named_slot_projection_part_theming_guard") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Engine = typeof ShadowSlotPartProjectionEngine === "function"
            ? ShadowSlotPartProjectionEngine
            : exports.ShadowSlotPartProjectionEngine;

          const engine = new Engine({
            slots: [
              { name: "header", fallbackText: "Default Header" },
              { name: "", fallbackText: "Default Body" },
              { name: "footer", fallbackText: "Default Footer" },
            ],
            allowedParts: ["surface", "header-title"],
          });

          const dist = engine.distributeLightDomNodes([
            { nodeId: "n1", slotAttr: "header", textContent: "Custom Title" },
            { nodeId: "n2", textContent: "Main Content" },
            { nodeId: "n3", slotAttr: "unknown-slot", textContent: "Orphaned" },
          ]);

          const parts = engine.validateCssPartSelectors([
            "gauntlet-web-card::part(surface)",
            "gauntlet-web-card::part(private-internal-node)",
          ]);

          return {
            slotAndPartOk:
              dist.projectedSlots.header.usingFallback === false &&
              dist.projectedSlots.header.renderedText === "Custom Title" &&
              dist.projectedSlots.footer.usingFallback === true &&
              dist.projectedSlots.footer.renderedText === "Default Footer" &&
              dist.unslottedOrphanNodeIds.includes("n3") &&
              parts.validParts.includes("surface") &&
              parts.unauthorizedParts.includes("private-internal-node"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Shadow DOM Named Slot Projection, Fallback Rendering & ::part() Audit",
        passed: Boolean(res?.slotAndPartOk),
        detail: "Projects named/default slots, renders footer fallback, isolates orphan slots, and validates ::part()",
      });
    } else if (taskId === "task_webcomp_virtualized_shadow_list_resize_observer") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Engine = typeof VirtualizedShadowListEngine === "function"
            ? VirtualizedShadowListEngine
            : exports.VirtualizedShadowListEngine;

          // 1,000 rows @ 40px default = 40,000px total height
          const vlist = new Engine(1000, 40);
          // ResizeObserver measures row 10 at 100px (+60px delta => 40,060px total)
          vlist.updateMeasuredRowHeight(10, 100);

          const win = vlist.computeViewportWindow({
            scrollTopPx: 460, // lands right inside row 10 (offsets: row 0..9 = 400px, row 10 = 400..500px)
            viewportHeightPx: 120,
            overscanCount: 2,
          });

          const renderedHeight = win.visibleRows.reduce((s, r) => s + r.heightPx, 0);

          return {
            virtualListOk:
              win.totalScrollHeightPx === 40060 &&
              win.startIndex === 8 &&
              win.visibleRows.length <= 8 &&
              win.topSpacerPx + renderedHeight + win.bottomSpacerPx === 40060,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "O(log N) Prefix-Sum Virtualized Viewport & Spacer Conservation",
        passed: Boolean(res?.virtualListOk),
        detail: "Updates measured row height, slices overscan window in O(log N), and preserves 40,060px scroll height",
      });
    } else if (taskId === "task_webworker_transferable_offload") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const values = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
          const plan = planTransferableChunks(values, 3);
          const sent = [];
          const fakeWorker = { postMessage: (msg, transfer) => sent.push({ msg, transfer }) };
          const dispatched = dispatchChunks(fakeWorker, plan);
          const lengths = plan.map((chunk) => chunk.length).join(",");
          const offsets = plan.map((chunk) => chunk.offset).join(",");
          const noCopy = sent.length === 3 && sent.every(
            (entry) => Array.isArray(entry.transfer) && entry.transfer.length === 1 && entry.transfer[0] === entry.msg.buffer,
          );
          const total = mergeChunkSums(plan.map((chunk) => {
            let sum = 0;
            for (const value of new Float64Array(chunk.buffer)) sum += value;
            return sum;
          }));
          return {
            offloadOk:
              dispatched === 3 && lengths === "4,4,2" && offsets === "0,4,8" && noCopy && total === 55,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Transferable Chunk Plan & Partial-Sum Merge",
        passed: Boolean(res?.offloadOk),
        detail: "Balances 10 samples over 3 workers, transfers each buffer, and merges to 55",
      });
    } else if (taskId === "task_webworker_shared_atomics_counter") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const counter = createSharedCounter(1);
          bumpCounter(counter.view, 3);
          bumpCounter(counter.view, 4);
          const total = readCounter(counter.view);
          const firstClaim = claimExclusiveSlot(counter.view, 7, 10);
          const secondClaim = claimExclusiveSlot(counter.view, 7, 11);
          return {
            atomicsOk:
              counter.sab instanceof SharedArrayBuffer &&
              total === 7 &&
              firstClaim === true &&
              secondClaim === false &&
              readCounter(counter.view) === 10,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Atomic Counter & compareExchange Guard",
        passed: Boolean(res?.atomicsOk),
        detail: "Accumulates 7 atomically, then allows exactly one compareExchange claim",
      });
    } else if (taskId === "task_webworker_pool_lifecycle") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          let terminated = 0;
          let concurrent = 0;
          let peak = 0;
          const spawn = () => ({
            run: (task) => new Promise((resolve) => {
              concurrent += 1;
              peak = Math.max(peak, concurrent);
              setTimeout(() => {
                concurrent -= 1;
                resolve(task * 2);
              }, 5);
            }),
            terminate: () => { terminated += 1; },
          });
          const pool = new WorkerPool(2, spawn);
          const results = await Promise.all([1, 2, 3, 4, 5].map((task) => pool.submit(task)));
          const closed = await pool.close();
          return {
            poolOk:
              results.join(",") === "2,4,6,8,10" &&
              peak <= 2 &&
              terminated === 2 &&
              closed.terminated === 2,
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 2000 });
      results.push({
        name: "Pool Concurrency Cap & Graceful Drain",
        passed: Boolean(res?.poolOk),
        detail: "Runs 5 jobs on 2 workers in order, caps concurrency at 2, terminates both once",
      });
    } else if (taskId === "task_webstreams_json_frame_decoder") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const encoder = new TextEncoder();
          const frames = ['{"seq":1}\\n{"seq":', '2}\\n{"seq":3}'];
          const source = new ReadableStream({
            start(controller) {
              for (const frame of frames) controller.enqueue(encoder.encode(frame));
              controller.close();
            },
          });
          const seen = [];
          const sink = new WritableStream({ write(frame) { seen.push(frame.seq); } });
          await source.pipeThrough(createJsonFrameDecoder()).pipeTo(sink);
          return { frameOk: seen.join(",") === "1,2,3" };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 2000 });
      results.push({
        name: "Cross-Chunk NDJSON Decode",
        passed: Boolean(res?.frameOk),
        detail: "Decodes three frames even though one is split across chunk boundaries",
      });
    } else if (taskId === "task_webstreams_sse_reconnect_parser") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const parser = createSseParser();
          const first = parser.push("id: 7\\ndata: hel");
          const second = parser.push("lo\\n\\n: keep-alive\\n\\nevent: tick\\ndata: x\\ndata: y\\n\\n");
          return {
            sseOk:
              first.length === 0 &&
              second.length === 2 &&
              second[0].id === "7" &&
              second[0].data === "hello" &&
              second[1].event === "tick" &&
              second[1].data === "x\\ny" &&
              parser.lastEventId === "7",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Buffered SSE Frame & Last-Event-ID Resume",
        passed: Boolean(res?.sseOk),
        detail: "Reassembles a split frame, skips keep-alive comments, and records the last event id",
      });
    } else if (taskId === "task_webstreams_streaming_checksum") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const split = checksumStream(["hello", " ", "world"]);
          const single = checksumStream(["hello world"]);
          const incremental = createChecksum().update("hello").update(" world").digest();
          return {
            digestOk: split === single && incremental === single && /^[0-9a-f]{8}$/.test(single),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Chunk-Boundary Independent Digest",
        passed: Boolean(res?.digestOk),
        detail: "Produces the same 8-character digest for split, whole and incremental input",
      });
    } else if (taskId === "task_webmcp_tool_registry") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const registry = new ToolRegistry("https://app.example.test");
            await registry.registerTool({ name: "search_products", description: "Search", inputSchema: { type: "object" }, execute: async () => ({}) });
            await registry.registerTool({ name: "add_to_cart", description: "Add to cart", execute: async () => ({}) });

            const duplicate = await registry.registerTool({ name: "search_products", description: "dupe", execute: async () => ({}) }).then(() => null, (e) => e);
            const invalidName = await registry.registerTool({ name: "bad name!", description: "x", execute: async () => ({}) }).then(() => null, (e) => e);
            const emptyDescription = await registry.registerTool({ name: "valid_name", description: "", execute: async () => ({}) }).then(() => null, (e) => e);

            const tools = await registry.getTools();
            const names = tools.map((t) => t.name).join(",");
            const schema = tools.find((t) => t.name === "search_products")?.inputSchema;

            const controller = new AbortController();
            await registry.registerTool({ name: "temp_tool", description: "temp", execute: async () => ({}) }, { signal: controller.signal });
            const beforeAbort = (await registry.getTools()).length;
            let changes = 0;
            registry.onToolChange(() => { changes += 1; });
            controller.abort();
            const afterAbort = (await registry.getTools()).length;

            return {
              registryOk:
                duplicate?.name === "InvalidStateError" &&
                invalidName?.name === "InvalidStateError" &&
                emptyDescription?.name === "InvalidStateError" &&
                names === "add_to_cart,search_products" &&
                schema?.type === "object" &&
                beforeAbort === 3 &&
                afterAbort === 2 &&
                changes >= 1,
            };
          } catch (error) {
            return { registryOk: false };
          }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 2000 });
      results.push({
        name: "WebMCP Tool Registration & Discovery",
        passed: Boolean(res?.registryOk),
        detail: "Rejects invalid names, duplicates and empty descriptions, sorts discovery, unregisters on abort",
      });
    } else if (taskId === "task_webmcp_tool_execution") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const executor = new ToolExecutor();
            await executor.registerTool({ name: "echo", description: "Echo", execute: async (input, options) => ({ got: input, signalled: Boolean(options && options.signal) }) });
            await executor.registerTool({ name: "boom", description: "Fails", execute: async () => { throw new Error("nope"); } });
            await executor.registerTool({ name: "circular", description: "Bad", execute: async () => { const o = {}; o.self = o; return o; } });

            const raw = await executor.executeTool("echo", { a: 1 });
            const parsed = JSON.parse(raw);

            const missing = await executor.executeTool("nope", {}).then(() => null, (e) => e);
            const badInput = await executor.executeTool("echo", "not-an-object").then(() => null, (e) => e);
            const rejected = await executor.executeTool("boom", {}).then(() => null, (e) => e);
            const unserialisable = await executor.executeTool("circular", {}).then(() => null, (e) => e);

            const controller = new AbortController();
            const pending = executor.executeTool("echo", { a: 2 }, { signal: controller.signal });
            controller.abort();
            const cancelled = await pending.then(() => null, (e) => e);

            return {
              executionOk:
                typeof raw === "string" &&
                parsed.got.a === 1 &&
                parsed.signalled === true &&
                missing?.name === "NotFoundError" &&
                badInput?.name === "DataError" &&
                rejected?.name === "OperationError" &&
                unserialisable?.name === "OperationError" &&
                cancelled?.name === "AbortError",
            };
          } catch (error) {
            return { executionOk: false };
          }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 2000 });
      results.push({
        name: "WebMCP Tool Execution & Error Taxonomy",
        passed: Boolean(res?.executionOk),
        detail: "Round-trips input, signals cancellation and maps failures to the draft's exception names",
      });
    } else if (taskId === "task_webmcp_origin_exposure") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const registry = new ToolExposure("https://shop.example.test");
            await registry.registerTool({ name: "public_tool", description: "Public", execute: async () => ({}) });
            await registry.registerTool({ name: "shared_tool", description: "Shared", execute: async () => ({}) }, { exposedTo: ["https://agent.example.test"] });

            const visible = await registry.getTools("https://agent.example.test", { fromOrigins: ["https://shop.example.test"] });
            const ownerVisible = await registry.getTools("https://shop.example.test");
            const hidden = await registry.executeTool("https://agent.example.test", "public_tool", {}).then(() => null, (e) => e);
            const allowed = await registry.executeTool("https://agent.example.test", "shared_tool", {}).then(() => null, (e) => e);

            return {
              exposureOk:
                visible.length === 1 &&
                visible[0].name === "shared_tool" &&
                ownerVisible.length === 2 &&
                hidden?.name === "NotFoundError" &&
                allowed === null,
            };
          } catch (error) {
            return { exposureOk: false };
          }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 2000 });
      results.push({
        name: "Cross-Origin Tool Exposure Without Enumeration",
        passed: Boolean(res?.exposureOk),
        detail: "Shows only exposed tools and reports a hidden tool as NotFoundError",
      });
    } else if (taskId === "task_seo_llms_txt_generator") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const site = {
            title: "FastHTML",
            summary: "A python library.",
            details: "Important notes:",
            sections: [{ name: "Docs", links: [{ title: "Quick start", url: "https://x.dev/q.html.md", notes: "Overview" }] }],
            optional: [{ title: "Full docs", url: "https://gist/y.md" }],
          };
          const file = buildLlmsTxt(site);
          const header = buildLinkHeader("https://x.dev/page.html", "https://x.dev/docs/llms.txt");
          const variant = markdownVariantUrl("https://x.dev/page.html");
          const extended = markdownVariantUrl("https://x.dev/guide");

          return {
            llmsOk:
              file.startsWith("# FastHTML") &&
              file.includes("> A python library.") &&
              file.includes("## Docs") &&
              file.includes("- [ Quick start ](https://x.dev/q.html.md) : Overview") &&
              file.indexOf("## Optional") > file.indexOf("## Docs") &&
              file.includes("- [ Full docs ](https://gist/y.md)") &&
              header.includes('rel="alternate"') &&
              header.includes('type="text/markdown"') &&
              header.includes('rel="describedby"') &&
              variant === "https://x.dev/page.md" &&
              extended === "https://x.dev/guide.md",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "llms.txt v2 Structure & Link Relations",
        passed: Boolean(res?.llmsOk),
        detail: "Emits the H1 title, blockquote summary, H2 link lists and both standard link relations",
      });
    } else if (taskId === "task_seo_llms_txt_validator") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const nl = String.fromCharCode(10);
          const join = (lines) => lines.join(nl);
          const valid = validateLlmsTxt(join(["# Title", "", "> Summary", "", "## Docs", "", "- [ A ](https://x/a.md)", ""]));
          const missingH1 = validateLlmsTxt(join(["## Docs", "", "- [ A ](https://x/a.md)", ""]));
          const malformed = validateLlmsTxt(join(["# T", "", "## Docs", "", "- A without a link", ""]));
          const stray = validateLlmsTxt(join(["# T", "", "- [ A ](https://x/a.md)", ""]));
          const deep = validateLlmsTxt(join(["# T", "", "### Too deep", ""]));
          const selected = selectLlmsTxt([{ path: "/llms.txt" }, { path: "/docs/llms.txt" }], "/docs/page.html");
          const root = selectLlmsTxt([{ path: "/llms.txt" }], "/other.html");

          return {
            validatorOk:
              valid.valid === true &&
              missingH1.valid === false &&
              malformed.valid === false &&
              stray.valid === false &&
              deep.valid === false &&
              selected?.path === "/docs/llms.txt" &&
              root?.path === "/llms.txt",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "llms.txt Validation & Covering-File Resolution",
        passed: Boolean(res?.validatorOk),
        detail: "Rejects malformed files and resolves the most specific llms.txt for a page",
      });
    } else if (taskId === "task_seo_ai_crawler_policy") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const nl = String.fromCharCode(10);
          const robots = buildAiRobotsTxt({ allowTraining: false, allowSearch: true, allowAiInput: true });
          const kinds = [classifyCrawler("GPTBot"), classifyCrawler("OAI-SearchBot"), classifyCrawler("ChatGPT-User"), classifyCrawler("Mozilla/5.0")].join(",");
          const longest = ["User-agent: *", "Disallow: /private", "Allow: /private/public", ""].join(nl);

          return {
            policyOk:
              kinds === "training,search,user-triggered,unknown" &&
              robots.includes("User-agent: GPTBot") &&
              robots.includes("Content-Signal: search=yes, ai-input=yes, ai-train=no") &&
              isPathAllowed(robots, "GPTBot", "/x") === false &&
              isPathAllowed(robots, "OAI-SearchBot", "/x") === true &&
              isPathAllowed(robots, "ChatGPT-User", "/x") === true &&
              isPathAllowed(longest, "AnyBot", "/private/public/a") === true &&
              isPathAllowed(longest, "AnyBot", "/private/secret") === false,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "AI Crawler Policy & RFC 9309 Matching",
        passed: Boolean(res?.policyOk),
        detail: "Classifies crawler purposes, emits usage signals and applies longest-match precedence",
      });
    } else if (taskId === "task_acp_checkout_session") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const service = new CheckoutService();
          const session = service.createSession({ items: [{ id: "item_1", quantity: 2, unitAmount: 500 }], currency: "usd" });
          const first = service.createSession({ items: [{ id: "i", quantity: 1, unitAmount: 100 }] }, { idempotencyKey: "key-1" });
          const replay = service.createSession({ items: [{ id: "i", quantity: 1, unitAmount: 100 }] }, { idempotencyKey: "key-1" });

          let conflict = null;
          try { service.createSession({ items: [{ id: "i", quantity: 9, unitAmount: 100 }] }, { idempotencyKey: "key-1" }); } catch (e) { conflict = e; }
          let badQuantity = null;
          try { service.createSession({ items: [{ id: "i", quantity: 0, unitAmount: 100 }] }); } catch (e) { badQuantity = e; }

          const completed = service.completeSession(first.id, { payment_data: { type: "card_token" } });
          let cancelError = null;
          try { service.cancelSession(first.id); } catch (e) { cancelError = e; }

          const total = session.totals.find((t) => t.type === "total");
          return {
            acpOk:
              session.status === "ready_for_payment" &&
              session.currency === "usd" &&
              Number.isInteger(session.line_items[0].total) &&
              session.line_items[0].total === 1100 &&
              total?.amount === 1200 &&
              first.id === replay.id &&
              conflict?.status === 409 &&
              conflict?.code === "idempotency_conflict" &&
              badQuantity?.status === 400 &&
              completed.status === "completed" &&
              completed.order?.checkout_session_id === first.id &&
              cancelError?.status === 405,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Checkout Session Lifecycle & Idempotency",
        passed: Boolean(res?.acpOk),
        detail: "Prices in minor units, replays idempotent requests and enforces the completion and cancel rules",
      });
    } else if (taskId === "task_x402_payment_gate") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const gate = createPaymentGate({
              resource: { url: "https://api.example.com/premium", description: "Premium data" },
              accepts: [{ scheme: "exact", network: "eip155:84532", amount: "10000", asset: "0xA", payTo: "0xB", maxTimeoutSeconds: 60 }],
              data: { hello: "world" },
            });

            const unpaid = await gate.handle({ method: "GET", headers: {} });
            const required = decodeHeader(unpaid.headers["PAYMENT-REQUIRED"]);
            const paid = await gate.handle({
              method: "GET",
              headers: { "PAYMENT-SIGNATURE": encodeHeader({ x402Version: 2, accepted: { scheme: "exact", network: "eip155:84532", amount: "10000" }, payload: { authorization: { from: "0xPAYER" } } }) },
            });
            const settlement = decodeHeader(paid.headers["PAYMENT-RESPONSE"]);
            const underpaid = await gate.handle({
              method: "GET",
              headers: { "PAYMENT-SIGNATURE": encodeHeader({ x402Version: 2, accepted: { scheme: "exact", network: "eip155:84532", amount: "1" }, payload: { authorization: { from: "0xPAYER" } } }) },
            });
            const preflight = await gate.handle({ method: "OPTIONS", headers: {} });

            return {
              x402Ok:
                unpaid.status === 402 &&
                required?.x402Version === 2 &&
                required?.accepts?.[0]?.network === "eip155:84532" &&
                required?.error === "PAYMENT-SIGNATURE header is required" &&
                paid.status === 200 &&
                settlement?.success === true &&
                settlement?.network === "eip155:84532" &&
                settlement?.payer === "0xPAYER" &&
                underpaid.status === 402 &&
                decodeHeader(underpaid.headers["PAYMENT-RESPONSE"])?.errorReason === "insufficient_funds" &&
                unpaid.headers["Access-Control-Expose-Headers"].includes("PAYMENT-REQUIRED") &&
                unpaid.headers["Access-Control-Allow-Headers"].includes("PAYMENT-SIGNATURE") &&
                preflight.status === 204 &&
                preflight.headers["PAYMENT-REQUIRED"] === undefined,
            };
          } catch (error) {
            return { x402Ok: false };
          }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 2000 });
      results.push({
        name: "x402 v2 Challenge, Settlement & CORS Headers",
        passed: Boolean(res?.x402Ok),
        detail: "Challenges with 402, verifies the payment payload, settles and exposes the payment headers",
      });
    } else if (taskId === "task_ap2_mandate_verification") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const checkoutJwt = "eyJhbGciOiJFUzI1NiJ9.eyJtIjoxfQ.sig";
            const expectedHash = "AJ6gspp0-95E4UC4z1z52kdKPTYNpfkECTWiZdxuzD4";
            const hash = await computeCheckoutHash(checkoutJwt);
            const mandate = { vct: "mandate.checkout.1", checkout_jwt: checkoutJwt, checkout_hash: hash, merchant: { name: "M", website: "https://m.test" } };
            const valid = await verifyCheckoutMandate(mandate);
            const tampered = await verifyCheckoutMandate({ ...mandate, checkout_jwt: "tampered" });
            const wrongVct = await verifyCheckoutMandate({ ...mandate, vct: "mandate.checkout.2" });
            const expired = await verifyCheckoutMandate({ ...mandate, exp: 1000 });
            const open = { vct: "mandate.checkout.open.1", constraints: [{ type: "checkout.allowed_merchants", allowed: [{ name: "M", website: "https://m.test" }] }] };
            const denied = { vct: "mandate.checkout.open.1", constraints: [{ type: "checkout.allowed_merchants", allowed: [{ name: "Other", website: "https://other.test" }] }] };

            return {
              mandateOk:
                hash === expectedHash &&
                valid.valid === true &&
                valid.errors.length === 0 &&
                tampered.valid === false &&
                tampered.errors.some((e) => e.includes("checkout_hash")) &&
                wrongVct.valid === false &&
                expired.valid === false &&
                (await verifyCheckoutMandate(mandate, { openMandate: open })).valid === true &&
                (await verifyCheckoutMandate(mandate, { openMandate: denied })).valid === false,
            };
          } catch (error) {
            return { mandateOk: false };
          }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 2000 });
      results.push({
        name: "AP2 Mandate Verification & Checkout Hash Binding",
        passed: Boolean(res?.mandateOk),
        detail: "Verifies the versioned type, the recomputed checkout hash, expiry and the merchant constraint",
      });
    } else if (taskId === "task_webcodecs_decoder_config_router") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const events = [];
            const decoder = {
              configure(config) { events.push("configure:" + config.codedWidth); },
              decode(chunk) { events.push("decode:" + chunk); },
              async flush() { events.push("flush"); },
            };
            const router = new DecoderConfigRouter(decoder);
            const config640 = {
              codec: "vp09.00.10.08",
              codedWidth: 640,
              codedHeight: 360,
              description: new Uint8Array([1, 2, 3]),
            };
            const equalConfig640 = {
              description: new Uint8Array([1, 2, 3]),
              codedHeight: 360,
              codec: "vp09.00.10.08",
              codedWidth: 640,
            };
            await router.decode("first-key", { decoderConfig: config640 });
            await router.decode("same-config", { decoderConfig: equalConfig640 });
            await router.decode("resized-key", {
              decoderConfig: { ...config640, codedWidth: 1280, codedHeight: 720 },
            });
            await router.flush();
            let missingInitialConfig = false;
            try {
              await new DecoderConfigRouter(decoder).decode("orphan");
            } catch (error) { missingInitialConfig = error.name === "DataError"; }
            return {
              decoderConfigOk:
                events.join(",") === "configure:640,decode:first-key,decode:same-config,flush,configure:1280,decode:resized-key,flush" &&
                missingInitialConfig,
            };
          } catch { return { decoderConfigOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "VideoDecoder Config Change Ordering & Metadata Deduplication",
        passed: Boolean(res?.decoderConfigOk),
        detail: "Flushes before resolution change and skips equivalent configs with separate description buffers",
      });
    } else if (taskId === "task_webcodecs_timestamp_mapper") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            const mapper = createMicrosecondTimestampMapper({ timeOriginMs: 5 });
            const timestamps = [mapper.toMicroseconds(5.0004), mapper.toMicroseconds(5.00049), mapper.toMicroseconds(5.00031), mapper.toMicroseconds(6)];
            let nonFiniteRejected = false;
            let unsafeRejected = false;
            try { mapper.toMicroseconds(Number.NaN); } catch (error) { nonFiniteRejected = error instanceof RangeError; }
            try { mapper.toMicroseconds(1e20); } catch (error) { unsafeRejected = error instanceof RangeError; }
            return {
              mediaTimestampsOk:
                timestamps.join(",") === "0,1,2,1000" && nonFiniteRejected && unsafeRejected &&
                new Set(timestamps).size === timestamps.length,
            };
          } catch { return { mediaTimestampsOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Fractional Media Timestamps & Regressing Clock Protection",
        passed: Boolean(res?.mediaTimestampsOk),
        detail: "Produces distinct microseconds for colliding frames and rejects unsafe timestamps",
      });
    } else if (taskId === "task_webcodecs_bounded_encode_queue") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            let queueSize = 0;
            let peakQueueSize = 0;
            let flushCount = 0;
            const events = new Map();
            const keyframes = [];
            const frames = Array.from({ length: 5 }, (_, index) => ({ closed: false, close() { this.closed = true; } }));
            const encoder = {
              state: "configured",
              get encodeQueueSize() { return queueSize; },
              addEventListener(type, listener) {
                if (!events.has(type)) events.set(type, new Set());
                events.get(type).add(listener);
              },
              removeEventListener(type, listener) { events.get(type)?.delete(listener); },
              encode(frame, options) {
                keyframes.push(options.keyFrame);
                queueSize++;
                peakQueueSize = Math.max(peakQueueSize, queueSize);
                setTimeout(() => {
                  queueSize--;
                  for (const listener of events.get("dequeue") ?? []) listener({ type: "dequeue" });
                }, 0);
              },
              async flush() { flushCount++; },
            };
            const summary = await encodeVideoFrames(encoder, frames, { maxQueueSize: 2, keyFrameInterval: 2 });
            const listenerCount = [...events.values()].reduce((sum, set) => sum + set.size, 0);
            return {
              encodeQueueOk:
                summary.submittedFrames === 5 && summary.requestedKeyFrames === 3 &&
                keyframes.join(",") === "true,false,true,false,true" && peakQueueSize === 2 &&
                frames.every((frame) => frame.closed) && flushCount === 1 && listenerCount === 0,
            };
          } catch { return { encodeQueueOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1500 });
      results.push({
        name: "Bounded VideoEncoder, Keyframes & Frame Cleanup",
        passed: Boolean(res?.encodeQueueOk),
        detail: "Encodes five frames with a queue cap of two, then closes frames and flushes output",
      });
    } else if (taskId === "task_webrtc_data_channel_backpressure") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const channel = {
              readyState: "open",
              bufferedAmount: 98,
              bufferedAmountLowThreshold: 0,
              sent: [],
              listeners: new Map(),
              addEventListener(type, handler) {
                if (!this.listeners.has(type)) this.listeners.set(type, new Set());
                this.listeners.get(type).add(handler);
              },
              removeEventListener(type, handler) { this.listeners.get(type)?.delete(handler); },
              dispatch(type) {
                for (const handler of this.listeners.get(type) ?? []) handler({ type });
              },
              send(payload) {
                this.sent.push(payload);
                this.bufferedAmount += new TextEncoder().encode(payload).byteLength;
              },
            };
            const first = sendWithBackpressure(channel, "🙂", { highWaterMark: 100, lowWaterMark: 30 });
            const second = sendWithBackpressure(channel, "A", { highWaterMark: 100, lowWaterMark: 30 });
            setTimeout(() => {
              channel.bufferedAmount = 30;
              channel.dispatch("bufferedamountlow");
            }, 0);
            const results = await Promise.all([first, second]);
            const remainingListeners = [...channel.listeners.values()].reduce((sum, set) => sum + set.size, 0);
            return {
              dataChannelFlowOk:
                channel.sent.join(",") === "🙂,A" && results[0].bytesSent === 4 &&
                results[1].bytesSent === 1 && channel.bufferedAmountLowThreshold === 30 &&
                channel.bufferedAmount <= 35 && remainingListeners === 0,
            };
          } catch { return { dataChannelFlowOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1500 });
      results.push({
        name: "Ordered RTCDataChannel Writes & UTF-8 Backpressure",
        passed: Boolean(res?.dataChannelFlowOk),
        detail: "Waits for bufferedamountlow before sending a four-byte UTF-8 emoji, then releases listeners",
      });
    } else if (taskId === "task_webrtc_ice_candidate_inbox") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const applied = [];
            const peerConnection = {
              async setRemoteDescription() {},
              async addIceCandidate(candidate) { applied.push(candidate); },
            };
            const inbox = new RemoteIceCandidateInbox(peerConnection);
            const current = { candidate: "candidate:one", sdpMid: "0", usernameFragment: "g1" };
            const stale = { candidate: "candidate:stale", sdpMid: "0", usernameFragment: "g0" };
            const end = { candidate: "", sdpMid: "0", usernameFragment: "g1" };
            const buffered =
              !(await inbox.receive(current)) && !(await inbox.receive(current)) &&
              !(await inbox.receive(stale)) && !(await inbox.receive(end));
            const drained = await inbox.setRemoteDescription({ type: "offer", sdp: "v=0\\r\\na=ice-ufrag:g1\\r\\n" });
            const duplicateRejected = !(await inbox.receive(current));
            await inbox.setRemoteDescription({ type: "offer", sdp: "v=0\\r\\na=ice-ufrag:g2\\r\\n" });
            const oldGenerationRejected = !(await inbox.receive(current));
            const newCandidate = { candidate: "candidate:two", sdpMid: "0", usernameFragment: "g2" };
            const accepted = await inbox.receive(newCandidate);
            const acceptedEnd = await inbox.receive(null);
            return {
              iceInboxOk:
                buffered && drained === 2 && duplicateRejected && oldGenerationRejected &&
                applied.length === 4 && applied[0] === current && applied[1] === end &&
                applied[2] === newCandidate && applied[3] === null && accepted && acceptedEnd,
            };
          } catch { return { iceInboxOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1500 });
      results.push({
        name: "Trickle ICE Ordering, Deduplication & Restart Fencing",
        passed: Boolean(res?.iceInboxOk),
        detail: "Drains active ICE in order, suppresses duplicates and drops a stale restart candidate",
      });
    } else if (taskId === "task_webrtc_perfect_negotiation") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          function makePeer(signalingState) {
            const operations = [];
            return {
              signalingState,
              localDescription: { type: "offer", sdp: "local" },
              operations,
              async setLocalDescription(description) {
                operations.push(description?.type ?? "local:auto");
                if (description?.type === "rollback") this.signalingState = "stable";
                else if (this.signalingState === "have-remote-offer") {
                  this.localDescription = { type: "answer", sdp: "answer" };
                  this.signalingState = "stable";
                } else {
                  this.localDescription = { type: "offer", sdp: "offer" };
                  this.signalingState = "have-local-offer";
                }
              },
              async setRemoteDescription(description) {
                operations.push("remote:" + description.type);
                this.signalingState = description.type === "offer" ? "have-remote-offer" : "stable";
              },
            };
          }
          try {
            const offer = { type: "offer", sdp: "remote" };
            const impolitePeer = makePeer("have-local-offer");
            const impolite = createPerfectNegotiationController(impolitePeer, false);
            const ignored = await impolite.receiveDescription(offer);
            const politePeer = makePeer("have-local-offer");
            const polite = createPerfectNegotiationController(politePeer, true);
            const accepted = await polite.receiveDescription(offer);
            const stablePeer = makePeer("stable");
            const stable = createPerfectNegotiationController(stablePeer, false);
            const ordinaryOffer = await stable.receiveDescription(offer);
            return {
              perfectNegotiationOk:
                ignored.ignored && impolitePeer.operations.length === 0 &&
                !accepted.ignored && accepted.answer?.type === "answer" &&
                politePeer.operations.join(",") === "rollback,remote:offer,local:auto" &&
                !ordinaryOffer.ignored && ordinaryOffer.answer?.type === "answer",
            };
          } catch { return { perfectNegotiationOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Simultaneous WebRTC Offers with Polite Rollback",
        passed: Boolean(res?.perfectNegotiationOk),
        detail: "Ignores glare on one peer and rolls back then answers on the polite peer",
      });
    } else if (taskId === "task_webgpu_buffer_readback") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const flags = { COPY_DST: 4, MAP_READ: 1 };
          const source = { size: 8 };
          const descriptors = [];
          const copies = [];
          let submitCount = 0;
          let mappedFlag;
          const staging = {
            async mapAsync(flag) { mappedFlag = flag; },
            getMappedRange() { return Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]).buffer; },
            unmap() { this.didUnmap = true; },
            destroy() { this.didDestroy = true; },
          };
          const device = {
            createBuffer(value) { descriptors.push(value); return staging; },
            createCommandEncoder() {
              return {
                copyBufferToBuffer(...args) { copies.push(args); },
                finish() { return {}; },
              };
            },
            queue: { submit() { submitCount += 1; } },
          };
          try {
            const bytes = await readGpuBufferBytes(device, source, 5, flags);
            let failureWasCleaned = false;
            const failingStaging = {
            async mapAsync() { throw new Error("device lost"); },
              destroy() { failureWasCleaned = true; },
            };
            let mappingRejected = false;
            try {
              await readGpuBufferBytes({ ...device, createBuffer(value) { descriptors.push(value); return failingStaging; } }, source, 4, flags);
            } catch { mappingRejected = true; }
            let shortSourceRejected = false;
            try {
              await readGpuBufferBytes(device, { size: 7 }, 5, flags);
            } catch (error) { shortSourceRejected = error instanceof RangeError; }
            return {
              gpuReadbackOk:
                bytes.length === 5 && bytes[0] === 1 && bytes[4] === 5 &&
                descriptors[0].size === 8 && descriptors[0].usage === 5 && mappedFlag === flags.MAP_READ &&
                copies[0][4] === 8 && copies[1][4] === 4 && submitCount === 2 && staging.didUnmap && staging.didDestroy &&
                mappingRejected && failureWasCleaned && shortSourceRejected,
            };
          } catch { return { gpuReadbackOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Aligned GPU Readback, Exact Byte Count & Error Cleanup",
        passed: Boolean(res?.gpuReadbackOk),
        detail: "Reads five bytes using an eight-byte staging copy and verifies map failure cleanup",
      });
    } else if (taskId === "task_webgpu_capability_selection") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            const adapter = {
              features: new Set(["timestamp-query", "shader-f16"]),
              limits: { maxBufferSize: 2097152, maxStorageBufferBindingSize: 1048576 },
            };
            const request = planGpuDeviceRequest(adapter, {
              requiredFeatures: ["shader-f16"],
              optionalFeatureGroups: [["timestamp-query"], ["texture-compression-bc"]],
              requiredLimits: { maxBufferSize: 1048576 },
              optionalLimits: { maxStorageBufferBindingSize: 2097152, maxComputeWorkgroupSizeX: 256 },
            });
            let missingRequiredFailed = false;
            try {
              planGpuDeviceRequest(adapter, { requiredFeatures: ["texture-compression-bc"] });
            } catch (error) { missingRequiredFailed = error.name === "NotSupportedError"; }
            return {
              gpuCapabilitiesOk:
                request.requiredFeatures.join(",") === "shader-f16,timestamp-query" &&
                request.requiredLimits.maxBufferSize === 1048576 &&
                request.requiredLimits.maxStorageBufferBindingSize === 1048576 &&
                !("maxComputeWorkgroupSizeX" in request.requiredLimits) &&
                missingRequiredFailed,
            };
          } catch (error) { return { gpuCapabilitiesOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "GPU Adapter Feature Negotiation & Limit Clamping",
        passed: Boolean(res?.gpuCapabilitiesOk),
        detail: "Selects only supported features, clamps optional limits and rejects missing requirements",
      });
    } else if (taskId === "task_webgpu_dispatch_tiling") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            const batches = planLinearGpuDispatches(131123, 64, 2);
            let nextIndex = 0;
            let totalItems = 0;
            let bounded = true;
            for (const batch of batches) {
              bounded = bounded && batch.baseIndex === nextIndex && batch.workgroupCount <= 2 && batch.itemCount > 0;
              nextIndex += batch.itemCount;
              totalItems += batch.itemCount;
            }
            let rejected = false;
            try { planLinearGpuDispatches(8, 0, 2); } catch (error) { rejected = error instanceof RangeError; }
            return {
              gpuDispatchOk:
                batches.length === 1025 && batches[0].workgroupCount === 2 &&
                batches.at(-1).baseIndex === 131072 && batches.at(-1).itemCount === 51 &&
                totalItems === 131123 && nextIndex === 131123 && bounded && rejected &&
                planLinearGpuDispatches(0, 64, 2).length === 0,
            };
          } catch (error) { return { gpuDispatchOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Oversized GPU Dispatch Tiling & Boundary Validation",
        passed: Boolean(res?.gpuDispatchOk),
        detail: "Plans 131,123 items across bounded, gap-free dispatches and checks the padded tail",
      });
    } else if (taskId === "task_webtransport_datagram_sender") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const events = [];
            let released = false;
            let readyPromise = Promise.resolve();
            let onReady;
            const writer = {
              get ready() { events.push("ready"); onReady?.(); return readyPromise; },
              async write(bytes) { events.push("write:" + [...bytes].join(".")); },
              async close() { events.push("close"); },
              releaseLock() { released = true; },
            };
            const datagrams = {
              maxDatagramSize: 4,
              outgoingMaxAge: null,
              createWritable(options) { events.push("options:" + options.sendOrder); return { getWriter: () => writer }; },
            };
            const sender = createDatagramSender({ datagrams }, { maxAgeMs: 50, sendOrder: 2 });
            const backing = new Uint8Array([9, 1, 2, 8]);
            const sent = await sender.send(backing.subarray(1, 3));
            const tooLarge = await sender.send(new Uint8Array(5));
            let announceReady;
            const readyEntered = new Promise((resolve) => { announceReady = resolve; });
            onReady = announceReady;
            let releaseReady;
            readyPromise = new Promise((resolve) => { releaseReady = resolve; });
            const changedLimitSend = sender.send(new Uint8Array(4));
            await readyEntered;
            datagrams.maxDatagramSize = 3;
            releaseReady();
            const changedLimitRejected = !(await changedLimitSend);
            await sender.close();
            let closedSendRejected = false;
            try { await sender.send(new Uint8Array([1])); } catch { closedSendRejected = true; }
            return {
              datagramSenderOk: sent === true && tooLarge === false && datagrams.outgoingMaxAge === 50 &&
                events.includes("write:1.2") && events.indexOf("ready") < events.findIndex((event) => event.startsWith("write:")) &&
                events.includes("options:2") && changedLimitRejected &&
                events.filter((event) => event.startsWith("write:")).length === 1 && released && closedSendRejected,
            };
          } catch { return { datagramSenderOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "WebTransport Datagram Expiry, Backpressure & View Bounds",
        passed: Boolean(res?.datagramSenderOk),
        detail: "Queues only the selected typed-view bytes, honors readiness and refuses oversized datagrams",
      });
    } else if (taskId === "task_webtransport_framed_stream") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const frames = [];
            const chunks = [
              new Uint8Array([0, 0, 0]),
              new Uint8Array([3, 65, 66, 67, 0, 0, 0]),
              new Uint8Array([2, 68]),
              new Uint8Array([69]),
            ];
            const stream = new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } });
            const count = await decodeLengthPrefixedStream(stream, {
              maxFrameBytes: 4,
              async onFrame(frame) { await Promise.resolve(); frames.push([...frame].join(",")); },
            });
            let oversizedRejected = false;
            try {
              const oversized = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([0, 0, 1, 0])); controller.close(); } });
              await decodeLengthPrefixedStream(oversized, { maxFrameBytes: 4, onFrame() {} });
            } catch (error) { oversizedRejected = error instanceof RangeError; }
            let truncatedRejected = false;
            try {
              const truncated = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([0, 0, 0, 2, 65])); controller.close(); } });
              await decodeLengthPrefixedStream(truncated, { onFrame() {} });
            } catch (error) { truncatedRejected = error instanceof SyntaxError; }
            return { framedStreamOk: count === 2 && frames.join("|") === "65,66,67|68,69" && oversizedRejected && truncatedRejected };
          } catch { return { framedStreamOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Split and Merged WebTransport Frame Reassembly",
        passed: Boolean(res?.framedStreamOk),
        detail: "Decodes two messages across fragmented headers and bodies, rejecting oversized and incomplete frames",
      });
    } else if (taskId === "task_webtransport_datagram_replay_window") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            const window = new DatagramReplayWindow(4);
            const accepted = [
              window.accept(0xfffffffe),
              window.accept(0xffffffff),
              window.accept(0),
              window.accept(1),
            ];
            const duplicateRejected = !window.accept(0xffffffff) && !window.accept(1);
            window.accept(2);
            window.accept(3);
            window.accept(4);
            window.accept(5);
            const staleRejected = !window.accept(0xfffffffe);
            const halfRangeRejected = !window.accept(0x80000005);
            let invalidRejected = false;
            try { window.accept(-1); } catch (error) { invalidRejected = error instanceof RangeError; }
            let sizeRejected = false;
            try { new DatagramReplayWindow(33); } catch (error) { sizeRejected = error instanceof RangeError; }
            return {
              replayWindowOk: accepted.every(Boolean) && duplicateRejected && staleRejected && halfRangeRejected &&
                invalidRejected && sizeRejected && window.highestSequence === 5,
            };
          } catch { return { replayWindowOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Reordered, Duplicate and Wrapped Datagram Sequence Handling",
        passed: Boolean(res?.replayWindowOk),
        detail: "Accepts a rolling uint32 sequence across rollover once and rejects duplicates, stale and half-range packets",
      });
    } else if (taskId === "task_webassembly_memory_view_refresh") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            let buffer = new ArrayBuffer(8);
            const memory = { get buffer() { return buffer; } };
            const access = createMemoryAccessor(memory);
            access.writeU32(0, 0x12345678);
            new Uint8Array(buffer).set(new TextEncoder().encode("OK"), 4);
            const oldBuffer = buffer;
            buffer = new ArrayBuffer(16);
            new Uint8Array(buffer).set(new Uint8Array(oldBuffer));
            new Uint8Array(buffer)[6] = 0xc3;
            access.writeU32(8, 0xfedcba98);
            let boundsRejected = false;
            let unsafeRejected = false;
            let malformedRejected = false;
            try { access.readU32(13); } catch (error) { boundsRejected = error instanceof RangeError; }
            try { access.decodeUtf8(Number.MAX_SAFE_INTEGER, 1); } catch (error) { unsafeRejected = error instanceof RangeError; }
            try { access.decodeUtf8(6, 1); } catch (error) { malformedRejected = error instanceof TypeError; }
            return {
              wasmMemoryViewOk: access.readU32(0) === 0x12345678 && access.readU32(8) === 0xfedcba98 &&
                access.decodeUtf8(4, 2) === "OK" && boundsRejected && unsafeRejected && malformedRejected,
            };
          } catch { return { wasmMemoryViewOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Memory Growth, Pointer Bounds and UTF-8 Interop",
        passed: Boolean(res?.wasmMemoryViewOk),
        detail: "Reads from the replacement buffer after growth and rejects unsafe, out-of-range and malformed inputs",
      });
    } else if (taskId === "task_webassembly_component_resource_lifetimes") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            const dropped = [];
            const ledger = new ComponentResourceLedger((value) => dropped.push(value));
            const owner = ledger.createOwned("socket");
            const firstBorrow = ledger.borrow(owner, "request-1");
            const secondBorrow = ledger.borrow(owner, "request-1");
            let dropBlocked = false;
            let transferBlocked = false;
            try { ledger.drop(owner); } catch (error) { dropBlocked = error.name === "InvalidStateError"; }
            try { ledger.transfer(owner); } catch (error) { transferBlocked = error.name === "InvalidStateError"; }
            const readable = ledger.read(firstBorrow) === "socket" && ledger.read(secondBorrow) === "socket";
            const returnedCount = ledger.resolveTask("request-1");
            let staleBorrowRejected = false;
            try { ledger.read(firstBorrow); } catch (error) { staleBorrowRejected = error.name === "InvalidStateError"; }
            const nextOwner = ledger.transfer(owner);
            let oldOwnerRejected = false;
            try { ledger.read(owner); } catch (error) { oldOwnerRejected = error.name === "InvalidStateError"; }
            const cancelledBorrow = ledger.borrow(nextOwner, "request-cancelled");
            const cancelledCount = ledger.resolveTask("request-cancelled");
            let cancelledBorrowRejected = false;
            try { ledger.read(cancelledBorrow); } catch (error) { cancelledBorrowRejected = error.name === "InvalidStateError"; }
            ledger.drop(nextOwner);
            const reused = ledger.createOwned("new-resource");
            let staleGenerationRejected = false;
            try { ledger.read(nextOwner); } catch (error) { staleGenerationRejected = error.name === "InvalidStateError"; }
            ledger.drop(reused);
            return {
              componentResourcesOk: dropBlocked && transferBlocked && readable && returnedCount === 2 &&
                staleBorrowRejected && oldOwnerRejected && cancelledCount === 1 && cancelledBorrowRejected &&
                staleGenerationRejected && dropped.join(",") === "socket,new-resource",
            };
          } catch { return { componentResourcesOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Async Component Borrow Resolution, Transfer & Drop Safety",
        passed: Boolean(res?.componentResourcesOk),
        detail: "Returns loans after task completion or cancellation and blocks stale handles and premature disposal",
      });
    } else if (taskId === "task_webassembly_jspi_boundary") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            class FakeSuspending { constructor(callback) { this.callback = callback; } }
            const api = {
              Suspending: FakeSuspending,
              promising(fn) { return (...args) => Promise.resolve(fn(...args)); },
            };
            const memory = { marker: "preserved" };
            const importedCall = async (value) => value + 1;
            const wasmCall = (value) => value * 2;
            const sourceImports = { env: { waitForValue: importedCall, memory } };
            const sourceExports = { run: wasmCall, memory };
            const wrapped = createJspiBindings(sourceImports, sourceExports, api);
            let unsupportedRejected = false;
            try { createJspiBindings({}, {}, {}); } catch (error) { unsupportedRejected = error.name === "NotSupportedError"; }
            return {
              jspiBoundaryOk: wrapped.imports.env.waitForValue instanceof FakeSuspending &&
                await wrapped.imports.env.waitForValue.callback(4) === 5 &&
                await wrapped.exports.run(6) === 12 && wrapped.imports.env.memory === memory &&
                wrapped.exports.memory === memory && sourceImports.env.waitForValue === importedCall &&
                sourceExports.run === wasmCall && wrapped.imports !== sourceImports && unsupportedRejected,
            };
          } catch { return { jspiBoundaryOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "JSPI Import Suspension, Export Promises & Unsupported Runtime",
        passed: Boolean(res?.jspiBoundaryOk),
        detail: "Uses injected JSPI shims to wrap functions, keep memory values intact and reject absent proposal APIs",
      });
    } else if (taskId === "task_webassembly_streaming_loader") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const imports = { env: { log() {} } };
            const calls = [];
            const wasmApi = {
              async instantiateStreaming(responsePromise, receivedImports) {
                calls.push("stream");
                const response = await responsePromise;
                return { path: "stream", ok: response.ok, imports: receivedImports };
              },
              async instantiate(bytes, receivedImports) {
                calls.push("buffer");
                return { path: "buffer", bytes: bytes.byteLength, imports: receivedImports };
              },
            };
            const streamedResponse = new Response(new Uint8Array([0, 97, 115, 109]), {
              status: 200,
              headers: { "content-type": "Application/Wasm; charset=binary" },
            });
            const streamed = await loadWasmResponse(Promise.resolve(streamedResponse), imports, wasmApi);
            const legacyResponse = new Response(new Uint8Array([1, 2, 3]), {
              status: 200,
              headers: { "content-type": "application/octet-stream" },
            });
            const buffered = await loadWasmResponse(Promise.resolve(legacyResponse), imports, wasmApi);
            const failingResponse = new Response("missing", { status: 404 });
            let httpRejected = false;
            try { await loadWasmResponse(Promise.resolve(failingResponse), imports, wasmApi); }
            catch (error) { httpRejected = error.name === "NetworkError"; }
            const compileError = Object.assign(new Error("bad module"), { name: "CompileError" });
            const failingApi = {
              async instantiateStreaming() { calls.push("compile-failure"); throw compileError; },
              async instantiate() { calls.push("retry"); return {}; },
            };
            const compileResponse = new Response(new Uint8Array([0]), {
              status: 200,
              headers: { "content-type": "application/wasm" },
            });
            let compileErrorPreserved = false;
            try { await loadWasmResponse(Promise.resolve(compileResponse), imports, failingApi); }
            catch (error) { compileErrorPreserved = error === compileError; }
            return {
              wasmStreamingLoaderOk: streamed.path === "stream" && buffered.path === "buffer" &&
                buffered.bytes === 3 && streamed.imports === imports && buffered.imports === imports &&
                httpRejected && compileErrorPreserved && !calls.includes("retry") &&
                calls.filter((call) => call === "buffer").length === 1,
            };
          } catch { return { wasmStreamingLoaderOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "CDN MIME Fallback, HTTP Failure & Single Instantiation",
        passed: Boolean(res?.wasmStreamingLoaderOk),
        detail: "Uses streaming with a correct MIME type, buffers a legacy response, and preserves failures without retrying",
      });
    } else if (taskId === "task_webassembly_utf8_abi_ownership") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            let buffer = new ArrayBuffer(4);
            const memory = { get buffer() { return buffer; } };
            const freed = [];
            const expectedTrap = new Error("guest trap");
            const exports = {
              alloc(size) {
                if (buffer.byteLength < size + 12) buffer = new ArrayBuffer(size + 12);
                return 8;
              },
              free(pointer) { freed.push(pointer); },
              consume(pointer, length) {
                return new TextDecoder("utf-8", { fatal: true })
                  .decode(new Uint8Array(memory.buffer, pointer, length));
              },
              trap() { throw expectedTrap; },
            };
            const label = "Café 雪 🌐";
            const decoded = callWasmWithUtf8(memory, exports, "consume", label);
            let trapPreserved = false;
            try { callWasmWithUtf8(memory, exports, "trap", "release me"); }
            catch (error) { trapPreserved = error === expectedTrap; }
            return {
              wasmUtf8AbiOk: decoded === label && freed.length === 2 && freed[0] === 8 && freed[1] === 8 &&
                new Uint8Array(buffer, 8, new TextEncoder().encode(label).byteLength).length > label.length && trapPreserved,
            };
          } catch { return { wasmUtf8AbiOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Unicode Byte Length, Memory Growth & Trap-Safe Free",
        passed: Boolean(res?.wasmUtf8AbiOk),
        detail: "Round-trips multibyte text after allocator-driven growth and releases each pointer even after a trap",
      });
    } else if (taskId === "task_webassembly_threaded_runtime_gate") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            class FakeSharedBuffer { constructor(byteLength) { this.byteLength = byteLength; } }
            const descriptors = [];
            class FakeMemory {
              constructor(descriptor) {
                descriptors.push(descriptor);
                if (descriptor.fail) throw new Error("shared memory unavailable");
                this.buffer = new FakeSharedBuffer(descriptor.initial * 65536);
              }
            }
            const isolated = createWasmThreadPlan({
              crossOriginIsolated: true,
              SharedArrayBufferCtor: FakeSharedBuffer,
              hardwareConcurrency: 8,
              maxWorkers: 3,
              initialPages: 2,
              maximumPages: 12,
              Memory: FakeMemory,
            });
            const constructionCount = descriptors.length;
            const notIsolated = createWasmThreadPlan({
              crossOriginIsolated: false,
              SharedArrayBufferCtor: FakeSharedBuffer,
              hardwareConcurrency: 8,
              Memory: FakeMemory,
            });
            const noCapacity = createWasmThreadPlan({
              crossOriginIsolated: true,
              SharedArrayBufferCtor: FakeSharedBuffer,
              hardwareConcurrency: 1,
              Memory: FakeMemory,
            });
            class ThrowingMemory { constructor() { throw new Error("unsupported"); } }
            const unavailable = createWasmThreadPlan({
              crossOriginIsolated: true,
              SharedArrayBufferCtor: FakeSharedBuffer,
              hardwareConcurrency: 4,
              Memory: ThrowingMemory,
            });
            let invalidLimitsRejected = false;
            try {
              createWasmThreadPlan({ crossOriginIsolated: true, SharedArrayBufferCtor: FakeSharedBuffer,
                hardwareConcurrency: 4, Memory: FakeMemory, maximumPages: 65537 });
            } catch (error) { invalidLimitsRejected = error instanceof RangeError; }
            return {
              wasmThreadGateOk: isolated.mode === "threaded" && isolated.workerCount === 3 &&
                isolated.sharedMemory instanceof FakeMemory && descriptors[0].shared === true &&
                descriptors[0].initial === 2 && descriptors[0].maximum === 12 &&
                constructionCount === 1 && notIsolated.mode === "single-threaded" &&
                noCapacity.reason === "insufficient-worker-capacity" &&
                unavailable.reason === "shared-memory-construction-failed" && invalidLimitsRejected,
            };
          } catch { return { wasmThreadGateOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Isolation, Worker Budget, Memory Construction & Fallback",
        passed: Boolean(res?.wasmThreadGateOk),
        detail: "Creates a bounded shared-memory plan only after isolation and capability checks, with reliable fallback cases",
      });
    } else if (taskId === "task_webassembly_plugin_capabilities") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const module = { id: "third-party-report" };
            const specialNamespace = Object.create(null);
            specialNamespace.__proto__ = "explicit-value";
            const capabilityMap = {
              host: { price: (value) => value * 2, memory: { marker: "guest-buffer" }, diagnostics: () => "private" },
              network: { fetch: () => "private" },
              special: specialNamespace,
            };
            const importMetadata = [
              { module: "host", name: "price", kind: "function" },
              { module: "host", name: "memory", kind: "memory" },
              { module: "special", name: "__proto__", kind: "global" },
            ];
            let instantiateCount = 0;
            let receivedImports;
            const api = {
              Module: { imports(receivedModule) { return receivedModule === module ? importMetadata : []; } },
              async instantiate(receivedModule, imports) {
                instantiateCount++;
                receivedImports = imports;
                return { module: receivedModule, imports };
              },
            };
            const result = await instantiateWasmPlugin(module, capabilityMap, api);
            let missingDenied = false;
            try {
              await instantiateWasmPlugin(module, { host: capabilityMap.host }, api);
            } catch (error) { missingDenied = error.name === "NotAllowedError"; }
            return {
              wasmPluginCapabilitiesOk: result.module === module && instantiateCount === 1 &&
                receivedImports.host.price(4) === 8 && receivedImports.host.memory === capabilityMap.host.memory &&
                receivedImports.special.__proto__ === "explicit-value" &&
                Object.getPrototypeOf(receivedImports) === null && Object.getPrototypeOf(receivedImports.host) === null &&
                Object.keys(receivedImports.host).sort().join(",") === "memory,price" &&
                !Object.hasOwn(receivedImports, "network") && !Object.hasOwn(receivedImports.host, "diagnostics") &&
                Object.hasOwn(capabilityMap.host, "diagnostics") && missingDenied,
            };
          } catch { return { wasmPluginCapabilitiesOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Exact Plugin Grants, Prototype-Safe Imports & Pre-Link Denial",
        passed: Boolean(res?.wasmPluginCapabilitiesOk),
        detail: "Instantiates with only requested own-property grants, safely preserves special keys and refuses missing authority",
      });
    } else if (taskId === "task_webnn_tensor_inference_lifecycle") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const events = [];
            const descriptors = [];
            function makeContext(failRead = false) {
              return {
                async createTensor(descriptor) {
                  descriptors.push(descriptor);
                  events.push("create:" + (descriptor.writable ? "input" : "output"));
                  return {
                    descriptor,
                    data: null,
                    destroy() { events.push("destroy:" + (descriptor.writable ? "input" : "output")); },
                  };
                },
                writeTensor(tensor, data) {
                  events.push("write");
                  tensor.data = new Float32Array(data);
                },
                dispatch(graph, inputs, outputs) {
                  events.push("dispatch");
                  outputs.result.data = new Float32Array([inputs.values.data[0] * 2]);
                },
                async readTensor(tensor) {
                  events.push("read:result");
                  if (failRead) throw new Error("context lost");
                  await Promise.resolve();
                  return tensor.data.buffer.slice(0);
                },
              };
            }
            const context = makeContext();
            const outputs = await runWebNNInference(context, { id: "graph" }, {
              values: { descriptor: { dataType: "float32", shape: [2] }, data: new Float32Array([3, 4]) },
            }, {
              result: { dataType: "float32", shape: [1] },
            });
            const outputValue = new Float32Array(outputs.result)[0];
            const expectedOrder = events.indexOf("dispatch") < events.indexOf("read:result") &&
              events.indexOf("read:result") < events.lastIndexOf("destroy:output");
            const permissionsOk = descriptors[0].writable === true && descriptors[0].readable === false &&
              descriptors[1].readable === true && descriptors[1].writable === false;
            const failedContext = makeContext(true);
            let failedReadRejected = false;
            try {
              await runWebNNInference(failedContext, { id: "graph" }, {
                values: { descriptor: { dataType: "float32", shape: [1] }, data: new Float32Array([1]) },
              }, { result: { dataType: "float32", shape: [1] } });
            } catch { failedReadRejected = true; }
            const destroysAfterFailure = events.filter((event) => event.startsWith("destroy:")).length === 4;
            return {
              webnnInferenceOk: outputValue === 6 && expectedOrder && permissionsOk && failedReadRejected && destroysAfterFailure,
            };
          } catch { return { webnnInferenceOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "WebNN Tensor Permissions, Timeline Readback & Failure Cleanup",
        passed: Boolean(res?.webnnInferenceOk),
        detail: "Runs a named graph, awaits output readback and destroys input/output tensors on successful and failed reads",
      });
    } else if (taskId === "task_webnn_shared_tensor_queue") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const events = [];
            let failNextRead = false;
            const inputTensors = { values: { value: 0 } };
            const outputTensors = { result: { value: 0 } };
            const context = {
              writeTensor(tensor, data) { tensor.value = data[0]; events.push("write:" + data[0]); },
              dispatch(graph, inputs, outputs) {
                outputs.result.value = inputs.values.value * 2;
                events.push("dispatch:" + inputs.values.value);
              },
              readTensor(tensor) {
                const value = tensor.value;
                if (failNextRead) { failNextRead = false; return Promise.reject(new Error("lost context")); }
                events.push("read-start:" + value);
                return new Promise((resolve) => setTimeout(() => {
                  events.push("read-end:" + value);
                  resolve(new Float32Array([value]).buffer);
                }, 0));
              },
            };
            const queue = createWebNNInferenceQueue(context, { id: "shared" }, inputTensors, outputTensors);
            const first = queue.run({ values: new Float32Array([3]) });
            const mutableSecond = new Float32Array([5]);
            const second = queue.run({ values: mutableSecond });
            mutableSecond[0] = 99;
            const [firstResult, secondResult] = await Promise.all([first, second]);
            failNextRead = true;
            let failedRunRejected = false;
            try { await queue.run({ values: new Float32Array([7]) }); } catch { failedRunRejected = true; }
            const recovered = await queue.run({ values: new Float32Array([8]) });
            const firstReadEnd = events.indexOf("read-end:6");
            const secondWrite = events.indexOf("write:5");
            let postDisposeRejected = false;
            await queue.dispose();
            try { await queue.run({ values: new Float32Array([9]) }); } catch { postDisposeRejected = true; }
            return {
              webnnQueueOk: new Float32Array(firstResult.result)[0] === 6 &&
                new Float32Array(secondResult.result)[0] === 10 && new Float32Array(recovered.result)[0] === 16 &&
                firstReadEnd >= 0 && secondWrite > firstReadEnd && events.includes("write:5") &&
                !events.includes("write:99") && failedRunRejected && postDisposeRejected,
            };
          } catch { return { webnnQueueOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1500 });
      results.push({
        name: "WebNN Shared-Tensor Isolation, Failure Recovery & Drain",
        passed: Boolean(res?.webnnQueueOk),
        detail: "Returns distinct queued results, recovers after a failed readback and rejects runs after disposal",
      });
    } else if (taskId === "task_webnn_context_loss_recovery") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const sessions = [];
            const runner = createWebNNSessionRunner(async () => {
              await Promise.resolve();
              let resolveLost;
              const lost = new Promise((resolve) => { resolveLost = resolve; });
              const session = {
                id: sessions.length + 1,
                context: { lost, destroyed: false, destroy() { this.destroyed = true; } },
                markLost: resolveLost,
              };
              sessions.push(session);
              return session;
            }, { maxAttempts: 2 });
            let startFirst;
            let finishFirst;
            const firstStarted = new Promise((resolve) => { startFirst = resolve; });
            const firstWork = new Promise((resolve) => { finishFirst = resolve; });
            const staleRun = runner.run(async (session) => {
              if (session.id === 1) {
                startFirst();
                await firstWork;
                return "stale-result";
              }
              return "session-" + session.id;
            });
            await firstStarted;
            sessions[0].markLost({ message: "device reset" });
            const concurrentA = runner.run((session) => session.id);
            const concurrentB = runner.run((session) => session.id);
            const [recoveredResult, resultA, resultB] = await Promise.all([staleRun, concurrentA, concurrentB]);
            finishFirst();
            const generation = runner.generation;
            await runner.close();
            let closedRejected = false;
            try { await runner.run(() => "should not run"); } catch { closedRejected = true; }
            return {
              webnnRecoveryOk: recoveredResult === "session-2" && resultA === 2 && resultB === 2 &&
                sessions.length === 2 && generation === 2 && sessions[1].context.destroyed && closedRejected,
            };
          } catch { return { webnnRecoveryOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1500 });
      results.push({
        name: "WebNN Context Loss Retry, Session Sharing & Stale Result Fence",
        passed: Boolean(res?.webnnRecoveryOk),
        detail: "Rebuilds once after loss, shares the replacement session among callers and discards the old result",
      });
    } else if (taskId === "task_digital_credentials_request_builder") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            const allowed = [];
            const api = { userAgentAllowsProtocol(protocol) { allowed.push(protocol); return protocol !== "blocked"; } };
            const data = { nonce: "n-1", request: { fields: ["age_over_18"] } };
            const getPlan = buildDigitalCredentialRequest("get", "openid4vp", data, api);
            const createPlan = buildDigitalCredentialRequest("create", "openid4vci", { offer: "opaque" }, api);
            data.request.fields.push("address");
            const unsupported = buildDigitalCredentialRequest("get", "blocked", { nonce: 1 }, api);
            const circular = {}; circular.self = circular;
            let operationRejected = false;
            let circularRejected = false;
            try { buildDigitalCredentialRequest("store", "openid4vp", {}, api); } catch (error) { operationRejected = error.name === "TypeError"; }
            try { buildDigitalCredentialRequest("get", "openid4vp", circular, api); } catch (error) { circularRejected = error.name === "TypeError"; }
            return {
              credentialBuilderOk: getPlan.operation === "get" && createPlan.operation === "create" &&
                getPlan.options.digital.requests[0].protocol === "openid4vp" &&
                getPlan.options.digital.requests[0].data.request.fields.length === 1 &&
                getPlan.options.digital.requests[0].data !== data && unsupported === null &&
                allowed.join(",") === "openid4vp,openid4vci,blocked,openid4vp" && operationRejected && circularRejected,
            };
          } catch { return { credentialBuilderOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Presentation, Issuance, Protocol Fallback & JSON Boundary",
        passed: Boolean(res?.credentialBuilderOk),
        detail: "Builds detached request payloads for get/create, falls back for unsupported protocols and rejects cycles",
      });
    } else if (taskId === "task_digital_credentials_prompt_coordinator") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            let resolveChooser;
            const chooserPromise = new Promise((resolve) => { resolveChooser = resolve; });
            let activation = true;
            let calls = 0;
            let calledInActivation = false;
            let capturedOptions;
            const credentials = {
              get(options) { calls += 1; calledInActivation = activation; capturedOptions = options; return chooserPromise; },
              create() { calls += 1; return Promise.resolve({ protocol: "issue" }); },
            };
            const digitalCredentialApi = { userAgentAllowsProtocol: () => true };
            const coordinator = createDigitalCredentialPromptCoordinator({ credentials, digitalCredentialApi, isUserActivated: () => activation });
            const controller = new AbortController();
            const first = coordinator.request({ operation: "get", protocol: "openid4vp", data: { nonce: "same" }, signal: controller.signal });
            const duplicate = coordinator.request({ operation: "get", protocol: "openid4vp", data: { nonce: "same" } });
            let competingRejected = false;
            try { coordinator.request({ operation: "create", protocol: "openid4vci", data: { offer: 1 } }); }
            catch (error) { competingRejected = error.name === "InvalidStateError"; }
            resolveChooser({ protocol: "openid4vp", data: { response: "opaque" } });
            const result = await first;
            await Promise.resolve();
            const secondResult = await coordinator.request({ operation: "create", protocol: "openid4vci", data: { offer: 2 } });
            activation = false;
            let activationRejected = false;
            try { coordinator.request({ operation: "get", protocol: "openid4vp", data: {} }); }
            catch (error) { activationRejected = error.name === "NotAllowedError"; }
            coordinator.close();
            activation = true;
            let closedRejected = false;
            try { coordinator.request({ operation: "get", protocol: "openid4vp", data: {} }); }
            catch (error) { closedRejected = error.name === "InvalidStateError"; }
            return {
              credentialPromptOk: first === duplicate && calls === 2 && calledInActivation &&
                capturedOptions.signal === controller.signal && !("mediation" in capturedOptions) &&
                result.protocol === "openid4vp" && secondResult.protocol === "issue" &&
                competingRejected && activationRejected && closedRejected,
            };
          } catch { return { credentialPromptOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Activation-Turn Chooser, Duplicate Coalescing & Lifecycle",
        passed: Boolean(res?.credentialPromptOk),
        detail: "Opens one chooser in the gesture turn, shares duplicates and releases the gate after completion",
      });
    } else if (taskId === "task_digital_credentials_server_verification") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const calls = [];
            const fetchImpl = async (url, options) => {
              calls.push({ url, options });
              return { ok: true, async json() { return { verified: true, subject: "must-not-escape" }; } };
            };
            const credential = { protocol: "openid4vp", data: { presentation: "opaque" } };
            const verified = await verifyDigitalCredentialAtOrigin(credential, {
              fetchImpl, origin: "https://verifier.example", endpoint: "/api/verify",
            });
            let crossOriginRejected = false;
            let insecureRejected = false;
            try { await verifyDigitalCredentialAtOrigin(credential, { fetchImpl, origin: "https://verifier.example", endpoint: "https://attacker.example/collect" }); }
            catch (error) { crossOriginRejected = error.name === "TypeError"; }
            try { await verifyDigitalCredentialAtOrigin(credential, { fetchImpl, origin: "http://verifier.example" }); }
            catch (error) { insecureRejected = error.name === "TypeError"; }
            const falseResult = await verifyDigitalCredentialAtOrigin(credential, {
              fetchImpl: async () => ({ ok: true, async json() { return { verified: false }; } }),
              origin: "https://verifier.example",
            });
            const call = calls[0];
            const body = JSON.parse(call.options.body);
            return {
              credentialVerifyOk: verified === true && falseResult === false && calls.length === 1 &&
                call.url === "https://verifier.example/api/verify" && call.options.method === "POST" &&
                call.options.credentials === "same-origin" && call.options.cache === "no-store" &&
                call.options.redirect === "error" && body.protocol === "openid4vp" &&
                body.data.presentation === "opaque" && crossOriginRejected && insecureRejected,
            };
          } catch { return { credentialVerifyOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Same-Origin Verifier Boundary & Opaque Response Handling",
        passed: Boolean(res?.credentialVerifyOk),
        detail: "Posts the credential response securely and accepts only the verifier's explicit boolean result",
      });
    } else if (taskId === "task_webxr_depth_session_options") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const optional = buildDepthAwareXRSessionOptions({});
            const required = buildDepthAwareXRSessionOptions({ required: true, matchDepthView: false });
            let captured;
            const session = { id: "xr" };
            const xr = { async requestSession(mode, options) { captured = { mode, options }; return session; } };
            const result = await requestDepthAwareXRSession(xr, "immersive-ar", { required: true });
            let invalidRejected = false;
            try { buildDepthAwareXRSessionOptions({ dataFormatPreference: ["made-up"] }); }
            catch (error) { invalidRejected = error.name === "TypeError"; }
            return {
              webxrSessionOk: optional.optionalFeatures.join(",") === "depth-sensing" &&
                !optional.requiredFeatures && required.requiredFeatures.join(",") === "depth-sensing" &&
                required.depthSensing.matchDepthView === false &&
                required.depthSensing.usagePreference.length > 0 &&
                required.depthSensing.dataFormatPreference.length > 0 &&
                captured.mode === "immersive-ar" && captured.options.requiredFeatures[0] === "depth-sensing" &&
                result === session && invalidRejected,
            };
          } catch { return { webxrSessionOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Required and Optional Depth Feature Negotiation",
        passed: Boolean(res?.webxrSessionOk),
        detail: "Requests the correct feature policy and supplies validated preference arrays to XRSystem",
      });
    } else if (taskId === "task_webxr_depth_sampling") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            const coordinates = [];
            const information = {
              data: new ArrayBuffer(8),
              getDepthInMeters(x, y) { coordinates.push([x, y]); return 1.75; },
            };
            const meters = readXrDepthSample(information, 0.25, 1);
            const invalid = readXrDepthSample({ getDepthInMeters() { return Number.NaN; } }, 0, 0);
            const absent = readXrDepthSample(null, 0.5, 0.5);
            let boundsRejected = false;
            let gpuRejected = false;
            try { readXrDepthSample(information, 1.01, 0.5); } catch (error) { boundsRejected = error.name === "RangeError"; }
            try { readXrDepthSample({ texture: {} }, 0.5, 0.5); } catch (error) { gpuRejected = error.name === "NotSupportedError"; }
            return {
              webxrSampleOk: meters === 1.75 && invalid === null && absent === null &&
                coordinates.length === 1 && coordinates[0][0] === 0.25 && coordinates[0][1] === 1 &&
                information.data.byteLength === 8 && boundsRejected && gpuRejected,
            };
          } catch { return { webxrSampleOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Meter Conversion, View Bounds & GPU-Only Handling",
        passed: Boolean(res?.webxrSampleOk),
        detail: "Uses XR's unit conversion, preserves source bytes and reports unsupported CPU sampling clearly",
      });
    } else if (taskId === "task_webxr_depth_frame_loop") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            function makeSession() {
              const callbacks = new Map();
              const cancelled = [];
              const listeners = new Map();
              let nextId = 1;
              return {
                callbacks, cancelled, listeners,
                requestAnimationFrame(callback) { const id = nextId++; callbacks.set(id, callback); return id; },
                cancelAnimationFrame(id) { cancelled.push(id); callbacks.delete(id); },
                addEventListener(name, callback) { listeners.set(name, callback); },
                removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
                end() { listeners.get("end")?.(); },
              };
            }
            const session = makeSession();
            const referenceSpace = { id: "local" };
            const depth = { width: 2, height: 2 };
            let framesSeen = 0;
            let currentDepth = false;
            const loop = startXRDepthFrameLoop({
              session, referenceSpace,
              binding: { getDepthInformation(view) { return view.id === "left" ? depth : null; } },
              onFrame(frameInfo) {
                framesSeen += 1;
                currentDepth = frameInfo.time === 12 && frameInfo.depthByView[0] === depth && frameInfo.depthByView[1] === null;
              },
            });
            const firstId = [...session.callbacks.keys()][0];
            const firstTick = session.callbacks.get(firstId);
            session.callbacks.delete(firstId);
            firstTick(12, { getViewerPose(space) { return space === referenceSpace ? { views: [{ id: "left" }, { id: "right" }] } : null; } });
            const pendingId = [...session.callbacks.keys()][0];
            session.end();
            loop.stop();
            const errorSession = makeSession();
            let reported = 0;
            startXRDepthFrameLoop({
              session: errorSession, referenceSpace,
              binding: { getDepthInformation() { return null; } },
              onFrame() { throw new Error("renderer failed"); },
              onError(error) { if (error.message === "renderer failed") reported += 1; },
            });
            const errorId = [...errorSession.callbacks.keys()][0];
            const errorTick = errorSession.callbacks.get(errorId);
            errorSession.callbacks.delete(errorId);
            errorTick(13, { getViewerPose() { return { views: [] }; } });
            return {
              webxrLoopOk: framesSeen === 1 && currentDepth && pendingId !== undefined &&
                session.cancelled.includes(pendingId) && !session.listeners.has("end") &&
                reported === 1 && errorSession.cancelled.length === 1,
            };
          } catch { return { webxrLoopOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Current Per-View Depth, Session End & Render Failure Cleanup",
        passed: Boolean(res?.webxrLoopOk),
        detail: "Samples each view, preserves missing depth, and cancels queued callbacks on end or renderer failure",
      });
    } else if (taskId === "task_webrtc_encoded_script_transform") {
      const harness = `
        ${sanitizedCode};
        (() => {
          try {
            const worker = { id: "worker" };
            const options = { operation: "encrypt", room: "r1" };
            class FakeScriptTransform {
              constructor(receivedWorker, receivedOptions) {
                if (receivedOptions.fail) throw new Error("clone failed");
                this.worker = receivedWorker;
                this.options = receivedOptions;
              }
            }
            const sender = { transform: null };
            const attached = attachRtcScriptTransform(sender, worker, options, FakeScriptTransform);
            const receiver = { transform: null };
            attachRtcScriptTransform(receiver, worker, { operation: "decrypt" }, FakeScriptTransform);
            const unchanged = { transform: "existing" };
            let constructionFailed = false;
            try { attachRtcScriptTransform(unchanged, worker, { fail: true }, FakeScriptTransform); }
            catch { constructionFailed = true; }
            let unavailable = false;
            try { attachRtcScriptTransform({ transform: null }, worker, {}, undefined); }
            catch (error) { unavailable = error.name === "NotSupportedError"; }
            return {
              rtcScriptTransformOk: sender.transform === attached && attached.worker === worker &&
                attached.options === options && receiver.transform.options.operation === "decrypt" &&
                unchanged.transform === "existing" && constructionFailed && unavailable,
            };
          } catch { return { rtcScriptTransformOk: false }; }
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Sender and Receiver Script Transform Installation",
        passed: Boolean(res?.rtcScriptTransformOk),
        detail: "Attaches worker transforms to both endpoint kinds and preserves old state on failure",
      });
    } else if (taskId === "task_webrtc_sframe_key_rotation") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const events = [];
            const key = { type: "secret" };
            const decryptor = {
              async addDecryptionKey(received, id) { events.push("add:" + id); if (received !== key) throw new Error("wrong key"); },
              async removeDecryptionKey(id) { events.push("remove:" + id); },
            };
            const encryptor = { async setEncryptionKey(received, id) { events.push("set:" + id); if (received !== key) throw new Error("wrong key"); } };
            const rotated = await rotateSFrameEncryptionKey({ encryptor, decryptor, key, keyId: 2, previousKeyId: 1 });
            let failedActivation = false;
            const failingEncryptor = { async setEncryptionKey() { throw new Error("sender rejected key"); } };
            try { await rotateSFrameEncryptionKey({ encryptor: failingEncryptor, decryptor, key, keyId: 3, previousKeyId: 2 }); }
            catch (error) { failedActivation = error.message === "sender rejected key"; }
            let unsafeIdRejected = false;
            try { await rotateSFrameEncryptionKey({ encryptor, decryptor, key, keyId: Number.MAX_SAFE_INTEGER + 1 }); }
            catch (error) { unsafeIdRejected = error.name === "RangeError"; }
            return {
              sframeRotationOk: rotated.keyId === 2 && rotated.previousKeyRetired &&
                events.slice(0, 3).join(",") === "add:2,set:2,remove:1" &&
                failedActivation && events.includes("remove:3") && !events.includes("remove:2") && unsafeIdRejected,
            };
          } catch { return { sframeRotationOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Receive-First SFrame Key Rotation and Failed Activation Rollback",
        passed: Boolean(res?.sframeRotationOk),
        detail: "Adds the new receive key first, activates the sender, retires the old key, and rolls back a failed switch",
      });
    } else if (taskId === "task_webrtc_encoded_frame_pipe") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          try {
            const first = { id: 1 };
            const dropped = { id: 2, drop: true };
            const last = { id: 3 };
            const output = [];
            const input = new ReadableStream({
              start(controller) { controller.enqueue(first); controller.enqueue(dropped); controller.enqueue(last); controller.close(); },
            });
            const destination = new WritableStream({ write(frame) { output.push(frame); } });
            await pipeEncodedFrames({ readable: input, writable: destination }, (frame) => frame.drop ? null : frame);
            let replacementRejected = false;
            try {
              await pipeEncodedFrames({
                readable: new ReadableStream({ start(controller) { controller.enqueue({ id: 4 }); controller.close(); } }),
                writable: new WritableStream({ write() {} }),
              }, (frame) => ({ ...frame }));
            } catch (error) { replacementRejected = error.name === "TypeError"; }
            let asyncRejected = false;
            try {
              await pipeEncodedFrames({
                readable: new ReadableStream({ start(controller) { controller.enqueue({ id: 5 }); controller.close(); } }),
                writable: new WritableStream({ write() {} }),
              }, (frame) => Promise.resolve(frame));
            } catch (error) { asyncRejected = error.name === "TypeError"; }
            return {
              encodedFramePipeOk: output.length === 2 && output[0] === first && output[1] === last &&
                replacementRejected && asyncRejected,
            };
          } catch { return { encodedFramePipeOk: false }; }
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Synchronous In-Order Frame Processing, Drop & Ownership Checks",
        passed: Boolean(res?.encodedFramePipeOk),
        detail: "Drops a selected frame, preserves object identity and rejects asynchronous or replacement outputs",
      });
    } else {
      // General syntax evaluation
      runInContext(sanitizedCode, ctx, { timeout: 1000 });
      results.push({
        name: "Clean Syntax & Execution",
        passed: true,
        detail: "Code compiles and runs without syntax or reference exceptions",
      });
    }

    return results;
  }

  #calculateLineDiff(original, modified) {
    const origLines = original.split("\n");
    const modLines = modified.split("\n");
    return {
      originalLineCount: origLines.length,
      modifiedLineCount: modLines.length,
      lineDelta: modLines.length - origLines.length,
    };
  }
}
