const crypto = require("crypto");

function chave() {
  const origem = process.env.IFOOD_ENCRYPTION_KEY || process.env.JWT_SECRET || "";
  if (!origem) {
    throw new Error("Configure IFOOD_ENCRYPTION_KEY no ambiente antes de salvar o client secret.");
  }
  return crypto.createHash("sha256").update(origem).digest();
}

function criptografar(valor) {
  if (!valor) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", chave(), iv);
  const conteudo = Buffer.concat([cipher.update(String(valor), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, conteudo].map((item) => item.toString("base64url")).join(".");
}

function descriptografar(valor) {
  if (!valor) return "";
  const [ivRaw, tagRaw, conteudoRaw] = String(valor).split(".");
  if (!ivRaw || !tagRaw || !conteudoRaw) throw new Error("Credencial iFood armazenada em formato inválido.");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    chave(),
    Buffer.from(ivRaw, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(conteudoRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

module.exports = { criptografar, descriptografar };
