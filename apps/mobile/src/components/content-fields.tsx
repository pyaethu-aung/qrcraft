import type { QRContentMode } from '@qrcraft/core';
import { cryptoUnit } from '@qrcraft/core';
import { AlertTriangle } from 'lucide-react-native';
import { StyleSheet, Switch, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useQrContent } from '@/hooks/qr-content-store';
import { useTheme } from '@/hooks/use-theme';

// Per-type field sets — shared by the content sheet's step 2 (build sequence
// step 5 originally lived on its own /form route; the two-step sheet is the
// single place content gets edited now).
export function ContentFields({ mode, store }: { mode: QRContentMode; store: ReturnType<typeof useQrContent> }) {
  switch (mode) {
    case 'text':
      return (
        <FormField
          label="Link"
          value={store.text}
          onChangeText={store.setText}
          placeholder="Paste or type a URL"
          keyboardType="url"
        />
      );

    case 'wifi':
      return (
        <>
          <Callout text="Scanning joins the network. The password stays on this device." />
          <FormField
            label="Network name (SSID)"
            value={store.wifi.ssid}
            onChangeText={(ssid) => store.setWifi({ ssid })}
            placeholder="e.g. Yoma-Guest"
          />
          {store.wifi.security !== 'nopass' ? (
            <FormField
              label="Password"
              value={store.wifi.password}
              onChangeText={(password) => store.setWifi({ password })}
              secureTextEntry
            />
          ) : null}
          <ThemedView type="surfaceRaised" glass style={styles.card}>
            <ThemedText type="label" themeColor="textSecondary">
              Security
            </ThemedText>
            <SegmentedControl
              options={[
                { value: 'WPA', label: 'WPA/WPA2' },
                { value: 'WEP', label: 'WEP' },
                { value: 'nopass', label: 'None' },
              ]}
              value={store.wifi.security}
              onChange={(security) => store.setWifi({ security })}
            />
          </ThemedView>
          <ToggleRow
            label="Hidden network"
            value={store.wifi.hidden}
            onValueChange={(hidden) => store.setWifi({ hidden })}
          />
        </>
      );

    case 'vcard':
      return (
        <>
          <FormField label="First name" value={store.vcard.firstName} onChangeText={(v) => store.setVCard({ firstName: v })} autoCapitalize="words" />
          <FormField label="Last name" value={store.vcard.lastName} onChangeText={(v) => store.setVCard({ lastName: v })} autoCapitalize="words" />
          <FormField label="Phone" value={store.vcard.phone} onChangeText={(v) => store.setVCard({ phone: v })} keyboardType="phone-pad" />
          <FormField label="Email" value={store.vcard.email} onChangeText={(v) => store.setVCard({ email: v })} keyboardType="email-address" />
          <FormField label="Company" value={store.vcard.company} onChangeText={(v) => store.setVCard({ company: v })} autoCapitalize="words" />
          <FormField label="Job title" value={store.vcard.jobTitle} onChangeText={(v) => store.setVCard({ jobTitle: v })} autoCapitalize="words" />
          <FormField label="Website" value={store.vcard.website} onChangeText={(v) => store.setVCard({ website: v })} keyboardType="url" />
        </>
      );

    case 'email':
      return (
        <>
          <FormField label="To" value={store.email.to} onChangeText={(v) => store.setEmail({ to: v })} keyboardType="email-address" placeholder="name@example.com" />
          <FormField label="Subject" value={store.email.subject} onChangeText={(v) => store.setEmail({ subject: v })} autoCapitalize="sentences" />
          <FormField label="Message" value={store.email.body} onChangeText={(v) => store.setEmail({ body: v })} autoCapitalize="sentences" multiline />
        </>
      );

    case 'sms':
      return (
        <>
          <FormField label="Number" value={store.sms.number} onChangeText={(v) => store.setSms({ number: v })} keyboardType="phone-pad" />
          <FormField label="Message" value={store.sms.message} onChangeText={(v) => store.setSms({ message: v })} autoCapitalize="sentences" multiline />
        </>
      );

    case 'tel':
      return <FormField label="Number" value={store.tel.number} onChangeText={(v) => store.setTel({ number: v })} keyboardType="phone-pad" />;

    case 'geo':
      return (
        <>
          <FormField label="Latitude" value={store.geo.latitude} onChangeText={(v) => store.setGeo({ latitude: v })} keyboardType="numbers-and-punctuation" placeholder="e.g. 16.8409" />
          <FormField label="Longitude" value={store.geo.longitude} onChangeText={(v) => store.setGeo({ longitude: v })} keyboardType="numbers-and-punctuation" placeholder="e.g. 96.1735" />
        </>
      );

    case 'vevent':
      return (
        <>
          <FormField label="Title" value={store.vevent.summary} onChangeText={(v) => store.setVEvent({ summary: v })} autoCapitalize="sentences" />
          <FormField
            label={store.vevent.allDay ? 'Date (YYYY-MM-DD)' : 'Starts (YYYY-MM-DDTHH:mm)'}
            value={store.vevent.start}
            onChangeText={(v) => store.setVEvent({ start: v })}
            placeholder={store.vevent.allDay ? '2026-03-05' : '2026-03-05T09:00'}
          />
          {!store.vevent.allDay ? (
            <FormField
              label="Ends (YYYY-MM-DDTHH:mm)"
              value={store.vevent.end}
              onChangeText={(v) => store.setVEvent({ end: v })}
              placeholder="2026-03-05T10:00"
            />
          ) : null}
          <ToggleRow label="All day" value={store.vevent.allDay} onValueChange={(allDay) => store.setVEvent({ allDay })} />
          <FormField label="Location" value={store.vevent.location} onChangeText={(v) => store.setVEvent({ location: v })} />
          <FormField label="Description" value={store.vevent.description} onChangeText={(v) => store.setVEvent({ description: v })} multiline />
        </>
      );

    case 'crypto':
      return (
        <>
          <ThemedView type="surfaceRaised" glass style={styles.card}>
            <ThemedText type="label" themeColor="textSecondary">
              Network
            </ThemedText>
            <SegmentedControl
              options={[
                { value: 'bitcoin', label: 'Bitcoin' },
                { value: 'ethereum', label: 'Ethereum' },
              ]}
              value={store.crypto.network}
              onChange={(network) => store.setCrypto({ network })}
            />
          </ThemedView>
          <FormField label="Address" value={store.crypto.address} onChangeText={(v) => store.setCrypto({ address: v })} autoCapitalize="none" />
          <FormField
            label={`Amount (${cryptoUnit(store.crypto.network)})`}
            value={store.crypto.amount}
            onChangeText={(v) => store.setCrypto({ amount: v })}
            keyboardType="decimal-pad"
          />
          {store.crypto.network === 'bitcoin' ? (
            <FormField label="Label" value={store.crypto.label} onChangeText={(v) => store.setCrypto({ label: v })} />
          ) : null}
        </>
      );
  }
}

function Callout({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.callout, { backgroundColor: theme.warningSurface, borderColor: theme.warningBorder }]}>
      <AlertTriangle size={18} color={theme.warning} />
      <ThemedText type="body" themeColor="warning" style={{ flex: 1 }}>
        {text}
      </ThemedText>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <ThemedView type="surfaceRaised" glass style={[styles.card, styles.toggleRow]}>
      <ThemedText type="body">{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.surfaceInset, true: theme.action }}
        thumbColor={theme.surfaceRaised}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
  },
});
