import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect, useRef } from 'react';

interface VoiceConfig {
    agentId: string;
    apiKey?: string;
    maxSessionLength?: number;
    silenceTimeout?: number;
}

export const useSovereignVoice = (config: VoiceConfig) => {
    const { 
        startSession, 
        endSession, 
        status, 
        isSpeaking, 
        mode,
        // Nativní funkce od ElevenLabs pro poslání textu namísto hlasu (pokud je potřeba explicitní trigger)
        sendUserMessage 
    } = useConversation();

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const maxSessionLength = config.maxSessionLength ?? 300; // default 300s (5 mins)
    const silenceTimeout = config.silenceTimeout ?? 60; // default 60s of silence
    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';
    const clearTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };
    const scheduleStop = (delaySec: number) => {
        clearTimer();
        timeoutRef.current = setTimeout(() => {
            endSession();
            console.log('ElevenLabs: Session auto‑stopped to save credits');
        }, delaySec * 1000);
    };

    const connectToEngine = useCallback(async () => {
        if (status !== 'connected' && status !== 'connecting') {
            try {
                await startSession({ 
                    agentId: config.agentId,
                    onConnect: () => console.log("ElevenLabs: Připojeno!"),
                    onDisconnect: (reason) => console.warn("ElevenLabs: Odpojeno. Důvod:", reason),
                    onError: (error) => console.error("ElevenLabs: Chyba:", error),
                    onMessage: (msg) => console.log("ElevenLabs Zpráva:", msg)
                });
            } catch (err) {
                console.error("Failed to connect to ElevenLabs engine:", err);
            }
        }
    }, [status, startSession, config.agentId]);
    // Auto‑stop session to prevent excessive credit usage
    useEffect(() => {
        if (status === 'connected') {
            if (isSpeaking) {
                scheduleStop(maxSessionLength);
            } else {
                // stop after 60 seconds of silence (configurable)
                scheduleStop(silenceTimeout);
            }
        }
        return clearTimer;
    }, [isSpeaking, status, maxSessionLength, silenceTimeout]);
    const sendVoiceInput = useCallback((text: string) => {
        if (status === 'connected' && typeof sendUserMessage === 'function') {
            sendUserMessage(text);
        }
    }, [status, sendUserMessage]);

    return { 
        connectToEngine, 
        startSession: connectToEngine,
        stopSession: endSession,
        sendVoiceInput, 
        isConnected, 
        isConnecting, 
        isSpeaking,
        mode,
        disconnect: endSession
    };
};