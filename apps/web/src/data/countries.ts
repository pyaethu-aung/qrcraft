// ISO 3166-1 alpha-2 codes with ITU international dial codes. Display names are
// not stored here — they come from `Intl.DisplayNames` (see src/utils/country.ts)
// so English and Burmese names stay correct without a hand-maintained list.
//
// Several territories share a dial code (e.g. +1, +7, +44). Ties when detecting a
// country from a typed "+..." number are resolved by SHARED_DIAL_PRIMARY below,
// not by array order, so the list can stay alphabetical by English name.

export interface Country {
  /** ISO 3166-1 alpha-2 code, e.g. "MM". */
  iso: string
  /** International dial code with leading +, e.g. "+95". */
  dialCode: string
}

/** Preferred country when a bare dial code is shared by several territories. */
export const SHARED_DIAL_PRIMARY: Record<string, string> = {
  '+1': 'US',
  '+7': 'RU',
  '+39': 'IT',
  '+44': 'GB',
  '+47': 'NO',
  '+61': 'AU',
  '+212': 'MA',
  '+262': 'RE',
  '+290': 'SH',
  '+358': 'FI',
  '+500': 'FK',
  '+590': 'GP',
  '+599': 'CW',
}

export const COUNTRIES: Country[] = [
  { iso: 'AF', dialCode: '+93' }, // Afghanistan
  { iso: 'AX', dialCode: '+358' }, // Åland Islands
  { iso: 'AL', dialCode: '+355' }, // Albania
  { iso: 'DZ', dialCode: '+213' }, // Algeria
  { iso: 'AS', dialCode: '+1' }, // American Samoa
  { iso: 'AD', dialCode: '+376' }, // Andorra
  { iso: 'AO', dialCode: '+244' }, // Angola
  { iso: 'AI', dialCode: '+1' }, // Anguilla
  { iso: 'AG', dialCode: '+1' }, // Antigua & Barbuda
  { iso: 'AR', dialCode: '+54' }, // Argentina
  { iso: 'AM', dialCode: '+374' }, // Armenia
  { iso: 'AW', dialCode: '+297' }, // Aruba
  { iso: 'AU', dialCode: '+61' }, // Australia
  { iso: 'AT', dialCode: '+43' }, // Austria
  { iso: 'AZ', dialCode: '+994' }, // Azerbaijan
  { iso: 'BS', dialCode: '+1' }, // Bahamas
  { iso: 'BH', dialCode: '+973' }, // Bahrain
  { iso: 'BD', dialCode: '+880' }, // Bangladesh
  { iso: 'BB', dialCode: '+1' }, // Barbados
  { iso: 'BY', dialCode: '+375' }, // Belarus
  { iso: 'BE', dialCode: '+32' }, // Belgium
  { iso: 'BZ', dialCode: '+501' }, // Belize
  { iso: 'BJ', dialCode: '+229' }, // Benin
  { iso: 'BM', dialCode: '+1' }, // Bermuda
  { iso: 'BT', dialCode: '+975' }, // Bhutan
  { iso: 'BO', dialCode: '+591' }, // Bolivia
  { iso: 'BQ', dialCode: '+599' }, // Caribbean Netherlands
  { iso: 'BA', dialCode: '+387' }, // Bosnia & Herzegovina
  { iso: 'BW', dialCode: '+267' }, // Botswana
  { iso: 'BR', dialCode: '+55' }, // Brazil
  { iso: 'IO', dialCode: '+246' }, // British Indian Ocean Territory
  { iso: 'VG', dialCode: '+1' }, // British Virgin Islands
  { iso: 'BN', dialCode: '+673' }, // Brunei
  { iso: 'BG', dialCode: '+359' }, // Bulgaria
  { iso: 'BF', dialCode: '+226' }, // Burkina Faso
  { iso: 'BI', dialCode: '+257' }, // Burundi
  { iso: 'KH', dialCode: '+855' }, // Cambodia
  { iso: 'CM', dialCode: '+237' }, // Cameroon
  { iso: 'CA', dialCode: '+1' }, // Canada
  { iso: 'CV', dialCode: '+238' }, // Cape Verde
  { iso: 'KY', dialCode: '+1' }, // Cayman Islands
  { iso: 'CF', dialCode: '+236' }, // Central African Republic
  { iso: 'TD', dialCode: '+235' }, // Chad
  { iso: 'CL', dialCode: '+56' }, // Chile
  { iso: 'CN', dialCode: '+86' }, // China
  { iso: 'CX', dialCode: '+61' }, // Christmas Island
  { iso: 'CC', dialCode: '+61' }, // Cocos (Keeling) Islands
  { iso: 'CO', dialCode: '+57' }, // Colombia
  { iso: 'KM', dialCode: '+269' }, // Comoros
  { iso: 'CG', dialCode: '+242' }, // Congo - Brazzaville
  { iso: 'CD', dialCode: '+243' }, // Congo - Kinshasa
  { iso: 'CK', dialCode: '+682' }, // Cook Islands
  { iso: 'CR', dialCode: '+506' }, // Costa Rica
  { iso: 'CI', dialCode: '+225' }, // Côte d'Ivoire
  { iso: 'HR', dialCode: '+385' }, // Croatia
  { iso: 'CU', dialCode: '+53' }, // Cuba
  { iso: 'CW', dialCode: '+599' }, // Curaçao
  { iso: 'CY', dialCode: '+357' }, // Cyprus
  { iso: 'CZ', dialCode: '+420' }, // Czechia
  { iso: 'DK', dialCode: '+45' }, // Denmark
  { iso: 'DJ', dialCode: '+253' }, // Djibouti
  { iso: 'DM', dialCode: '+1' }, // Dominica
  { iso: 'DO', dialCode: '+1' }, // Dominican Republic
  { iso: 'EC', dialCode: '+593' }, // Ecuador
  { iso: 'EG', dialCode: '+20' }, // Egypt
  { iso: 'SV', dialCode: '+503' }, // El Salvador
  { iso: 'GQ', dialCode: '+240' }, // Equatorial Guinea
  { iso: 'ER', dialCode: '+291' }, // Eritrea
  { iso: 'EE', dialCode: '+372' }, // Estonia
  { iso: 'SZ', dialCode: '+268' }, // Eswatini
  { iso: 'ET', dialCode: '+251' }, // Ethiopia
  { iso: 'FK', dialCode: '+500' }, // Falkland Islands
  { iso: 'FO', dialCode: '+298' }, // Faroe Islands
  { iso: 'FJ', dialCode: '+679' }, // Fiji
  { iso: 'FI', dialCode: '+358' }, // Finland
  { iso: 'FR', dialCode: '+33' }, // France
  { iso: 'GF', dialCode: '+594' }, // French Guiana
  { iso: 'PF', dialCode: '+689' }, // French Polynesia
  { iso: 'GA', dialCode: '+241' }, // Gabon
  { iso: 'GM', dialCode: '+220' }, // Gambia
  { iso: 'GE', dialCode: '+995' }, // Georgia
  { iso: 'DE', dialCode: '+49' }, // Germany
  { iso: 'GH', dialCode: '+233' }, // Ghana
  { iso: 'GI', dialCode: '+350' }, // Gibraltar
  { iso: 'GR', dialCode: '+30' }, // Greece
  { iso: 'GL', dialCode: '+299' }, // Greenland
  { iso: 'GD', dialCode: '+1' }, // Grenada
  { iso: 'GP', dialCode: '+590' }, // Guadeloupe
  { iso: 'GU', dialCode: '+1' }, // Guam
  { iso: 'GT', dialCode: '+502' }, // Guatemala
  { iso: 'GG', dialCode: '+44' }, // Guernsey
  { iso: 'GN', dialCode: '+224' }, // Guinea
  { iso: 'GW', dialCode: '+245' }, // Guinea-Bissau
  { iso: 'GY', dialCode: '+592' }, // Guyana
  { iso: 'HT', dialCode: '+509' }, // Haiti
  { iso: 'HN', dialCode: '+504' }, // Honduras
  { iso: 'HK', dialCode: '+852' }, // Hong Kong
  { iso: 'HU', dialCode: '+36' }, // Hungary
  { iso: 'IS', dialCode: '+354' }, // Iceland
  { iso: 'IN', dialCode: '+91' }, // India
  { iso: 'ID', dialCode: '+62' }, // Indonesia
  { iso: 'IR', dialCode: '+98' }, // Iran
  { iso: 'IQ', dialCode: '+964' }, // Iraq
  { iso: 'IE', dialCode: '+353' }, // Ireland
  { iso: 'IM', dialCode: '+44' }, // Isle of Man
  { iso: 'IL', dialCode: '+972' }, // Israel
  { iso: 'IT', dialCode: '+39' }, // Italy
  { iso: 'JM', dialCode: '+1' }, // Jamaica
  { iso: 'JP', dialCode: '+81' }, // Japan
  { iso: 'JE', dialCode: '+44' }, // Jersey
  { iso: 'JO', dialCode: '+962' }, // Jordan
  { iso: 'KZ', dialCode: '+7' }, // Kazakhstan
  { iso: 'KE', dialCode: '+254' }, // Kenya
  { iso: 'KI', dialCode: '+686' }, // Kiribati
  { iso: 'XK', dialCode: '+383' }, // Kosovo
  { iso: 'KW', dialCode: '+965' }, // Kuwait
  { iso: 'KG', dialCode: '+996' }, // Kyrgyzstan
  { iso: 'LA', dialCode: '+856' }, // Laos
  { iso: 'LV', dialCode: '+371' }, // Latvia
  { iso: 'LB', dialCode: '+961' }, // Lebanon
  { iso: 'LS', dialCode: '+266' }, // Lesotho
  { iso: 'LR', dialCode: '+231' }, // Liberia
  { iso: 'LY', dialCode: '+218' }, // Libya
  { iso: 'LI', dialCode: '+423' }, // Liechtenstein
  { iso: 'LT', dialCode: '+370' }, // Lithuania
  { iso: 'LU', dialCode: '+352' }, // Luxembourg
  { iso: 'MO', dialCode: '+853' }, // Macao
  { iso: 'MG', dialCode: '+261' }, // Madagascar
  { iso: 'MW', dialCode: '+265' }, // Malawi
  { iso: 'MY', dialCode: '+60' }, // Malaysia
  { iso: 'MV', dialCode: '+960' }, // Maldives
  { iso: 'ML', dialCode: '+223' }, // Mali
  { iso: 'MT', dialCode: '+356' }, // Malta
  { iso: 'MH', dialCode: '+692' }, // Marshall Islands
  { iso: 'MQ', dialCode: '+596' }, // Martinique
  { iso: 'MR', dialCode: '+222' }, // Mauritania
  { iso: 'MU', dialCode: '+230' }, // Mauritius
  { iso: 'YT', dialCode: '+262' }, // Mayotte
  { iso: 'MX', dialCode: '+52' }, // Mexico
  { iso: 'FM', dialCode: '+691' }, // Micronesia
  { iso: 'MD', dialCode: '+373' }, // Moldova
  { iso: 'MC', dialCode: '+377' }, // Monaco
  { iso: 'MN', dialCode: '+976' }, // Mongolia
  { iso: 'ME', dialCode: '+382' }, // Montenegro
  { iso: 'MS', dialCode: '+1' }, // Montserrat
  { iso: 'MA', dialCode: '+212' }, // Morocco
  { iso: 'MZ', dialCode: '+258' }, // Mozambique
  { iso: 'MM', dialCode: '+95' }, // Myanmar
  { iso: 'NA', dialCode: '+264' }, // Namibia
  { iso: 'NR', dialCode: '+674' }, // Nauru
  { iso: 'NP', dialCode: '+977' }, // Nepal
  { iso: 'NL', dialCode: '+31' }, // Netherlands
  { iso: 'NC', dialCode: '+687' }, // New Caledonia
  { iso: 'NZ', dialCode: '+64' }, // New Zealand
  { iso: 'NI', dialCode: '+505' }, // Nicaragua
  { iso: 'NE', dialCode: '+227' }, // Niger
  { iso: 'NG', dialCode: '+234' }, // Nigeria
  { iso: 'NU', dialCode: '+683' }, // Niue
  { iso: 'NF', dialCode: '+672' }, // Norfolk Island
  { iso: 'KP', dialCode: '+850' }, // North Korea
  { iso: 'MK', dialCode: '+389' }, // North Macedonia
  { iso: 'MP', dialCode: '+1' }, // Northern Mariana Islands
  { iso: 'NO', dialCode: '+47' }, // Norway
  { iso: 'OM', dialCode: '+968' }, // Oman
  { iso: 'PK', dialCode: '+92' }, // Pakistan
  { iso: 'PW', dialCode: '+680' }, // Palau
  { iso: 'PS', dialCode: '+970' }, // Palestine
  { iso: 'PA', dialCode: '+507' }, // Panama
  { iso: 'PG', dialCode: '+675' }, // Papua New Guinea
  { iso: 'PY', dialCode: '+595' }, // Paraguay
  { iso: 'PE', dialCode: '+51' }, // Peru
  { iso: 'PH', dialCode: '+63' }, // Philippines
  { iso: 'PL', dialCode: '+48' }, // Poland
  { iso: 'PT', dialCode: '+351' }, // Portugal
  { iso: 'PR', dialCode: '+1' }, // Puerto Rico
  { iso: 'QA', dialCode: '+974' }, // Qatar
  { iso: 'RE', dialCode: '+262' }, // Réunion
  { iso: 'RO', dialCode: '+40' }, // Romania
  { iso: 'RU', dialCode: '+7' }, // Russia
  { iso: 'RW', dialCode: '+250' }, // Rwanda
  { iso: 'BL', dialCode: '+590' }, // St. Barthélemy
  { iso: 'SH', dialCode: '+290' }, // St. Helena
  { iso: 'KN', dialCode: '+1' }, // St. Kitts & Nevis
  { iso: 'LC', dialCode: '+1' }, // St. Lucia
  { iso: 'MF', dialCode: '+590' }, // St. Martin
  { iso: 'PM', dialCode: '+508' }, // St. Pierre & Miquelon
  { iso: 'VC', dialCode: '+1' }, // St. Vincent & Grenadines
  { iso: 'WS', dialCode: '+685' }, // Samoa
  { iso: 'SM', dialCode: '+378' }, // San Marino
  { iso: 'ST', dialCode: '+239' }, // São Tomé & Príncipe
  { iso: 'SA', dialCode: '+966' }, // Saudi Arabia
  { iso: 'SN', dialCode: '+221' }, // Senegal
  { iso: 'RS', dialCode: '+381' }, // Serbia
  { iso: 'SC', dialCode: '+248' }, // Seychelles
  { iso: 'SL', dialCode: '+232' }, // Sierra Leone
  { iso: 'SG', dialCode: '+65' }, // Singapore
  { iso: 'SX', dialCode: '+1' }, // Sint Maarten
  { iso: 'SK', dialCode: '+421' }, // Slovakia
  { iso: 'SI', dialCode: '+386' }, // Slovenia
  { iso: 'SB', dialCode: '+677' }, // Solomon Islands
  { iso: 'SO', dialCode: '+252' }, // Somalia
  { iso: 'ZA', dialCode: '+27' }, // South Africa
  { iso: 'GS', dialCode: '+500' }, // South Georgia & South Sandwich Islands
  { iso: 'KR', dialCode: '+82' }, // South Korea
  { iso: 'SS', dialCode: '+211' }, // South Sudan
  { iso: 'ES', dialCode: '+34' }, // Spain
  { iso: 'LK', dialCode: '+94' }, // Sri Lanka
  { iso: 'SD', dialCode: '+249' }, // Sudan
  { iso: 'SR', dialCode: '+597' }, // Suriname
  { iso: 'SJ', dialCode: '+47' }, // Svalbard & Jan Mayen
  { iso: 'SE', dialCode: '+46' }, // Sweden
  { iso: 'CH', dialCode: '+41' }, // Switzerland
  { iso: 'SY', dialCode: '+963' }, // Syria
  { iso: 'TW', dialCode: '+886' }, // Taiwan
  { iso: 'TJ', dialCode: '+992' }, // Tajikistan
  { iso: 'TZ', dialCode: '+255' }, // Tanzania
  { iso: 'TH', dialCode: '+66' }, // Thailand
  { iso: 'TL', dialCode: '+670' }, // Timor-Leste
  { iso: 'TG', dialCode: '+228' }, // Togo
  { iso: 'TK', dialCode: '+690' }, // Tokelau
  { iso: 'TO', dialCode: '+676' }, // Tonga
  { iso: 'TT', dialCode: '+1' }, // Trinidad & Tobago
  { iso: 'TN', dialCode: '+216' }, // Tunisia
  { iso: 'TR', dialCode: '+90' }, // Turkey
  { iso: 'TM', dialCode: '+993' }, // Turkmenistan
  { iso: 'TC', dialCode: '+1' }, // Turks & Caicos Islands
  { iso: 'TV', dialCode: '+688' }, // Tuvalu
  { iso: 'UG', dialCode: '+256' }, // Uganda
  { iso: 'UA', dialCode: '+380' }, // Ukraine
  { iso: 'AE', dialCode: '+971' }, // United Arab Emirates
  { iso: 'GB', dialCode: '+44' }, // United Kingdom
  { iso: 'US', dialCode: '+1' }, // United States
  { iso: 'UY', dialCode: '+598' }, // Uruguay
  { iso: 'UZ', dialCode: '+998' }, // Uzbekistan
  { iso: 'VU', dialCode: '+678' }, // Vanuatu
  { iso: 'VA', dialCode: '+39' }, // Vatican City
  { iso: 'VE', dialCode: '+58' }, // Venezuela
  { iso: 'VN', dialCode: '+84' }, // Vietnam
  { iso: 'VI', dialCode: '+1' }, // U.S. Virgin Islands
  { iso: 'WF', dialCode: '+681' }, // Wallis & Futuna
  { iso: 'EH', dialCode: '+212' }, // Western Sahara
  { iso: 'YE', dialCode: '+967' }, // Yemen
  { iso: 'ZM', dialCode: '+260' }, // Zambia
  { iso: 'ZW', dialCode: '+263' }, // Zimbabwe
]
