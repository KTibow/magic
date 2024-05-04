import { readFile, writeFile } from "fs/promises";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const json = await request.json();

  let data = [];
  try {
    data = JSON.parse(await readFile("state/cards.json", "utf-8"));
  } catch (e) {
    // ignore
  }

  data.push(json.id);
  console.log("saving", json.id);

  await writeFile("state/cards.json", JSON.stringify(data));
  return new Response(undefined, { status: 204 });
};
