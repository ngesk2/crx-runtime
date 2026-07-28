# WEB COMPONENT CONSTITUTION

**Document ID:** WEB-COMPONENT-CONSTITUTION-1.0  
**Status:** CONSTITUTIONAL FREEZE  
**Constitutional Law:** TRUTH ≠ EMBEDDINGS  
**Amendment:** Requires constitutional amendment process

---

## SECTION 0 — DECLARATION

This constitution defines web components for PING.

Web components are permanent constitutional substrate.

Mistakes propagate permanently.

No modifications after Phase B freeze.

**Constitutional Principle:**
- Runtime controls UI rendering
- Object provides data only
- Separation of concerns
- No frameworks (React, Vue, etc.)
- Only standard web APIs

---

## SECTION 1 — COMPONENT DEFINITION

### Component Semantics

Web components are custom HTML elements.

Web components use Shadow DOM.

Web components use standard web APIs.

### Component Architecture

```
Custom Element
  ↓
Shadow DOM
  ↓
Template
  ↓
Styles
  ↓
Script
```

### Component Properties

Web components MUST be:
- Framework-agnostic
- Standard-compliant
- Declarative
- Composable
- Reusable

---

## SECTION 2 — CONSTITUTIONAL COMPONENTS

### PING-PROFILE

**Definition:** `<ping-profile>` displays user profile information.

**Attributes:**
- **object_id**: ObjectID of profile object (required)
- **editable**: Boolean, whether profile is editable (optional, default: false)
- **theme**: String, theme name (optional, default: "light")

**Serialization:**
```html
<ping-profile object_id="ping:profile:a1b2c3" editable="false" theme="light"></ping-profile>
```

**Shadow DOM Contract:**
- Profile header (name, avatar)
- Profile metadata (bio, location)
- Profile actions (edit, follow)
- Profile stats (followers, following)

### PING-FOLLOW

**Definition:** `<ping-follow>` displays follow button and status.

**Attributes:**
- **target_id**: ObjectID of target object (required)
- **follower_id**: ObjectID of follower object (required)
- **following**: Boolean, follow status (optional, default: false)
- **count**: Number, follower count (optional, default: 0)

**Serialization:**
```html
<ping-follow target_id="ping:profile:a1b2c3" follower_id="ping:profile:d4e5f6" following="false" count="42"></ping-follow>
```

**Shadow DOM Contract:**
- Follow button
- Follow status indicator
- Follower count display
- Loading state

### PING-SUBSCRIBE

**Definition:** `<ping-subscribe>` displays subscribe button and status.

**Attributes:**
- **target_id**: ObjectID of target object (required)
- **subscriber_id**: ObjectID of subscriber object (required)
- **subscribed**: Boolean, subscribe status (optional, default: false)
- **count**: Number, subscriber count (optional, default: 0)

**Serialization:**
```html
<ping-subscribe target_id="ping:profile:a1b2c3" subscriber_id="ping:profile:d4e5f6" subscribed="false" count="42"></ping-subscribe>
```

**Shadow DOM Contract:**
- Subscribe button
- Subscribe status indicator
- Subscriber count display
- Loading state

---

## SECTION 3 — RENDERING AUTHORITY

### Constitutional Law

**Runtime controls UI rendering.**

**Object provides data only.**

**Constitutional Architecture:**
- Object: Pure data
- Runtime: Rendering logic
- Separation of concerns

### Rendering Model

**Model B (FINAL):**
- Object contains: `{ "payload": {...} }`
- Runtime chooses template
- Runtime applies styles
- Runtime controls UI

**Rationale:**
- Data/rendering separation enables portability
- Runtime rendering enables host flexibility
- Object immutability enables replay
- Template flexibility enables evolution

---

## SECTION 4 — HYDRATION AUTHORITY

### Constitutional Law

**Runtime controls UI.**

**Constitutional Architecture:**
- Object: Data source
- Runtime: UI controller
- Host: Runtime environment

### Hydration Flow

```
Object payload
  ↓
Runtime hydration
  ↓
Template selection
  ↓
Style application
  ↓
Shadow DOM render
```

### Hydration Guarantees

Runtime hydration MUST guarantee:
- Deterministic rendering
- Consistent UI
- Replayable state
- Verifiable output

---

## SECTION 5 — COMPONENT LIFECYCLE

### Lifecycle Methods

Components MUST implement:
- **connectedCallback()**: Element connected to DOM
- **disconnectedCallback()**: Element disconnected from DOM
- **attributeChangedCallback()**: Attribute changed
- **adoptedCallback()**: Element adopted

### Lifecycle Guarantees

