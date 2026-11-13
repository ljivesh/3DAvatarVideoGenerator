# 3D Avatar Video Generator

Turns text into a video of a talking 3D avatar. Azure Speech synthesizes the voice from SSML, and its viseme events drive the avatar's lip-sync in react-three-fiber. The canvas and audio are recorded with MediaRecorder, and `record.js` runs the page headless with Puppeteer to export the video.

**Stack:** React, Vite, react-three-fiber / drei, Azure Speech SDK, MediaRecorder, Puppeteer

**Run:** `npm install`, set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`, then `npm run dev`. Use `node record.js` for a headless export.
