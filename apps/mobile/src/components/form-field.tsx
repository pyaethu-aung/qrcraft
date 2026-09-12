import { useState } from 'react';
import { TextInput, View, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
}

// One glass-card field (label + value), matching every text field in the
// design mockups (Link input, Wi-Fi SSID/password, VCard fields, ...).
// Password fields get a reveal toggle, matching IosForm.dc.html.
export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'none',
  secureTextEntry,
  multiline,
  style,
}: FormFieldProps) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);

  return (
    <ThemedView type="surfaceRaised" glass style={[{ borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs / 2 }, style]}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textDisabled}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !revealed}
          multiline={multiline}
          style={{ flex: 1, fontSize: 17, color: theme.textPrimary, paddingVertical: Spacing.xs / 2 }}
        />
        {secureTextEntry ? (
          <PressableScale
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={8}>
            {revealed ? (
              <EyeOff size={19} color={theme.textSecondary} />
            ) : (
              <Eye size={19} color={theme.textSecondary} />
            )}
          </PressableScale>
        ) : null}
      </View>
    </ThemedView>
  );
}
