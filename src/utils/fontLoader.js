let fontLoadPromise = null;

function arrayBufferToBase64(buffer) {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function loadFonts() {
  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = (async () => {
    const pdfMake = (await import('pdfmake/build/pdfmake')).default;

    if (pdfMake.vfs && pdfMake.vfs['NotoSansSC-Regular.otf']) return;

    const [regularRes, boldRes] = await Promise.all([
      fetch('/fonts/NotoSansSC-Regular.otf'),
      fetch('/fonts/NotoSansSC-Bold.otf'),
    ]);

    const [regularBuf, boldBuf] = await Promise.all([
      regularRes.arrayBuffer(),
      boldRes.arrayBuffer(),
    ]);

    const [regularB64, boldB64] = await Promise.all([
      arrayBufferToBase64(regularBuf),
      arrayBufferToBase64(boldBuf),
    ]);

    pdfMake.addFontContainer({
      vfs: {
        'NotoSansSC-Regular.otf': { data: regularB64, encoding: 'base64' },
        'NotoSansSC-Bold.otf': { data: boldB64, encoding: 'base64' },
      },
      fonts: {
        NotoSansSC: {
          normal: 'NotoSansSC-Regular.otf',
          bold: 'NotoSansSC-Bold.otf',
          italics: 'NotoSansSC-Regular.otf',
          bolditalics: 'NotoSansSC-Bold.otf',
        },
      },
    });
  })();

  return fontLoadPromise;
}