Lifecycle methods MUST guarantee:
- Deterministic execution
- Idempotent behavior
- Resource cleanup
- Error handling

### Lifecycle Performance

Lifecycle methods MUST complete in:
- connectedCallback(): <50ms
- disconnectedCallback(): <10ms
- attributeChangedCallback(): <20ms
- adoptedCallback(): <20ms

---

## SECTION 6 — SHADOW DOM CONTRACT

### Shadow DOM Definition

Shadow DOM is encapsulated DOM tree.

Shadow DOM isolates component styles.

Shadow DOM isolates component markup.

### Shadow DOM Structure

Shadow DOM MUST contain:
- Root element
- Component markup
- Component styles
- Component scripts

### Shadow DOM Isolation

Shadow DOM MUST isolate:
- Styles (no external leakage)
- Markup (no external access)
- Events (no external interference)

### Shadow DOM Slots

Shadow DOM MAY use:
- Named slots
- Default slots
- Fallback content
- Slot distribution

---

## SECTION 7 — ATTRIBUTES

### Attribute Definition

Attributes MUST be:
- String-typed
- Hyphenated (kebab-case)
- Reflective
- Observable

### Attribute Types

Allowed attribute types:
- **string**: Text values
- **boolean**: true/false values
- **number**: Numeric values
- **object_id**: ObjectID references

### Attribute Validation

Attributes MUST validate:
- Type correctness
- Format correctness
- Value constraints
- Business rules

### Attribute Reflection

Attributes MUST reflect to properties:
```javascript
static get observedAttributes() {
  return ['object_id', 'editable', 'theme'];
}
```

---

## SECTION 8 — SERIALIZATION BEHAVIOR

### Serialization Rules

Components MUST serialize to:
- Valid HTML
- Standard attributes
- No custom syntax
- No framework-specific markup

### Serialization Invariant

Same component state → Same serialized HTML
Same serialized HTML → Same component state

### Serialization Verification

Serialization MUST verify:
- Attribute validity
- Attribute format
- Attribute constraints
- Component state

---

## SECTION 9 — DECLARATIVE SHADOW DOM

### Declarative Shadow DOM

Components MUST support declarative Shadow DOM:
```html
<ping-profile object_id="ping:profile:a1b2c3">
  <template shadowrootmode="open">
    <!-- Shadow DOM content -->
  </template>
</ping-profile>
```

### Server-Side Rendering

Components MUST support server-side rendering:
- Render initial HTML
- Include Shadow DOM
- Hydrate on client
- Progressive enhancement

### Progressive Enhancement

Components MUST support progressive enhancement:
- Work without JavaScript
- Enhance with JavaScript
- Graceful degradation
- Fallback content

---

## SECTION 10 — STANDARDS COMPLIANCE

### Web Components Standard

Components MUST comply with:
- Custom Elements API
- Shadow DOM API
- HTML Templates
- ES Modules

### Browser Compatibility

Components MUST support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Fallback for older browsers

### Accessibility

Components MUST support:
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management

---

## SECTION 11 — PERFORMANCE

### Performance Targets

Components MUST meet:
- Initial render: <50ms
- Attribute update: <20ms
- Event handling: <10ms
- Memory usage: <1MB per component

### Performance Optimization

Components MAY optimize:
- Lazy rendering
- Virtual scrolling
- Event delegation
- Memoization

---

## SECTION 12 — CONSTITUTIONAL CONSTRAINTS

### Constraint 1: No Frameworks

Components MUST NOT use frameworks.
No React. No Vue. No Angular.
Only standard web APIs.

### Constraint 2: Runtime Controls UI

Runtime controls UI rendering.
Object provides data only.
Separation of concerns.

### Constraint 3: Standard Compliance

Components MUST comply with web standards.
Custom Elements API. Shadow DOM API.

### Constraint 4: Declarative

Components MUST be declarative.
No imperative DOM manipulation.

### Constraint 5: Composable

Components MUST be composable.
Components MUST nest. Components MUST combine.

### Constraint 6: Reusable

Components MUST be reusable.
Components MUST work in any context.

---

## SECTION 13 — FINAL PRINCIPLE

Web components are constitutional substrate.

Web components are permanent.

Mistakes propagate permanently.

No modifications after Phase B freeze.

**Constitutional Law:**
- Runtime controls UI rendering
- Object provides data only
- No frameworks (React, Vue, etc.)
- Only standard web APIs

---

**Document ID:** WEB-COMPONENT-CONSTITUTION-1.0  
**Status:** CONSTITUTIONAL FREEZE  
**Amendment:** Requires constitutional amendment process
