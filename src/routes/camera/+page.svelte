<script lang="ts">
  import { onMount } from "svelte";

  let imageCapture: ImageCapture;
  let video: HTMLVideoElement;
  let status: { state: "ready" } | { state: "processing" } = { state: "ready" };

  onMount(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
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
    status = { state: "processing" };
    const blob = await imageCapture.takePhoto({ imageWidth: 1500, imageHeight: 2000 });
    await fetch("/api/store", { method: "POST", body: blob });
    status = { state: "ready" };
  }
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video bind:this={video} autoplay />
{#if status.state == "ready"}
  <button on:click={takePhoto} style="flex-grow: 1">Take Photo</button>
{:else}
  processing...
{/if}
