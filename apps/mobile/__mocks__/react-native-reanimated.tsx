// Jest manual mock: Reanimated v4's worklets runtime needs a native
// module (react-native-worklets/NativeWorklets) that doesn't exist under
// Jest — importing the real package throws before any test using an
// animated component even runs. This is the same class of problem as the
// react-native-mmkv mock (see that file's comment) — a minimal,
// non-reactive passthrough is enough for component tests, which only need
// the tree to render, not the animation to actually run.
import { forwardRef } from 'react';
import { View, Text, ScrollView } from 'react-native';

export function useSharedValue<T>(initial: T) {
  return { value: initial };
}

export function useAnimatedStyle<T>(fn: () => T): T {
  return fn();
}

export function withTiming<T>(toValue: T): T {
  return toValue;
}

export function withRepeat<T>(toValue: T): T {
  return toValue;
}

export function withSequence<T>(...values: T[]): T {
  return values[values.length - 1];
}

export function withDelay<T>(_delay: number, value: T): T {
  return value;
}

export function interpolateColor(_value: number, _input: number[], output: string[]): string {
  return output[0];
}

export const Easing = {
  ease: (t: number) => t,
  linear: (t: number) => t,
  in: (fn: (t: number) => number) => fn,
  out: (fn: (t: number) => number) => fn,
  inOut: (fn: (t: number) => number) => fn,
};

function chainable() {
  const obj: Record<string, unknown> = {};
  obj.duration = () => obj;
  obj.delay = () => obj;
  obj.easing = () => obj;
  return obj;
}

export const FadeIn = chainable();
export const FadeOut = chainable();

const AnimatedView = forwardRef<View, React.ComponentProps<typeof View>>((props, ref) => (
  <View ref={ref} {...props} />
));
const AnimatedText = forwardRef<Text, React.ComponentProps<typeof Text>>((props, ref) => (
  <Text ref={ref} {...props} />
));
const AnimatedScrollView = forwardRef<ScrollView, React.ComponentProps<typeof ScrollView>>((props, ref) => (
  <ScrollView ref={ref} {...props} />
));

const Animated = {
  View: AnimatedView,
  Text: AnimatedText,
  ScrollView: AnimatedScrollView,
  createAnimatedComponent: <P extends object>(Component: React.ComponentType<P>) => Component,
};

export default Animated;
