To build an audio-to-text application with React and Google Gemini, you can consider two primary approaches, depending on whether you want the browser or Google Gemini to perform the initial speech-to-text transcription:

1.  **Browser-based Speech Recognition with React, then sending text to Gemini for further processing:** This approach leverages the Web Speech API directly in the browser for real-time transcription. You would then send the transcribed text to Google Gemini for advanced natural language processing tasks like summarization, question answering, or sentiment analysis.
2.  **Recording audio in React and sending the audio to Google Gemini (via a backend) for transcription:** This approach utilizes Gemini's robust audio understanding capabilities to perform the speech-to-text conversion, offering potentially higher accuracy, speaker labeling, and handling of various audio formats. This usually involves an intermediary backend to securely handle the audio and interact with the Gemini API.
    Here's a breakdown of how to implement both, focusing on the "audio to text" aspect:

### Approach 1: Browser-based Speech Recognition (React's Web Speech API)

This method is simpler for real-time, in-browser transcription. Libraries like `react-speech-recognition` or `react-speech-kit` simplify access to the Web Speech API.

**Key Features & Considerations:**

- **Real-time Transcription:** Provides a transcript as the user speaks.
- **Browser Dependency:** Primarily supported robustly by Chrome. Cross-browser compatibility may be limited.
- **Offline Capability:** Requires an internet connection as audio is sent to a web service for processing.
- **Microphone Access:** Requires user permission to access the microphone.

**Implementation Steps:**

1.  **Set up your React project:**

    ```bash
    npx create-react-app audio-to-text-app
    cd audio-to-text-app
    ```

2.  **Install a speech recognition library:**
    `react-speech-recognition` is a popular choice:

    ```bash
    npm install --save react-speech-recognition
    # or
    yarn add react-speech-recognition
    ```

3.  **Create your React Component:**
    You'll use the `useSpeechRecognition` hook to manage the speech recognition process. It provides the transcript, methods to start/stop listening, and microphone availability status.

    ```jsx
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
          <button onClick={SpeechRecognition.stopListening}>
            Stop Listening
          </button>
          <button onClick={resetTranscript}>Reset</button>
          <p>{transcript}</p>
          <button
            onClick={handleSendToGemini}
            disabled={!transcript || listening}
          >
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
    ```

4.  **Integrate into `App.js`:**

    ```jsx
    import React from "react";
    import AudioToTextComponent from "./AudioToTextComponent"; // Assuming the component is in this file

    function App() {
      return (
        <div className="App">
          <h1>Audio to Text with React</h1>
          <AudioToTextComponent />
        </div>
      );
    }

    export default App;
    ```

**Integrating Gemini for Text Processing (after browser ASR):**

Once you have the `transcript` from `react-speech-recognition`, you can send this text to your backend, which then calls the Google Gemini API. Gemini can generate text output from various inputs, including text. You would use the `generateContent` method of the Gemini API.

- **Backend setup (e.g., Node.js with Express):**

  ```javascript
  // server.js (example using Node.js)
  const express = require("express");
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  require("dotenv").config(); // For environment variables

  const app = express();
  const port = 3001;

  app.use(express.json());

  // Initialize Gemini (replace with your API key)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  app.post("/api/process-with-gemini", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text input is required." });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or "gemini-1.5-flash"

      const result = await model.generateContent(text);
      const response = await result.response;
      const geminiOutput = response.text();

      res.json({ geminiOutput });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: "Failed to process with Gemini API." });
    }
  });

  app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
  });
  ```

  Remember to create a `.env` file with `GEMINI_API_KEY=YOUR_API_KEY`.

### Approach 2: Recording Audio in React and Sending to Gemini for Transcription

This approach is more robust for audio-to-text conversion by Gemini itself. It requires handling audio recording in React, sending the audio to a server, and then the server interacting with the Gemini API.

**Key Features & Considerations:**

