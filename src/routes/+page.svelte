<script lang="ts" context="module">
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Card = Record<string, any>;
</script>

<script lang="ts">
  import Overview from "./Overview.svelte";

  let cards: Card[];

  function handleFile(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files) return;
    const file = files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = async () => {
      cards = JSON.parse(reader.result as string);
    };
  }
</script>

{#if cards}
  <Overview {cards} />
{:else}
  <input type="file" on:change={handleFile} />
{/if}
