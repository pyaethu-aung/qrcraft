import {
  buildCryptoString,
  buildEmailString,
  buildGeoString,
  buildSmsString,
  buildTelString,
  buildVCardString,
  buildVEventString,
  buildWifiString,
  getCapacityStatus,
} from '@qrcraft/core';
import type {
  CryptoConfig,
  EmailConfig,
  GeoConfig,
  QRContentMode,
  QRDesignConfig,
  QRErrorCorrectionLevel,
  SmsConfig,
  TelConfig,
  VCardConfig,
  VEventConfig,
  WiFiConfig,
} from '@qrcraft/core';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_QR_BG_COLOR,
  DEFAULT_QR_DESIGN_CONFIG,
  DEFAULT_QR_EC_LEVEL,
  DEFAULT_QR_FG_COLOR,
  QR_INPUT_LENGTH_LIMIT,
} from '@/constants/qrDefaults';
import { usePatchState } from '@/hooks/use-patch-state';

// Shared across the Generate and structured-form screens (they're separate
// routes, not parent/child components like apps/web's QRControls, so the
// content-mode + per-type field state needs a home above both — a Context
// provider wrapping the (generate) stack, not per-screen local state).

const EMPTY_WIFI: WiFiConfig = { ssid: '', password: '', security: 'WPA', hidden: false };
const EMPTY_VCARD: VCardConfig = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  company: '',
  jobTitle: '',
  website: '',
};
const EMPTY_EMAIL: EmailConfig = { to: '', subject: '', body: '' };
const EMPTY_SMS: SmsConfig = { number: '', message: '' };
const EMPTY_TEL: TelConfig = { number: '' };
const EMPTY_GEO: GeoConfig = { latitude: '', longitude: '' };
const EMPTY_VEVENT: VEventConfig = {
  summary: '',
  start: '',
  end: '',
  allDay: false,
  location: '',
  description: '',
};
const EMPTY_CRYPTO: CryptoConfig = { network: 'bitcoin', address: '', amount: '', label: '' };

function buildRawValue(mode: QRContentMode, configs: {
  text: string;
  wifi: WiFiConfig;
  vcard: VCardConfig;
  email: EmailConfig;
  sms: SmsConfig;
  tel: TelConfig;
  geo: GeoConfig;
  vevent: VEventConfig;
  crypto: CryptoConfig;
}): string {
  switch (mode) {
    case 'text':
      return configs.text;
    case 'wifi':
      return buildWifiString(configs.wifi);
    case 'vcard':
      return buildVCardString(configs.vcard);
    case 'email':
      return buildEmailString(configs.email);
    case 'sms':
      return buildSmsString(configs.sms);
    case 'tel':
      return buildTelString(configs.tel);
    case 'geo':
      return buildGeoString(configs.geo);
    case 'vevent':
      return buildVEventString(configs.vevent);
    case 'crypto':
      return buildCryptoString(configs.crypto);
  }
}

/** Raw field-length proxy for the capacity counter — the built payload for
 * structured modes, or the text field itself in text mode (matches
 * apps/web: the counter measures what the user is typing, not the built
 * payload, so it stays meaningful even while a required field is missing).
 * Takes the already-built rawValue rather than calling buildRawValue again. */
function rawCapacityInput(
  mode: QRContentMode,
  configs: Parameters<typeof buildRawValue>[1],
  builtRawValue: string,
): string {
  if (mode === 'text') return configs.text;
  return builtRawValue || JSON.stringify(configs[mode]);
}

export interface QrContentStore {
  contentMode: QRContentMode;
  setContentMode: (mode: QRContentMode) => void;

  text: string;
  setText: (value: string) => void;

  wifi: WiFiConfig;
  setWifi: (patch: Partial<WiFiConfig>) => void;
  vcard: VCardConfig;
  setVCard: (patch: Partial<VCardConfig>) => void;
  email: EmailConfig;
  setEmail: (patch: Partial<EmailConfig>) => void;
  sms: SmsConfig;
  setSms: (patch: Partial<SmsConfig>) => void;
  tel: TelConfig;
  setTel: (patch: Partial<TelConfig>) => void;
  geo: GeoConfig;
  setGeo: (patch: Partial<GeoConfig>) => void;
  vevent: VEventConfig;
  setVEvent: (patch: Partial<VEventConfig>) => void;
  crypto: CryptoConfig;
  setCrypto: (patch: Partial<CryptoConfig>) => void;

  ecLevel: QRErrorCorrectionLevel;
  setEcLevel: (level: QRErrorCorrectionLevel) => void;
  fgColor: string;
  setFgColor: (color: string) => void;
  bgColor: string;
  setBgColor: (color: string) => void;
  design: QRDesignConfig;
  setDesign: (patch: Partial<QRDesignConfig>) => void;