- **Gemini's ASR Capabilities:** Gemini can analyze and understand audio input, providing transcription, summarization, and answering questions about audio content.
- **Audio Formats:** Supports WAV and MP3.
- **File Size Limits:** For larger audio files (over 20 MB total request size), use the Files API to upload the audio before making a `generateContent` request. Smaller files can be sent inline.
- **Real-time (Gemini Live API):** The Gemini Live API is in preview for low-latency, real-time voice and video interactions, processing continuous audio streams. This typically involves WebSockets and a server-side component.
- **Backend Required:** A backend server is generally necessary to securely handle your Gemini API key, manage audio uploads, and orchestrate communication.

**Implementation Steps (High-Level):**

1.  **React Frontend:**
    - **Audio Recording:** Use a library like `RecordRTC` or the native MediaDevices API (`navigator.mediaDevices.getUserMedia`) to record audio from the user's microphone.
    - **Convert to Blob/File:** Once recording stops, convert the recorded audio data into a `Blob` or `File` object (e.g., WAV or MP3 format).
    - **Send to Backend:** Use `fetch` or `axios` to send the audio `Blob`/`File` to your backend server.

    ```jsx
    // Simplified React component for audio recording and sending
    import React, { useState, useRef } from "react";

    function AudioRecorderComponent() {
      const [recording, setRecording] = useState(false);
      const [audioBlob, setAudioBlob] = useState(null);
      const mediaRecorderRef = useRef(null);
      const audioChunksRef = useRef([]);

      const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          }); // Or 'audio/mpeg' for MP3
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
        formData.append("audio", audioBlob, "recording.wav"); // Append the audio file

        try {
          // Send audio to your backend for Gemini transcription
          const response = await fetch("/api/transcribe-with-gemini", {
            method: "POST",
            body: formData, // No 'Content-Type' header needed for FormData
          });
          const data = await response.json();
          console.log("Gemini Transcription:", data.transcription);
          alert("Transcription: " + data.transcription);
        } catch (error) {
          console.error("Error sending audio to Gemini:", error);
          alert("Error transcribing audio.");
        }
      };

      return (
        <div>
          <button onClick={recording ? stopRecording : startRecording}>
            {recording ? "Stop Recording" : "Start Recording"}
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
    ```

