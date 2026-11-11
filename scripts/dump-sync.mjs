import fs from "node:fs";
const html = fs.readFileSync("legacy/index.html", "utf8");
const i = html.indexOf("async function cloudSync");
console.log(html.slice(i, i + 1600));
