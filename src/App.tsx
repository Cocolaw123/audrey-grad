import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Mail,
  X,
  Sparkles,
  Plus,
  GraduationCap,
} from 'lucide-react';

interface BubblePreset {
  id: string;
  label: string;
  avatar?: string;
  emoji?: string | null;
}

interface GroupMessage {
  id: string;
  sender?: string;
  text: string;
}

interface ActiveBubble {
  id: number;
  avatar: string | null;
  emoji: string;
  leftPercent: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  swayPx: number;
  spawnedAt: number;
}

interface BurstParticle {
  emoji: string;
  dx: string;
  dy: string;
}

interface ActiveBurst {
  id: number;
  x: number;
  y: number;
  particles: BurstParticle[];
}

// Default center photo path inside your public/ folder
const DEFAULT_AUDREY_CENTER_PHOTO = '/audrey-big-pic.jpeg';

// Default falling bubble photos inside your public/ folder (audrey-1.jpeg to audrey-7.jpeg)
// Automatically falls back to cute cat emojis if a file isn't in public/ yet!
const DEFAULT_AUDREY_BUBBLES: BubblePreset[] = [
  { id: 'a1', label: 'Audrey Face #1', avatar: '/audrey-1.jpeg', emoji: '🐱' },
  { id: 'a2', label: 'Audrey Face #2', avatar: '/audrey-2.jpeg', emoji: '😺' },
  { id: 'a3', label: 'Audrey Face #3', avatar: '/audrey-3.jpeg', emoji: '😻' },
  { id: 'a4', label: 'Audrey Face #4', avatar: '/audrey-4.jpeg', emoji: '😸' },
  { id: 'a5', label: 'Audrey Face #5', avatar: '/audrey-5.jpeg', emoji: '😽' },
  { id: 'a6', label: 'Audrey Face #6', avatar: '/audrey-6.jpeg', emoji: '😹' },
  { id: 'a7', label: 'Audrey Face #7', avatar: '/audrey-7.jpeg', emoji: '🐾' },
];

// Default collective graduation messages
const DEFAULT_GROUP_MESSAGES: GroupMessage[] = [
  {
    id: 'm-hayden',
    sender: 'Hayden',
    text: '畢業大個啦，好好地做人啦~🥹🥹🙂‍↕️🙂‍↕️👍🏻👍🏻💪🏻💪🏻',
  },
  {
    id: 'm-coco',
    sender: 'Coco',
    text: '點解你唔要橫幅！！！🥹anyways happy graduation & 1114 happy birthday🥳🥳🥳我人生第一個web app就咁樣俾咗你係咪好感動www🧘🏻‍♀️努力搵工返工做gym，同埋多啲光遇搵我跑圖啊🥳話說你下年生日想唔想要啲新奇嘢我同ruby佢哋prep一下😁。',
  },
  {
    id: 'm-ruby',
    sender: 'Ruby',
    text: '畢咗業快啲成為高級大人, and then...閨蜜養我！！！！🥹🥹🥹🥹🥹🥹🥹',
  },
  {
    id: 'm-charlie',
    sender: 'Charlie',
    text: 'Happy graduation!🎉搵工加油,搵多D錢再約埋去多幾次日本👍千奇唔好學久留美炒美日圓fx😂',
  },
  {
    id: 'm-anthony',
    sender: 'Anthony',
    text: 'Happy Graduation，祝你“前程似錦，萬事勝意！”🎓🎉',
  },
  {
    id: 'm-cherry',
    sender: 'Cherry',
    text: '畢業快樂！祝你 “長風破浪會有時，直掛雲帆濟滄海”！🎓🎓🎓🎓',
  },
];

const POP_EMOJIS = ['🎓', '🎉', '🥳', '✨', '💐', '🥂', '🌟', '👏', '💖', '🎀'];

const RANDOM_CONGRATS = [
  'Happy Graduation, Audrey! We are so proud of you!',
  'Audrey Yo! Audrey Hey! Audrey so Awesome, Audrey Yay!',
  'Oh My God Audrey, why are you so strong?!',
  'Audrey was released from her 4 year sentence.',
  'Yeeeeeeeeeeeeeeaaaaaaaaaaaaaaaaaaaaaaaaaaaaaah!!!!!',
  'The Audrey of the opera is there, inside my heart!',
  'Plot twist: Audrey graduated',
  'Three cheers for Audrey! Hip hip hooray!',
  'If Ruby and I fall to the sea, who would you save first?',
  'Dream big and sparkle always, Audrey! Happy Graduation!',
  'No more exams, no more deadlines—just pure celebration!',
  'Look at you glowing in your grad gown, Audrey!',
  'The greatest Audrey in the world!',
  'Pop the bubbly! Audrey is officially a graduate!',
  'Audrey wants more Fridays and pancakes!',
  'Do you want a MTR advertisement for your birthday next time?',
  'Is this web app cool? I made it hahahahaha',
  'Audrey sensei can you teach me english?',
  'Audrey sensei can you teach me japanese? Audrey says Hai Hai!',
  'Good morning, Good afternoon, and Good evening, do you miss us today?',
  'Do you see the salary of yylam? What the hell is that?'
];

