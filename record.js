import puppeteer from 'puppeteer';
import path from 'path';
import { promises as fs } from 'fs';

async function recordAnimation() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--enable-audio-autoplay',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ]
  });

  try {
    const page = await browser.newPage();
    const client = await page.createCDPSession();  // Create CDP session

    // Set viewport size
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Create downloads directory if it doesn't exist
    const downloadPath = path.join(process.cwd(), 'downloads');
    await fs.mkdir(downloadPath, { recursive: true });

    // Set up download behavior using CDP session
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath,
    });

    // Navigate to your React app
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // Wait for canvas and controls to be ready
    await page.waitForSelector('canvas');
    await page.waitForSelector('button');

    // Start recording by clicking the button
    await page.evaluate(() => {
      const recordButton = document.querySelector('button');
      recordButton.click();
    });

    // Wait for recording to complete
    const recordingDuration = 30000; // 30 seconds
    console.log('Recording in progress...');
    await page.waitForTimeout(recordingDuration);

    // Download both video and audio
    await page.evaluate(() => {
      const downloadButtons = Array.from(document.querySelectorAll('button'))
        .filter(button => button.textContent.includes('Download'));
      downloadButtons.forEach(button => button.click());
    });

    // Wait for downloads to complete
    await page.waitForTimeout(5000);

    console.log('Recording completed and files downloaded');

  } catch (error) {
    console.error('Error during recording:', error);
  } finally {
    await browser.close();
  }
}

// Run the recording
recordAnimation().catch(console.error);