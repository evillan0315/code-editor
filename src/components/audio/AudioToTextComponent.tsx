import React, { useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function AudioToTextComponent() {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [geminiResponse, setGeminiResponse] = useState("");

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  const handleSendToGemini = async () => {
    if (transcript) {
      // In a real application, you would send this transcript to your backend
      // which then calls the Gemini API securely.
      // For a client-side prototype, you might directly use the Google AI SDK,
      // but be aware of API key exposure for production. [15]
      console.log("Sending transcript to Gemini:", transcript);

      try {
        // Placeholder for Gemini API call (requires a backend for secure and robust integration)
        // Example using a hypothetical backend endpoint:
        // const response = await fetch('/api/process-with-gemini', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ text: transcript }),
        // });
        // const data = await response.json();
        // setGeminiResponse(data.geminiOutput);

        setGeminiResponse(
          "Gemini processing (simulated): " + transcript.toUpperCase(),
        ); // Simulated response
      } catch (error) {
        console.error("Error sending to Gemini:", error);
        setGeminiResponse("Error processing with Gemini.");
      }
    }
  };

  return (
    <div>
      <p>Microphone: {listening ? "on" : "off"}</p>
      <button onClick={SpeechRecognition.startListening}>
        Start Listening
      </button>
      <button onClick={SpeechRecognition.stopListening}>Stop Listening</button>
      <button onClick={resetTranscript}>Reset</button>
      <p>{transcript}</p>
      <button onClick={handleSendToGemini} disabled={!transcript || listening}>
        Process with Gemini (Text)
      </button>
      {geminiResponse && (
        <div>
          <h3>Gemini's Response:</h3>
          <p>{geminiResponse}</p>
        </div>
      )}
    </div>
  );
}

export default AudioToTextComponent;
