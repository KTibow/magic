import { error, json } from "@sveltejs/kit";
// @ts-expect-error sus
import { writeFile } from "fs/promises";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.arrayBuffer();
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    const secondsSinceMidnight = (now.getTime() - midnight.getTime()) / 1000;
    const id = secondsSinceMidnight.toFixed(1);
    const filePath = `./cards/${id}.jpg`; // Adjust the path as needed
    await writeFile(filePath, new Uint8Array(data));
    return json({ id });
  } catch (e) {
    console.error(e);
    return error(500, "An error occurred while saving the file.");
  }
};
