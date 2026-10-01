export interface PassportDocumentSpec {
  country: string;
  document: string;
  widthMm: number;
  heightMm: number;
  dpi: number;
  backgroundRequirements: 'white' | 'blue' | 'red' | 'any';
  minResolution: { width: number; height: number };
  maxFileSizeKb: number;
  allowedFormats: ('jpg' | 'png')[];
}

export const PASSPORT_SPECS: PassportDocumentSpec[] = [
  {
    country: 'Tanzania',
    document: 'Passport',
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    backgroundRequirements: 'white',
    minResolution: { width: 413, height: 531 },
    maxFileSizeKb: 200,
    allowedFormats: ['jpg'],
  },
  {
    country: 'United Kingdom',
    document: 'Passport',
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    backgroundRequirements: 'white',
    minResolution: { width: 413, height: 531 },
    maxFileSizeKb: 1024,
    allowedFormats: ['jpg'],
  },
];
