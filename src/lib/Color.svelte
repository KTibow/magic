<script lang="ts">
  export let color: string;
</script>

<div
  class="color"
  style:background-color={color == "{W}"
    ? "rgb(255 255 255)"
    : color == "{R}"
      ? "rgb(255 128 128)"
      : color == "{G}"
        ? "rgb(128 255 128)"
        : color == "{U}"
          ? "rgb(128 128 255)"
          : "rgb(128 128 128)"}
/>

<style>
  .color {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
  }
</style>
