import { ACCOUNT_ID, API_TOKEN } from "$env/static/private";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/mistral/mistral-7b-instruct-v0.1`;

  try {
    const requestBody = await request.json();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: `It is ${new Date().toLocaleTimeString()}` },
          {
            role: "user",
            content: `You are a professional Magic card comparer.
This is Card A: ${requestBody.cardA}

This is Card B: ${requestBody.cardB}

Respond with this exact format, and no other text:
"""
Playability: [1 sentence on which one has better playability]
Offense: [1 sentence on which one has better offense]
Defense: [1 sentence on which one has better defense]
Versatility: [1 sentence on which one has better versatility]
VERDICT: [which one should go in my deck out of A or B, in the form of a single letter]"""`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(await response.text());
      throw new Error(response.statusText);
    }

    const data = await response.json();
    return json(data);
  } catch (e) {
    error(500, `Error from Cloudflare AI API: ${e}`);
  }
};
