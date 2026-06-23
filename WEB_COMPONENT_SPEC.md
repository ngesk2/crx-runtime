# WEB COMPONENT SPECIFICATION

**Document ID:** WEB-COMPONENT-SPEC-1.0  
**Status:** CONSTITUTIONAL  
**Constitutional Law:** TRUTH ≠ EMBEDDINGS

---

## SECTION 0 — DECLARATION

This specification defines web components for PING.

Web components are permanent constitutional substrate.

Mistakes propagate permanently.

No modifications after Phase B freeze.

**Constraint:** No frameworks. No React. No Vue. Only standards.

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

## SECTION 2 — PING-PROFILE COMPONENT

### Component Definition

`<ping-profile>` displays user profile information.

### Attributes

- **object_id**: ObjectID of profile object (required)
- **editable**: Boolean, whether profile is editable (optional, default: false)
- **theme**: String, theme name (optional, default: "light")

### Serialization Behavior

Component MUST serialize to:

```html
<ping-profile object_id="ping:profile:a1b2c3" editable="false" theme="light"></ping-profile>
```

### Shadow DOM Contract

Shadow DOM MUST contain:

- Profile header (name, avatar)
- Profile metadata (bio, location)
- Profile actions (edit, follow)
- Profile stats (followers, following)

### Custom Element Lifecycle

**connectedCallback()**
- Load profile data from ObjectID
- Render profile in Shadow DOM
- Attach event listeners

**disconnectedCallback()**
- Remove event listeners
- Clean up resources

**attributeChangedCallback()**
- Re-render on attribute change
- Update profile data

**adoptedCallback()**
- Handle element adoption
- Re-render if needed

### Declarative Shadow DOM Compatibility

Component MUST support:

- Declarative Shadow DOM
- Server-side rendering
- Progressive enhancement
- Graceful degradation

---

## SECTION 3 — PING-FOLLOW COMPONENT

### Component Definition

`<ping-follow>` displays follow button and status.

### Attributes

- **target_id**: ObjectID of target object (required)
- **follower_id**: ObjectID of follower object (required)
- **following**: Boolean, follow status (optional, default: false)
- **count**: Number, follower count (optional, default: 0)

### Serialization Behavior

Component MUST serialize to:

```html
<ping-follow target_id="ping:profile:a1b2c3" follower_id="ping:profile:d4e5f6" following="false" count="42"></ping-follow>
```

### Shadow DOM Contract

Shadow DOM MUST contain:

- Follow button
- Follow status indicator
- Follower count display
- Loading state

### Custom Element Lifecycle

**connectedCallback()**
- Load follow status
- Render follow button
- Attach event listeners

**disconnectedCallback()**
- Remove event listeners
- Clean up resources

**attributeChangedCallback()**
- Re-render on attribute change
- Update follow status

**adoptedCallback()**
- Handle element adoption
- Re-render if needed

### Declarative Shadow DOM Compatibility

Component MUST support:

- Declarative Shadow DOM
- Server-side rendering
- Progressive enhancement
- Graceful degradation

---

## SECTION 4 — PING-SUBSCRIBE COMPONENT

### Component Definition

`<ping-subscribe>` displays subscribe button and status.

### Attributes

- **target_id**: ObjectID of target object (required)
- **subscriber_id**: ObjectID of subscriber object (required)
- **subscribed**: Boolean, subscribe status (optional, default: false)
- **count**: Number, subscriber count (optional, default: 0)

### Serialization Behavior

Component MUST serialize to:

```html
<ping-subscribe target_id="ping:profile:a1b2c3" subscriber_id="ping:profile:d4e5f6" subscribed="false" count="42"></ping-subscribe>
```

### Shadow DOM Contract

Shadow DOM MUST contain:

- Subscribe button
- Subscribe status indicator
- Subscriber count display
- Loading state

### Custom Element Lifecycle

**connectedCallback()**
- Load subscribe status
- Render subscribe button
- Attach event listeners

**disconnectedCallback()**
- Remove event listeners
- Clean up resources

**attributeChangedCallback()**
- Re-render on attribute change
- Update subscribe status

**adoptedCallback()**
- Handle element adoption
- Re-render if needed

### Declarative Shadow DOM Compatibility

Component MUST support:

- Declarative Shadow DOM
- Server-side rendering
- Progressive enhancement
- Graceful degradation

---

## SECTION 5 — ATTRIBUTES

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

## SECTION 6 — SERIALIZATION BEHAVIOR

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

## SECTION 7 — SHADOW DOM CONTRACT

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

## SECTION 8 — CUSTOM ELEMENT LIFECYCLE

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

## SECTION 9 — DECLARATIVE SHADOW DOM COMPATIBILITY

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

### Constraint 2: Standard Compliance

Components MUST comply with web standards.

Custom Elements API. Shadow DOM API.

### Constraint 3: Declarative

Components MUST be declarative.

No imperative DOM manipulation.

### Constraint 4: Composable

Components MUST be composable.

Components MUST nest. Components MUST combine.

### Constraint 5: Reusable

Components MUST be reusable.

Components MUST work in any context.

---

## SECTION 13 — FINAL PRINCIPLE

Web components are constitutional substrate.

Web components are permanent.

Mistakes propagate permanently.

No modifications after Phase B freeze.

---

**Document ID:** WEB-COMPONENT-SPEC-1.0  
**Status:** CONSTITUTIONAL  
**Amendment:** Requires constitutional amendment process
