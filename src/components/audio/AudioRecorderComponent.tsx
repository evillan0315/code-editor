// Simplified React component for audio recording and sending
import React, { useState, useRef } from 'react';

function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' }); // Or 'audio/mpeg' for MP3
      setAudioBlob(audioBlob);
      stream.getTracks().forEach((track) => track.stop()); // Stop microphone
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const sendAudioToGemini = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav'); // Append the audio file

    try {
      // Send audio to your backend for Gemini transcription
      const response = await fetch('/api/transcribe-with-gemini', {
        method: 'POST',
        body: formData, // No 'Content-Type' header needed for FormData
      });
      const data = await response.json();
      console.log('Gemini Transcription:', data.transcription);
      alert('Transcription: ' + data.transcription);
    } catch (error) {
      console.error('Error sending audio to Gemini:', error);
      alert('Error transcribing audio.');
    }
  };

  return (
    <div>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {audioBlob && !recording && (
        <button onClick={sendAudioToGemini}>
          Transcribe with Gemini (Audio File)
        </button>
      )}
      {audioBlob && !recording && (
        <audio src={URL.createObjectURL(audioBlob)} controls />
      )}
    </div>
  );
}

export default AudioRecorderComponent;
