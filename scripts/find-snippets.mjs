import fs from "node:fs";
const html = fs.readFileSync("legacy/index.html", "utf8");
const keys = ["const OT", "function objetivos", "function avatarCard", "function finQuick", "function TP", "const OT=", "objHoje", "function emp", "function cico", "function picker"];
for (const k of keys) {
  const i = html.indexOf(k);
  console.log("\n====", k, i);
  if (i >= 0) console.log(html.slice(i, i + 900).replace(/\s+/g, " ").slice(0, 700));
}
