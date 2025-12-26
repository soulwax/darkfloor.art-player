// File: src/contexts/AudioPlayerContext.tsx

"use client";

import { useToast } from "@/contexts/ToastContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { useSession } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";

interface AudioPlayerContextType {
  // Player state
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
  playbackRate: number;
  isLoading: boolean;
  lastAutoQueueCount: number;
  showMobilePlayer: boolean;
  setShowMobilePlayer: (show: boolean) => void;
  hideUI: boolean;
  setHideUI: (hide: boolean) => void;

  // Audio element reference for visualizer and equalizer
  audioElement: HTMLAudioElement | null;

  // Actions
  play: (track: Track) => void;
  togglePlay: () => Promise<void>;
  addToQueue: (track: Track | Track[], checkDuplicates?: boolean) => void;
  addToPlayNext: (track: Track | Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  playFromQueue: (index: number) => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (oldIndex: number, newIndex: number) => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setPlaybackRate: (rate: number) => void;
  skipForward: () => void;
  skipBackward: () => void;

  // Queue Management
  saveQueueAsPlaylist: () => Promise<void>;

  // Queue Safety & Cleanup
  removeDuplicates: () => void;
  cleanInvalidTracks: () => void;
  cleanQueue: () => void;
  clearQueueAndHistory: () => void;
  isValidTrack: (track: Track | null | undefined) => track is Track;

  // COMMENTED OUT - Smart Queue features disabled for now
  // addSimilarTracks: (trackId: number, count?: number) => Promise<void>;
  // generateSmartMix: (seedTrackIds: number[], count?: number) => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined,
);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [showMobilePlayer, setShowMobilePlayer] = useState(false);
  const [hideUI, setHideUI] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const addToHistory = api.music.addToHistory.useMutation();
  const createPlaylistMutation = api.music.createPlaylist.useMutation();
  const addToPlaylistMutation = api.music.addToPlaylist.useMutation();

  // COMMENTED OUT - Smart queue settings disabled
  // const { data: smartQueueSettings } = api.music.getSmartQueueSettings.useQuery(
  //   undefined,
  //   { enabled: !!session },
  // );

  // TRPC utils for imperative calls
  const utils = api.useUtils();

  // COMMENTED OUT - Smart queue mutations disabled
  // const generateSmartMixMutation = api.music.generateSmartMix.useMutation();
  // const logRecommendationMutation = api.music.logRecommendation.useMutation();

  const hasCompleteTrackData = (track: Track | null | undefined): boolean => {
    if (!track) return false;

    const {
      id,
      readable,
      title,
      title_short,
      title_version,
      duration,
      rank,
      explicit_lyrics,
      explicit_content_lyrics,
      explicit_content_cover,
      preview,
      md5_image,
      artist,
      album,
    } = track as Partial<Track>;

    return (
      typeof id === "number" &&
      typeof readable === "boolean" &&
      typeof title === "string" &&
      typeof title_short === "string" &&
      typeof title_version === "string" &&
      typeof duration === "number" &&
      typeof rank === "number" &&
      typeof explicit_lyrics === "boolean" &&
      typeof explicit_content_lyrics === "number" &&
      typeof explicit_content_cover === "number" &&
      typeof preview === "string" &&
      typeof md5_image === "string" &&
      artist !== undefined &&
      album !== undefined &&
      typeof artist?.id === "number" &&
      typeof artist?.name === "string" &&
      typeof artist?.link === "string" &&
      typeof artist?.picture === "string" &&
      typeof artist?.picture_small === "string" &&
      typeof artist?.picture_medium === "string" &&
      typeof artist?.picture_big === "string" &&
      typeof artist?.picture_xl === "string" &&
      typeof artist?.tracklist === "string" &&
      typeof artist?.type === "string" &&
      typeof album?.id === "number" &&
      typeof album?.title === "string" &&
      typeof album?.cover === "string" &&
      typeof album?.cover_small === "string" &&
      typeof album?.cover_medium === "string" &&
      typeof album?.cover_big === "string" &&
      typeof album?.cover_xl === "string" &&
      typeof album?.md5_image === "string" &&
      typeof album?.tracklist === "string" &&
      typeof album?.type === "string"
    );
  };

