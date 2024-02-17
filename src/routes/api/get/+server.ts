// @ts-expect-error sus
import { readFile } from "fs/promises";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const file = `./cards/${url.searchParams.get("file")}`;
  const fileBuffer = await readFile(file);
  return new Response(fileBuffer);
};
