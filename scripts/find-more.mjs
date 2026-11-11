import fs from "node:fs";
const html = fs.readFileSync("legacy/index.html", "utf8");
for (const k of ["CATD", "CATR", "function tsave", "const TP", "tsave=", "function trep", "function qt", "cico=", "const cico", "function cico", "ICONS", "const CI"]) {
  const i = html.indexOf(k);
  console.log("\n====", k, i);
  if (i >= 0) console.log(html.slice(Math.max(0, i - 40), i + 500).replace(/\s+/g, " ").slice(0, 450));
}
