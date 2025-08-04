# CSS Variables Style Guide

This document outlines the global CSS variables system implemented in the Vibe Property Management application for consistent theming and maintainable styles.

## 🎨 Global CSS Variables

All CSS variables are defined in `src/styles.scss` within the `:root` selector, making them available throughout the entire application.

### Color Palette

#### Primary Brand Colors
```css
--primary-color: #1976d2;     /* Main brand blue */
--primary-light: #42a5f5;     /* Lighter shade */
--primary-dark: #1565c0;      /* Darker shade */
```

#### Success/Profit Colors (Green)
```css
--success-color: #4caf50;     /* Main success green */
--success-light: #81c784;     /* Lighter green */
--success-dark: #2e7d32;      /* Darker green */
--success-background: #e8f5e8; /* Light green background */
```

#### Error/Loss Colors (Red)
```css
--error-color: #f44336;       /* Main error red */
--error-light: #e57373;       /* Lighter red */
--error-dark: #c62828;        /* Darker red */
--error-background: #ffebee;  /* Light red background */
```

#### Warning/Medium Colors (Orange)
```css
--warning-color: #ff9800;     /* Main warning orange */
--warning-light: #ffb74d;     /* Lighter orange */
--warning-dark: #f57c00;      /* Darker orange */
--warning-background: #fff3e0; /* Light orange background */
```

#### Purple/Loss Colors (for extreme negative values)
```css
--purple-color: #9c27b0;      /* Main purple */
--purple-light: #ba68c8;      /* Lighter purple */
--purple-dark: #7b1fa2;       /* Darker purple */
--purple-background: #f3e5f5; /* Light purple background */
```

#### Text Colors
```css
--text-primary: #333;         /* Main text color */
--text-secondary: #666;       /* Secondary text (labels, captions) */
--text-tertiary: #999;        /* Tertiary text (disabled, placeholders) */
--text-disabled: #ccc;        /* Disabled text */
```

#### Background Colors
```css
--background-primary: #ffffff;   /* Main background (cards, content) */
--background-secondary: #f5f5f5; /* Secondary background (headers, panels) */
--background-tertiary: #f9f9f9;  /* Tertiary background (subtle areas) */
--background-paper: #fafafa;     /* Paper-like background */
```

#### Border Colors
```css
--border-light: #e0e0e0;      /* Light borders */
--border-medium: #bdbdbd;     /* Medium borders */
--border-dark: #757575;       /* Dark borders */
```

#### Shadow Colors
```css
--shadow-light: rgba(0, 0, 0, 0.1);   /* Light shadows */
--shadow-medium: rgba(0, 0, 0, 0.12); /* Medium shadows */
--shadow-dark: rgba(0, 0, 0, 0.2);    /* Dark shadows */
```

### Spacing Variables

```css
--spacing-xs: 4px;    /* Extra small spacing */
--spacing-sm: 8px;    /* Small spacing */
--spacing-md: 16px;   /* Medium spacing (default) */
--spacing-lg: 24px;   /* Large spacing */
--spacing-xl: 32px;   /* Extra large spacing */
--spacing-xxl: 48px;  /* Extra extra large spacing */
```

### Border Radius

```css
--border-radius-sm: 4px;   /* Small radius */
--border-radius-md: 8px;   /* Medium radius */
--border-radius-lg: 12px;  /* Large radius */
```

### Typography

#### Font Sizes
```css
--font-size-xs: 12px;   /* Extra small text */
--font-size-sm: 14px;   /* Small text */
--font-size-md: 16px;   /* Medium text (default) */
--font-size-lg: 18px;   /* Large text */
--font-size-xl: 24px;   /* Extra large text */
--font-size-xxl: 32px;  /* Extra extra large text */
```

#### Font Weights
```css
--font-weight-normal: 400;  /* Normal weight */
--font-weight-medium: 500;  /* Medium weight */
--font-weight-bold: 700;    /* Bold weight */
```

### Transitions

```css
--transition-fast: 0.15s ease-in-out;    /* Fast transitions */
--transition-normal: 0.2s ease-in-out;   /* Normal transitions */
--transition-slow: 0.3s ease-in-out;     /* Slow transitions */
```

## 🎯 Usage Guidelines

### How to Use CSS Variables

In your component styles, reference variables using the `var()` function:

```css
.my-component {
  color: var(--text-primary);
  background-color: var(--background-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: var(--transition-normal);
}
```

### Color Usage Patterns

#### Success/Profit Indicators
- Use `--success-color` for positive financial values
- Use `--success-background` for success state backgrounds
- Use `--success-dark` for text on light success backgrounds

#### Error/Loss Indicators  
- Use `--error-color` for negative financial values
- Use `--error-background` for error state backgrounds
- Use `--error-dark` for text on light error backgrounds

#### Warning/Medium Indicators
- Use `--warning-color` for moderate/cautionary states
- Use `--warning-background` for warning state backgrounds
- Use `--warning-dark` for text on light warning backgrounds

#### Text Hierarchy
- Use `--text-primary` for main content text
- Use `--text-secondary` for labels, captions, and secondary information
- Use `--text-tertiary` for disabled or placeholder text
- Use `--text-disabled` for completely disabled elements

#### Spacing Consistency
- Use `--spacing-xs` for tight spacing (4px)
- Use `--spacing-sm` for small gaps (8px)
- Use `--spacing-md` for standard spacing (16px) - most common
- Use `--spacing-lg` for section spacing (24px)
- Use `--spacing-xl` for major section separation (32px)
- Use `--spacing-xxl` for page-level spacing (48px)

## 🔄 Migration from Hardcoded Values

### Before (Hardcoded)
```css
.old-style {
  color: #1976d2;
  background-color: #f5f5f5;
  padding: 16px;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
```

### After (CSS Variables)
```css
.new-style {
  color: var(--primary-color);
  background-color: var(--background-secondary);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: 0 2px 8px var(--shadow-medium);
}
```

## 🎨 Benefits

1. **Consistency**: All components use the same color palette and spacing
2. **Maintainability**: Change colors globally by updating one location
3. **Theme Support**: Easy to implement dark mode or alternate themes
4. **Developer Experience**: Semantic variable names make intent clear
5. **Design System**: Creates a cohesive visual language across the app

## 📱 Component Integration

The following components have been updated to use CSS variables:

- ✅ Dashboard Component
- ✅ Property Form Component  
- ✅ Property Map Component
- ✅ Reports Component
- ✅ Property List Component
- ✅ App Navigation/Toolbar
- ✅ Global Styles

## 🔮 Future Enhancements

1. **Dark Mode**: Add CSS variables for dark theme colors
2. **Theme Switching**: Implement runtime theme switching
3. **Custom Themes**: Allow users to customize color schemes
4. **CSS Custom Properties**: Extend to include more design tokens
5. **Design Tokens**: Integrate with design systems like Figma tokens

## 💡 Best Practices

1. **Always use variables**: Avoid hardcoded colors, spacing, and other design tokens
2. **Semantic naming**: Choose variable names that describe purpose, not appearance
3. **Consistent spacing**: Stick to the defined spacing scale
4. **Color meaning**: Use success/error/warning colors consistently for their intended purpose
5. **Documentation**: Update this guide when adding new variables

---

This CSS variables system ensures consistent, maintainable, and professional styling across the entire Vibe Property Management application.
