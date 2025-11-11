import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#C4A052', '#707070', '#FF4A4A']  // Using our theme colors
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  // First burst
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  // Second burst
  fire(0.2, {
    spread: 60,
  });

  // Third burst
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });

  // Fourth burst
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });

  // Fifth burst
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};