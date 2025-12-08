import { useState, useEffect, useRef } from "react";

export function useGreeting({ token, isAdmin }) {
  const greetingBase64Ref = useRef(null); // ✅ Store base64, not AudioBuffer
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [greetingText, setGreetingText] = useState("");

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    console.log("🎤 [useGreeting] Fetching greeting for token:", token);

    const fetchGreeting = async () => {
      try {
        setIsLoading(true);
        if (isAdmin) {
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/api/generate-greeting`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ [useGreeting] Received greeting:", data.text);

        setGreetingText(data.text);
        greetingBase64Ref.current = data.audio; // ✅ Just store base64

        setIsLoading(false);
      } catch (err) {
        console.error("❌ [useGreeting] Error fetching greeting:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchGreeting();
  }, [token]);

  const decodeGreeting = async (audioContext) => {
    if (!greetingBase64Ref.current) {
      throw new Error("No greeting audio available");
    }

    console.log("🔄 [useGreeting] Decoding greeting audio (Raw PCM 24000)...");

    // Convert base64 to ArrayBuffer
    const cleanBase64 = greetingBase64Ref.current.replace(/\s/g, "");
    const binaryString = atob(cleanBase64);

    // 1. Create a byte array from the binary string
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 2. Interpret the raw bytes as 16-bit signed integers (Int16Array)
    // We use .buffer to get the underlying ArrayBuffer, which is then passed to the constructor.
    const pcmData = new Int16Array(bytes.buffer);

    // 3. Create the destination AudioBuffer with the correct sample rate
    // CRITICAL: We hardcode 24000 here to match the backend 'pcm_24000' output format.
    const audioBuffer = audioContext.createBuffer(
      1, // 1 channel (mono)
      pcmData.length,
      24000 // Sample Rate MUST match the source
    );

    // 4. Normalize and copy the PCM data into the AudioBuffer
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      // Normalize from Int16 range (-32768 to 32767) to Float32 range (-1 to 1)
      channelData[i] = pcmData[i] / 32768.0;
    }

    console.log(
      "✅ [useGreeting] Decoded! Duration:",
      audioBuffer.duration,
      "seconds"
    );

    return audioBuffer;
  };

  return {
    greetingText,
    isLoading,
    error,
    hasGreeting: !!greetingBase64Ref.current,
    decodeGreeting, // ✅ Return function to decode later
  };
}
