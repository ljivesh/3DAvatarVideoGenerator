import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SpeechSynthesizer,
  SpeechConfig,
  AudioOutputStream,
  AudioConfig,
} from "microsoft-cognitiveservices-speech-sdk";
import { useQueue } from "@uidotdev/usehooks";



function markdownToText(markdown) {
  // Remove Markdown formatting using regex
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove image tags
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links but keep link text
    .replace(/[#>*_~`-]+/g, "") // Remove Markdown symbols like #, *, _, ~, `, etc.
    .replace(/(\r\n|\n|\r)/gm, " ") // Replace newlines with spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .trim(); // Trim leading and trailing spaces
}



export const useSynthesize = (
  ssml,
  stopRecording,
  setCurrentAnimation
) => {
  const audioElementRef = useRef(new Audio()); // Use ref to create and store the audio element

  const {
    queue: frameQueue,
    add: addFrame,
    remove: removeFrame,
    first: firstFrame,
    clear: clearFrameQueue,
  } = useQueue();

  const {
    queue: wordQueue,
    add: addWord,
    remove: removeWord,
    first: firstWord,
    clear: clearWordQueue,
  } = useQueue();

  const {
    first,
    add: addToQueue,
    remove: removeFromQueue,
    clear: clearQueue,
    size: queueSize,
    queue: sentenceQueue,
  } = useQueue();

  const {
    first: firstAudioURL,
    add: addAudioURLToQueue,
    remove: removeAudioURLFromQueue,
    clear: clearAudioURLQueue,
  } = useQueue();

  const {
    first: firstFormatedSentence,
    add: addFormatedSentence,
    remove: removeFormatedSentence,
    clear: clearFormatedSentence,
  } = useQueue();

  const {
    first: firstBookmark,
    add: addToBookmarkQueue,
    remove: removeFromBookmarkQueue,
    clear: clearBookmarkQueue,
  } = useQueue();

  // const showProductChat = useRecoilValue(showProductChatState);
  // const currentProduct = useRecoilValue(currentProductState);

  const inturupt = () => {
    // if (!stopFlag) {
    //   unStop();
    //   stopPlayer();
    //   clearAudioURLQueue();
    //   setIsAudioPlaying(false)
    //   clearFormatedSentence();
    //   clearQueue();
    //   clearWordQueue();
    //   clearFrameQueue();
    //   if (showProductChat) {
    //     tempSentence.length > 0 && addSentenceToConverstaion(tempSentence, "product-chat", currentProduct);
    //   } else {
    //     tempSentence.length > 0 && addSentenceToConverstaion(tempSentence);
    //   }
    //   // removeLastEmptyAssistantMessage();
    //   setTempSentence("");
    // }
  };

  const [tempSentence, setTempSentence] = useState('');

  const stopPlayer = useCallback(() => {
    const audioElement = audioElementRef.current;
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  }, []);

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [audioBlob, setAudioBlob] = useState(null);

  const speechSynthesizer = useMemo(() => {
    

      const speechConfig = SpeechConfig.fromSubscription(
        "your-key",
        "your-region"
      );

      const stream = AudioOutputStream.createPullStream();

      const audioConfig = AudioConfig.fromStreamOutput(stream);

      const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

      synthesizer.visemeReceived = async (s, e) => {

        try {
          const frames = JSON.parse(e.animation).BlendShapes;
          frames.forEach((frame) => addFrame(frame));
          
        } catch(error) {
          // console.error(error);
        }
      };

      synthesizer.wordBoundary = (s, e) => {
        addWord(e); 
      };

      synthesizer.bookmarkReached = (s, e) => {
        addToBookmarkQueue(e);
      }

      return synthesizer;
    
  }, []);

  useEffect(() => {
    if (first && speechSynthesizer) {
      // console.log(sentenceQueue.length);
      let sentenceToSpeak = first.content;
      addFormatedSentence({content: first.content, product: first.product});

      const unFormatedSentence = first.content;

      console.log(unFormatedSentence);
      // let numberOfCharacters = unFormatedSentence.length;
      // conversation.platformUsages.TextToSpeech += numberOfCharacters;

      console.log(ssml.replace("__TEXT__", unFormatedSentence));
      speechSynthesizer.speakSsmlAsync(
        ssml.replace("__TEXT__", unFormatedSentence),
        (result) => {
          if (result.audioData) {
            const blob = new Blob([result.audioData], { type: "audio/wav" });
            setAudioBlob(blob);
            const url = URL.createObjectURL(blob);
            addAudioURLToQueue(url);
          }
        },
        (error) => {
          console.error("Speech synthesis failed", error);
        }
      );

      removeFromQueue();
    }
  }, [first, speechSynthesizer, addAudioURLToQueue, removeFromQueue]);

  useEffect(() => {
    const processQueue = async () => {
      const audioElement = audioElementRef.current;
      if (firstAudioURL && audioElement) {
        audioElement.src = firstAudioURL;

        // Wait for the audio to play completely
        audioElement
          .play().then(()=> {setIsAudioPlaying(true)
          })
          .catch((error) => {
            console.error("Audio playback failed", error);
            setIsAudioPlaying(false);
            setTempSentence("");
            // if (firstFormatedSentence) {
            //   addSentenceToConverstaion(firstFormatedSentence.content, firstFormatedSentence.product ? "product-chat" : "main", firstFormatedSentence.product);
            //   removeFormatedSentence();
            // }
          });

        // Event listener to handle when audio playback ends
        audioElement.onended = () => {
          removeAudioURLFromQueue(); // Call this after the audio has finished playing
          URL.revokeObjectURL(firstAudioURL);

          setIsAudioPlaying(false);
          
          setTempSentence("");
          stopRecording();
          // if (firstFormatedSentence) {
          //   addSentenceToConverstaion(firstFormatedSentence.content,firstFormatedSentence.product ? "product-chat" : "main", firstFormatedSentence.product);
          //   removeFormatedSentence();
          // }
        };
      }
    };

    processQueue(); // Start processing the queue when the effect runs

    return () => {
      const audioElement = audioElementRef.current;
      if (audioElement) {
        audioElement.onended = null; // Clean up the event listener when component unmounts or dependencies change
      }
    };
  }, [firstAudioURL, removeAudioURLFromQueue]);


  useEffect(() => {
    const audioElement = audioElementRef.current;

    const handleTimeUpdate = () => {
      if (
        firstWord &&
        audioElement.currentTime > firstWord.audioOffset / 10000000
      ) {
        const word = firstWord.text;

        setTempSentence((prev) => {
          // let formattedWord: string;
          if (
            word === "." ||
            word === "?" ||
            word === "!" ||
            word === "," ||
            word === ";" ||
            word === ":" ||
            word === "-"
          ) {
            prev += word;
          } else {
            prev += " " + word;
          }
          // console.log(prev);
          return prev;
        });
        removeWord();
      }

      if (firstBookmark && audioElement.currentTime > firstBookmark.audioOffset / 10000000) {
        setCurrentAnimation(firstBookmark.text);
        removeFromBookmarkQueue();
      }
    };

    const handlePlay = () => {
      const time = new Date();
    };

    const handleWaiting = () => {
      const time = new Date();
    };

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("waiting", handleWaiting);

    return () => {
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("waiting", handleWaiting);
    };
  }, [firstWord, removeWord]);

  return {
    speechSynthesizer,
    stopPlayer,
    firstFrame,
    addFrame,
    removeFrame,
    addToQueue,
    inturupt,
    frameQueue,
    clearFrameQueue,
    isAudioPlaying,
    audioBlob,
  };
};
