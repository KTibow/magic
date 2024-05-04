import { AutoProcessor, CLIPVisionModelWithProjection, RawImage } from "@xenova/transformers";
import { readFile } from "fs/promises";
import type { RequestHandler } from "./$types";

const processor = await AutoProcessor.from_pretrained("Xenova/clip-vit-base-patch16");
const vision_model = await CLIPVisionModelWithProjection.from_pretrained(
  "Xenova/clip-vit-base-patch16",
);
const cards: { name: string; id: string; embedding: number[] }[] = JSON.parse(
  await readFile("prebuild/outputs.json", "utf-8"),
);
const colors: Record<string, string> = JSON.parse(await readFile("prebuild/colors.json", "utf-8"));

const similarity = (a: number[], b: number[]) => {
  const dot = a.reduce((a, v, i) => a + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((a, v) => a + v * v, 0));
  const magB = Math.sqrt(b.reduce((a, v) => a + v * v, 0));
  return dot / (magA * magB);
};

export const POST: RequestHandler = async ({ request }) => {
  const dat = await request.blob();
  const imageA = await RawImage.fromBlob(dat);

  // await imageA.save("tmp1.png");
  const imageB = await imageA.resize(224, 224);
  // await imageB.save("tmp2.png");
  const imageC = await processor(imageB);
  const {
    image_embeds: { data },
  } = await vision_model(imageC);
  const embedding = Array.from(data as Float32Array);

  console.log("sorting...");
  const best = cards
    .map((c) => ({ ...c, color: colors[c.id], similarity: similarity(embedding, c.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 2);

  console.log(best);
  return Response.json(best);
};