  /** The current mode's built payload, undebounced. */
  rawValue: string;
  /** Debounced (300ms/0ms), what the QR preview actually renders. */
  liveValue: string;
  isPending: boolean;
  isUsable: boolean;
  capacityUsed: number;
  capacityMax: number;
  isNearCapacity: boolean;
  isOverCapacity: boolean;
  inputError?: string;
}

const QrContentContext = createContext<QrContentStore | null>(null);

export function QrContentProvider({ children }: { children: ReactNode }) {
  const [contentMode, setContentMode] = useState<QRContentMode>('text');
  const [text, setText] = useState('');
  // usePatchState covers every per-content-type config plus the design
  // config below: one object, patched field-by-field, with a stable setter
  // identity — a plain useCallback-wrapped setter per type here would hand
  // every consumer a brand-new store object and brand-new setter functions
  // on every keystroke otherwise (found by an /impeccable audit).
  const [wifi, setWifi] = usePatchState<WiFiConfig>(EMPTY_WIFI);
  const [vcard, setVCard] = usePatchState<VCardConfig>(EMPTY_VCARD);
  const [email, setEmail] = usePatchState<EmailConfig>(EMPTY_EMAIL);
  const [sms, setSms] = usePatchState<SmsConfig>(EMPTY_SMS);
  const [tel, setTel] = usePatchState<TelConfig>(EMPTY_TEL);
  const [geo, setGeo] = usePatchState<GeoConfig>(EMPTY_GEO);
  const [vevent, setVEvent] = usePatchState<VEventConfig>(EMPTY_VEVENT);
  const [crypto, setCrypto] = usePatchState<CryptoConfig>(EMPTY_CRYPTO);

  const [ecLevel, setEcLevel] = useState<QRErrorCorrectionLevel>(DEFAULT_QR_EC_LEVEL);
  const [fgColor, setFgColor] = useState(DEFAULT_QR_FG_COLOR);
  const [bgColor, setBgColor] = useState(DEFAULT_QR_BG_COLOR);
  const [design, setDesign] = usePatchState<QRDesignConfig>(DEFAULT_QR_DESIGN_CONFIG);

  const [liveValue, setLiveValue] = useState('');

  const configs = { text, wifi, vcard, email, sms, tel, geo, vevent, crypto };
  const rawValue = buildRawValue(contentMode, configs);

  const inputError =
    contentMode === 'text' && text.length > QR_INPUT_LENGTH_LIMIT
      ? `Input too long (max ${QR_INPUT_LENGTH_LIMIT} characters)`
      : undefined;

  const capacityInput = rawCapacityInput(contentMode, configs, rawValue);
  const capacity = getCapacityStatus(capacityInput, ecLevel);
  const isBlocked = Boolean(inputError) || capacity.isOverLimit;
  const isUsable = Boolean(rawValue.trim()) && !isBlocked;

  useEffect(() => {
    const effective = isUsable ? rawValue.trim() : '';
    const delay = effective ? 300 : 0;
    const timer = setTimeout(() => setLiveValue(effective), delay);
    return () => clearTimeout(timer);
  }, [rawValue, isUsable]);

  const isPending = isUsable && liveValue !== rawValue.trim();

  const store: QrContentStore = useMemo(
    () => ({
      contentMode,
      setContentMode,
      text,
      setText,
      wifi,
      setWifi,
      vcard,
      setVCard,
      email,
      setEmail,
      sms,
      setSms,
      tel,
      setTel,
      geo,
      setGeo,
      vevent,
      setVEvent,
      crypto,
      setCrypto,
      ecLevel,
      setEcLevel,
      fgColor,
      setFgColor,
      bgColor,
      setBgColor,
      design,
      setDesign,
      rawValue,
      liveValue,
      isPending,
      isUsable,
      capacityUsed: capacity.used,
      capacityMax: capacity.max,
      isNearCapacity: capacity.isNearLimit,
      isOverCapacity: capacity.isOverLimit,
      inputError,
    }),
    [
      contentMode,
      text,
      wifi,
      setWifi,
      vcard,
      setVCard,
      email,
      setEmail,
      sms,
      setSms,
      tel,
      setTel,
      geo,
      setGeo,
      vevent,
      setVEvent,
      crypto,
      setCrypto,
      ecLevel,
      fgColor,
      bgColor,
      design,
      setDesign,
      rawValue,
      liveValue,
      isPending,
      isUsable,
      capacity.used,
      capacity.max,
      capacity.isNearLimit,
      capacity.isOverLimit,
      inputError,
    ],
  );

  return <QrContentContext.Provider value={store}>{children}</QrContentContext.Provider>;
}

export function useQrContent(): QrContentStore {
  const store = useContext(QrContentContext);
  if (!store) {
    throw new Error('useQrContent must be used within a QrContentProvider');
  }
  return store;
}
