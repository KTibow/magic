import { readFile } from "fs/promises";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const data: string[] = JSON.parse(await readFile("state/cards.json", "utf-8"));

  const cards: Record<string, unknown> = {};
  for (const c of JSON.parse(
    await readFile("prebuild/default-cards-20240503210743.json", "utf-8"),
  )) {
    cards[c.id] = c;
  }

  return { cards: data.map((x) => cards[x]) };
};
