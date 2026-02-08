export async function captureFrameAsBase64(
  videoElement: HTMLVideoElement,
  quality: number = 0.8
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Draw the current video frame to the canvas
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Convert to blob then base64
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to capture frame'));
          return;
        }
        try {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        } catch (error) {
          reject(error);
        }
      },
      'image/jpeg',
      quality
    );
  });
}
