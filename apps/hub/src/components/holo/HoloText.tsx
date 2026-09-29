'use client';

/**
 * HoloText
 * 
 * Text rendered in 3D space with holographic styling.
 * Supports labels, values, and descriptions.
 */

import { Text, Billboard } from '@react-three/drei';
import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

interface HoloTextProps {
  children: ReactNode;
  position?: [number, number, number];
  fontSize?: number;
  color?: string;
  variant?: 'label' | 'value' | 'title' | 'body' | 'mono';
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
  lookAtCamera?: boolean;
  opacity?: number;
}

// ============================================================================
// Font Mappings
// ============================================================================

const FONTS = {
  label: '/fonts/Rajdhani-SemiBold.ttf',
  value: '/fonts/JetBrainsMono-Regular.ttf',
  title: '/fonts/Rajdhani-Bold.ttf',
  body: '/fonts/Barlow-Regular.ttf',
  mono: '/fonts/JetBrainsMono-Regular.ttf',
};

const LETTER_SPACING = {
  label: 0.1,
  value: 0,
  title: 0.15,
  body: 0.02,
  mono: 0,
};

// ============================================================================
// HoloText Component
// ============================================================================

export function HoloText({
  children,
  position = [0, 0, 0],
  fontSize = 0.2,
  color = '#FFFFFF',
  variant = 'body',
  align = 'center',
  maxWidth = 10,
  lookAtCamera = true,
  opacity = 1,
}: HoloTextProps) {
  const content = (
    <Text
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX={align}
      anchorY="middle"
      font={FONTS[variant]}
      letterSpacing={LETTER_SPACING[variant]}
      maxWidth={maxWidth}
      fillOpacity={opacity}
      outlineWidth={variant === 'title' ? 0.01 : 0}
      outlineColor={color}
      outlineOpacity={0.3}
    >
      {variant === 'label' || variant === 'title'
        ? String(children).toUpperCase()
        : children}
    </Text>
  );
  
  if (lookAtCamera) {
    return <Billboard>{content}</Billboard>;
  }
  
  return content;
}

// ============================================================================
// Convenience Components
// ============================================================================

export function HoloLabel(props: Omit<HoloTextProps, 'variant'>) {
  return <HoloText {...props} variant="label" color="#7B8794" fontSize={0.12} />;
}

export function HoloValue(props: Omit<HoloTextProps, 'variant'>) {
  return <HoloText {...props} variant="value" color="#FFFFFF" fontSize={0.25} />;
}

export function HoloTitle(props: Omit<HoloTextProps, 'variant'>) {
  return <HoloText {...props} variant="title" color="#FF6A00" fontSize={0.3} />;
}

export default HoloText;
