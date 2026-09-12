import { useIsFocused, useRouter } from 'expo-router';
import { Zap, ZapOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const VIEWFINDER_SIZE = 248;
const VIEWFINDER_INSET = 24; // matches the mockup's line inset from the frame edges

// Native barcode scanning (FR: no in-house decode loop) via
// react-native-vision-camera's codeScanner — pinned to v4.7.3, not the
// installed-by-default v5 (its object-detection replacement is iOS-only as
// of this SDK; v4's codeScanner is the cross-platform one). Camera-from-
// Photos import is deferred: decoding a *static* image needs raw pixel
// data (@qrcraft/core/utils/qrDecode expects that), which needs its own
// image-loading pipeline RN doesn't give for free — not built this pass.
export default function ScanScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [torchOn, setTorchOn] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      void requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const value = codes[0]?.value;
      if (!value || value === lastScanned) return;
      setLastScanned(value);
      router.push({ pathname: '/(scan)/result', params: { value } });
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <ThemedText type="body" themeColor="textSecondary" style={styles.permissionText}>
          QRCraft needs camera access to scan codes.
        </ThemedText>
        <PressableScale onPress={() => void requestPermission()} accessibilityRole="button" style={styles.permissionButton}>
          <ThemedText type="label" themeColor="actionFg">
            Grant camera access
          </ThemedText>
        </PressableScale>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <ThemedText type="body" themeColor="textSecondary">
          No camera available on this device.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        codeScanner={codeScanner}
        torch={torchOn ? 'on' : 'off'}
      />

      <View style={styles.viewfinderWrap}>
        <View style={styles.viewfinder}>
          <ScanLine active={isFocused} />
        </View>
      </View>

      <View style={styles.captionWrap}>
        <ThemedText type="title" style={styles.caption}>
          Point at a QR code
        </ThemedText>
        <ThemedText type="body" style={styles.captionSub}>
          Read on your device, never uploaded
        </ThemedText>
      </View>

      <View style={styles.controls}>
        <PressableScale
          onPress={() => setTorchOn((t) => !t)}
          accessibilityRole="button"
          accessibilityState={{ selected: torchOn }}
          style={styles.controlButton}>
          {torchOn ? <Zap size={18} color="#F3EBE2" /> : <ZapOff size={18} color="#F3EBE2" />}
          <ThemedText type="label" style={styles.controlLabel}>
            Torch
          </ThemedText>
        </PressableScale>
      </View>
    </View>
  );
}

// The moving line that tells the user the camera is actually looking for a
// code — the viewfinder had no motion at all before this (emil-design-eng
// review: "the one screen where continuous motion is earned"). Rare/
// continuous-while-scanning, so `withRepeat` + a slow ease-in-out is the
// right easing per the animation decision framework (constant on-screen
// motion, not a UI state change).
function ScanLine({ active }: { active: boolean }) {
  const travel = VIEWFINDER_SIZE - VIEWFINDER_INSET * 2;
  const offset = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    offset.value = withRepeat(
      withTiming(travel, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [active, offset, travel]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View style={[styles.scanLine, animatedStyle]}>
      <Svg width={VIEWFINDER_SIZE - VIEWFINDER_INSET * 2} height={2}>
        <Defs>
          <LinearGradient id="scanLineGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#D4916E" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#D4916E" stopOpacity={1} />
            <Stop offset="1" stopColor="#D4916E" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height={2} fill="url(#scanLineGradient)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0B09',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: '#0E0B09',
  },
  permissionText: {
    textAlign: 'center',
    color: '#F3EBE2',
  },
  permissionButton: {
    height: 48,
    paddingHorizontal: Spacing.xl,
    borderRadius: 24,
    backgroundColor: '#A04D28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#D4916E',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: VIEWFINDER_INSET - 4,
    top: VIEWFINDER_INSET - 4,
  },
  captionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 140,
    alignItems: 'center',
    gap: 6,
  },
  caption: {
    color: '#F3EBE2',
  },
  captionSub: {
    color: '#A89E93',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 90,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  controlButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.13)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    color: '#F3EBE2',
  },
});
