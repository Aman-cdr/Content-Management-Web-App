"use client";
/**
 * AudioPanel.jsx
 * Complete audio panel: volume, effects, voiceover recorder, music library.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import useEditorStore from '../store/editorStore';

const AUDIO_EFFECTS = [
  { id: 'none', label: 'None', icon: '🎵' },
  { id: 'reverb', label: 'Reverb', icon: '🏛️' },
  { id: 'echo', label: 'Echo', icon: '🔁' },
  { id: 'bassBoost', label: 'Bass Boost', icon: '🔊' },
  { id: 'voiceChanger', label: 'Voice+', icon: '🎙️' },
  { id: 'noiseCut', label: 'Noise Cut', icon: '✂️' },
];

const MUSIC_LIBRARY = [
  { id: 'm1', name: 'Energetic Vibe', genre: 'Electronic', bpm: 128, duration: 180, mood: '⚡' },
  { id: 'm2', name: 'Calm Acoustic', genre: 'Acoustic', bpm: 80, duration: 240, mood: '🌿' },
  { id: 'm3', name: 'Epic Cinematic', genre: 'Cinematic', bpm: 100, duration: 200, mood: '🎬' },
  { id: 'm4', name: 'Hip Hop Beat', genre: 'Hip Hop', bpm: 90, duration: 160, mood: '🔥' },
  { id: 'm5', name: 'Lofi Chill', genre: 'Lofi', bpm: 75, duration: 300, mood: '☕' },
  { id: 'm6', name: 'Pop Upbeat', genre: 'Pop', bpm: 120, duration: 200, mood: '🎉' },
];

const SOUND_FX = [
  { id: 'whoosh', label: 'Whoosh', icon: '💨' },
  { id: 'pop', label: 'Pop', icon: '💥' },
  { id: 'ding', label: 'Ding', icon: '🔔' },
  { id: 'swoosh', label: 'Swoosh', icon: '🌀' },
  { id: 'click', label: 'Click', icon: '🖱️' },
  { id: 'applause', label: 'Applause', icon: '👏' },
];

export default function AudioPanel() {
  const audioMix = useEditorStore(s => s.audioMix);
  const setAudioMix = useEditorStore(s => s.setAudioMix);
  const addClip = useEditorStore(s => s.addClip);
  const currentTime = useEditorStore(s => s.currentTime);
  const duration = useEditorStore(s => s.duration);

  const [activeTab, setActiveTab] = useState('mix'); // 'mix' | 'music' | 'voice' | 'sfx'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [selectedEffect, setSelectedEffect] = useState('none');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    // 3-second countdown
    let count = 3;
    setCountdown(count);
    countdownRef.current = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(countdownRef.current);
        setCountdown(null);
        beginRecording();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, []);

  const beginRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const rec = {
          id: `voice_${Date.now()}`,
          url,
          duration: recordingTime,
          name: `Recording ${recordings.length + 1}`,
          timestamp: currentTime,
        };
        setRecordings(prev => [...prev, rec]);

        // Add to voice track
        addClip('voice-1', {
          id: rec.id,
          label: rec.name,
          src: url,
          start: currentTime,
          duration: recordingTime,
          clipDuration: recordingTime,
          type: 'voice',
        });

        stream.getTracks().forEach(t => t.stop());
        setRecordingTime(0);
      };

      recorder.start();
      setIsRecording(true);

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed++;
        setRecordingTime(elapsed);
      }, 1000);
    } catch (err) {
      console.error('Mic access denied:', err);
      alert('Microphone access denied. Please allow microphone access to record voiceover.');
    }
  };

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  }, []);

  const formatSecs = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--t-border)', padding: '0 12px' }}>
        {[['mix', 'Mix'], ['music', 'Music'], ['voice', 'Voiceover'], ['sfx', 'SFX']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === id ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === id ? '#6366f1' : 'var(--t-text-muted)',
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── Mix Tab ── */}
      {activeTab === 'mix' && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Volume sliders */}
          {[
            { key: 'masterVolume', label: '🎚️ Master', color: '#6366f1' },
            { key: 'videoAudioVolume', label: '🎬 Video Audio', color: '#22c55e' },
            { key: 'musicVolume', label: '🎵 Music', color: '#f59e0b' },
            { key: 'voiceoverVolume', label: '🎤 Voiceover', color: '#ec4899' },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text)' }}>{label}</span>
                <span style={{ fontSize: 11, color: 'var(--t-text-muted)', fontFamily: 'monospace' }}>
                  {Math.round(audioMix[key] * 100)}%
                </span>
              </div>
              <input
                type="range" min={0} max={1} step={0.01}
                value={audioMix[key]}
                onChange={e => setAudioMix({ [key]: Number(e.target.value) })}
                style={{ width: '100%', accentColor: color }}
              />
            </div>
          ))}

          {/* Audio ducking */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--t-surface)', border: '1px solid var(--t-border)', borderRadius: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--t-text)' }}>Auto Ducking</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--t-text-muted)' }}>Music lowers when voiceover plays</p>
            </div>
            <button
              onClick={() => setAudioMix({ audioDucking: !audioMix.audioDucking })}
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                border: 'none',
                background: audioMix.audioDucking ? '#6366f1' : '#374151',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 18,
                height: 18,
                background: '#fff',
                borderRadius: '50%',
                position: 'absolute',
                top: 3,
                left: audioMix.audioDucking ? 20 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>

          {/* Audio Effects */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audio Effects</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {AUDIO_EFFECTS.map(fx => (
                <button
                  key={fx.id}
                  onClick={() => setSelectedEffect(fx.id)}
                  style={{
                    padding: '8px 4px',
                    background: selectedEffect === fx.id ? 'rgba(99,102,241,0.15)' : 'var(--t-surface)',
                    border: `1px solid ${selectedEffect === fx.id ? '#6366f1' : 'var(--t-border)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 700,
                    color: selectedEffect === fx.id ? '#6366f1' : 'var(--t-text)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{fx.icon}</span>
                  {fx.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Music Tab ── */}
      {activeTab === 'music' && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Upload */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: 'var(--t-surface)', border: '1px dashed var(--t-border)', borderRadius: 8, cursor: 'pointer',
          }}>
            <span style={{ fontSize: 18 }}>⬆️</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-muted)' }}>Upload Audio (MP3, WAV)</span>
            <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = URL.createObjectURL(file);
              addClip('music-1', {
                id: `music_${Date.now()}`,
                label: file.name.replace(/\.[^/.]+$/, ''),
                src: url,
                start: 0,
                duration: 0,
                clipDuration: 60, // unknown duration without decode
                type: 'music',
              });
            }} />
          </label>

          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Library</p>

          {MUSIC_LIBRARY.map(track => (
            <div
              key={track.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: 'var(--t-surface)', border: '1px solid var(--t-border)', borderRadius: 10, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--t-border)'}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{track.mood}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--t-text)' }}>{track.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--t-text-muted)' }}>{track.genre} · {track.bpm} BPM</p>
              </div>
              <button
                onClick={() => addClip('music-1', {
                  id: `music_${track.id}_${Date.now()}`,
                  label: track.name,
                  src: null, // In production, real URL
                  start: 0,
                  duration: track.duration,
                  clipDuration: track.duration,
                  type: 'music',
                })}
                style={{
                  padding: '5px 10px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >+ Add</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Voiceover Tab ── */}
      {activeTab === 'voice' && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Record button */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            padding: '24px 16px',
            background: 'var(--t-surface)', border: '1px solid var(--t-border)', borderRadius: 12,
          }}>
            {countdown !== null && (
              <div style={{ fontSize: 48, fontWeight: 900, color: '#ef4444', animation: 'pulse 0.5s ease' }}>
                {countdown}
              </div>
            )}
            {isRecording && (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>
                ● REC {formatSecs(recordingTime)}
              </div>
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: 'none',
                background: isRecording
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                cursor: 'pointer',
                fontSize: 24,
                boxShadow: isRecording
                  ? '0 0 0 4px rgba(239,68,68,0.3), 0 4px 20px rgba(239,68,68,0.4)'
                  : '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'all 0.2s',
              }}
            >
              {isRecording ? '⏹' : '🎤'}
            </button>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--t-text-muted)', fontWeight: 600 }}>
              {isRecording ? 'Click to stop recording' : countdown !== null ? 'Get ready...' : 'Click to record voiceover'}
            </p>
          </div>

          {/* Recordings */}
          {recordings.map(rec => (
            <div key={rec.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              background: 'var(--t-surface)', border: '1px solid var(--t-border)', borderRadius: 8,
            }}>
              <span>🎤</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--t-text)' }}>{rec.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--t-text-muted)' }}>{formatSecs(rec.duration)}</p>
              </div>
              <audio src={rec.url} controls style={{ height: 28, flex: 1 }} />
            </div>
          ))}
        </div>
      )}

      {/* ── SFX Tab ── */}
      {activeTab === 'sfx' && (
        <div style={{ padding: '0 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {SOUND_FX.map(fx => (
              <button
                key={fx.id}
                onClick={() => addClip('audio-1', {
                  id: `sfx_${fx.id}_${Date.now()}`,
                  label: fx.label,
                  src: null,
                  start: currentTime,
                  duration: 1,
                  clipDuration: 1,
                  type: 'sfx',
                })}
                style={{
                  padding: '12px 8px',
                  background: 'var(--t-surface)',
                  border: '1px solid var(--t-border)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--t-text)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--t-border)'}
              >
                <span style={{ fontSize: 24 }}>{fx.icon}</span>
                {fx.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
