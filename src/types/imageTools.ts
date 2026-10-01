export type ToolId =
  | 'remove-bg'
  | 'resize'
  | 'compress'
  | 'crop'
  | 'rotate'
  | 'convert'
  | 'watermark'
  | 'ocr'
  | 'enhance'
  | 'rename'
  | 'passport';

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  previewUrl: string;
  processedUrl?: string;
  processedSize?: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  unit: 'px' | '%';
  percentage: number;
  preset: string; // e.g. 'custom', 'instagram-square', 'youtube-thumb', 'hd-1080'
}

export interface CompressOptions {
  quality: number; // 1 - 100
  targetFormat: 'original' | 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number | null; // e.g. 1 (1:1), 1.777 (16:9), null for free
}

export interface RotateOptions {
  angle: number; // 0, 90, 180, 270 or arbitrary -180 to 180
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

export interface ConvertOptions {
  targetFormat: ExportFormat;
  quality: number; // 1 - 100
}

export interface WatermarkOptions {
  mode: 'text' | 'image';
  text: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  opacity: number; // 0.1 - 1
  position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'tiled' | 'custom';
  customX?: number;
  customY?: number;
  watermarkImageFile?: File;
  watermarkImageUrl?: string;
  watermarkScale?: number; // 0.1 - 2
}

export interface OcrResult {
  extractedText: string;
  wordCount: number;
  language: string;
  confidenceScore: number;
  blocks: {
    text: string;
    type: string;
    confidence: number;
  }[];
}

export interface EnhanceOptions {
  scaleFactor: 1.5 | 2 | 4;
  sharpen: number; // 0 - 2
  contrast: number; // 0.5 - 1.5
  saturation: number; // 0.5 - 1.5
  brightness: number; // 0.5 - 1.5
  denoise: boolean;
}

export interface RenameOptions {
  patternMode: 'custom' | 'prefix-suffix' | 'sequential' | 'find-replace' | 'clean';
  customName: string;
  prefix: string;
  suffix: string;
  startNumber: number;
  numberPadding: number; // e.g. 1 (1), 2 (01), 3 (001)
  findText: string;
  replaceText: string;
  casing: 'preserve' | 'lowercase' | 'uppercase' | 'titlecase';
  spaceReplacement: 'none' | 'hyphen' | 'underscore';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Business';
  dailyUsageLimit: number;
  dailyUsageCount: number;
  tokensRemaining: number;
  settings: {
    defaultExportFormat: 'PNG' | 'JPG' | 'WEBP' | 'AVIF';
    defaultCompressionQuality: number;
    autoDeleteAfterDownload: boolean;
    highDpiExport: boolean;
  };
}
