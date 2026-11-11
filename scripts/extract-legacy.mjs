import fs from "node:fs";

const html = fs.readFileSync("legacy/index.html", "utf8");
const marker = "const FD=`";
const start = html.indexOf(marker);
if (start < 0) throw new Error("FD not found");
const end = html.indexOf("`.split", start);
const raw = html.slice(start + marker.length, end);
const rows = raw
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => {
    const a = l.split("|");
    return {
      names: a[0].split(",").map((s) => s.trim()).filter(Boolean),
      k: Number(a[1]) || 0,
      p: Number(a[2]) || 0,
      c: Number(a[3]) || 0,
      f: Number(a[4]) || 0,
      u: Number(a[5]) || 0,
      s: Number(a[6]) || 0,
    };
  });

fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/taco.json", JSON.stringify(rows));
console.log("taco", rows.length);

const imgStart = html.indexOf("data:image/png;base64,");
if (imgStart < 0) throw new Error("logo not found");
const b64Start = imgStart + "data:image/png;base64,".length;
let b64End = b64Start;
while (b64End < html.length && /[A-Za-z0-9+/=]/.test(html[b64End])) b64End++;
const buf = Buffer.from(html.slice(b64Start, b64End), "base64");
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/forja-mark.png", buf);
console.log("logo bytes", buf.length);