2.  **Backend (Node.js with Express and Multer):**
    - **Receive Audio:** Use a middleware like `multer` to handle file uploads from the React frontend.
    - **Send to Gemini:** Read the uploaded audio file and send it to the Gemini API. For larger files, you'd first upload to a cloud storage (like Google Cloud Storage) and provide Gemini with a file URI using the Files API.

    ```javascript
    // server.js (example for handling audio file and sending to Gemini)
    const express = require('express');
    const multer = require('multer');
    const { GoogleGenerativeAI, Part, GenerationConfig } = require('@google/generative-ai'); // Added Part and GenerationConfig
    const fs = require('fs'); // For reading file
    const util = require('util'); // For promisify
    const readFile = util.promis promisify(fs.readFile); // Convert to promise-based function
    require('dotenv').config();

    const app = express();
    const port = 3001;

    app.use(express.json());

    // Configure multer for file uploads
    const upload = multer({ dest: 'uploads/' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Helper to convert local file to a GoogleGenerativeAI.Part object
    async function fileToGenerativePart(path, mimeType) {
      const data = await readFile(path);
      return {
        inlineData: {
          data: Buffer.from(data).toString('base64'),
          mimeType
        },
      };
    }

    app.post('/api/transcribe-with-gemini', upload.single('audio'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No audio file uploaded.' });
        }

        const audioFilePath = req.file.path;
        const audioMimeType = req.file.mimetype;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use a model that supports audio [7]

        const audioPart = await fileToGenerativePart(audioFilePath, audioMimeType);

        const result = await model.generateContent([
          audioPart,
          { text: "Transcribe this audio." } // Prompt for transcription [7]
        ]);
        const response = await result.response;
        const transcription = response.text();

        // Clean up the uploaded file
        fs.unlink(audioFilePath, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });

        res.json({ transcription });
      } catch (error) {
        console.error('Error during Gemini audio transcription:', error);
        res.status(500).json({ error: 'Failed to transcribe audio with Gemini.' });
      }
    });

    app.listen(port, () => {
      console.log(`Backend server listening at http://localhost:${port}`);
    });
    ```

    Install necessary packages: `npm install express multer @google/generative-ai dotenv`.

**Gemini Live API for Real-time Streaming (Advanced):**

For true real-time, low-latency audio-to-text with Gemini, you would explore the **Gemini Live API**, which is currently in preview. This involves:

- Establishing a WebSocket connection from your React frontend to a backend.
- Streaming audio chunks from the browser's microphone (e.g., using Web Audio API or `RecordRTC`) over the WebSocket to your backend.
- Your backend then forwards these audio streams to the Gemini Live API.
- The Gemini Live API processes the continuous stream and sends back immediate, spoken responses or text transcripts.
- Partner integrations like Daily or LiveKit can simplify this complex setup.

### General Considerations for Gemini API Integration:

- **API Key Security:** Never expose your Gemini API key directly in client-side React code. Always route API calls through a secure backend server.
- **Authentication:** Set up Application Default Credentials for server-side authentication to Google Cloud/Gemini APIs.
- **Firebase AI Logic:** For web apps, Google recommends Firebase AI Logic (in public preview) when calling the Gemini API directly, as it offers enhanced security and integrations with other Firebase/Google Cloud products. For prototyping, the Google AI SDK can be used directly from the client, but security concerns exist for production.
- **Error Handling:** Implement robust error handling for microphone access, API calls, and network issues.
- **User Experience:** Provide clear feedback to the user about recording status, microphone availability, and processing.
- **Cost & Quotas:** Be mindful of API usage costs and any free tier limits, especially for audio processing, which can be resource-intensive.
- **Model Selection:** Choose the appropriate Gemini model (e.g., `gemini-1.5-pro`, `gemini-1.5-flash`) based on your needs for quality, cost, and features like speaker labeling or timestamping.

By combining React's capabilities for UI and audio capture with Google Gemini's powerful AI models, you can build a versatile audio-to-text application with advanced processing features.

To build a NestJS backend that generates subtitles from an audio file using Google Gemini, it's important to understand a key nuance:

- **Google Gemini's primary strength for audio is understanding content and generating text/responses based on it.** While you _can_ prompt it to include time estimations, Gemini 1.5, as a general-purpose multimodal generative model, is _not_ specifically designed for highly precise, word-level timestamping required for professional subtitles. It will attempt to provide time information based on its understanding of the audio duration and content, but this might be less accurate than a dedicated Speech-to-Text (STT) service.
- **For precise, production-grade subtitles with word-level timestamps and segment information, Google Cloud's dedicated [Speech-to-Text API](https://cloud.google.com/speech-to-text) is the recommended tool.** It's built for exactly this purpose and offers features like word offsets, speaker diarization, and confidence scores.

Given your request to "Build a NestJS that generate a subtitle from an audio _with Google Gemini_", I will provide an implementation that uses Gemini 1.5 by prompting it to output a structured format (JSON) that includes estimated timestamps, which can then be converted to SRT.

**However, please be aware of the accuracy limitations when relying solely on Gemini for precise timestamping. For robust subtitle generation, consider integrating the Google Cloud Speech-to-Text API.**

---

### NestJS Backend for Subtitle Generation (using Google Gemini)

This setup will allow your NestJS application to receive an audio file, send it to the Gemini API with a specific prompt to generate timed text, and then convert that into an SRT subtitle file.

**1. Create a New NestJS Project (if you haven't already):**

```bash
nest new nestjs-gemini-subtitle-generator
cd nestjs-gemini-subtitle-generator
```

**2. Install Necessary Dependencies:**

```bash
npm install @google/generative-ai multer @nestjs/config
npm install -D @types/multer # Install types for Multer
```

**3. Set Up Environment Variables:**

Create a `.env` file in the root of your NestJS project:

```
GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
PORT=3001
```

**Important:** Replace `YOUR_GOOGLE_GEMINI_API_KEY` with your actual API key.

**4. NestJS Configuration (`src/config/configuration.ts` and `src/config/config.module.ts`):**

`src/config/configuration.ts`:

```typescript
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  geminiApiKey: process.env.GEMINI_API_KEY,
});
```

`src/config/config.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import configuration from "./configuration";

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
  exports: [NestConfigModule], // Export NestConfigModule for use in other modules if needed
})
export class ConfigModule {}
```

**5. Gemini Service (`src/gemini/gemini.service.ts`):**

This service handles the interaction with the Gemini API and the conversion to SRT.

```typescript
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// Define an interface for the expected structure from Gemini
interface SubtitleSegment {
  start_time_seconds: number;
  end_time_seconds: number;
  text: string;
}

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(GeminiService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("geminiApiKey");
    if (!apiKey) {
      this.logger.error("GEMINI_API_KEY is not set in environment variables.");
      throw new InternalServerErrorException("Gemini API key is missing.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Converts a Buffer to a Generative Part for inline data.
   * @param data The audio file buffer.
   * @param mimeType The MIME type of the audio (e.g., 'audio/wav', 'audio/mpeg').
   * @returns A Part object suitable for the Gemini API.
   */
  private bufferToGenerativePart(data: Buffer, mimeType: string): Part {
    return {
      inlineData: {
        data: data.toString("base64"),
        mimeType,
      },
    };
  }

  /**
   * Converts seconds to HH:MM:SS,ms format for SRT.
   */
  private formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor(
      (totalSeconds - Math.floor(totalSeconds)) * 1000,
    );

    return (
      [hours, minutes, seconds]
        .map((v) => v.toString().padStart(2, "0"))
        .join(":") + `,${milliseconds.toString().padStart(3, "0")}`
    );
  }

  /**
   * Converts an array of subtitle segments into SRT format.
   */
  private convertToSrt(segments: SubtitleSegment[]): string {
    let srtContent = "";
    segments.forEach((segment, index) => {
      const startTime = this.formatTime(segment.start_time_seconds);
      const endTime = this.formatTime(segment.end_time_seconds);

      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${segment.text}\n\n`;
    });
    return srtContent;
  }

  /**
   * Generates subtitles from audio using the Google Gemini API.
   * Prompts Gemini to return a JSON array with estimated timestamps.
   * @param audioBuffer The audio file as a Buffer.
   * @param mimeType The MIME type of the audio.
   * @returns The subtitles in SRT format.
   */
  async generateSubtitlesFromAudio(
    audioBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    try {
      // Using a multimodal model that supports audio input [7]
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      }); // Or "gemini-1.5-pro"

      const audioPart = this.bufferToGenerativePart(audioBuffer, mimeType);

      // Prompt to request JSON output with estimated timestamps
      // IMPORTANT: Gemini's ability to provide precise timestamps is an estimation
      // and relies on its understanding of the content. For high accuracy,
      // Google Cloud Speech-to-Text API is recommended.
      const prompt = `Transcribe this audio. For each spoken segment or sentence, provide its estimated start time in seconds, end time in seconds, and the transcribed text. Return the output as a JSON array of objects, where each object has 'start_time_seconds', 'end_time_seconds', and 'text' fields. Ensure the JSON is valid and only includes the JSON output.`;

      const result = await model.generateContent([audioPart, { text: prompt }]);

      const response = await result.response;
      const geminiTextResponse = response.text();
      this.logger.debug(`Raw Gemini Response: ${geminiTextResponse}`);

      let segments: SubtitleSegment[];
      try {
        // Attempt to parse the response as JSON
        segments = JSON.parse(geminiTextResponse);
        if (
          !Array.isArray(segments) ||
          !segments.every(
            (s) =>
              "start_time_seconds" in s &&
              "end_time_seconds" in s &&
              "text" in s,
          )
        ) {
          throw new Error(
            "Parsed JSON does not match expected SubtitleSegment format.",
          );
        }
      } catch (jsonError) {
        this.logger.error(
          `Failed to parse Gemini response as JSON. Attempting fallback: ${jsonError.message}`,
        );
        // Fallback: If JSON parsing fails, try to return plain transcription
        // For actual subtitle generation, this fallback is not ideal for timestamps.
        // You would likely re-prompt or use a different service.
        return `WARNING: Could not generate timed subtitles. Raw transcription: ${geminiTextResponse}`;
      }

      const srtContent = this.convertToSrt(segments);
      this.logger.log(
        "Subtitles successfully generated by Gemini and formatted to SRT.",
      );
      return srtContent;
    } catch (error) {
      this.logger.error(
        `Error generating subtitles with Gemini: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Failed to generate subtitles with Gemini.",
      );
    }
  }
}
```

**6. Audio Controller (`src/audio/audio.controller.ts`):**

This controller exposes the API endpoint for subtitle generation.

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Logger,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express"; // Import Response from express
import { GeminiService } from "../gemini/gemini.service";

@Controller("audio")
export class AudioController {
  private readonly logger = new Logger(AudioController.name);

  constructor(private readonly geminiService: GeminiService) {}

  @Post("subtitles")
  @UseInterceptors(FileInterceptor("audio")) // 'audio' is the field name for the file
  async generateSubtitles(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException("No audio file provided.");
    }

    const allowedMimeTypes = ["audio/wav", "audio/mpeg", "audio/webm"]; // Common audio types
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Please upload a WAV, MP3, or WebM audio file.`,
      );
    }

    this.logger.log(
      `Received audio for subtitles: ${file.originalname}, MIME type: ${file.mimetype}, Size: ${file.size} bytes`,
    );

    try {
      const srtContent = await this.geminiService.generateSubtitlesFromAudio(
        file.buffer,
        file.mimetype,
      );

      // Set headers for SRT file download
      res.setHeader("Content-Type", "text/plain"); // SRT is plain text
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.originalname}.srt"`,
      );
      res.send(srtContent);
    } catch (error) {
      this.logger.error(
        `Error in generateSubtitles endpoint: ${error.message}`,
      );
      // Re-throw the error, NestJS's exception filter will handle it
      throw error;
    }
  }
}
```

**7. NestJS Modules (`src/gemini/gemini.module.ts` and `src/audio/audio.module.ts`):**

`src/gemini/gemini.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { GeminiService } from "./gemini.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {}
```

`src/audio/audio.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { AudioController } from "./audio.controller";
import { GeminiModule } from "../gemini/gemini.module";

