let key: CryptoKey;

try {
  key = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(localStorage.getItem("aes-cbc-key") ?? "null"),
    {
      name: "AES-CBC",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
} catch (_err) {
  key = await crypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
  localStorage.setItem(
    "aes-cbc-key",
    JSON.stringify(await crypto.subtle.exportKey("jwk", key)),
  );
}

export async function encrypt(decrypted: string) {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      key,
      new TextEncoder().encode(decrypted),
    ),
  );
  const args = Array.from(new Uint8Array([...encrypted, ...iv]));
  return btoa(String.fromCharCode.apply(null, args));
}

export async function decrypt(encrypted: string) {
  let buffer = new Uint8Array(
    atob(encrypted).split("").map((v) => v.charCodeAt(0)),
  );
  const iv = buffer.slice(-16, buffer.length);
  buffer = buffer.slice(0, -16);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    buffer,
  );
  return new TextDecoder().decode(decrypted);
}
