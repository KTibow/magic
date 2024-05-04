<script lang="ts">
  import { onMount } from "svelte";
  import Color from "$lib/Color.svelte";

  let imageCapture: ImageCapture;
  let video: HTMLVideoElement;
  let status:
    | { state: "ready" }
    | { state: "processingA" }
    | { state: "processingB" }
    | { state: "choose"; options: { name: string; id: string; color: string }[] } = {
    state: "ready",
  };

  onMount(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
      });
      video.srcObject = stream;

      const track = stream.getVideoTracks()[0];
      imageCapture = new ImageCapture(track);
    } catch (error) {
      console.error("Error accessing the camera", error);
    }
  });

  async function takePhoto() {
    status = { state: "processingA" };
    const blob = await imageCapture.takePhoto({ imageWidth: 224, imageHeight: 224 });
    status = { state: "processingB" };

    let r: Response;
    try {
      r = await fetch("/_search", { method: "POST", body: blob });
    } catch (error) {
      status = { state: "ready" };
      return;
    }
    const rData = await r.json();
    status = { state: "choose", options: rData };
  }
  const cancel = () => {
    status = { state: "ready" };
  };
  const select = async (option: { name: string; id: string }) => {
    status = { state: "ready" };
    fetch("/_save", { method: "POST", body: JSON.stringify({ id: option.id }) });
  };
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video bind:this={video} autoplay />

{#if status.state == "ready" || status.state == "processingA"}
  <button class="shutter" disabled={status.state != "ready"} on:click={takePhoto} />
{:else if status.state == "choose"}
  {@const { options } = status}
  <div class="bottom-sheet">
    <button on:click={cancel}>Cancel</button>
    <button on:click={() => select(options[1])}>
      {options[1].name}
      {#if options[1].color}<Color color={options[1].color} />{/if}
    </button>
    <button on:click={() => select(options[0])}>
      {options[0].name}
      {#if options[1].color}<Color color={options[0].color} />{/if}
    </button>
  </div>
{/if}

<style>
  :global(body) {
    padding: 0;
    height: 100dvh;
  }
  video {
    flex-grow: 1;
    object-fit: contain;
  }
  .shutter {
    position: absolute;
    width: 4rem;
    height: 4rem;
    border-radius: 4rem;

    background-color: white;
    border-width: 0.25rem;
    border-color: #10101f;

    left: 50%;
    bottom: 0.5rem;
    translate: -50% 0;
    transition: 0.2s ease-in-out;
  }
  .shutter:disabled {
    scale: 0.4;
  }
  .bottom-sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    display: flex;
    flex-direction: column;
    border-radius: 0.5rem 0.5rem 0 0;
    background-color: rgb(0 74 119);
  }
  .bottom-sheet button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    padding: 2rem 0.5rem;
    background-color: transparent;
    border-bottom: 2px solid rgb(255 255 255 / 0.2);
  }
  .bottom-sheet button:last-child {
    padding: 4rem 0.5rem;
    border: none;
  }
</style>
