export type TemplateCategory =
  | 'Recent'
  | 'Universal'
  | 'Visa'
  | 'Passport'
  | 'ID Card'
  | 'Other'
  | 'Social'
  | 'Custom';

export interface PassportDocumentSpec {
  id: string;
  country: string;
  documentType: string;
  category: TemplateCategory;
  width: number;
  height: number;
  unit: 'mm' | 'cm' | 'inch' | 'px';
  dpi: number;
  background: 'white' | 'blue' | 'red' | 'custom' | 'any';
  flag?: string;
  description?: string;
}

export function toMillimeters(value: number, unit: 'mm' | 'cm' | 'inch' | 'px', dpi: number = 300): number {
  switch (unit) {
    case 'mm':
      return value;
    case 'cm':
      return value * 10;
    case 'inch':
      return value * 25.4;
    case 'px':
      return (value / dpi) * 25.4;
    default:
      return value;
  }
}

export function toPixels(value: number, unit: 'mm' | 'cm' | 'inch' | 'px', dpi: number = 300): number {
  switch (unit) {
    case 'px':
      return Math.round(value);
    case 'inch':
      return Math.round(value * dpi);
    case 'mm':
      return Math.round((value / 25.4) * dpi);
    case 'cm':
      return Math.round(((value * 10) / 25.4) * dpi);
    default:
      return Math.round(value);
  }
}

export function formatDimensions(spec: PassportDocumentSpec): string {
  if (spec.unit === 'inch') {
    return `${spec.width} × ${spec.height} in (${toMillimeters(spec.width, 'inch').toFixed(0)} × ${toMillimeters(spec.height, 'inch').toFixed(0)} mm)`;
  }
  if (spec.unit === 'cm') {
    return `${spec.width} × ${spec.height} cm (${toMillimeters(spec.width, 'cm').toFixed(0)} × ${toMillimeters(spec.height, 'cm').toFixed(0)} mm)`;
  }
  if (spec.unit === 'px') {
    return `${spec.width} × ${spec.height} px`;
  }
  return `${spec.width} × ${spec.height} mm`;
}

export function calculateTargetDimensions(
  spec: PassportDocumentSpec,
  targetDpi: number = spec.dpi
): { widthPx: number; heightPx: number; dpi: number } {
  return {
    widthPx: toPixels(spec.width, spec.unit, targetDpi),
    heightPx: toPixels(spec.height, spec.unit, targetDpi),
    dpi: targetDpi,
  };
}

