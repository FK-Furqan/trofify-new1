# Trofify-Style Typography System

This guide documents the comprehensive Trofify-style typography system implemented in the Trofify application. The system replicates Instagram's exact font styles, sizes, weights, and responsive behavior across web and mobile interfaces.

## Font Families

### Primary Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

### Display Font Stack (for headings)
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

### Text Font Stack (for body text)
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

## Typography Classes

### Profile Components

#### Profile Name (Bolded Display Name)
```css
.trofify-profile-name
```
- **Font Size**: 14px (13px on mobile)
- **Line Height**: 18px (17px on mobile)
- **Font Weight**: 600 (Semibold)
- **Letter Spacing**: 0.2px
- **Color**: Foreground (primary text color)

**Usage Example:**
```tsx
<span className="trofify-profile-name">John Doe</span>
```

#### Username/Subtitle
```css
.trofify-username
```
- **Font Size**: 14px (13px on mobile)
- **Line Height**: 18px (17px on mobile)
- **Font Weight**: 400 (Regular)
- **Letter Spacing**: 0.2px
- **Color**: Muted foreground (secondary text color)

**Usage Example:**
```tsx
<span className="trofify-username">@johndoe</span>
```

### Post Components

#### Post Caption Text
```css
.trofify-caption
```
- **Font Size**: 14px (13px on mobile)
- **Line Height**: 18px (17px on mobile)
- **Font Weight**: 400 (Regular)
- **Letter Spacing**: 0.2px
- **Color**: Foreground (primary text color)

**Usage Example:**
```tsx
<p className="trofify-caption">This is a post caption with Trofify-style typography</p>
```

#### Time of Post
```css
.trofify-time
```
- **Font Size**: 12px (11px on mobile)
- **Line Height**: 16px (15px on mobile)
- **Font Weight**: 400 (Regular)
- **Letter Spacing**: 0.2px
- **Color**: Muted foreground (secondary text color)

**Usage Example:**
```tsx
<span className="trofify-time">2 hours ago</span>
```

#### Number of Likes/Comments
```css
.trofify-stats
```
- **Font Size**: 14px (13px on mobile)
- **Line Height**: 18px (17px on mobile)
- **Font Weight**: 600 (Semibold)
- **Letter Spacing**: 0.2px
- **Color**: Foreground (primary text color)

**Usage Example:**
```tsx
<span className="trofify-stats">1,234 likes</span>
```

### Comment Components

#### Comments
```css
.trofify-comment
```
- **Font Size**: 14px (13px on mobile)
- **Line Height**: 18px (17px on mobile)
- **Font Weight**: 400 (Regular)
- **Letter Spacing**: 0.2px
- **Color**: Foreground (primary text color)

**Usage Example:**
```tsx
<div className="trofify-comment">Great post! Thanks for sharing.</div>
```

### Input Components

#### Placeholder/Input Fields
```css
.trofify-input
```
- **Font Size**: 14px (13px on mobile)
- **Line Height**: 18px (17px on mobile)
- **Font Weight**: 400 (Regular)
- **Letter Spacing**: 0.2px
- **Color**: Foreground (primary text color)

**Usage Example:**
```tsx
<input 
  className="trofify-input" 
  placeholder="Add a comment..." 
/>
```

### Button Components

#### Button Texts
```css
.trofify-button
```
- **Font Size**: 14px (13px on mobile)
- **Line Height**: 18px (17px on mobile)
- **Font Weight**: 600 (Semibold)
- **Letter Spacing**: 0.2px
- **Color**: Foreground (primary text color)

**Usage Example:**
```tsx
<button className="trofify-button">Follow</button>
```

### Message Components

#### Message Sender/Receiver
```css
.trofify-message
```
- **Font Size**: 14px (13px on mobile)
- **Line Height**: 18px (17px on mobile)
- **Font Weight**: 400 (Regular)
- **Letter Spacing**: 0.2px
- **Color**: Foreground (primary text color)

**Usage Example:**
```tsx
<div className="trofify-message">Hello! How are you?</div>
```

#### Message Timestamp
```css
.trofify-message-time
```
- **Font Size**: 11px (10px on mobile)
- **Line Height**: 14px (13px on mobile)
- **Font Weight**: 400 (Regular)
- **Letter Spacing**: 0.2px
- **Color**: Muted foreground (secondary text color)

**Usage Example:**
```tsx
<span className="trofify-message-time">2:30 PM</span>
```

#### Typing Indicator
```css
.trofify-typing
```
- **Font Size**: 14px (13px on mobile)
- **Line Height**: 18px (17px on mobile)
- **Font Weight**: 400 (Regular)
- **Letter Spacing**: 0.2px
- **Color**: Muted foreground (secondary text color)

**Usage Example:**
```tsx
<span className="trofify-typing text-[#0e9591]">typing</span>
```

### Navigation Components

#### Navigation Items
```css
.trofify-nav
```
- **Font Size**: 12px (11px on mobile)
- **Line Height**: 16px (15px on mobile)
- **Font Weight**: 400 (Regular)
- **Letter Spacing**: 0.2px
- **Color**: Foreground (primary text color)

**Usage Example:**
```tsx
<span className="trofify-nav">Home</span>
```