  // COMMENTED OUT - Auto-queue trigger disabled
  // const handleAutoQueueTrigger = useCallback(
  //   async (currentTrack: Track, _queueLength: number) => {
  //     // Auto-queue functionality disabled - comment out to simplify queue
  //     return [];
  //   },
  //   [],
  // );

  const player = useAudioPlayer({
    onTrackChange: (track) => {
      if (track && session) {
        if (hasCompleteTrackData(track)) {
          addToHistory.mutate({
            track,
            duration:
              typeof track.duration === "number" ? track.duration : undefined,
          });
        } else {
          console.warn(
            "[AudioPlayerContext] ⚠️ Skipping addToHistory due to incomplete track data",
            {
              trackId: track.id,
            },
          );
        }
      }
    },
    // COMMENTED OUT - Auto-queue disabled
    // onAutoQueueTrigger: handleAutoQueueTrigger,
    onError: (error, trackId) => {
      console.error(
        `[AudioPlayerContext] Playback error for track ${trackId}:`,
        error,
      );

      // Check for upstream errors (backend can't reach upstream service)
      if (
        error.includes("upstream error") ||
        error.includes("ServiceUnavailableException")
      ) {
        showToast(
          "Music service temporarily unavailable. The backend cannot reach the music source. Please try again in a moment.",
          "error",
        );
      } else if (
        error.includes("503") ||
        error.includes("Service Unavailable")
      ) {
        showToast(
          "Streaming service unavailable. Please try again later.",
          "error",
        );
      } else {
        showToast("Playback failed. Please try again.", "error");
      }
    },
    // COMMENTED OUT - Smart queue settings disabled
    // smartQueueSettings: smartQueueSettings ?? undefined,
  });

  // Watch for session changes (login/logout) and clear queue
  useEffect(() => {
    const currentUserId = session?.user?.id ?? null;

    // Only clear on actual user change, not on initial load
    if (lastUserId !== null && currentUserId !== lastUserId) {
      console.log(
        "[AudioPlayerContext] 🔄 User session changed, clearing queue",
        {
          from: lastUserId,
          to: currentUserId,
        },
      );
      player.clearQueueAndHistory();
      showToast(
        currentUserId
          ? "Welcome! Queue has been cleared for your new session."
          : "Logged out. Queue cleared.",
        "info",
      );
    }

    setLastUserId(currentUserId);
  }, [session?.user?.id, lastUserId, player, showToast]);

