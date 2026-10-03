export interface SavedPhotoItem {
  id: string;
  title: string;
  type: 'passport' | 'sheet' | 'signed' | 'annotated' | 'draft' | 'raw';
  dataUrl: string;
  timestamp: number;
  templateName?: string;
  widthMm?: number;
  heightMm?: number;
  widthPx?: number;
  heightPx?: number;
  dpi?: number;
  fileSizeBytes?: number;
  compliancePassed?: boolean;
  draftState?: any;
}

export interface SavedSignatureItem {
  id: string;
  dataUrl: string;
  timestamp: number;
  title?: string;
}

const STORAGE_KEY_PHOTOS = 'image_edit_my_photos_v2';
const STORAGE_KEY_SIGNATURES = 'image_edit_saved_signatures_v2';

export function getMyPhotos(): SavedPhotoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PHOTOS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load my photos from localStorage:', err);
    return [];
  }
}

export function saveToMyPhotos(item: Omit<SavedPhotoItem, 'id' | 'timestamp'>): SavedPhotoItem {
  const photos = getMyPhotos();

  // Estimate file size from dataUrl bytes
  let sizeBytes = item.fileSizeBytes;
  if (!sizeBytes && item.dataUrl) {
    const base64Len = item.dataUrl.split(',')[1]?.length || item.dataUrl.length;
    sizeBytes = Math.round((base64Len * 3) / 4);
  }

  const newItem: SavedPhotoItem = {
    ...item,
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    fileSizeBytes: sizeBytes,
  };

  try {
    // Keep up to 60 items
    const updated = [newItem, ...photos.slice(0, 59)];
    localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(updated));
  } catch (err) {
    console.warn('Storage quota limit reached, trimming older items:', err);
    try {
      const trimmed = [newItem, ...photos.slice(0, 20)];
      localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(trimmed));
    } catch {
      // Ignore if localStorage quota exceeded
    }
  }
  return newItem;
}

export function deleteMyPhoto(id: string): void {
  const photos = getMyPhotos();
  const updated = photos.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete photo from localStorage:', err);
  }
}

export function getSavedSignatures(): SavedSignatureItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SIGNATURES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load signatures from localStorage:', err);
    return [];
  }
}

export function saveSignature(dataUrl: string, title?: string): SavedSignatureItem {
  const sigs = getSavedSignatures();
  const newSig: SavedSignatureItem = {
    id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    dataUrl,
    timestamp: Date.now(),
    title: title || `Signature ${new Date().toLocaleDateString()}`,
  };

  try {
    const updated = [newSig, ...sigs.slice(0, 29)];
    localStorage.setItem(STORAGE_KEY_SIGNATURES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save signature to localStorage:', err);
  }
  return newSig;
}

export function deleteSignature(id: string): void {
  const sigs = getSavedSignatures();
  const updated = sigs.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_SIGNATURES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete signature:', err);
  }
}
