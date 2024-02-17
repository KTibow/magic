# magic

it's magic the gathering but ai... heh the name actually kinda works out well

so yeah it's a sveltekit application i made for the one stunt of "ai created this deck". the ai wasn't that good, you could probably get better results if you used a different model (mistral 7b -> 8x7b/openai/claude) or applied more rigorous structuring (separate out the types, enforce a mana curve, etc), but i didn't bother. if you do, please send in a pr!

## if you want to use it yourself (why?)

1. clone the repo
2. set up `.env` with working Gemini key and Cloudflare key
3. `pnpm install`
4. `pnpm run dev` and proxy it w/ ngrok
5. open `/camera` on your phone and start scanning all your cards
   tip: try to make the card's title really clear and the other cards not show, this will help later
6. open `/label` on your device
   a. let gemini take its first shot by pressing Auto ID
   b. make sure all of its ids were correct
   c. add any it missed
   d. download the json file
7. open `/` on your device, choose your two colors, and now it can sort your cards by how good it thinks they are