export const PASSPORT_SPECS: PassportDocumentSpec[] = [
  // --- Universal & Standard Sizes ---
  {
    id: 'univ-2x2',
    country: 'Universal',
    documentType: 'Standard 2x2 inch Photo',
    category: 'Universal',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🌐',
    description: '51x51 mm universal standard for USA, India, etc.'
  },
  {
    id: 'univ-35x45',
    country: 'Universal',
    documentType: 'Standard 35x45 mm (ICAO)',
    category: 'Universal',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🌐',
    description: 'Most common European & international passport format'
  },
  {
    id: 'univ-30x40',
    country: 'Universal',
    documentType: 'Standard 30x40 mm Photo',
    category: 'Universal',
    width: 30.0,
    height: 40.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🌐',
    description: 'Standard ID and application photo size'
  },
  {
    id: 'univ-50x70',
    country: 'Universal',
    documentType: 'Large 50x70 mm Format',
    category: 'Universal',
    width: 50.0,
    height: 70.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🌐',
    description: 'Canadian and official government application photo'
  },

  // --- Official Passports Registry ---
  {
    id: 'us-passport',
    country: 'United States',
    documentType: 'Passport & Visa',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇺🇸',
    description: 'Dept of State 2x2 inch (51x51 mm), pure white background'
  },
  {
    id: 'uk-passport',
    country: 'United Kingdom',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇬🇧',
    description: 'HM Passport Office standard 35x45 mm, light grey or cream/white'
  },
  {
    id: 'ca-passport',
    country: 'Canada',
    documentType: 'Passport',
    category: 'Passport',
    width: 50.0,
    height: 70.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇨🇦',
    description: 'Passport Canada 50x70 mm, head size 31-36 mm'
  },
  {
    id: 'in-passport',
    country: 'India',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇮🇳',
    description: 'Govt of India standard passport 35x45 mm, plain white background'
  },
  {
    id: 'cn-passport',
    country: 'China',
    documentType: 'Passport',
    category: 'Passport',
    width: 33.0,
    height: 48.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇨🇳',
    description: 'China Ministry of Foreign Affairs 33x48 mm, head width 15-22 mm'
  },
  {
    id: 'au-passport',
    country: 'Australia',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇦🇺',
    description: 'Australian Passport Office 35x45 mm, head 32-36 mm'
  },
  {
    id: 'eu-passport',
    country: 'European Union (Schengen)',
    documentType: 'Passport & Schengen Visa',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇪🇺',
    description: 'Schengen biometric standard 35x45 mm, neutral white/light grey'
  },
  {
    id: 'de-passport',
    country: 'Germany',
    documentType: 'Passport (Reisepass)',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇩🇪',
    description: 'Bundesdruckerei biometric 35x45 mm'
  },
  {
    id: 'fr-passport',
    country: 'France',
    documentType: 'Passeport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇫🇷',
    description: 'République Française 35x45 mm, fond clair uni'
  },
  {
    id: 'jp-passport',
    country: 'Japan',
    documentType: 'Passport (Ryoken)',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇯🇵',
    description: 'Ministry of Foreign Affairs Japan 35x45 mm'
  },
  {
    id: 'af-passport',
    country: 'Afghanistan',
    documentType: 'Passport',
    category: 'Passport',
    width: 40.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇦🇫'
  },
  {
    id: 'al-passport',
    country: 'Albania',
    documentType: 'Passport',
    category: 'Passport',
    width: 4.0,
    height: 5.0,
    unit: 'cm',
    dpi: 300,
    background: 'white',
    flag: '🇦🇱'
  },
  {
    id: 'ar-passport',
    country: 'Argentina',
    documentType: 'Passport',
    category: 'Passport',
    width: 4.0,
    height: 4.0,
    unit: 'cm',
    dpi: 300,
    background: 'white',
    flag: '🇦🇷'
  },
  {
    id: 'bs-passport',
    country: 'Bahamas',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇧🇸'
  },
  {
    id: 'bd-passport',
    country: 'Bangladesh',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇧🇩'
  },
  {
    id: 'by-passport',
    country: 'Belarus',
    documentType: 'Passport',
    category: 'Passport',
    width: 40.0,
    height: 50.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇧🇾'
  },
  {
    id: 'be-passport',
    country: 'Belgium',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇧🇪'
  },
  {
    id: 'bz-passport',
    country: 'Belize',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇧🇿'
  },
  {
    id: 'bo-passport',
    country: 'Bolivia',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇧🇴'
  },
  {
    id: 'br-passport',
    country: 'Brazil',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇧🇷'
  },
  {
    id: 'bg-passport',
    country: 'Bulgaria',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇧🇬'
  },
  {
    id: 'co-passport',
    country: 'Colombia',
    documentType: 'Passport',
    category: 'Passport',
    width: 1.5,
    height: 2.5,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇨🇴'
  },
  {
    id: 'cr-passport',
    country: 'Costa Rica',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇨🇷'
  },
  {
    id: 'hr-passport',
    country: 'Croatia',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇭🇷'
  },
  {
    id: 'cy-passport',
    country: 'Cyprus',
    documentType: 'Passport',
    category: 'Passport',
    width: 40.0,
    height: 50.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇨🇾'
  },
  {
    id: 'cz-passport',
    country: 'Czech Republic',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇨🇿'
  },
  {
    id: 'dk-passport',
    country: 'Denmark',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇩🇰'
  },
  {
    id: 'ee-passport',
    country: 'Estonia',
    documentType: 'Passport',
    category: 'Passport',
    width: 40.0,
    height: 50.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇪🇪'
  },
  {
    id: 'fi-passport',
    country: 'Finland',
    documentType: 'Passport',
    category: 'Passport',
    width: 36.0,
    height: 47.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇫🇮'
  },
  {
    id: 'gr-passport',
    country: 'Greece',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇬🇷'
  },
  {
    id: 'hk-passport',
    country: 'Hong Kong',
    documentType: 'Passport',
    category: 'Passport',
    width: 40.0,
    height: 50.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇭🇰'
  },
  {
    id: 'hu-passport',
    country: 'Hungary',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇭🇺'
  },
  {
    id: 'id-passport',
    country: 'Indonesia',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇮🇩'
  },
  {
    id: 'ir-passport',
    country: 'Iran',
    documentType: 'Passport',
    category: 'Passport',
    width: 30.0,
    height: 40.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇮🇷'
  },
  {
    id: 'ie-passport',
    country: 'Ireland',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇮🇪'
  },
  {
    id: 'il-passport',
    country: 'Israel',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇮🇱'
  },
  {
    id: 'it-passport',
    country: 'Italy',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇮🇹'
  },
  {
    id: 'jm-passport',
    country: 'Jamaica',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇯🇲'
  },
  {
    id: 'ke-passport',
    country: 'Kenya',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇰🇪'
  },
  {
    id: 'kr-passport',
    country: 'Korea (South)',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇰🇷'
  },
  {
    id: 'lb-passport',
    country: 'Lebanon',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇱🇧'
  },
  {
    id: 'my-passport',
    country: 'Malaysia',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 50.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇲🇾'
  },
  {
    id: 'mx-passport',
    country: 'Mexico',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇲🇽'
  },
  {
    id: 'ma-passport',
    country: 'Morocco',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇲🇦'
  },
  {
    id: 'nl-passport',
    country: 'Netherlands',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇳🇱'
  },
  {
    id: 'nz-passport',
    country: 'New Zealand',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇳🇿'
  },
  {
    id: 'ng-passport',
    country: 'Nigeria',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇳🇬'
  },
  {
    id: 'no-passport',
    country: 'Norway',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇳🇴'
  },
  {
    id: 'pk-passport',
    country: 'Pakistan',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇵🇰'
  },
  {
    id: 'pa-passport',
    country: 'Panama',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇵🇦'
  },
  {
    id: 'pe-passport',
    country: 'Peru',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇵🇪'
  },
  {
    id: 'pl-passport',
    country: 'Poland',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇵🇱'
  },
  {
    id: 'pt-passport',
    country: 'Portugal',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇵🇹'
  },
  {
    id: 'ro-passport',
    country: 'Romania',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇷🇴'
  },
  {
    id: 'sg-passport',
    country: 'Singapore',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇸🇬'
  },
  {
    id: 'za-passport',
    country: 'South Africa',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇿🇦'
  },
  {
    id: 'es-passport',
    country: 'Spain',
    documentType: 'Passport',
    category: 'Passport',
    width: 30.0,
    height: 40.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇪🇸'
  },
  {
    id: 'se-passport',
    country: 'Sweden',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇸🇪'
  },
  {
    id: 'ch-passport',
    country: 'Switzerland',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇨🇭'
  },
  {
    id: 'sy-passport',
    country: 'Syria',
    documentType: 'Passport',
    category: 'Passport',
    width: 4.0,
    height: 6.0,
    unit: 'cm',
    dpi: 300,
    background: 'white',
    flag: '🇸🇾'
  },
  {
    id: 'tw-passport',
    country: 'Taiwan',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇹🇼'
  },
  {
    id: 'tz-passport',
    country: 'Tanzania',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇹🇿'
  },
  {
    id: 'th-passport',
    country: 'Thailand',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇹🇭'
  },
  {
    id: 'tt-passport',
    country: 'Trinidad and Tobago',
    documentType: 'Passport',
    category: 'Passport',
    width: 43.0,
    height: 53.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇹🇹'
  },
  {
    id: 'tr-passport',
    country: 'Turkey',
    documentType: 'Passport',
    category: 'Passport',
    width: 50.0,
    height: 60.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇹🇷'
  },
  {
    id: 'ua-passport',
    country: 'Ukraine',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇺🇦'
  },
  {
    id: 'uz-passport',
    country: 'Uzbekistan',
    documentType: 'Passport',
    category: 'Passport',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇺🇿'
  },
  {
    id: 've-passport',
    country: 'Venezuela',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇻🇪'
  },
  {
    id: 'vn-passport',
    country: 'Vietnam',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇻🇳'
  },
  {
    id: 'zw-passport',
    country: 'Zimbabwe',
    documentType: 'Passport',
    category: 'Passport',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇿🇼'
  },

  // --- Official Visas Registry ---
  {
    id: 'us-visa',
    country: 'United States',
    documentType: 'US Visa (DS-160)',
    category: 'Visa',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇺🇸',
    description: 'US State Dept DS-160 Nonimmigrant Visa format'
  },
  {
    id: 'cn-visa',
    country: 'China',
    documentType: 'Visa',
    category: 'Visa',
    width: 33.0,
    height: 48.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇨🇳'
  },
  {
    id: 'in-visa',
    country: 'India',
    documentType: 'Visa & OCI Card',
    category: 'Visa',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇮🇳'
  },
  {
    id: 'schengen-visa',
    country: 'Schengen Area',
    documentType: 'Schengen Visa',
    category: 'Visa',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇪🇺'
  },
  {
    id: 'br-visa',
    country: 'Brazil',
    documentType: 'Visa',
    category: 'Visa',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇧🇷'
  },
  {
    id: 'co-visa',
    country: 'Colombia',
    documentType: 'Visa',
    category: 'Visa',
    width: 3.0,
    height: 4.0,
    unit: 'cm',
    dpi: 300,
    background: 'white',
    flag: '🇨🇴'
  },
  {
    id: 'jp-visa',
    country: 'Japan',
    documentType: 'Visa',
    category: 'Visa',
    width: 45.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇯🇵'
  },
  {
    id: 'kr-visa',
    country: 'Korea',
    documentType: 'Visa',
    category: 'Visa',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇰🇷'
  },
  {
    id: 'ph-visa',
    country: 'Philippines',
    documentType: 'Visa',
    category: 'Visa',
    width: 2.0,
    height: 2.0,
    unit: 'inch',
    dpi: 300,
    background: 'white',
    flag: '🇵🇭'
  },

  // --- Official ID Cards Registry ---
  {
    id: 'national-id-std',
    country: 'Universal',
    documentType: 'National ID Card (30x40 mm)',
    category: 'ID Card',
    width: 30.0,
    height: 40.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🪪'
  },
  {
    id: 'driver-license-std',
    country: 'Universal',
    documentType: 'Driving License Photo (35x45 mm)',
    category: 'ID Card',
    width: 35.0,
    height: 45.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🪪'
  },
  {
    id: 'br-id',
    country: 'Brazil',
    documentType: 'Carteira de Identidade (RG)',
    category: 'ID Card',
    width: 3.0,
    height: 4.0,
    unit: 'cm',
    dpi: 300,
    background: 'white',
    flag: '🇧🇷'
  },
  {
    id: 'np-id',
    country: 'Nepal',
    documentType: 'ID Cards',
    category: 'ID Card',
    width: 25.0,
    height: 30.0,
    unit: 'mm',
    dpi: 300,
    background: 'white',
    flag: '🇳🇵'
  },

  // --- Social Media Sizes ---
  {
    id: 'social-ig-post',
    country: 'Social Media',
    documentType: 'Instagram Square Post',
    category: 'Social',
    width: 1080,
    height: 1080,
    unit: 'px',
    dpi: 72,
    background: 'any',
    flag: '📸'
  },
  {
    id: 'social-fb-cover',
    country: 'Social Media',
    documentType: 'Facebook Profile Cover',
    category: 'Social',
    width: 851,
    height: 315,
    unit: 'px',
    dpi: 72,
    background: 'any',
    flag: '👥'
  },
  {
    id: 'social-linkedin-cover',
    country: 'Social Media',
    documentType: 'LinkedIn Banner Cover',
    category: 'Social',
    width: 1584,
    height: 396,
    unit: 'px',
    dpi: 72,
    background: 'any',
    flag: '💼'
  },
  {
    id: 'social-pinterest',
    country: 'Social Media',
    documentType: 'Pinterest Pin Graphic',
    category: 'Social',
    width: 1000,
    height: 1500,
    unit: 'px',
    dpi: 72,
    background: 'any',
    flag: '📌'
  }
];
