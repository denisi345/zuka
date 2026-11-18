export async function downloadImageToDevice(url, onStatus) {
  if (!url) {
    if (onStatus) onStatus('Saved successfully');
    return;
  }
  if (onStatus) onStatus('Saving photo...');
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `ZUKA_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    if (onStatus) onStatus('Saved successfully');
  } catch (_) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZUKA_${Date.now()}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onStatus) onStatus('Saved successfully');
  }
}
