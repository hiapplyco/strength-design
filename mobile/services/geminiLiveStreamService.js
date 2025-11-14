/**
 * Gemini Live Stream Service
 * Bridges the pose analysis flow with the Gemini Live API (WebRTC) for real-time
 * video + audio streaming and AI feedback.
 *
 * Responsibilities:
 * - Create RTCPeerConnection instances with device media streams
 * - Exchange SDP offers with the Gemini Live REST endpoint
 * - Surface server-side insights via lightweight event emitters
 * - Provide helpers for cleaning up streams and summarising sessions
 */

import { AppState } from 'react-native';
import Constants from 'expo-constants';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';

const DEFAULT_MODEL = 'models/gemini-2.5-flash';
const DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODALITIES = ['TEXT'];
const DEFAULT_RESOLUTION = 'MEDIA_RESOLUTION_MEDIUM';
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const SUPPORTED_EVENTS = [
  'status',
  'error',
  'insight',
  'localStream',
  'remoteStream',
  'sessionEnded',
];

export default class GeminiLiveStreamService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.controlChannel = null;
    this.sessionName = null;
    this.sessionStart = null;
    this.sessionActive = false;
    this.latestMetrics = {};
    this.insights = [];

    this.listeners = SUPPORTED_EVENTS.reduce((acc, event) => {
      acc[event] = new Set();
      return acc;
    }, {});
  }

  /**
   * Subscribe to service events.
   * Returns an unsubscribe function.
   */
  on(event, callback) {
    if (!SUPPORTED_EVENTS.includes(event) || typeof callback !== 'function') {
      return () => {};
    }
    this.listeners[event].add(callback);
    return () => this.listeners[event].delete(callback);
  }

  emit(event, payload) {
    if (!SUPPORTED_EVENTS.includes(event)) return;
    this.listeners[event].forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error('[GeminiLive] Listener error:', err);
      }
    });
  }

  get apiKey() {
    return (
      Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_LIVE_API_KEY ||
      process.env.EXPO_PUBLIC_GEMINI_LIVE_API_KEY
    );
  }

  get model() {
    return (
      Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_LIVE_MODEL ||
      process.env.EXPO_PUBLIC_GEMINI_LIVE_MODEL ||
      DEFAULT_MODEL
    );
  }

  get endpoint() {
    return (
      Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_LIVE_ENDPOINT ||
      process.env.EXPO_PUBLIC_GEMINI_LIVE_ENDPOINT ||
      DEFAULT_ENDPOINT
    );
  }

  get responseModalities() {
    const raw =
      Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_LIVE_RESPONSE_MODALITIES ||
      process.env.EXPO_PUBLIC_GEMINI_LIVE_RESPONSE_MODALITIES;
    if (!raw) return DEFAULT_MODALITIES;
    return raw.split(',').map((item) => item.trim()).filter(Boolean);
  }

  get mediaResolution() {
    return (
      Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_LIVE_MEDIA_RESOLUTION ||
      process.env.EXPO_PUBLIC_GEMINI_LIVE_MEDIA_RESOLUTION ||
      DEFAULT_RESOLUTION
    );
  }

  async startSession(options = {}) {
    if (this.sessionActive) {
      return;
    }

    if (!this.apiKey) {
      throw new Error(
        'Missing EXPO_PUBLIC_GEMINI_LIVE_API_KEY. Update your env configuration before starting a session.'
      );
    }

    this.emit('status', 'Requesting camera + microphone access…');
    this.localStream = await mediaDevices.getUserMedia({
      video: {
        facingMode: options.facingMode || 'environment',
        frameRate: options.frameRate || 30,
        width: options.width || 1280,
        height: options.height || 720,
      },
      audio: true,
    });
    this.emit('localStream', this.localStream);

    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        [this.remoteStream] = event.streams;
      } else {
        this.remoteStream.addTrack(event.track);
      }
      this.emit('remoteStream', this.remoteStream);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection?.iceConnectionState === 'failed') {
        this.emit('error', new Error('WebRTC connection failed.'));
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.registerServerChannel(event.channel);
    };

    this.controlChannel = this.peerConnection.createDataChannel('client-events');
    this.controlChannel.onopen = () => {
      if (options.exerciseType) {
        this.sendControlMessage({
          type: 'exercise_context',
          exerciseType: options.exerciseType,
          exerciseName: options.exerciseName || options.exerciseType,
        });
      }
    };

    // Attach local tracks
    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });
    await this.peerConnection.setLocalDescription(offer);

    await this.waitForIceGatheringComplete();

    const response = await this.postConnectOffer(this.peerConnection.localDescription);
    if (!response?.answer) {
      throw new Error('Gemini Live API did not return an SDP answer.');
    }

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(response.answer)
    );

    this.sessionName = response.session?.name || null;
    this.sessionStart = Date.now();
    this.sessionActive = true;
    this.emit('status', 'Connected to Gemini Live. Streaming in progress…');

    // Handle foreground/background lifecycle (pause streaming when app is backgrounded)
    this.appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        this.sendControlMessage({ type: 'app_state', state: 'background' });
      } else if (state === 'active') {
        this.sendControlMessage({ type: 'app_state', state: 'active' });
      }
    });
  }

  async stopSession() {
    if (!this.sessionActive) {
      this.cleanup();
      return this.buildSessionSummary();
    }

    this.sendControlMessage({ type: 'end_session' });
    this.cleanup();
    this.emit('sessionEnded', true);
    return this.buildSessionSummary();
  }

  async waitForIceGatheringComplete() {
    if (
      !this.peerConnection ||
      this.peerConnection.iceGatheringState === 'complete'
    ) {
      return;
    }

    await new Promise((resolve) => {
      const checkState = () => {
        if (this.peerConnection?.iceGatheringState === 'complete') {
          this.peerConnection.onicegatheringstatechange = null;
          resolve();
        }
      };

      this.peerConnection.onicegatheringstatechange = checkState;
    });
  }

  async postConnectOffer(localDescription) {
    const url = `${this.endpoint}/models/${encodeURIComponent(
      this.model
    )}:connect?key=${this.apiKey}`;

    const body = {
      live_config: {
        response_modalities: this.responseModalities,
        media_resolution: this.mediaResolution,
      },
      offer: {
        sdp: localDescription.sdp,
        type: localDescription.type,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GeminiLive] Connect error:', errorText);
        throw new Error(
          `Failed to connect to Gemini Live (status ${response.status}).`
        );
      }

      return response.json();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  registerServerChannel(channel) {
    channel.onmessage = (event) => {
      this.handleServerMessage(event.data);
    };
    channel.onerror = (error) => {
      this.emit('error', error);
    };
  }

  handleServerMessage(message) {
    let payload = message;
    if (typeof message === 'string') {
      try {
        payload = JSON.parse(message);
      } catch (_) {
        payload = message;
      }
    }

    const insight = this.normalizeInsight(payload);
    this.insights.unshift(insight);
    this.insights = this.insights.slice(0, 40);
    this.emit('insight', insight);
  }

  normalizeInsight(payload) {
    const timestamp = Date.now();

    if (typeof payload === 'string') {
      return {
        id: `${timestamp}`,
        timestamp,
        type: 'text',
        text: payload,
      };
    }

    const text =
      payload?.text ||
      payload?.markdown ||
      payload?.message ||
      JSON.stringify(payload, null, 2);

    if (payload?.metrics) {
      this.latestMetrics = { ...this.latestMetrics, ...payload.metrics };
    }

    return {
      id: payload?.id || `${timestamp}`,
      timestamp,
      type: payload?.type || (payload?.metrics ? 'metrics' : 'json'),
      text,
      raw: payload,
      metrics: payload?.metrics,
    };
  }

  sendControlMessage(payload) {
    if (!this.controlChannel || this.controlChannel.readyState !== 'open') {
      return;
    }
    try {
      this.controlChannel.send(JSON.stringify(payload));
    } catch (error) {
      console.warn('[GeminiLive] Failed to send control message:', error);
    }
  }

  buildSessionSummary() {
    return {
      sessionName: this.sessionName,
      startedAt: this.sessionStart,
      endedAt: Date.now(),
      insights: this.insights,
      metrics: this.latestMetrics,
      model: this.model,
    };
  }

  cleanup() {
    this.sessionActive = false;

    if (this.controlChannel) {
      try {
        this.controlChannel.close();
      } catch (_) {
        /* no-op */
      }
    }
    this.controlChannel = null;

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (_) {
        /* no-op */
      }
    }
    this.peerConnection = null;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    this.localStream = null;
    this.remoteStream = null;

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.emit('localStream', null);
    this.emit('remoteStream', null);
    this.emit('status', 'Session ended');
  }
}
