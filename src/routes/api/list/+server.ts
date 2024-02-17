import { json } from "@sveltejs/kit";
// @ts-expect-error sus
import { readdir } from "fs/promises";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const files = await readdir("./cards");
  return json(files);
};
