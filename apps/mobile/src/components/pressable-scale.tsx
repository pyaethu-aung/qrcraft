import { forwardRef } from 'react';
import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type AnimatedStyle } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** @default 0.97 */
  scaleTo?: number;
  // Widened (vs. PressableProps' plain StyleProp<ViewStyle>) so callers can
  // pass their own useAnimatedStyle() result alongside a static style, e.g.
  // for a disabled/enabled opacity crossfade (find-animation-opportunities
  // review on the Generate screen's Share button).
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
}

// Shared press-feedback wrapper: every tappable surface in the app scales
// down slightly on press so the UI confirms it heard the touch (emil-
// design-eng review — no Pressable in this app had any press feedback).
// Uses Reanimated (already a dependency) instead of the `pressed` render
// prop + inline style so the scale is a real spring-back animation, not
// an instant style swap.
export const PressableScale = forwardRef<View, PressableScaleProps>(
  ({ scaleTo = 0.97, style, onPressIn, onPressOut, ...props }, ref) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        ref={ref}
        style={[animatedStyle, style]}
        onPressIn={(e) => {
          scale.value = withTiming(scaleTo, { duration: 100 });
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withTiming(1, { duration: 160 });
          onPressOut?.(e);
        }}
        {...props}
      />
    );
  },
);
PressableScale.displayName = 'PressableScale';
