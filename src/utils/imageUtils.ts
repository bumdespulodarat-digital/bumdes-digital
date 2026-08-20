/**
 * Mengambil gambar dari URL (termasuk dari direktori public) dan mengonversinya ke Base64.
 * Base64 diperlukan untuk meletakkan gambar (logo) ke dalam pdfMake dan ExcelJS.
 */
export const fetchImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}`);
    }
    // Validate that the response is actually an image (not an HTML SPA fallback)
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Response from ${url} is not an image (content-type: ${contentType})`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return '';
  }
};
