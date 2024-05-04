import { readFile, writeFile } from "fs/promises";

const dat = JSON.parse(await readFile("default-cards-20240503210743.json", "utf-8"));
const out = {};
for (const c of dat) {
  const colors = ["{W}", "{U}", "{B}", "{R}", "{G}"].filter((x) => c.mana_cost?.includes(x));
  if (colors.length != 1) continue;
  out[c.id] = colors[0];
}
await writeFile("colors.json", JSON.stringify(out));
