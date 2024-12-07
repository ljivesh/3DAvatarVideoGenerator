import { useState, useRef, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
// import './App.css'
import { Canvas } from '@react-three/fiber'
import { Environment, Html, OrbitControls } from '@react-three/drei'
import {Model as Avatar} from './Avatar'
import { useSynthesize } from './synthesizer-hook'
import { useReactMediaRecorder } from 'react-media-recorder';
import { Color } from 'three';

function replaceVoice(voice) {
  let data = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
  <voice name="${voice}"  >
  <mstts:viseme type="FacialExpression"/>

  <mstts:express-as style="cheerful"	 styledegree="2">
  
  <prosody rate="+10.00%">
  
  __TEXT__
  </prosody>
  </mstts:express-as>
  </voice>
  </speak>`;

  return data;
}

const dialog = `Hey there! I’m Ampere AI, India’s first EV AI friend and your tech-savvy buddy who loves electric vibes and really hates traffic jams. I know every spec, every feature, and even the exact shade of green your wallet will love! Together, let’s electrify your ride and the planet—because saving the world is just... good salesmanship.`;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const voice = 'en-US-ChristopherNeural';

const ssml = replaceVoice(voice);

function App() {
  const [currentAnimation, setCurrentAnimation] = useState('Idle');
  const {
    removeFrame, 
    firstFrame, 
    frameQueue, 
    clearFrameQueue, 
    isAudioPlaying,
    addToQueue,
    audioBlob
  } = useSynthesize(ssml, stopRecording);
  const canvasRef = useRef();
  const videoRef = useRef();
  const mediaRecorderRef = useRef();
  const recordedBlobsRef = useRef([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const script = async () => {
    setCurrentAnimation('Walk');
    await wait(4000);
    setCurrentAnimation('Idle');
    addToQueue({content:dialog});
    await wait(3000);
    setCurrentAnimation('Wave');
    await wait(2000);
    setCurrentAnimation('Idle');
    await wait(15000);
  }

  const handleDataAvailable = (event) => {
    console.log('Data available event:', event.data?.size || 0, 'bytes');
    if (event.data && event.data.size > 0) {
      recordedBlobsRef.current.push(event.data);
      console.log('Total chunks recorded:', recordedBlobsRef.current.length);
    }
  };

  const handleStop = () => {
    console.log('Handle stop called');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // First, check if we have any recorded data
    console.log('Number of recorded chunks:', recordedBlobsRef.current.length);
    console.log('Recorded chunks details:', recordedBlobsRef.current.map(blob => ({
      size: blob.size,
      type: blob.type
    })));

    // MP4 specific blob creation
    const options = [
      { type: 'video/webm' }, // Try webm first as it's more widely supported
      { type: 'video/webm;codecs=h264' },
      { type: 'video/webm;codecs=vp8' },
      { type: 'video/mp4' },
      { type: 'video/mp4;codecs=avc1.42E01E' }
    ];

    let superBuffer = null;
    for (const option of options) {
      try {
        console.log('Attempting to create blob with type:', option.type);
        superBuffer = new Blob(recordedBlobsRef.current, option);
        console.log('Successfully created blob:', {
          size: superBuffer.size,
          type: superBuffer.type
        });
        break;
      } catch (e) {
        console.warn(`Failed to create blob with ${option.type}:`, e);
      }
    }

    if (superBuffer) {
      const url = window.URL.createObjectURL(superBuffer);
      console.log('Created video URL:', url);
      
      // Add more detailed error handling for video element
      videoRef.current.onerror = (e) => {
        console.error('Video error details:', {
          error: videoRef.current.error,
          errorCode: videoRef.current.error?.code,
          errorMessage: videoRef.current.error?.message,
          networkState: videoRef.current.networkState,
          readyState: videoRef.current.readyState
        });
      };

      // Add load event listener
      videoRef.current.onloadstart = () => console.log('Video load started');
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded', {
          duration: videoRef.current.duration,
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight
        });
      };
      videoRef.current.oncanplay = () => console.log('Video can play');
      
      // Set the source
      videoRef.current.src = url;
    } else {
      console.error('Failed to create video blob with any codec');
    }
  };

  function startRecording() {
    console.log('Starting recording...');
    recordedBlobsRef.current = [];
    const stream = canvasRef.current.captureStream(60);
    console.log('Stream details:', {
      tracks: stream.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
        settings: track.getSettings()
      }))
    });

    // Try WebM first as it's more widely supported
    const options = {
      mimeType: 'video/webm;codecs=vp8',
      videoBitsPerSecond: 8000000
    };

    try {
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      console.log('Using codec:', options.mimeType);
    } catch (e) {
      console.warn('Primary codec not supported, trying fallbacks:', e);
      
      const fallbackOptions = [
        { mimeType: 'video/webm' },
        { mimeType: 'video/webm;codecs=vp9' },
        { mimeType: 'video/mp4' }
      ];

      for (const fallbackOption of fallbackOptions) {
        try {
          mediaRecorderRef.current = new MediaRecorder(stream, fallbackOption);
          console.log('Using fallback codec:', fallbackOption.mimeType);
          break;
        } catch (err) {
          console.warn(`Fallback codec ${fallbackOption.mimeType} not supported:`, err);
        }
      }
    }

    if (!mediaRecorderRef.current) {
      console.error('No supported codecs found');
      return;
    }

    mediaRecorderRef.current.ondataavailable = handleDataAvailable;
    mediaRecorderRef.current.onstop = handleStop;
    mediaRecorderRef.current.start(100); // Capture every 100ms
  }

  function stopRecording() {
    console.log('Stopping recording...');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    mediaRecorderRef.current?.stop();
    console.log('Recorder stopped');
  }

  async function toggleRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      stopRecording();
    } else {
      startRecording();
      await script();
    }
  }

  function downloadVideo() {
    const options = [
      { type: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
      { type: 'video/mp4', ext: 'mp4' },
      { type: 'video/webm;codecs=h264', ext: 'mp4' },
      { type: 'video/webm', ext: 'webm' }
    ];

    let blob = null;
    let fileExtension = 'mp4'; // Default to mp4

    for (const option of options) {
      try {
        blob = new Blob(recordedBlobsRef.current, { type: option.type });
        fileExtension = option.ext;
        break;
      } catch (e) {
        console.warn(`Failed to create download blob with ${option.type}:`, e);
      }
    }

    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `canvas-recording-${timestamp}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }
  }

  function downloadAudio() {
    if (audioBlob) {
      const url = window.URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `audio-recording-${timestamp}.wav`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }
  }

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const pad = (num) => num.toString().padStart(2, '0');
    
    return `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const greenColor = new Color(0x00ff00);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        <button onClick={toggleRecording}>
          {mediaRecorderRef.current?.state === 'recording' ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button onClick={downloadVideo}>Download Video</button>
        <button 
          onClick={downloadAudio} 
          disabled={!audioBlob}
        >
          Download Audio
        </button>
        {recordingDuration > 0 && (
          <div style={{ margin: '10px 0' }}>
            Recording duration: {formatTime(recordingDuration)}
          </div>
        )}
        <video 
          ref={videoRef} 
          style={{
            width: 500, 
            height: 500,
            objectFit: 'contain'
          }} 
          controls
        ></video>
        {audioBlob && (
          <audio 
            src={URL.createObjectURL(audioBlob)} 
            controls 
            style={{ display: 'block', marginTop: '10px' }}
          />
        )}
      </div>
      <div
        style={{
          // backgroundColor: 'green',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
        }}
      >
        <Canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '25%',
            height: '100%',
            // backgroundColor: 'green',
          }}
          camera={{
            position: [0, 2, 10],
            fov: 11,
          }}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true,
            powerPreference: "high-performance"
          }}
          dpr={window.devicePixelRatio || 2}
        ><color attach="background" args={[greenColor.r, greenColor.g, greenColor.b]} />
          <Avatar
            position={[0, -1, -0.5]}
            scale={1}
            lipsync={{
              removeFrame,
              firstFrame,
              frameQueue,
              clearFrameQueue,
              isAudioPlaying,
            }}
            currentAnimation={currentAnimation}
          />
          {/* <OrbitControls /> */}
          <Environment preset="sunset" />
        </Canvas>
      </div>
    </>
  );
}

export default App
