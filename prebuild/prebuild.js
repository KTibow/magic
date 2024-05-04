import { AutoProcessor, CLIPVisionModelWithProjection, RawImage } from "@xenova/transformers";
import { readFile, writeFile } from "fs/promises";

console.log("loading models...");
const processor = await AutoProcessor.from_pretrained("Xenova/clip-vit-base-patch16");
const vision_model = await CLIPVisionModelWithProjection.from_pretrained(
  "Xenova/clip-vit-base-patch16",
);

console.log("loading cards...");
let cards = JSON.parse(await readFile("default-cards-20240503210743.json", "utf-8"));
cards = cards.filter(
  (c) => c.image_uris && c.legalities.duel == "legal" && c.released_at.startsWith("202"),
);

console.log("processing images...");
const startLength = cards.length;
const startTime = Date.now();
const outputs = [];
const worker = async () => {
  while (cards.length) {
    const done = startLength - cards.length;
    const timePerCard = (Date.now() - startTime) / done;
    const timeRemaining = timePerCard * cards.length;
    console.log(
      `${done}/${startLength} or ${((done / startLength) * 100).toFixed(1)}% done, or ${Math.floor(timeRemaining / 1000)} seconds remaining`,
    );
    const { name, id, image_uris } = cards.shift();

    let imageA;
    try {
      imageA = await RawImage.fromURL(image_uris.normal);
    } catch (e) {
      try {
        imageA = await RawImage.fromURL(image_uris.normal);
      } catch (e) {
        console.warn("skipping", name, e);
        continue;
      }
    }
    const imageB = await processor(await imageA.resize(224, 224));
    const {
      image_embeds: { data },
    } = await vision_model(imageB);
    outputs.push({
      name,
      id,
      embedding: Array.from(data, (x) => Math.round(x * 1000) / 1000),
    });
  }
};
try {
  await Promise.all([worker(), worker(), worker(), worker(), worker()]);
} finally {
  console.log("writing outputs...");
  await writeFile("outputs.json", JSON.stringify(outputs));
}
