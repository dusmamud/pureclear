/**
 * Thumbnails are DISPLAY ONLY — they never touch the cleaned file.
 * Images: canvas. HEIC: heic2any (lazy). PDF: pdfjs-dist first page (lazy).
 */

const MAX_DIM = 320;

function canvasThumb(
  img: CanvasImageSource,
  w: number,
  h: number,
): Promise<Blob> {
  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.7,
    );
  });
}

export async function imageThumbnail(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image load failed"));
      img.src = url;
    });
    const blob = await canvasThumb(img, img.naturalWidth, img.naturalHeight);
    return URL.createObjectURL(blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function heicThumbnail(file: File): Promise<string> {
  const { default: heic2any } = await import("heic2any");
  const converted = (await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.6,
  })) as Blob;
  const url = URL.createObjectURL(converted);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("heic preview failed"));
      img.src = url;
    });
    const blob = await canvasThumb(img, img.naturalWidth, img.naturalHeight);
    return URL.createObjectURL(blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function pdfThumbnail(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (
    await import("pdfjs-dist/build/pdf.worker.min.mjs?worker&url")
  ).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(
    1,
    MAX_DIM / Math.max(viewport.width, viewport.height),
  );
  const scaled = page.getViewport({ scale: viewport.scale * scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(scaled.width);
  canvas.height = Math.round(scaled.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  await page.render({ canvasContext: ctx, viewport: scaled } as never).promise;
  const destroy = (pdf as unknown as { destroy?: () => Promise<void> }).destroy;
  if (destroy) await destroy.call(pdf);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.7,
    ),
  );
  return URL.createObjectURL(blob);
}

export async function videoThumbnail(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("video load failed"));
      video.src = url;
    });
    video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });
    const blob = await canvasThumb(video, video.videoWidth, video.videoHeight);
    return URL.createObjectURL(blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}