  // Periodically clean queue (remove duplicates and invalid tracks)
  useEffect(() => {
    const cleanupInterval = setInterval(
      () => {
        if (player.queue.length > 1) {
          // Only clean if there's actually a queue
          console.log("[AudioPlayerContext] 🧹 Running periodic queue cleanup");
          player.cleanQueue();
        }
      },
      5 * 60 * 1000,
    ); // Every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [player]);

  const play = useCallback(
    (track: Track) => {
      // NEW: Use playTrack for queue-first behavior
      player.playTrack(track);

      // Auto-show mobile player when starting a new track (Spotify-like behavior)
      if (isMobile) {
        setShowMobilePlayer(true);
      }
    },
    [player, isMobile],
  );

  const playNext = useCallback(() => {
    // NEW: playNext now handles queue management automatically via useEffect
    player.playNext();
  }, [player]);

  const playPrevious = useCallback(() => {
    // NEW: playPrevious now handles queue management automatically via useEffect
    player.playPrevious();
  }, [player]);

  const playFromQueue = useCallback(
    (index: number) => {
      // NEW: playFromQueue now handles queue management automatically via useEffect
      player.playFromQueue(index);
    },
    [player],
  );

  // COMMENTED OUT - Smart Queue Functions disabled
  // const addSimilarTracks = useCallback(
  //   async (trackId: number, count = 5) => {
  //     // Disabled for simplified queue
  //     showToast("Smart queue features are currently disabled", "info");
  //   },
  //   [showToast],
  // );

  // const generateSmartMix = useCallback(
  //   async (seedTrackIds: number[], count = 50) => {
  //     // Disabled for simplified queue
  //     showToast("Smart queue features are currently disabled", "info");
  //   },
  //   [showToast],
  // );

  const saveQueueAsPlaylist = useCallback(async () => {
    console.log("[AudioPlayerContext] 💾 saveQueueAsPlaylist called", {
      hasSession: !!session,
      currentTrack: player.currentTrack ? player.currentTrack.title : null,
      queueSize: player.queue.length,
    });

    if (!session) {
      showToast("Sign in to save playlists", "info");
      return;
    }

    // NEW: queue already includes current track at queue[0]
    const tracksToSave: Track[] = [...player.queue];

    if (tracksToSave.length === 0) {
      showToast("Queue is empty", "info");
      return;
    }

    const defaultName = player.currentTrack
      ? `${player.currentTrack.title} Queue`
      : `Queue ${new Date().toLocaleDateString()}`;
    const playlistName = prompt("Name your new playlist", defaultName);

    if (playlistName === null) {
      console.log(
        "[AudioPlayerContext] ⚪ Playlist creation cancelled by user",
      );
      return;
    }

    const trimmedName = playlistName.trim();

    if (!trimmedName) {
      showToast("Playlist name cannot be empty", "error");
      return;
    }

    showToast("Saving queue as playlist...", "info");

    try {
      const playlist = await createPlaylistMutation.mutateAsync({
        name: trimmedName,
        isPublic: false,
      });

      if (!playlist) {
        throw new Error("Playlist creation returned no data");
      }

      for (const track of tracksToSave) {
        await addToPlaylistMutation.mutateAsync({
          playlistId: playlist.id,
          track,
        });
      }

      showToast(
        `Saved ${tracksToSave.length} track${tracksToSave.length === 1 ? "" : "s"} to "${trimmedName}"`,
        "success",
      );
      void utils.music.getPlaylists.invalidate();
    } catch (error) {
      console.error(
        "[AudioPlayerContext] ❌ Failed to save queue as playlist:",
        error,
      );
      showToast("Failed to save playlist", "error");
    }
  }, [
    session,
    player,
    createPlaylistMutation,
    addToPlaylistMutation,
    showToast,
    utils,
  ]);

  const value: AudioPlayerContextType = {
    // State
    currentTrack: player.currentTrack,
    queue: player.queue,
    isPlaying: player.isPlaying,
    currentTime: player.currentTime,
    duration: player.duration,
    volume: player.volume,
    isMuted: player.isMuted,
    isShuffled: player.isShuffled,
    repeatMode: player.repeatMode,
    playbackRate: player.playbackRate,
    isLoading: player.isLoading,
    lastAutoQueueCount: player.lastAutoQueueCount,
    showMobilePlayer,
    setShowMobilePlayer,
    hideUI,
    setHideUI,

    // Audio element reference
    audioElement: player.audioRef.current,

    // Actions
    play,
    togglePlay: player.togglePlay,
    addToQueue: player.addToQueue,
    addToPlayNext: player.addToPlayNext,
    playNext,
    playPrevious,
    playFromQueue,
    clearQueue: player.clearQueue,
    removeFromQueue: player.removeFromQueue,
    reorderQueue: player.reorderQueue,
    seek: player.seek,
    setVolume: player.setVolume,
    setIsMuted: player.setIsMuted,
    toggleShuffle: player.toggleShuffle,
    cycleRepeatMode: player.cycleRepeatMode,
    setPlaybackRate: player.setPlaybackRate,
    skipForward: player.skipForward,
    skipBackward: player.skipBackward,

    // Queue Management
    saveQueueAsPlaylist,

    // Queue Safety & Cleanup
    removeDuplicates: player.removeDuplicates,
    cleanInvalidTracks: player.cleanInvalidTracks,
    cleanQueue: player.cleanQueue,
    clearQueueAndHistory: player.clearQueueAndHistory,
    isValidTrack: player.isValidTrack,

    // COMMENTED OUT - Smart Queue features disabled
    // addSimilarTracks,
    // generateSmartMix,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useGlobalPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalPlayer must be used within an AudioPlayerProvider",
    );
  }
  return context;
}
