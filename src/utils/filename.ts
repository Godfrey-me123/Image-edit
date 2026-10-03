export const generateBigstaFilename = (originalName: string, extension: string): string => {
  const date = new Date().toISOString().split('T')[0];
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `Bigsta -${baseName}.. (${date}).${extension}`;
};