// Fisher-Yates shuffle so every bubble photo/variant appears equally often
function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  // Audrey photos & collective messages state
  const [audreyPhoto] = useState<string>(DEFAULT_AUDREY_CENTER_PHOTO);
  const [audreyPhotoError, setAudreyPhotoError] = useState<boolean>(false);
  const [audreyBubbles] = useState<BubblePreset[]>(DEFAULT_AUDREY_BUBBLES);
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>(DEFAULT_GROUP_MESSAGES);

  // Falling bubbles & burst animations
  const [balls, setBalls] = useState<ActiveBubble[]>([]);
  const [bursts, setBursts] = useState<ActiveBurst[]>([]);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [poppedCount, setPoppedCount] = useState<number>(0);

  // UI controls & modals
  const [isLettersOpen, setIsLettersOpen] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // New collective message input inside modal
  const [newLetter, setNewLetter] = useState<string>('');

  const nextId = useRef<number>(1);
  const bubbleBagRef = useRef<BubblePreset[]>([]);
  const lastSpawnTimeRef = useRef<number>(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Physics state for the large center oval cameo floating freely & rebounding off edges
  const [ovalTransform, setOvalTransform] = useState<{
    x: number;
    y: number;
    angle: number;
  }>({ x: 0, y: 0, angle: 0 });
  const ovalPhysicsRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    vAngle: number;
    initialized: boolean;
  }>({
    x: 0,
    y: 0,
    vx: 1.6,
    vy: 1.2,
    angle: 0,
    vAngle: 0.35,
    initialized: false,
  });
  const ovalBoxRef = useRef<HTMLDivElement | null>(null);

  // Physics state for the giant "WOW" word floating freely in the background & rebounding off edges
  const [wowTransform, setWowTransform] = useState<{
    x: number;
    y: number;
    angle: number;
  }>({ x: -160, y: 120, angle: -8 });
  const wowPhysicsRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    vAngle: number;
    initialized: boolean;
  }>({
    x: -160,
    y: 120,
    vx: 1.25,
    vy: -0.95,
    angle: -8,
    vAngle: -0.32,
    initialized: false,
  });
  const wowBoxRef = useRef<HTMLDivElement | null>(null);

  // Continuous 60fps physics loop: oval & giant "WOW" float freely, kiss screen edges, and rebound
  useEffect(() => {
    let frameId: number;

    const step = () => {
      const p = ovalPhysicsRef.current;
      const el = ovalBoxRef.current;
      const a = el ? el.offsetWidth / 2 : 240;
      const b = el ? el.offsetHeight / 2 : 300;

      if (!p.initialized) {
        // Shallow, wide diagonal sweep across the full width (red path: left <-> right with gentle vertical drift)
        const baseShallowAngle = (16 + Math.random() * 14) * (Math.PI / 180); // 16° to 30° from horizontal
        const dirX = Math.random() < 0.5 ? -1 : 1;
        const dirY = Math.random() < 0.5 ? -1 : 1;
        const speed = 1.05;
        p.vx = dirX * Math.cos(baseShallowAngle) * speed;
        p.vy = dirY * Math.sin(baseShallowAngle) * speed;
        p.vAngle = (Math.random() < 0.5 ? -1 : 1) * 0.24;
        p.initialized = true;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.angle = (p.angle + p.vAngle) % 360;

      // Exact rotated-ellipse extent so the oval's outer border touches the exact screen edge at any angle
      const theta = (p.angle * Math.PI) / 180;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const effectiveHalfW = Math.hypot(a * cosT, b * sinT);
      const effectiveHalfH = Math.hypot(a * sinT, b * cosT);

      const maxX = Math.max(0, window.innerWidth / 2 - effectiveHalfW);
      const maxY = Math.max(0, window.innerHeight / 2 - effectiveHalfH);

      // Rebound off left / right edges & keep horizontal sweep dominant
      if (p.x >= maxX) {
        p.x = maxX;
        p.vx = -Math.abs(p.vx);
        p.vAngle = (Math.random() < 0.5 ? -1 : 1) * (0.22 + Math.random() * 0.4);
      } else if (p.x <= -maxX) {
        p.x = -maxX;
        p.vx = Math.abs(p.vx);
        p.vAngle = (Math.random() < 0.5 ? -1 : 1) * (0.22 + Math.random() * 0.4);
      }

      // Rebound off top / bottom edges with gentle vertical angle so it never turns into a steep vertical zigzag
      if (p.y >= maxY) {
        p.y = maxY;
        p.vy = -Math.min(Math.abs(p.vy), Math.abs(p.vx) * 0.55);
        p.vAngle = (Math.random() < 0.5 ? -1 : 1) * (0.22 + Math.random() * 0.4);
      } else if (p.y <= -maxY) {
        p.y = -maxY;
        p.vy = Math.min(Math.abs(p.vy), Math.abs(p.vx) * 0.55);
        p.vAngle = (Math.random() < 0.5 ? -1 : 1) * (0.22 + Math.random() * 0.4);
      }

      setOvalTransform({ x: p.x, y: p.y, angle: p.angle });

      // Update giant "WOW" background word physics
      const w = wowPhysicsRef.current;
      const wEl = wowBoxRef.current;
      const wa = wEl ? wEl.offsetWidth / 2 : 210;
      const wb = wEl ? wEl.offsetHeight / 2 : 100;

      if (!w.initialized) {
        const wowAngle = (18 + Math.random() * 18) * (Math.PI / 180);
        const wDirX = p.vx > 0 ? -1 : 1; // Start drifting opposite to the oval
        const wDirY = Math.random() < 0.5 ? -1 : 1;
        const wSpeed = 1.2;
        w.x = wDirX * Math.min(180, window.innerWidth * 0.18);
        w.y = wDirY * Math.min(140, window.innerHeight * 0.18);
        w.vx = wDirX * Math.cos(wowAngle) * wSpeed;
        w.vy = wDirY * Math.sin(wowAngle) * wSpeed;
        w.vAngle = (Math.random() < 0.5 ? -1 : 1) * 0.35;
        w.initialized = true;
      }

      w.x += w.vx;
      w.y += w.vy;
      w.angle = (w.angle + w.vAngle) % 360;

      const wTheta = (w.angle * Math.PI) / 180;
      const wCos = Math.abs(Math.cos(wTheta));
      const wSin = Math.abs(Math.sin(wTheta));
      const wHalfW = wa * wCos + wb * wSin;
      const wHalfH = wa * wSin + wb * wCos;

      const wMaxX = Math.max(0, window.innerWidth / 2 - wHalfW);
      const wMaxY = Math.max(0, window.innerHeight / 2 - wHalfH);

      if (w.x >= wMaxX) {
        w.x = wMaxX;
        w.vx = -Math.abs(w.vx);
        w.vAngle = (Math.random() < 0.5 ? -1 : 1) * (0.28 + Math.random() * 0.45);
      } else if (w.x <= -wMaxX) {
        w.x = -wMaxX;
        w.vx = Math.abs(w.vx);
        w.vAngle = (Math.random() < 0.5 ? -1 : 1) * (0.28 + Math.random() * 0.45);
      }

      if (w.y >= wMaxY) {
        w.y = wMaxY;
        w.vy = -Math.abs(w.vy);
        w.vAngle = (Math.random() < 0.5 ? -1 : 1) * (0.28 + Math.random() * 0.45);
      } else if (w.y <= -wMaxY) {
        w.y = -wMaxY;
        w.vy = Math.abs(w.vy);
        w.vAngle = (Math.random() < 0.5 ? -1 : 1) * (0.28 + Math.random() * 0.45);
      }

      setWowTransform({ x: w.x, y: w.y, angle: w.angle });
      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Give the floating oval a gentle wide horizontal sweep & spin impulse when tapped
  const handleNudgeOval = () => {
    const p = ovalPhysicsRef.current;
    const shallowAngle = (15 + Math.random() * 16) * (Math.PI / 180);
    const dirX = Math.random() < 0.5 ? -1 : 1;
    const dirY = Math.random() < 0.5 ? -1 : 1;
    const speed = 1.35 + Math.random() * 0.45;
    p.vx = dirX * Math.cos(shallowAngle) * speed;
    p.vy = dirY * Math.sin(shallowAngle) * speed;
    p.vAngle = (Math.random() < 0.5 ? -1 : 1) * (0.55 + Math.random() * 0.65);
  };

  // Picks a random horizontal position across the screen while avoiding clusters near the top
  const getNonOverlappingLeft = useCallback((existingBalls: ActiveBubble[]): number => {
    const nearTopBalls = existingBalls.filter(
      (b) => Date.now() - (b.spawnedAt || 0) < 3500
    );

    let bestCandidate = Number((5 + Math.random() * 88).toFixed(1));
    let bestMinDistance = -1;

    for (let attempt = 0; attempt < 18; attempt++) {
      const candidate = Number((5 + Math.random() * 88).toFixed(1));
      if (nearTopBalls.length === 0) {
        return candidate;
      }
      const minDistance = Math.min(
        ...nearTopBalls.map((b) => Math.abs(b.leftPercent - candidate))
      );
      if (minDistance >= 14) {
        return candidate;
      }
      if (minDistance > bestMinDistance) {
        bestMinDistance = minDistance;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }, []);

  // Draws from a shuffled bag of all 7 bubble variants so each appears with equal probability
  const getNextBalancedBubble = useCallback((): BubblePreset => {
    if (bubbleBagRef.current.length === 0) {
      bubbleBagRef.current = shuffleArray(audreyBubbles);
    }
    return bubbleBagRef.current.pop() || audreyBubbles[0];
  }, [audreyBubbles]);

  // Speaks graduation message aloud using browser Web Speech API
  const speakMessage = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.15;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  // Spawns scattered falling bubbles continuously at random heights & speeds
  useEffect(() => {
    if (audreyBubbles.length === 0) return;

    const createBubble = (
      existingBalls: ActiveBubble[] = [],
      initialDelaySec = 0,
      forcedLeft: number | null = null
    ): ActiveBubble => {
      const id = nextId.current++;
      const leftPercent =
        forcedLeft !== null ? forcedLeft : getNonOverlappingLeft(existingBalls);
      const sizePx = Math.floor(Math.random() * 22) + 66;
      const durationSec = Number((11 + Math.random() * 5).toFixed(1));
      const bubbleFace = getNextBalancedBubble();
      const swayDir = Math.random() < 0.5 ? -1 : 1;
      const swayPx = Math.round(swayDir * (14 + Math.random() * 14));

      return {
        id,
        avatar: bubbleFace.avatar || null,
        emoji: bubbleFace.emoji || '🐱',
        leftPercent,
        sizePx,
        durationSec,
        delaySec: initialDelaySec,
        swayPx,
        spawnedAt: Date.now() + initialDelaySec * 1000,
      };
    };

    // Pre-populate 15 bubbles across the screen so it starts lively immediately
    const initialWave = Array.from({ length: 15 }, (_, idx) => {
      const randomLeft = Number((4 + Math.random() * 90).toFixed(1));
      const negativeStartDelay = Number((-0.6 - idx * 0.85 - Math.random() * 0.4).toFixed(2));
      return createBubble([], negativeStartDelay, randomLeft);
    });
    setBalls(initialWave);
    lastSpawnTimeRef.current = Date.now();

    // Higher spawn frequency (~2x per second, up to 32 bubbles on screen)
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSpawnTimeRef.current < 480) return;

      setBalls((prev) => {
        if (prev.length >= 32) return prev;
        lastSpawnTimeRef.current = now;
        return [...prev, createBubble(prev, 0)];
      });
    }, 520);

    return () => clearInterval(interval);
  }, [audreyBubbles, getNonOverlappingLeft, getNextBalancedBubble]);

  // Remove bubble once it finishes falling past the bottom
  const handleBallEnd = (id: number) => {
    setBalls((prev) => prev.filter((b) => b.id !== id));
  };

  // Handle clicking/popping a bubble
  const handlePopBall = (e: React.MouseEvent<HTMLButtonElement>, ball: ActiveBubble) => {
    e.stopPropagation();

    setBalls((prev) => prev.filter((b) => b.id !== ball.id));
    setPoppedCount((c) => c + 1);

    const burstId = nextId.current++;
    const particles: BurstParticle[] = Array.from({ length: 8 }, (_, idx) => {
      const angleRad = (idx * 45 * Math.PI) / 180;
      const distance = 75 + Math.random() * 35;
      return {
        emoji: POP_EMOJIS[Math.floor(Math.random() * POP_EMOJIS.length)],
        dx: `${Math.round(Math.cos(angleRad) * distance)}px`,
        dy: `${Math.round(Math.sin(angleRad) * distance)}px`,
      };
    });

    setBursts((prev) => [
      ...prev,
      { id: burstId, x: e.clientX, y: e.clientY, particles },
    ]);

    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 950);

    const randomMsg =
      RANDOM_CONGRATS[Math.floor(Math.random() * RANDOM_CONGRATS.length)];
    setActiveMessage(randomMsg);
    speakMessage(randomMsg);

    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setActiveMessage(null);
    }, 4200);
  };

  // Add a new collective message inside the modal
  const handleAddLetter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newLetter.trim()) return;
    setGroupMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        text: newLetter.trim(),
      },
    ]);
    setNewLetter('');
  };

  return (
    <div
      style={{
        fontFamily:
          "'Zen Maru Gothic', 'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', 'Quicksand', 'Comic Sans MS', cursive, sans-serif",
      }}
      className="relative w-screen h-screen overflow-hidden select-none bg-[radial-gradient(circle_at_20%_15%,#fff0f6_0%,#ffc2e2_38%,#e0c3fc_72%,#bae6fd_100%)] text-[#591c38] flex flex-col items-center justify-center"
    >
      {/* Inline Keyframe & 90s Shoujo Manga Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&family=Zen+Maru+Gothic:wght@500;700;900&display=swap');

        @keyframes floatSwayDown {
          0% {
            transform: translateY(-120px) translateX(0px);
          }
          25% {
            transform: translateY(25vh) translateX(var(--sway));
          }
          50% {
            transform: translateY(55vh) translateX(0px);
          }
          75% {
            transform: translateY(85vh) translateX(calc(var(--sway) * -1));
          }
          100% {
            transform: translateY(115vh) translateX(0px);
          }
        }
        @keyframes burstParticle {
          0% {
            transform: translate(-50%, -50%) scale(0.4);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(-50% + var(--dx)),
              calc(-50% + var(--dy))
            ) scale(1.35);
            opacity: 0;
          }
        }
        @keyframes toastPop {
          0% {
            transform: translateY(10px) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 5px #ffffff, 0 0 0 9px #ff66a3, 0 14px 36px rgba(255, 77, 148, 0.45);
          }
          50% {
            box-shadow: 0 0 0 5px #ffffff, 0 0 0 11px #c084fc, 0 18px 46px rgba(192, 132, 252, 0.55);
          }
        }
        @keyframes twinkleStar {
          0%, 100% {
            transform: scale(0.85) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.25) rotate(15deg);
            opacity: 1;
          }
        }
        @keyframes verticalBannerScroll {
          0% {
            transform: translateY(-50%);
          }
          100% {
            transform: translateY(0%);
          }
        }
        @keyframes centerOvalFloat {
          0%, 100% {
            transform: translate(0px, 0px) rotate(-1.5deg);
          }
          25% {
            transform: translate(16px, -14px) rotate(1.2deg);
          }
          50% {
            transform: translate(-12px, -22px) rotate(-1deg);
          }
          75% {
            transform: translate(-18px, -8px) rotate(1.8deg);
          }
        }
        @keyframes rainbowWowShift {
          0% {
            background-position: 0% 50%;
            filter: drop-shadow(0 0 18px rgba(255, 77, 166, 0.75)) drop-shadow(0 6px 0 #ffffff);
          }
          33% {
            background-position: 50% 50%;
            filter: drop-shadow(0 0 24px rgba(250, 204, 21, 0.85)) drop-shadow(0 6px 0 #ffffff);
          }
          66% {
            background-position: 100% 50%;
            filter: drop-shadow(0 0 24px rgba(56, 189, 248, 0.85)) drop-shadow(0 6px 0 #ffffff);
          }
          100% {
            background-position: 0% 50%;
            filter: drop-shadow(0 0 18px rgba(255, 77, 166, 0.75)) drop-shadow(0 6px 0 #ffffff);
          }
        }
        @keyframes wowPulseScale {
          0%, 100% {
            transform: scale(0.96);
          }
          50% {
            transform: scale(1.06);
          }
        }
        .shoujo-halftone {
          background-image: radial-gradient(rgba(255, 255, 255, 0.55) 2px, transparent 2px);
          background-size: 22px 22px;
        }
        .shoujo-title {
          text-shadow:
            -2px -2px 0 #ffffff,
             2px -2px 0 #ffffff,
            -2px  2px 0 #ffffff,
             2px  2px 0 #ffffff,
             0px  4px 0 #ff85b3,
             0px  7px 14px rgba(255, 51, 133, 0.35);
        }
        .shoujo-subtitle {
          text-shadow:
            -1.5px -1.5px 0 #ffffff,
             1.5px -1.5px 0 #ffffff,
            -1.5px  1.5px 0 #ffffff,
             1.5px  1.5px 0 #ffffff;
        }
        .falling-bubble {
          position: absolute;
          top: 0;
          left: 0;
          transform: translateY(-120px);
          will-change: transform;
          animation-name: floatSwayDown;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        .emoji-particle {
          position: absolute;
          animation: burstParticle 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .toast-enter {
          animation: toastPop 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
        }
        .audrey-ring {
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .twinkle-star {
          animation: twinkleStar 2.6s ease-in-out infinite;
        }
        .vertical-marquee-track {
          animation: verticalBannerScroll 18s linear infinite;
          will-change: transform;
        }
        .center-oval-float {
          animation: centerOvalFloat 7.5s ease-in-out infinite;
          will-change: transform;
        }
        .shoujo-vertical-letter {
          text-shadow:
            -2.5px -2.5px 0 #ffffff,
             2.5px -2.5px 0 #ffffff,
            -2.5px  2.5px 0 #ffffff,
             2.5px  2.5px 0 #ffffff,
             0px    3.5px 0 #ff66a3,
             0px    6px 12px rgba(225, 29, 72, 0.35);
        }
        .shoujo-wow-text {
          background-image: linear-gradient(
            90deg,
            #ff2e88 0%,
            #ff9f1c 20%,
            #fde047 40%,
            #34d399 60%,
            #38bdf8 80%,
            #c084fc 100%
          );
          background-size: 250% 250%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-stroke: 3px #ffffff;
          animation: rainbowWowShift 4.5s ease-in-out infinite;
        }
        .shoujo-wow-pulse {
          animation: wowPulseScale 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* 90s Shoujo Manga Halftone Screentone & Twinkling Four-Point Stars */}
      <div className="shoujo-halftone fixed inset-0 pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#ff85c0]/40 blur-3xl" />
        <div className="absolute top-1/4 -right-16 w-80 h-80 rounded-full bg-[#a855f7]/25 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 rounded-full bg-[#38bdf8]/25 blur-3xl" />
      </div>

      {/* Left & Right Vertical 90s Shoujo Anime Scrolling Banners ("HAPPY GRADUATION") */}
      {(['left', 'right'] as const).map((side) => (
        <div
          key={side}
          aria-hidden="true"
          className={`fixed top-0 bottom-0 ${
            side === 'left'
              ? 'left-2 sm:left-5 md:left-8'
              : 'right-2 sm:right-5 md:right-8'
          } w-20 sm:w-32 md:w-36 z-10 pointer-events-none overflow-hidden flex flex-col items-center`}
        >
          {/* Decorative Manga Ribbon Rail */}
          <div className="w-full h-full bg-white/40 backdrop-blur-[2px] border-x-[3px] border-dashed border-[#ff66a3]/75 shadow-[0_0_24px_rgba(255,102,163,0.3)] flex flex-col overflow-hidden">
            <div
              style={{
                animationDirection: side === 'right' ? 'reverse' : 'normal',
              }}
              className="vertical-marquee-track flex flex-col items-center shrink-0"
            >
              {[0, 1].map((dupIdx) => (
                <div
                  key={dupIdx}
                  className="flex flex-col items-center py-6 space-y-2.5 sm:space-y-3"
                >
                  <span className="text-2xl sm:text-3xl text-[#fff066] drop-shadow-[0_2px_4px_#ff3385]">
                    ✦
                  </span>
                  {['H', 'A', 'P', 'P', 'Y'].map((char, idx) => (
                    <span
                      key={`h-${dupIdx}-${idx}`}
                      className="shoujo-vertical-letter text-3xl sm:text-5xl md:text-6xl font-black text-[#ff2e88] leading-none"
                    >
                      {char}
                    </span>
                  ))}

                  <div className="py-2.5 flex flex-col items-center gap-1.5 text-[#a855f7]">
                    <span className="text-xl sm:text-2xl">🎀</span>
                    <span className="text-lg sm:text-xl text-[#ff66a3]">♡</span>
                  </div>

                  {['G', 'R', 'A', 'D', 'U', 'A', 'T', 'I', 'O', 'N'].map(
                    (char, idx) => (
                      <span
                        key={`g-${dupIdx}-${idx}`}
                        className="shoujo-vertical-letter text-3xl sm:text-5xl md:text-6xl font-black text-[#9333ea] leading-none"
                      >
                        {char}
                      </span>
                    )
                  )}

                  <div className="py-3 flex flex-col items-center gap-1.5">
                    <span className="text-2xl sm:text-3xl text-[#fff066] drop-shadow-[0_2px_4px_#ff3385]">
                      ★
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Top Header Bar (Manga Ribbon Badges) */}
      <header className="fixed top-4 left-4 right-4 sm:top-6 sm:left-8 sm:right-8 z-30 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 px-4 py-2 rounded-full border-2 border-[#ff66a3] shadow-[0_4px_0_#ff99c2]">
          <GraduationCap className="w-5 h-5 text-[#ff3385]" />
          <span className="font-black text-sm sm:text-base tracking-wider text-[#9d174d]">
            ★ 28 NOV 2026 ★
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className="flex items-center gap-1.5 bg-white/95 hover:bg-[#fff0f6] px-3.5 py-2 rounded-full border-2 border-[#ff66a3] shadow-[0_4px_0_#ff99c2] text-xs sm:text-sm font-extrabold text-[#9d174d] transition active:translate-y-0.5 cursor-pointer"
            title="Toggle spoken graduation wishes"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-[#ff3385]" />
                <span>Voice On ♪</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-pink-300" />
                <span>Voice Off</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Falling Audrey Bubbles Layer */}
      <div className="fixed inset-0 z-20 pointer-events-none">
        {balls.map((ball) => {
          const showAvatar = ball.avatar && !failedAvatars[ball.avatar];
          return (
            <button
              key={ball.id}
              onClick={(e) => handlePopBall(e, ball)}
              onAnimationEnd={() => handleBallEnd(ball.id)}
              style={
                {
                  left: `${ball.leftPercent}%`,
                  width: `${ball.sizePx}px`,
                  height: `${ball.sizePx}px`,
                  animationDuration: `${ball.durationSec}s`,
                  animationDelay: `${ball.delaySec || 0}s`,
                  '--sway': `${ball.swayPx}px`,
                } as React.CSSProperties
              }
              className="falling-bubble pointer-events-auto rounded-full p-1 bg-gradient-to-tr from-[#ff66a3] via-[#fde047] to-[#67e8f9] shadow-[0_6px_16px_rgba(255,51,133,0.3)] hover:scale-110 active:scale-90 transition-transform cursor-pointer group focus:outline-none"
              aria-label="Pop Audrey graduation bubble"
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-[#fff5f9] flex items-center justify-center">
                {showAvatar && ball.avatar ? (
                  <img
                    src={ball.avatar}
                    alt="Audrey"
                    draggable={false}
                    onError={() =>
                      setFailedAvatars((prev) => ({ ...prev, [ball.avatar!]: true }))
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    style={{ fontSize: `${Math.round(ball.sizePx * 0.56)}px` }}
                    className="leading-none select-none"
                  >
                    {ball.emoji}
                  </span>
                )}
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 left-1/2 -translate-x-1/2 bg-[#ff3385] border border-white text-white text-[10px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap pointer-events-none shadow-sm">
                POP! ✦
              </span>
            </button>
          );
        })}
      </div>

      {/* Radial Emoji Burst Layer */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        {bursts.map((burst) => (
          <div
            key={burst.id}
            style={{ left: burst.x, top: burst.y }}
            className="fixed"
          >
            {burst.particles.map((p, i) => (
              <span
                key={i}
                style={{ '--dx': p.dx, '--dy': p.dy } as React.CSSProperties}
                className="emoji-particle text-2xl sm:text-3xl select-none"
              >
                {p.emoji}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Freely Floating & Edge-Rebounding Giant "WOW" Word in the Background */}
      <div className="fixed inset-0 z-[5] pointer-events-none flex items-center justify-center overflow-hidden">
        <div
          ref={wowBoxRef}
          style={{
            transform: `translate3d(${wowTransform.x.toFixed(1)}px, ${wowTransform.y.toFixed(1)}px, 0) rotate(${wowTransform.angle.toFixed(1)}deg)`,
          }}
          className="will-change-transform select-none"
        >
          <div className="shoujo-wow-pulse relative flex items-center justify-center">
            <span className="twinkle-star absolute -top-6 -left-6 text-4xl sm:text-5xl text-[#fff066] drop-shadow-[0_2px_6px_#ff2e88]">
              ✦
            </span>
            <span
              style={{ animationDelay: '0.6s' }}
              className="twinkle-star absolute -top-8 right-6 text-3xl sm:text-4xl text-[#38bdf8] drop-shadow-[0_2px_6px_#ffffff]"
            >
              ★
            </span>
            <span
              style={{ animationDelay: '1.2s' }}
              className="twinkle-star absolute -bottom-6 -right-6 text-4xl sm:text-5xl text-[#ff4da6] drop-shadow-[0_2px_6px_#ffffff]"
            >
              ✦
            </span>
            <span
              style={{ animationDelay: '1.8s' }}
              className="twinkle-star absolute -bottom-5 left-8 text-3xl sm:text-4xl text-[#a855f7] drop-shadow-[0_2px_6px_#ffffff]"
            >
              ♡
            </span>
            <span className="shoujo-wow-text block font-black tracking-widest text-[6.5rem] sm:text-[10rem] md:text-[13rem] leading-none">
              WOW
            </span>
          </div>
        </div>
      </div>

      {/* Freely Floating & Edge-Rebounding Giant Oval Cameo Layer */}
      <div className="fixed inset-0 z-[15] pointer-events-none flex items-center justify-center">
        <div
          ref={ovalBoxRef}
          onClick={handleNudgeOval}
          style={{
            transform: `translate3d(${ovalTransform.x.toFixed(1)}px, ${ovalTransform.y.toFixed(1)}px, 0) rotate(${ovalTransform.angle.toFixed(1)}deg)`,
          }}
          title="Tap Audrey's floating cameo to give it a playful spin!"
          className="pointer-events-auto relative group cursor-pointer will-change-transform"
        >
          <span className="twinkle-star absolute -top-5 -left-5 text-4xl sm:text-5xl text-[#fff066] drop-shadow-[0_2px_4px_#ff3385] z-10">
            ✦
          </span>
          <span
            style={{ animationDelay: '1s' }}
            className="twinkle-star absolute -bottom-4 -right-5 text-4xl sm:text-5xl text-white drop-shadow-[0_2px_4px_#a855f7] z-10"
          >
            ✦
          </span>
          <div className="audrey-ring w-[min(70vw,19rem)] h-[min(78vw,22rem)] sm:w-[24rem] sm:h-[27.5rem] md:w-[27.5rem] md:h-[31.5rem] rounded-[50%] p-3 bg-gradient-to-tr from-[#ff66a3] via-[#fef08a] to-[#7dd3fc]">
            <div className="w-full h-full rounded-[50%] overflow-hidden border-[5px] border-white bg-[#fff0f7] flex items-center justify-center relative">
              {audreyPhoto && !audreyPhotoError ? (
                <img
                  src={audreyPhoto}
                  alt="Audrey Graduation"
                  draggable={false}
                  onError={() => setAudreyPhotoError(true)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <span
                  className="text-8xl sm:text-9xl leading-none select-none"
                  role="img"
                  aria-label="Cat placeholder for Audrey"
                >
                  🐱
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Center Stage Controls */}
      <main className="relative z-25 flex flex-col items-center text-center px-5 max-w-xl pointer-events-none">
        {/* Popped Counter Badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/95 px-4 py-1.5 rounded-full border-2 border-[#ff85b3] shadow-[0_3px_0_#ffc2d9] text-xs sm:text-sm font-black text-[#be185d] whitespace-nowrap">
          <Sparkles className="w-4 h-4 text-[#ff3385]" />
          <span>POPPED: {poppedCount} ♥</span>
        </div>

        {/* Subtitle & Voice Hint */}
        <p className="shoujo-subtitle mt-3 text-sm sm:text-base font-extrabold text-[#86198f]">
          ✧ Tap the floating bubbles for a magical surprise! ✧
        </p>

        {/* Dynamic Pop-up Congratulation Speech Bubble */}
        <div className="h-14 mt-2 flex items-center justify-center w-full">
          {activeMessage ? (
            <div className="toast-enter inline-flex items-center gap-2.5 bg-white/95 text-[#831843] px-5 py-2.5 rounded-2xl shadow-[0_5px_0_#ff85b3] border-2 border-[#ff4da6] max-w-md">
              <span className="text-xl shrink-0">🎀</span>
              <p className="text-xs sm:text-sm font-extrabold leading-snug text-left">
                {activeMessage}
              </p>
            </div>
          ) : (
            <div className="shoujo-subtitle text-xs sm:text-sm font-bold text-[#9d174d]/85">
              ♪ Turn Voice On for spoken graduation wishes ♪
            </div>
          )}
        </div>

        {/* Shoujo Ribbon CTA Button */}
        <button
          onClick={() => setIsLettersOpen(true)}
          className="pointer-events-auto mt-2 inline-flex items-center gap-2.5 bg-gradient-to-r from-[#ff4da6] via-[#f472b6] to-[#c084fc] hover:from-[#e11d48] hover:to-[#a855f7] text-white font-black text-sm sm:text-base px-8 py-3.5 rounded-full border-2 border-white shadow-[0_6px_0_#be185d,0_12px_24px_rgba(236,72,153,0.45)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Mail className="w-5 h-5" />
          <span>♡ Read Messages From Us ♡</span>
        </button>
      </main>

      {/* Modal 1: Collective Messages From Us (Shoujo Manga Card Style) */}
      {isLettersOpen && (
        <div
          onClick={() => setIsLettersOpen(false)}
          className="fixed inset-0 z-50 bg-[#591c38]/45 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fff7fb] border-[3px] border-[#ff66a3] rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-[0_8px_0_#ff99c2,0_20px_50px_rgba(190,24,93,0.35)] overflow-hidden"
          >
            <div className="px-6 py-4 bg-gradient-to-r from-[#ffd6e7] via-[#f3e8ff] to-[#e0f2fe] border-b-2 border-[#ff99c2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎀</span>
                <div>
                  <h2 className="text-lg font-black text-[#9d174d]">
                    ✦ To Audrey, With Love ✦
                  </h2>
                  <p className="text-xs font-bold text-[#a21caf]">
                    Graduation Wishes • 28 Nov 2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLettersOpen(false)}
                className="w-8 h-8 rounded-full bg-white border-2 border-[#ff66a3] hover:bg-[#ffe4ef] flex items-center justify-center text-[#be185d] transition cursor-pointer"
                aria-label="Close messages"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Scrollable Feed */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
              {groupMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white border-2 border-[#ffb3d1] rounded-2xl p-4 shadow-[0_4px_0_#ffe0ec] relative"
                >
                  <p className="text-sm sm:text-[15px] font-bold text-[#701a3c] leading-relaxed">
                    “{msg.text}”
                  </p>
                  {msg.sender && (
                    <p className="mt-2 text-right text-xs font-black text-[#be185d]">
                      — {msg.sender} ♡
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Add Note Form */}
            <form
              onSubmit={handleAddLetter}
              className="p-4 bg-[#ffeaf3] border-t-2 border-[#ffb3d1] flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5"
            >
              <textarea
                rows={2}
                placeholder="Write a magical graduation wish for Audrey... ♡"
                value={newLetter}
                onChange={(e) => setNewLetter(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border-2 border-[#ff85b3] bg-white text-sm font-semibold text-[#701a3c] resize-none focus:outline-none focus:border-[#c084fc]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#ff4da6] to-[#c084fc] hover:from-[#e11d48] hover:to-[#a855f7] text-white font-black text-sm px-5 py-2.5 rounded-xl border border-white shadow-[0_3px_0_#be185d] transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Wish</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}