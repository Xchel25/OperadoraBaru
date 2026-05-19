// Genera una huella única del dispositivo usando propiedades del navegador
export async function getDeviceFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.platform || "",
    navigator.vendor || "",
  ];

  const raw    = parts.join("|");
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Genera un label legible: "Chrome en Windows", "Safari en iPhone", etc.
export function getDeviceLabel() {
  const ua = navigator.userAgent;
  let browser = "Navegador";
  let os      = "desconocido";

  if      (ua.includes("Edg"))                            browser = "Edge";
  else if (ua.includes("Chrome") && !ua.includes("OPR")) browser = "Chrome";
  else if (ua.includes("Firefox"))                        browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("OPR"))                            browser = "Opera";

  if      (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android"))                        os = "Android";
  else if (ua.includes("Windows"))                        os = "Windows";
  else if (ua.includes("Mac OS"))                         os = "Mac";
  else if (ua.includes("Linux"))                          os = "Linux";

  return `${browser} en ${os}`;
}
