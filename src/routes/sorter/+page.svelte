<script lang="ts">
  import Sorter from "./Sorter.svelte";

  let colorA = "{W}";
  let colorB = "{R}";
  let locked = false;
</script>

<div class="chooser">
  <select disabled={locked} bind:value={colorA}>
    <option value={"{W}"}>White</option>
    <option value={"{B}"}>Black</option>
    <option value={"{R}"}>Red</option>
    <option value={"{G}"}>Green</option>
    <option value={"{U}"}>Blue</option>
  </select>
  <select disabled={locked} bind:value={colorB}>
    <option value={"{W}"}>White</option>
    <option value={"{B}"}>Black</option>
    <option value={"{R}"}>Red</option>
    <option value={"{G}"}>Green</option>
    <option value={"{U}"}>Blue</option>
  </select>
  {#if !locked}
    <button on:click={() => (locked = true)}> Start </button>
  {/if}
</div>
{#if locked}
  <Sorter {colorA} {colorB} />
{/if}

<style>
  .chooser {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .chooser select {
    height: 1.5rem;
    border-radius: 0.5rem;
    padding: 0 1rem;
  }
  .chooser button {
    display: flex;
    align-items: center;
    background-color: rgb(0 74 119);
    height: 1.5rem;
    border-radius: 1.5rem;
    padding: 0 1rem;
  }
</style>