### Header Components

#### Section Headers
```css
.trofify-header
```
- **Font Size**: 16px (15px on mobile)
- **Line Height**: 20px (19px on mobile)
- **Font Weight**: 600 (Semibold)
- **Letter Spacing**: 0.2px
- **Color**: Foreground (primary text color)

**Usage Example:**
```tsx
<h3 className="trofify-header">About</h3>
```

#### Large Titles
```css
.trofify-title
```
- **Font Size**: 22px (20px on mobile)
- **Line Height**: 26px (24px on mobile)
- **Font Weight**: 600 (Semibold)
- **Letter Spacing**: 0.2px
- **Color**: Foreground (primary text color)

**Usage Example:**
```tsx
<h1 className="trofify-title">Profile Name</h1>
```

#### Small Labels
```css
.trofify-label
```
- **Font Size**: 12px (11px on mobile)
- **Line Height**: 16px (15px on mobile)
- **Font Weight**: 400 (Regular)
- **Letter Spacing**: 0.2px
- **Color**: Muted foreground (secondary text color)

**Usage Example:**
```tsx
<span className="trofify-label">Read more</span>
```

## Font Weights

### Available Font Weights
```css
.trofify-light      /* 300 */
.trofify-regular    /* 400 */
.trofify-medium     /* 500 */
.trofify-semibold   /* 600 */
.trofify-bold       /* 700 */
```

## Line Heights

### Available Line Heights
```css
.leading-trofify-tight     /* 1.125 (18px for 16px font) */
.leading-trofify-normal    /* 1.25 (20px for 16px font) */
.leading-trofify-relaxed   /* 1.375 (22px for 16px font) */
```

## Letter Spacing

### Available Letter Spacing
```css
.tracking-trofify-tight    /* -0.2px */
.tracking-trofify-normal   /* 0px */
.tracking-trofify-wide     /* 0.2px */
```

## Responsive Behavior

The typography system automatically adjusts font sizes and line heights for mobile devices (screens ≤ 768px):

### Desktop → Mobile Adjustments
- **Profile Name**: 14px → 13px
- **Username**: 14px → 13px
- **Caption**: 14px → 13px
- **Time**: 12px → 11px
- **Stats**: 14px → 13px
- **Comments**: 14px → 13px
- **Input**: 14px → 13px
- **Button**: 14px → 13px
- **Message**: 14px → 13px
- **Message Time**: 11px → 10px
- **Typing**: 14px → 13px
- **Nav**: 12px → 11px
- **Header**: 16px → 15px
- **Title**: 22px → 20px
- **Label**: 12px → 11px

## Utility Classes

### Link Styles
```css
.trofify-link
```
- Primary brand color with hover effects
- Smooth color transitions

### Button Styles
```css
.trofify-button-primary
```
- Primary brand background with hover effects
- Smooth color transitions

### Input Focus Styles
```css
.trofify-input-focus
```
- Brand-colored focus ring
- Smooth transition effects

## Implementation Examples

### Complete Post Card Example
```tsx
<div className="post-card">
  <div className="post-header">
    <span className="trofify-profile-name">John Doe</span>
    <span className="trofify-username">@johndoe</span>
    <span className="trofify-time">2 hours ago</span>
  </div>
  
  <p className="trofify-caption">
    This is a post caption with Trofify-style typography
  </p>
  
  <div className="post-actions">
    <span className="trofify-stats">1,234 likes</span>
    <button className="trofify-button">Like</button>
  </div>
</div>
```

### Complete Message Example
```tsx
<div className="message-container">
  <div className="message-header">
    <span className="trofify-profile-name">Jane Smith</span>
    <span className="trofify-message-time">2:30 PM</span>
  </div>
  
  <div className="message-content">
    <div className="trofify-message">
      Hello! How are you doing today?
    </div>
  </div>
  
  {isTyping && (
    <div className="typing-indicator">
      <span className="trofify-typing text-[#0e9591]">typing</span>
    </div>
  )}
</div>
```

### Complete Comment Example
```tsx
<div className="comment">
  <div className="comment-header">
    <span className="trofify-profile-name">User Name</span>
    <span className="trofify-time">1 hour ago</span>
  </div>
  
  <div className="comment-content">
    <div className="trofify-comment">
      This is a comment with Trofify-style typography
    </div>
  </div>
  
  <div className="comment-actions">
    <button className="trofify-label text-[#0e9591] font-trofify-semibold">
      Reply
    </button>
  </div>
</div>
```

## Best Practices

1. **Consistency**: Always use the appropriate Trofify-style class for each text element
2. **Responsive Design**: The system automatically handles mobile adjustments
3. **Accessibility**: Maintain proper contrast ratios and readable font sizes
4. **Performance**: Font families are optimized for system fonts to ensure fast loading
5. **Brand Consistency**: Use the brand color (#0e9591) for interactive elements

## Browser Support

The typography system supports all modern browsers:
- Chrome/Chromium
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

- Uses system fonts for optimal performance
- No external font loading required
- Minimal CSS overhead
- Optimized for mobile devices

This typography system provides a complete Trofify-branded experience while maintaining excellent performance and accessibility standards. 