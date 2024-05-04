import { AutoTokenizer, CLIPTextModelWithProjection } from "@xenova/transformers";
import { readFile, writeFile } from "fs/promises";

console.log("loading models...");
const tokenizer = await AutoTokenizer.from_pretrained("Xenova/clip-vit-base-patch16");
const text_model = await CLIPTextModelWithProjection.from_pretrained(
  "Xenova/clip-vit-base-patch16",
);

console.log("loading cards...");
const cards = JSON.parse(await readFile("default-cards-20240503210743.json", "utf-8"));
const namesSet = new Set();
for (const c of cards) {
  if (c.image_uris && c.legalities.duel == "legal" && c.released_at.startsWith("202")) {
    namesSet.add(c.name);
  }
}

console.log("tokenizing...");
const names = Array.from(namesSet);
const tokens = tokenizer(names, { padding: true });

console.log("embedding...");
/**
 * @type {{text_embeds: import("@xenova/transformers").Tensor}}
 */
const { text_embeds } = await text_model(tokens);

const outputs = [];
for (let i = 0; i < names.length; i++) {
  const name = names[i];
  const embedding = text_embeds[i];
  outputs.push({
    name,
    embedding: Array.from(embedding.data, (x) => Math.round(x * 1000) / 1000),
  });
}

console.log("writing outputs...");
await writeFile("outputs-alt.json", JSON.stringify(outputs));
