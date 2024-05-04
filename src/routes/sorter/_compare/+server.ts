import { COHERE_KEY } from "$env/static/private";
import type { RequestHandler } from "./$types";

const fixMana = (str: string) => {
  return str.replace(/(\{[0-9WUBRGTX]\})+/g, (str) => {
    const itemCounts = Array.from(str.matchAll(/[0-9WUBRGTX]/g)).reduce<Record<string, number>>(
      (acc, item) => {
        acc[item[0]] = (acc[item[0]] || 0) + 1;
        return acc;
      },
      {},
    );

    return Object.entries(itemCounts)
      .map(([item, count]) => {
        if (item == "W") return `${count} white mana`;
        if (item == "U") return `${count} blue mana`;
        if (item == "B") return `${count} black mana`;
        if (item == "R") return `${count} red mana`;
        if (item == "G") return `${count} green mana`;
        if (item == "T") return `Tap`;
        if (item == "X") return `X amount`;
        return `${item} mana`;
      })
      .join(" plus ");
  });
};
const stringifyCard = (card: Record<string, any>) => {
  const output = [card.name];
  const type = card.type_line.split("—")[0].trim();
  if (type != "Creature" && type != "Swamp") output[0] += ` (${type})`;
  if (card.mana_cost) output.push(`Mana cost: ${fixMana(card.mana_cost)}`);
  if (card.power) output.push(`Power: ${card.power}`);
  if (card.toughness) output.push(`Toughness: ${card.toughness}`);
  if (card.oracle_text) output.push(fixMana(card.oracle_text));
  return output.join("\n");
};

export const POST: RequestHandler = async ({ request }) => {
  const { a: cardARaw, b: cardBRaw } = await request.json();
  console.log("comparing", cardARaw.name, cardBRaw.name);

  const cardAType = cardARaw.type_line.split("—")[0].trim();
  const cardBType = cardBRaw.type_line.split("—")[0].trim();

  const body = {
    model: "command-r",
    message:
      `You are a professional MTG card ranker, and are answering questions about card A and card B.

Table of stats:
          | A | B |
Name      | ${cardARaw.name} | ${cardBRaw.name} |
Type      | ${cardAType} | ${cardBType} |
Mana      | ${fixMana(cardARaw.mana_cost)} | ${fixMana(cardBRaw.mana_cost)} |
Power     | ${cardARaw.power ?? "not applicable"} | ${cardBRaw.power ?? "not applicable"} |
Toughness | ${cardARaw.toughness ?? "not applicable"} | ${cardBRaw.toughness ?? "not applicable"} |

Card A's text:
${fixMana(cardARaw.oracle_text)}

Card B's text:
${fixMana(cardBRaw.oracle_text)}

Respond with this exact format, and no other text. Keep your sentences short and consider that stats can and will be tied across cards.
"""
Ease of use: [1 sentence on which costs the least mana. keep cost in mind for the rest of this.]
Offense: [1 sentence on which has better offense]
Defense: [1 sentence on which has better defense]
Versatility: [1 sentence on which has better versatility]
VERDICT: [which one should go in my deck out of A or B, in the form of a single letter]
"""`
        .replace(`Power     | not applicable | not applicable |\n`, "")
        .replace(`Toughness | not applicable | not applicable |\n`, ""),
    chat_history: [],

    k: 1,
  };

  const resp = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${COHERE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const json = await resp.json();
  return Response.json(json.text.includes("VERDICT: B") ? true : false);
};
