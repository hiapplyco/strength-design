import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

// Optimized Pixel Shimmer Component with Instant Loading
const PixelShimmerEffect = ({ 
  isVisible = true, 
  onComplete,
  message = "Loading...",
  subMessage = "",
  pixelSize = 16, // Increased default for better performance
  colors = ['#00D4FF', '#00FF88', '#FF00FF', '#8A2BE2', '#FFD700'],
  duration = 3000,
  pattern = null,
  animationType = 'spiral',
  particleEffect = false
}) => {
  const [isReady, setIsReady] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Pre-defined patterns
  const patterns = useMemo(() => ({
    humanFigure: [
      [0,0,0,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,0,0,0],
      [0,0,0,0,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1],
      [0,0,0,1,1,1,0,0,0],
      [0,0,0,1,0,1,0,0,0],
      [0,0,1,1,0,1,1,0,0],
      [0,1,1,0,0,0,1,1,0]
    ],
    dumbbell: [
      [1,1,0,0,0,0,0,1,1],
      [1,1,0,0,0,0,0,1,1],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [1,1,0,0,0,0,0,1,1],
      [1,1,0,0,0,0,0,1,1]
    ],
    heart: [
      [0,1,1,0,0,0,1,1,0],
      [1,1,1,1,0,1,1,1,1],
      [1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,0,0,0],
      [0,0,0,0,1,0,0,0,0]
    ],
    trophy: [
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
      [0,0,1,1,1,0,0],
      [0,0,1,1,1,0,0],
      [0,1,1,1,1,1,0],
      [1,1,1,1,1,1,1]
    ],
    lightning: [
      [0,0,1,1,0,0],
      [0,1,1,0,0,0],
      [1,1,1,1,0,0],
      [0,1,1,1,1,0],
      [0,0,1,1,0,0],
      [0,1,1,0,0,0]
    ]
  }), []);

  // Calculate animation delay - optimized
  const getAnimationDelay = useCallback((x, y, centerX, centerY) => {
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    switch (animationType) {
      case 'wave':
        return (x * 8) + (Math.sin(y * 0.2) * 50);
      case 'explosion':
        return distance * 5;
      case 'scan':
        return x * 10;
      case 'pulse':
        return Math.floor(distance / 5) * 150;
      case 'spiral':
      default:
        const angle = Math.atan2(y - centerY, x - centerX);
        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
        return (distance * 8) + (normalizedAngle * 300);
    }
  }, [animationType]);

  // Generate pixels - memoized for performance
  const pixels = useMemo(() => {
    if (!isVisible) return [];

    const width = typeof window !== 'undefined' ? window.innerWidth : 375;
    const height = typeof window !== 'undefined' ? window.innerHeight : 812;
    const cols = Math.floor(width / pixelSize);
    const rows = Math.floor(height / pixelSize);
    const centerX = cols / 2;
    const centerY = rows / 2;
    const pixelArray = [];

    // Pattern setup
    const currentPattern = pattern && patterns[pattern] ? patterns[pattern] : null;
    const patternWidth = currentPattern ? currentPattern[0].length : 0;
    const patternHeight = currentPattern ? currentPattern.length : 0;
    const patternStartX = Math.floor((cols - patternWidth) / 2);
    const patternStartY = Math.floor((rows - patternHeight) / 2);

    // Limit pixels for better performance
    const step = pattern ? 1 : (pixelSize < 12 ? 2 : 1);

    for (let x = 0; x < cols; x += step) {
      for (let y = 0; y < rows; y += step) {
        let shouldCreatePixel = true;

        if (currentPattern) {
          const patternX = x - patternStartX;
          const patternY = y - patternStartY;
          
          shouldCreatePixel = (
            patternX >= 0 && 
            patternX < patternWidth &&
            patternY >= 0 && 
            patternY < patternHeight &&
            currentPattern[patternY][patternX] === 1
          );
        }

        if (shouldCreatePixel) {
          const delay = getAnimationDelay(x, y, centerX, centerY);
          
          pixelArray.push({
            id: `${x}-${y}`,
            x: x * pixelSize,
            y: y * pixelSize,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.min(delay, 1500), // Reduced max delay
            shimmerDelay: Math.random() * 1500,
            size: pixelSize - 2
          });
        }
      }
    }
    
    return pixelArray;
  }, [isVisible, pattern, pixelSize, colors, animationType, patterns, getAnimationDelay]);

  // Start animation immediately
  useEffect(() => {
    if (!isVisible) return;

    // Show elements immediately
    setIsReady(true);
    setTimeout(() => setShowMessage(true), 100);
    
    // Progress animation
    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);
      
      if (currentProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };
    updateProgress();
    
    // Auto-complete
    if (duration && onComplete) {
      const timer = setTimeout(() => {
        setShowMessage(false);
        setIsReady(false);
        setTimeout(() => onComplete(), 300);
      }, duration);
      
      return () => {
        clearTimeout(timer);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {/* Background gradient - appears immediately */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 30% 40%, ${colors[0]}20 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, ${colors[1]}20 0%, transparent 50%),
            radial-gradient(circle at center, rgba(138, 43, 226, 0.1) 0%, #000 100%)
          `,
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.3s ease-out'
        }}
      />
      
      {/* Pixel grid - renders immediately with staggered animation */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%'
      }}>
        {isReady && pixels.map((pixel, index) => (
          <div
            key={pixel.id}
            className="pixel-element"
            style={{
              position: 'absolute',
              left: `${pixel.x}px`,
              top: `${pixel.y}px`,
              width: `${pixel.size}px`,
              height: `${pixel.size}px`,
              backgroundColor: pixel.color,
              borderRadius: '2px',
              boxShadow: `0 0 ${pixel.size/2}px ${pixel.color}66`,
              opacity: 0,
              transform: 'scale(0)',
              animation: `pixelAppear 0.4s ${pixel.delay}ms cubic-bezier(0.4, 0, 0.2, 1) forwards, pixelShimmer 2s ${pixel.shimmerDelay}ms ease-in-out infinite`
            }}
          />
        ))}
      </div>

      {/* Loading message - appears quickly */}
      <div 
        style={{
          position: 'absolute',
          bottom: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: showMessage ? 1 : 0,
          transition: 'opacity 0.5s ease-out'
        }}
      >
        <h2 style={{
          color: '#fff',
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '8px',
          textShadow: `0 0 30px ${colors[0]}66`,
          letterSpacing: '0.5px'
        }}>
          {message}
        </h2>
        
        {subMessage && (
          <p style={{
            color: '#888',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {subMessage}
          </p>
        )}
        
        {/* Progress bar */}
        <div style={{
          width: '180px',
          height: '3px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          margin: '20px auto',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
            borderRadius: '2px',
            transition: 'width 0.2s linear'
          }} />
        </div>
        
        {/* Loading dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: colors[i % colors.length],
                borderRadius: '50%',
                animation: `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite`
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pixelAppear {
          0% {
            opacity: 0;
            transform: scale(0) rotate(90deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes pixelShimmer {
          0%, 100% { 
            opacity: 1;
            filter: brightness(1);
          }
          50% { 
            opacity: 0.7;
            filter: brightness(1.3);
          }
        }

        @keyframes dotPulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.3);
            opacity: 0.6;
          }
        }

        .pixel-element {
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};

// Demo App
export default function App() {
  const [showShimmer, setShowShimmer] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const scenarios = [
    {
      name: "💪 Workout Generation",
      message: "Creating Your Workout",
      subMessage: "Analyzing fitness level...",
      colors: ['#00FF88', '#00D4FF', '#00FFFF'],
      pattern: 'humanFigure',
      duration: 3000,
      animationType: 'spiral',
      pixelSize: 18
    },
    {
      name: "🔍 Exercise Search",
      message: "Searching Exercises",
      subMessage: "Scanning database...",
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
      pattern: null,
      duration: 2000,
      animationType: 'scan',
      pixelSize: 14
    },
    {
      name: "🏆 Level Up",
      message: "LEVEL UP!",
      subMessage: "Achievement unlocked!",
      colors: ['#FFD700', '#FFA500', '#FF69B4', '#00FF00'],
      pattern: 'trophy',
      duration: 3500,
      animationType: 'explosion',
      pixelSize: 16
    },
    {
      name: "🏋️ Equipment",
      message: "Loading Equipment",
      subMessage: "Preparing gear...",
      colors: ['#FF6B6B', '#FF8C00', '#FFB347'],
      pattern: 'dumbbell',
      duration: 2500,
      animationType: 'pulse',
      pixelSize: 18
    },
    {
      name: "⚡ Power Mode",
      message: "POWER MODE",
      subMessage: "Activating...",
      colors: ['#FFFF00', '#FFA500', '#FF4500'],
      pattern: 'lightning',
      duration: 2500,
      animationType: 'wave',
      pixelSize: 16
    },
    {
      name: "❤️ Recovery",
      message: "Recovery Mode",
      subMessage: "Rest & heal...",
      colors: ['#FFB6C1', '#FF69B4', '#FF1493'],
      pattern: 'heart',
      duration: 3000,
      animationType: 'pulse',
      pixelSize: 18
    }
  ];

  const triggerShimmer = (scenario) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setCurrentScenario(scenario);
    
    // Small delay to ensure state is set
    requestAnimationFrame(() => {
      setShowShimmer(true);
    });
  };

  const handleComplete = () => {
    setShowShimmer(false);
    setCurrentScenario(null);
    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        paddingTop: '40px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '36px',
            marginBottom: '12px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #00D4FF, #00FF88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Pixel Shimmer Effects
          </h1>
          <p style={{
            color: '#666',
            fontSize: '16px'
          }}>
            Optimized for instant loading
          </p>
        </div>

        {/* Scenario Grid */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {scenarios.map((scenario, index) => (
            <button
              key={index}
              onClick={() => triggerShimmer(scenario)}
              disabled={isLoading}
              style={{
                padding: '20px',
                background: isLoading ? '#1a1a1a' : 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                border: '2px solid #333',
                borderRadius: '16px',
                color: isLoading ? '#666' : '#fff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                opacity: isLoading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = scenario.colors[0];
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#333';
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    {scenario.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {scenario.animationType} • {(scenario.duration / 1000).toFixed(1)}s
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {scenario.colors.slice(0, 3).map((color, i) => (
                    <div
                      key={i}
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: color,
                        borderRadius: '4px'
                      }}
                    />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div style={{
          marginTop: '30px',
          padding: '16px',
          background: 'rgba(0, 212, 255, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 212, 255, 0.2)'
        }}>
          <p style={{ color: '#00D4FF', fontSize: '14px', margin: 0 }}>
            💡 Optimized for mobile performance with instant rendering
          </p>
        </div>
      </div>

      {/* Shimmer Effect */}
      {showShimmer && currentScenario && (
        <PixelShimmerEffect
          isVisible={showShimmer}
          onComplete={handleComplete}
          {...currentScenario}
        />
      )}
    </div>
  );
}