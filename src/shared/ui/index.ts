/**
 * Shared UI Exports (shared/ui)
 *
 * Single import path for shared components: primitives, forms, layout,
 * feedback, navigation, typography, animations, modals, splash.
 */

// Primitives (merged from components/core)
export * from './primitives';

// Animations, modals, splash
export * from './animations';
export * from './modals';
export { default as SplashScreen } from './splash-screen';

// Form Components
export * from './forms';

// Layout Components
export * from './layout';

// Feedback Components
export * from './feedback';

// Navigation Components
export * from './navigation';

// UI Components
export * from './components';

// Icon Components
export { IconSymbol } from './components/IconSymbol';

// Typography exports - using default exports from individual files
export { default as Title } from './typography/Title';
export type { TitleProps } from './typography/Title';

export { default as SectionTitle } from './typography/SectionTitle';
export type { SectionTitleProps } from './typography/SectionTitle';

export { default as Subtitle } from './typography/Subtitle';
export type { SubtitleProps } from './typography/Subtitle';

export { default as Body } from './typography/Body';
export type { BodyProps } from './typography/Body';

export { default as Caption } from './typography/Caption';
export type { CaptionProps } from './typography/Caption';

export { default as Label } from './typography/Label';
export type { LabelProps } from './typography/Label';

export { default as EmptyText } from './typography/EmptyText';
export type { EmptyTextProps } from './typography/EmptyText';

// Error Boundary and Protected Screen (not moved to subdirectories)
export { ErrorBoundary, default as ErrorBoundaryDefault } from './ErrorBoundary';
export { ProtectedScreen } from './ProtectedScreen';
export type { ProtectedScreenProps } from './ProtectedScreen';
