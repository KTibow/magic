<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { findTopKElements } from "./merge";

  export let colorA: string;
  export let colorB: string;

  type Card = {
    id: string;
    image_uris: { normal: string };
    mana_cost: string;
    name: string;
    type_line: string;
  };
  let cardsCreaturesSorted: Card[] = [];
  let cardsNoncreaturesSorted: Card[] = [];
  let cardsRecord: Record<string, Card> = {};

  const checkCard = (mana: string, mana1: string, mana2: string) => {
    if (mana.includes("{W}") && mana1 != "{W}" && mana2 != "{W}") return false;
    if (mana.includes("{U}") && mana1 != "{U}" && mana2 != "{U}") return false;
    if (mana.includes("{B}") && mana1 != "{B}" && mana2 != "{B}") return false;
    if (mana.includes("{R}") && mana1 != "{R}" && mana2 != "{R}") return false;
    if (mana.includes("{G}") && mana1 != "{G}" && mana2 != "{G}") return false;
    return true;
  };
  const compareCards = async (a: string, b: string) => {
    const aCard = cardsRecord[a];
    const bCard = cardsRecord[b];
    const r = await fetch("/sorter/_compare", {
      method: "POST",
      body: JSON.stringify({ a: aCard, b: bCard }),
    });
    return await r.json();
  };

  onMount(async () => {
    let cards: Card[] = $page.data.cards;
    cards = cards.filter((c) => !c.type_line.includes("Land"));
    cards = cards.filter((c) => checkCard(c.mana_cost, colorA, colorB));

    const cardsCreatures: Record<string, number> = {};
    const cardsNoncreatures: Record<string, number> = {};
    for (const c of cards) {
      if (c.type_line.includes("Creature")) {
        cardsCreatures[c.id] = (cardsCreatures[c.id] || 0) + 1;
      } else {
        cardsNoncreatures[c.id] = (cardsNoncreatures[c.id] || 0) + 1;
      }
      cardsRecord[c.id] = c;
    }

    findTopKElements(Object.keys(cardsCreatures), 16, (a, b) => compareCards(a, b)).then((x) => {
      for (const id of x) {
        for (let i = 0; i < cardsCreatures[id]; i++) {
          cardsCreaturesSorted.push(cardsRecord[id]);
        }
      }
      cardsCreaturesSorted = cardsCreaturesSorted;
    });
    findTopKElements(Object.keys(cardsNoncreatures), 7, (a, b) => compareCards(a, b)).then((x) => {
      for (const id of x) {
        for (let i = 0; i < cardsNoncreatures[id]; i++) {
          cardsNoncreaturesSorted.push(cardsRecord[id]);
        }
      }
      cardsNoncreaturesSorted = cardsNoncreaturesSorted;
    });
  });
</script>

{#if cardsCreaturesSorted.length > 0}
  <h1>Creatures</h1>
  <div class="cards">
    {#each cardsCreaturesSorted as card}
      <div class="card">
        <img src={card.image_uris.normal} alt={card.name} />
        <div class="name">{card.name}</div>
      </div>
    {/each}
  </div>
{/if}

{#if cardsNoncreaturesSorted.length > 0}
  <h1>Non-Creatures</h1>
  <div class="cards">
    {#each cardsNoncreaturesSorted as card}
      <div class="card">
        <img src={card.image_uris.normal} alt={card.name} />
        <div class="name">{card.name}</div>
      </div>
    {/each}
  </div>
{/if}

<style>
  h1 {
    font-size: 2rem;
    margin-top: 1.5rem;
  }
  .cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .card {
    display: flex;
    gap: 0.5rem;
    height: 10rem;

    background-color: rgb(0 74 119);
    padding: 1rem;
    border-radius: 1.5rem;
  }
</style>
