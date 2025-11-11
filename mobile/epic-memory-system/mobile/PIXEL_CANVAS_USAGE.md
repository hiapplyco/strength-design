# Pixel Canvas Component - React Native Implementation

## Overview
A high-performance pixel shimmer effect component that mimics the web `<pixel-canvas>` custom element for React Native applications.

## Installation

No additional dependencies required for the simple version. For the advanced version with Skia:

```bash
npm install @shopify/react-native-skia
```

## Components

### 1. PixelCanvasSimple (Recommended)
Pure React Native implementation with optimized performance.

### 2. PixelCanvas
Advanced version using Skia for canvas rendering (better performance on newer devices).

## Usage

### Basic Usage
```javascript
import PixelCanvasSimple from './components/PixelCanvasSimple';

<View style={styles.card}>
  <PixelCanvasSimple />
  {/* Other content */}
</View>
```

### With Custom Colors
```javascript
<PixelCanvasSimple 
  colors={['#f00', '#0f0', '#00f']}
/>

// Or as a string (comma-separated)
<PixelCanvasSimple 
  colors="#f00, #0f0, #00f"
/>
```

### Adjust Gap Between Pixels
```javascript
<PixelCanvasSimple 
  gap={10} // 4-50 pixels
/>
```

### Control Animation Speed
```javascript
<PixelCanvasSimple 
  speed={50} // 0-100 (0 = no animation)
/>
```

### Disable Focus Triggering
```javascript
<PixelCanvasSimple 
  noFocus={true}
/>
```

### Complete Example
```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PixelCanvasSimple from './components/PixelCanvasSimple';

const Card = () => {
  return (
    <View style={styles.card}>
      <PixelCanvasSimple
        colors={['#00F0FF', '#FF00FF', '#FFD700']}
        gap={8}
        speed={35}
        onHoverStart={() => console.log('Animation started')}
        onHoverEnd={() => console.log('Animation ended')}
      />
      <Text style={styles.cardText}>Hover or Touch Me!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    position: 'absolute',
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `colors` | string[] \| string | `['#e0e0e0', '#d0d0d0', '#c0c0c0']` | Pixel colors (array or comma-separated string) |
| `gap` | number | `5` | Spacing between pixels (4-50) |
| `speed` | number | `35` | Animation speed (0-100, 0 = no animation) |
| `noFocus` | boolean | `false` | Disable animation on focus |
| `style` | ViewStyle | - | Container styles |
| `onHoverStart` | function | - | Called when animation starts |
| `onHoverEnd` | function | - | Called when animation ends |

## How It Works

1. **Grid Generation**: Creates a grid of pixels based on container size and gap
2. **Touch/Hover Detection**: Activates on touch (mobile) or hover (web)
3. **Shimmer Effect**: Each pixel animates with random phase and frequency
4. **Performance**: 
   - Limits total pixels to 200
   - Animates only 1/3 of pixels at a time
   - Uses native driver for all animations
   - Respects reduced motion preferences

## Performance Considerations

### Optimization Features
- **Pixel Limiting**: Maximum 200 pixels rendered
- **Batch Animation**: Animates pixels in groups of 10
- **Native Driver**: All animations use native driver
- **Reduced Motion**: Respects accessibility settings
- **Cleanup**: Proper animation cleanup on unmount

### Best Practices
1. Use reasonable gap values (8-15 recommended)
2. Keep speed between 30-50 for smooth animation
3. Limit container size to reduce pixel count
4. Use `noFocus` if focus triggering isn't needed

## Integration with UnifiedLoader

The PixelCanvas is integrated into the UnifiedLoader as a variant:

```javascript
import UnifiedLoader from './components/UnifiedLoader';

<UnifiedLoader 
  variant="pixels"
  pixelConfig={{
    colors: ['#00F0FF', '#FF00FF', '#FFD700'],
    gap: 10,
    speed: 50,
    noFocus: true,
  }}
  duration={2000}
  onComplete={() => console.log('Loading complete')}
/>
```

## Accessibility

- Respects `prefers-reduced-motion` on iOS/Android
- Keyboard accessible with focus/blur support
- Can be disabled with `noFocus` prop
- Automatic speed reduction for accessibility

## Browser/Platform Support

- ✅ iOS (React Native)
- ✅ Android (React Native)
- ✅ Web (React Native Web)
- ✅ Expo

## Comparison with Web Version

| Feature | Web `<pixel-canvas>` | React Native PixelCanvas |
|---------|---------------------|--------------------------|
| Custom Element | ✅ | ❌ (Component) |
| Canvas Rendering | ✅ | ✅ (Skia version) |
| Hover Support | ✅ | ✅ (Web) / Touch (Mobile) |
| Focus Support | ✅ | ✅ |
| Reduced Motion | ✅ | ✅ |
| Performance | Excellent | Excellent |

## Troubleshooting

### Animation not working
- Check if `speed` is greater than 0
- Ensure device doesn't have reduced motion enabled
- Verify touch/hover events are reaching the component

### Performance issues
- Increase `gap` to reduce pixel count
- Reduce container size
- Lower `speed` value
- Use `PixelCanvasSimple` instead of `PixelCanvas`

### Pixels not visible
- Check `colors` prop is valid
- Ensure container has defined dimensions
- Verify component isn't covered by other elements

---

**Version**: 1.0.0
**Last Updated**: 2025-08-21