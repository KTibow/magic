<script lang="ts">
  import type { Card } from "./+page.svelte";

  export let cards: Card[];
  let mana1: Color;
  let mana2: Color;
  let rankings:
    | { status: "uncreated" }
    | { status: "loading"; rankings: string[][]; progress: number; total: number }
    | { status: "ready"; rankings: string[][] } = { status: "uncreated" };
  $: rankingsCards =
    rankings.status != "uncreated"
      ? rankings.rankings.map((subset) =>
          subset.map((id) => cards.filter((card) => card.id == id)!),
        )
      : [];

  enum Color {
    white = "W",
    blue = "U",
    black = "B",
    red = "R",
    green = "G",
  }
  const countMana = (color: Color) => {
    if (color == Color.white) {
      return cards.filter((card) => card.name == "Plains").length;
    } else if (color == Color.blue) {
      return cards.filter((card) => card.name == "Island").length;
    } else if (color == Color.black) {
      return cards.filter((card) => card.name == "Swamp").length;
    } else if (color == Color.red) {
      return cards.filter((card) => card.name == "Mountain").length;
    } else if (color == Color.green) {
      return cards.filter((card) => card.name == "Forest").length;
    }
    return 0;
  };
  const countCards = (color: Color) => {
    return cards.filter((card) => checkCard(card.mana_cost, color, color)).length;
  };
  const checkCard = (mana: string, mana1: Color, mana2: Color) => {
    if (mana.includes("{W}") && mana1 != Color.white && mana2 != Color.white) return false;
    if (mana.includes("{U}") && mana1 != Color.blue && mana2 != Color.blue) return false;
    if (mana.includes("{B}") && mana1 != Color.black && mana2 != Color.black) return false;
    if (mana.includes("{R}") && mana1 != Color.red && mana2 != Color.red) return false;
    if (mana.includes("{G}") && mana1 != Color.green && mana2 != Color.green) return false;
    return true;
  };
  const createRankings = async () => {
    const ids = new Set(
      cards
        .filter(
          (card) => !card.type_line.includes("Land") && checkCard(card.mana_cost, mana1, mana2),
        )
        .map((c) => c.id),
    );

    let lastRequest = 0;
    const choose = async (cardA: Card, cardB: Card) => {
      while (Date.now() - lastRequest < 1100) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1100 - (Date.now() - lastRequest) + 100 * Math.random()),
        );
      }
      lastRequest = Date.now();

      const resp = await fetch("/api/cardrank", {
        method: "POST",
        body: JSON.stringify({ cardA: stringifyCard(cardA), cardB: stringifyCard(cardB) }),
      });
      const json = await resp.json();
      const message = json.result.response;
      return message.includes("VERDICT: A") ? "A" : "B";
    };
    const chooseRigor = async (cardA: Card, cardB: Card) => {
      const r1 = await choose(cardA, cardB);
      const r2 = await choose(cardA, cardB);
      const r3 = await choose(cardB, cardA);
      if (r1 == "A" && r2 == "A") return "A";
      if (r1 == "A" && r3 == "B") return "A";
      if (r2 == "A" && r3 == "B") return "A";
      return "B";
    };

    // better first
    let idsRanked = [Array.from(ids)];
    while (true) {
      rankings = {
        status: "loading",
        rankings: idsRanked,
        progress: Math.floor((idsRanked.length / ids.size) * 100),
        total: ids.size,
      };
      const target = idsRanked.find((id) => id.length > 1);
      if (!target) break;

      if (target.length == 2) {
        const idA = target[0];
        const cardA = cards.find((card) => card.id == idA)!;
        const idB = target[1];
        const cardB = cards.find((card) => card.id == idB)!;
        console.log("sorting", cardA.name, cardB.name);
        const result = await chooseRigor(cardA, cardB);
        if (result == "A") {
          idsRanked = idsRanked.flatMap((subset) => (subset == target ? [[idA], [idB]] : [subset]));
        } else {
          idsRanked = idsRanked.flatMap((subset) => (subset == target ? [[idB], [idA]] : [subset]));
        }
      } else {
        const pivot = target[Math.floor(target.length / 2)];
        const card = cards.find((card) => card.id == pivot)!;
        const worse: string[] = [];
        const better: string[] = [];
        console.log("sorting", target.length - 1, "cards by", card.name);
        await Promise.all(
          target.map(async (id) => {
            if (id == pivot) return;
            const c = cards.find((card) => card.id == id)!;
            const result = await choose(card, c);
            if (result == "A") {
              worse.push(id);
            } else {
              better.push(id);
            }
          }),
        );
        idsRanked = idsRanked.flatMap((subset) =>
          subset == target ? [better, [pivot], worse] : [subset],
        );
      }
      idsRanked = idsRanked.filter((subset) => subset.length > 0);
    }
    rankings = { status: "ready", rankings: idsRanked };
  };

  const fixMana = (str: string) => {
    return str.replace(/(\{[0-9WUBRGTX]\})+/g, (str) => {
      const itemCounts = Array.from(str.matchAll(/[0-9WUBRGTX]/g)).reduce(
        (acc, item) => {
          acc[item[0]] = (acc[item[0]] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
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
        .join(" and ");
    });
  };
  const stringifyCard = (card: Card) => {
    let output = [card.name];
    const type = card.type_line.split("—")[0].trim();
    if (type != "Creature" && type != "Swamp") output[0] += ` (${type})`;
    if (card.mana_cost) output.push(`Mana cost: ${fixMana(card.mana_cost)}`);
    if (card.power) output.push(`Power: ${card.power}`);
    if (card.toughness) output.push(`Toughness: ${card.toughness}`);
    if (card.oracle_text) output.push(fixMana(card.oracle_text));
    return output.join("\n");
  };
</script>

<div class="row">
  Building with
  <select bind:value={mana1}>
    {#each Object.entries(Color) as [c, color]}
      {#if countMana(color) > 5}
        <option value={color}
          >{c} ({countMana(color)} mana cards, {countCards(color)} other cards)</option
        >
      {/if}
    {/each}
  </select>
  <select bind:value={mana2}>
    {#each Object.entries(Color) as [c, color]}
      {#if countMana(color) > 5}
        <option value={color}
          >{c} ({countMana(color)} mana cards, {countCards(color)} other cards)</option
        >
      {/if}
    {/each}
  </select>
  {#if rankings.status == "uncreated"}
    <button on:click={createRankings}>Create rankings</button>
  {:else if rankings.status == "loading"}
    Creating rankings... {rankings.progress}%, sorting {rankings.total} cards
  {/if}
</div>

{#if rankings.status != "uncreated"}
  <div class="rankings">
    {#each rankingsCards as rank, i}
      {#if rank.length == 1}
        {@const cardSet = rank[0]}
        <div class="rank">
          <img src={cardSet[0].image_uris.normal} alt="" />
          <p>{cardSet[0].name} x{cardSet.length}</p>
        </div>
      {:else}
        <div class="rank">
          <p>Rank #{i + 1}</p>
          {#each rank as cardSet}
            <img src={cardSet[0].image_uris.normal} alt="" />
          {/each}
        </div>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .rankings {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .rank {
    display: flex;
    gap: 0.5rem;
    background-color: #181818;
    padding: 0.5rem;
    overflow: hidden;
  }
  img {
    max-width: 16rem;
  }
</style>
