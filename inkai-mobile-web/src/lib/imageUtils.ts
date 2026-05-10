/**
 * Compresses an image file to be under a specific size (in bytes)
 * @param file The original image file
 * @param maxSizeKB The maximum allowed size in KB
 * @returns A promise that resolves to the compressed File
 */
export async function compressImage(file: File, maxSizeKB: number = 250): Promise<File> {
  // Skip compression for PDF files
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return file;
  }
  
  const maxSizeBytes = maxSizeKB * 1024;
  if (file.size <= maxSizeBytes) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension 1600px
        const MAX_DIM = 1600;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Iteratively reduce quality to hit target size
        while (dataUrl.length * 0.75 > maxSizeBytes && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Convert dataUrl back to File
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        
        resolve(new File([u8arr], file.name, { type: mime }));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
