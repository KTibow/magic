import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { GOOGLE_KEY } from "$env/static/private";

export const POST: RequestHandler = async ({ request }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GOOGLE_KEY}`;
  const requestBody = await request.json();
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(await response.text());
      throw new Error(response.statusText);
    }

    const data = await response.json();
    return json(data);
  } catch (e) {
    error(500, `Error from Gen Text API: ${e}`);
  }
};
