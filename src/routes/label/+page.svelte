<script lang="ts">
  import { onMount } from "svelte";
  type ImageCard = {
    file: string;
    url: string;
    card?: Card;
  };
  type Card = {
    name: string;
    id: string;
    type_line: string;
    image_uris: { normal: string };
  };

  let cards: ImageCard[] = [];

  onMount(async () => {
    const listResponse = await fetch("/api/list");
    const imageIds = await listResponse.json();
    cards = await Promise.all(
      imageIds.map(async (file: string) => {
        const response = await fetch(`/api/get?file=${file}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        return { file, url }; // This structure assumes an ImageCard type { id: string, url: string }
      }),
    );
  });

  async function idCard(card: ImageCard) {
    const blob = await fetch(card.url).then((r) => r.blob());
    const reader = new FileReader();
    const dataBlob: string = await new Promise((resolve) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
    const data64 = dataBlob.split(",")[1];

    const req = {
      contents: [
        {
          parts: [
            {
              text: `This is a MtG card. Please output the name of the card with no other text.
What to do:
- Output an exact name, like "Melek, Reforged Researcher" or "Forest"
- Output the card that is clearly the first card of the stack
- Use the rest of the card as a hint
What not to do:
- Output any other text than the name
- Output the card that isn't the first card of the stack (BE VERY CAREFUL ABOUT THIS - IF YOU AREN'T YOU *WILL* GET FOOLED.)`,
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: data64,
              },
            },
          ],
        },
      ],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };
    const resp = await fetch("/api/cardid", {
      method: "POST",
      body: JSON.stringify(req),
    });
    const json = await resp.json();
    const message: string = json.candidates[0].content.parts[0].text.trim();
    await searchCard(card, message);
  }
  async function searchCard(card: ImageCard, name: string) {
    const resp = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`);
    const json = await resp.json();
    const data: Card[] = json.data;
    const dataCard = data && (data.find((c) => c.name == name) || data[0]);

    card.card = dataCard;
  }

  async function autoId() {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    for (const card of cards) {
      (async () => {
        await idCard(card);
        cards = cards;
      })();
      await sleep(1100);
    }
  }
  function exportCards() {
    const data = cards.map((card) => card.card);
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cards.json";
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="actions">
  <button on:click={autoId}>Auto ID</button>
  <button on:click={exportCards}>Export</button>
</div>
<div class="card-container">
  {#each cards as card (card.file)}
    <div class="card">
      <img src={card.url} alt="Card {card.file}" />
      {#if card.card}
        <div class="vertical">
          <p>{card.card.name}</p>
          <p>{card.card.type_line.split("—")[0]}</p>
        </div>
      {/if}
      <div class="vertical">
        <button
          on:click={async () => {
            await idCard(card);
            cards = cards;
          }}>ID</button
        >
        <button
          on:click={async () => {
            const name = prompt("What is the name of the card?");
            if (!name) return;
            await searchCard(card, name);
            cards = cards;
          }}>Manual ID</button
        >
      </div>
    </div>
  {/each}
</div>

<style>
  .actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .card-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(24rem, 1fr));
    gap: 0.5rem;
  }
  .card {
    display: flex;
    gap: 0.5rem;
    background: #181818;
    padding: 0.5rem;
  }
  .card img {
    max-height: 16rem;
  }
  .vertical + .vertical {
    margin-left: auto;
  }
  .vertical {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .vertical button {
    flex-grow: 1;
  }
</style>
