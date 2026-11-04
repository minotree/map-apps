export async function stampImage(file: File, latitude: number, longitude: number, address: string, takenAt: Date): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > 2560 || height > 2560) {
          const ratio = Math.min(2560 / width, 2560 / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const textAreaHeight = 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, height - textAreaHeight, width, textAreaHeight);

        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'top';

        const formattedAddress = address.replace(/ /g, '\n');
        const lines = formattedAddress.split('\n');
        let y = height - textAreaHeight + 5;
        for (const line of lines) {
          ctx.fillText(line, 10, y);
          y += 20;
        }

        ctx.fillText(`GPS ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, 10, y);
        y += 20;
        ctx.fillText(`Taken at: ${takenAt.toLocaleString()}`, 10, y);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg');
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = event.target!.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

