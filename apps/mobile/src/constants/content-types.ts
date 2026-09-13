import type { QRContentMode } from '@qrcraft/core';
import { Calendar, Contact, CreditCard, Link, Mail, MapPin, MessageSquare, Phone, Wifi } from 'lucide-react-native';
import type { ComponentType } from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

export interface ContentTypeMeta {
  label: string;
  sfSymbol: SFSymbol;
  // lucide-react-native's icon components all share this shape; used as the
  // Android/web fallback for SymbolView (SF Symbols only render on iOS).
  Icon: ComponentType<{ size?: number; color?: string }>;
}

export const CONTENT_TYPE_META: Record<QRContentMode, ContentTypeMeta> = {
  text: { label: 'Link', sfSymbol: 'link', Icon: Link },
  wifi: { label: 'Wi-Fi', sfSymbol: 'wifi', Icon: Wifi },
  vcard: { label: 'Contact', sfSymbol: 'person.crop.square', Icon: Contact },
  email: { label: 'Email', sfSymbol: 'envelope', Icon: Mail },
  sms: { label: 'SMS', sfSymbol: 'message', Icon: MessageSquare },
  tel: { label: 'Phone', sfSymbol: 'phone', Icon: Phone },
  geo: { label: 'Location', sfSymbol: 'mappin.and.ellipse', Icon: MapPin },
  vevent: { label: 'Event', sfSymbol: 'calendar', Icon: Calendar },
  crypto: { label: 'Crypto', sfSymbol: 'creditcard', Icon: CreditCard },
};

// Grouping from the /prototype comparison's "Grouped" variant — the winner
// picked over a flat 3x3 grid and a descriptive list.
export const CONTENT_TYPE_GROUPS: { name: string; modes: QRContentMode[] }[] = [
  { name: 'Connect', modes: ['text', 'wifi'] },
  { name: 'People & places', modes: ['vcard', 'geo', 'vevent'] },
  { name: 'Get in touch', modes: ['email', 'sms', 'tel'] },
  { name: 'Pay', modes: ['crypto'] },
];