@Module({
  imports: [GeminiModule],
  controllers: [AudioController],
})
export class AudioModule {}
```

**8. Update Main Application Module (`src/app.module.ts`):**

```typescript
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AudioModule } from "./audio/audio.module";
import { ConfigModule } from "./config/config.module";
import { GeminiModule } from "./gemini/gemini.module";

@Module({
  imports: [ConfigModule, GeminiModule, AudioModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**9. Enable CORS (`src/main.ts`):**

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config"; // Import ConfigService

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>("port");

  // Enable CORS
  app.enableCors({
    origin: "http://localhost:3000", // Replace with your frontend's URL
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
```

**10. Run Your NestJS Application:**

```bash
npm run start:dev
```

Your NestJS backend should now be running on `http://localhost:3001` (or whatever port you configured).

### Frontend Interaction (Conceptual - React)

Your React frontend would now make a `POST` request to `http://localhost:3001/audio/subtitles` with the audio file in `FormData`.

```javascript
// Example in a React component (after recording audio and having audioBlob)
const sendAudioForSubtitles = async () => {
  if (!audioBlob) return;

  const formData = new FormData();
  formData.append("audio", audioBlob, "my_audio.wav"); // Use .wav for broader compatibility

  try {
    const response = await fetch("http://localhost:3001/audio/subtitles", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to generate subtitles on backend.",
      );
    }

    // If successful, the response will be the SRT content
    const srtContent = await response.text();
    console.log("Generated SRT:", srtContent);

    // You can then display this SRT content or offer it as a download
    // For download:
    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitles.srt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error sending audio for subtitles:", error);
    alert("Error generating subtitles: " + error.message);
  }
};
```

This setup provides a complete NestJS backend that uses Google Gemini to attempt subtitle generation. Remember to thoroughly test the accuracy of the timestamps generated by Gemini for your specific use case.

Okay, let's enhance the React frontend to play the audio and display the generated SRT content with a typewriter effect, synchronized with the audio playback.

This involves:

1.  **React Frontend:**
    - An `<audio>` element for playback.
    - State to manage audio files, SRT content, current displayed text, and playback status.
    - Logic to parse the SRT string into structured data (start time, end time, text).
    - An `onTimeUpdate` event listener for the audio element to synchronize the text display.
    - A typewriter effect mechanism that reveals text based on the audio's current time.

2.  **NestJS Backend:** (Already built in the previous response, no changes needed for this part). It provides the `/audio/subtitles` endpoint to generate and return the SRT file.

---

### React Frontend (Updated `AudioTranscriptionPlayer.jsx`)

Create a new file, e.g., `src/AudioTranscriptionPlayer.jsx` or modify your `App.js` as needed.

```jsx
import React, { useState, useRef, useEffect, useCallback } from "react";

// Helper function to parse SRT time format (HH:MM:SS,ms) to milliseconds
const srtTimeToMs = (timeStr) => {
  const [hours, minutes, secondsAndMs] = timeStr.split(":");
  const [seconds, ms] = secondsAndMs.split(",");
  return (
    parseInt(hours, 10) * 3600 * 1000 +
    parseInt(minutes, 10) * 60 * 1000 +
    parseInt(seconds, 10) * 1000 +
    parseInt(ms, 10)
  );
};

// Helper function to parse SRT content
const parseSrtContent = (srtText) => {
  const lines = srtText.split(/\r?\n/);
  const segments = [];
  let currentSegment = null;

  for (const line of lines) {
    if (line.trim() === "") {
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = null;
      }
    } else if (/^\d+$/.test(line.trim())) {
      // This is a new segment number, reset for a new segment
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = { text: "" };
    } else if (line.includes("-->")) {
      const [startTimeStr, endTimeStr] = line.split("-->").map((s) => s.trim());
      if (currentSegment) {
        currentSegment.startTimeMs = srtTimeToMs(startTimeStr);
        currentSegment.endTimeMs = srtTimeToMs(endTimeStr);
      }
    } else if (currentSegment) {
      // This is the text content
      if (currentSegment.text) {
        currentSegment.text += " " + line.trim(); // Append if multiple text lines
      } else {
        currentSegment.text = line.trim();
      }
    }
  }
  // Add the last segment if it exists
  if (currentSegment) {
    segments.push(currentSegment);
  }
  return segments;
};

function AudioTranscriptionPlayer() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [srtText, setSrtText] = useState("");
  const [parsedSrt, setParsedSrt] = useState([]);
  const [currentDisplayedText, setCurrentDisplayedText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSrtIndex, setCurrentSrtIndex] = useState(-1);
  const [typingIndex, setTypingIndex] = useState(0); // For typewriter effect
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const typewriterIntervalRef = useRef(null);

  // Clean up Blob URL when component unmounts or audioFile changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle audio file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
      // Create a URL for local audio playback
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl); // Clean up previous URL
      }
      setAudioUrl(URL.createObjectURL(file));
      setSrtText("");
      setParsedSrt([]);
      setCurrentDisplayedText("");
      setCurrentSrtIndex(-1);
      setTypingIndex(0);
      setError(null);
    }
  };

  // Upload audio to NestJS backend for SRT generation
  const uploadAudioForSubtitles = async () => {
    if (!audioFile) {
      setError("Please select an audio file first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentDisplayedText("");
    setCurrentSrtIndex(-1);
    setTypingIndex(0);

    const formData = new FormData();
    formData.append("audio", audioFile, audioFile.name);

    try {
      // Ensure your backend URL is correct
      const response = await fetch("http://localhost:3001/audio/subtitles", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to generate subtitles on backend.",
        );
      }

      const srtResult = await response.text();
      setSrtText(srtResult);
      setParsedSrt(parseSrtContent(srtResult));
      console.log("SRT Generated:", srtResult);
    } catch (err) {
      console.error("Error generating subtitles:", err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Typewriter effect function
  const startTypewriterEffect = useCallback((text) => {
    // Clear any existing interval
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }

    setTypingIndex(0);
    setCurrentDisplayedText("");

    let charIndex = 0;
    typewriterIntervalRef.current = setInterval(() => {
      if (charIndex < text.length) {
        setCurrentDisplayedText((prev) => prev + text[charIndex]);
        charIndex++;
      } else {
        clearInterval(typewriterIntervalRef.current);
      }
    }, 50); // Adjust typing speed (milliseconds per character)
  }, []);

  // Stop typewriter effect and display full line
  const stopTypewriterEffect = useCallback((fullText) => {
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }
    setCurrentDisplayedText(fullText);
  }, []);

  // Audio time update handler for synchronization
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || parsedSrt.length === 0) return;

    const currentTimeMs = audioRef.current.currentTime * 1000;
    let newSrtIndex = currentSrtIndex;

    // Find the correct segment based on current audio time
    let found = false;
    for (let i = 0; i < parsedSrt.length; i++) {
      const segment = parsedSrt[i];
      if (
        currentTimeMs >= segment.startTimeMs &&
        currentTimeMs <= segment.endTimeMs
      ) {
        newSrtIndex = i;
        found = true;
        break;
      }
    }

    // If no segment is active (e.g., between segments, or before first/after last)
    if (!found) {
      if (currentSrtIndex !== -1) {
        // If a segment was previously active, clear text
        stopTypewriterEffect("");
        setCurrentSrtIndex(-1);
        setCurrentDisplayedText("");
      }
      return;
    }

    // If a new segment becomes active, start the typewriter effect for it
    if (newSrtIndex !== currentSrtIndex) {
      setCurrentSrtIndex(newSrtIndex);
      startTypewriterEffect(parsedSrt[newSrtIndex].text);
    } else if (
      // If still in the same segment but typewriter finished, ensure full text is displayed
      currentSrtIndex !== -1 &&
      currentDisplayedText.length < parsedSrt[currentSrtIndex].text.length &&
      !typewriterIntervalRef.current // Check if typewriter is not running
    ) {
      // This can happen if audio seeks or jumps, and typewriter was stopped but not fully displayed
      stopTypewriterEffect(parsedSrt[currentSrtIndex].text);
    }
  }, [
    parsedSrt,
    currentSrtIndex,
    currentDisplayedText,
    startTypewriterEffect,
    stopTypewriterEffect,
  ]);

  // Handle play/pause
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        stopTypewriterEffect(
          currentSrtIndex !== -1 ? parsedSrt[currentSrtIndex].text : "",
        ); // Show full text when paused
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Listener for audio playing/pausing state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      stopTypewriterEffect(""); // Clear text when audio ends
      setCurrentSrtIndex(-1);
      setTypingIndex(0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate); // Add timeupdate listener

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate); // Clean up
    };
  }, [handleTimeUpdate, stopTypewriterEffect]); // Dependencies for useEffect

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h1>Audio Subtitle Generator & Player</h1>

      <div style={{ marginBottom: "20px" }}>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        <button
          onClick={uploadAudioForSubtitles}
          disabled={!audioFile || isGenerating}
          style={{
            marginLeft: "10px",
            padding: "8px 15px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isGenerating ? "Generating..." : "Generate Subtitles"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {audioUrl && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Audio Player:</h3>
          <audio ref={audioRef} controls style={{ width: "100%" }}>
            <source src={audioUrl} type={audioFile?.type || "audio/wav"} />
            Your browser does not support the audio element.
          </audio>
          <button
            onClick={handlePlayPause}
            disabled={!parsedSrt.length}
            style={{
              padding: "8px 15px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            {isPlaying ? "Pause Subtitles" : "Play Subtitles"}
          </button>
        </div>
      )}

      {parsedSrt.length > 0 && (
        <div>
          <h3>Live Subtitles:</h3>
          <div
            style={{
              minHeight: "80px",
              border: "1px solid #eee",
              padding: "15px",
              fontSize: "1.2em",
              backgroundColor: "#f9f9f9",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            {currentDisplayedText || "Waiting for audio to play..."}
          </div>

          <h3 style={{ marginTop: "20px" }}>Full SRT Content:</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              backgroundColor: "#eee",
              padding: "15px",
              borderRadius: "4px",
              maxHeight: "300px",
              overflowY: "auto",
              fontSize: "0.9em",
            }}
          >
            {srtText || "SRT content will appear here after generation."}
          </pre>
        </div>
      )}
    </div>
  );
}

export default AudioTranscriptionPlayer;
```

### How to Use:

1.  **NestJS Backend:** Ensure your NestJS application (from the previous response) is running, typically on `http://localhost:3001`.
2.  **React Project:**
    - If you don't have a React project, create one: `npx create-react-app my-subtitle-app && cd my-subtitle-app`.
    - Replace the content of `src/App.js` (or `src/App.jsx`) with the `AudioTranscriptionPlayer` component code above, and change `export default App;` to `export default AudioTranscriptionPlayer;`.
    - Or, you can keep `App.js` as is and import `AudioTranscriptionPlayer` into `App.js`:

      ```jsx
      import React from "react";
      import AudioTranscriptionPlayer from "./AudioTranscriptionPlayer"; // Adjust path if needed

      function App() {
        return (
          <div className="App">
            <AudioTranscriptionPlayer />
          </div>
        );
      }
      export default App;
      ```

    - Start your React development server: `npm start`.

3.  **Interaction:**
    - Open your browser to `http://localhost:3000` (or wherever your React app is running).
    - Select an audio file using the "Choose File" button.
    - Click "Generate Subtitles". This will send the audio to your NestJS backend.
    - Once the SRT content is generated and displayed, click the "Play Subtitles" button.
    - The audio will play, and the subtitles will appear with a typewriter effect, synchronized with the audio.

### Important Considerations:

- **Timestamp Accuracy:** As mentioned previously, Gemini's estimated timestamps might not be as precise as a dedicated Speech-to-Text API like Google Cloud's. You might observe minor discrepancies between when the text appears and when the words are exactly spoken.
- **Typewriter Effect Speed:** The `50` milliseconds per character in `setInterval` is an arbitrary value. You might need to adjust it for a more natural feel or even calculate it dynamically based on the length of the subtitle segment and its duration.
- **Error Handling:** The current setup has basic error display. For a production app, you'd want more robust user feedback.
- **UI/UX:** The styling is minimal. You'd want to enhance the user interface significantly for a real application.
- **Large Files:** For very large audio files, sending them directly as a buffer might hit memory or request size limits. For such cases, you would typically upload the audio to cloud storage (e.g., Google Cloud Storage) first, and then pass the file URI to Gemini, often involving the Files API. However, for many common use cases, direct buffer transfer works.
