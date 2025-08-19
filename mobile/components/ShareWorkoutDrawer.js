/**
 * ShareWorkoutDrawer - Advanced Social Sharing Component
 * 
 * Features:
 * - Share individual days or entire workout programs
 * - Social media integration with custom graphics generation
 * - Glassmorphism design with liquid animations
 * - QR code generation for easy sharing
 * - Analytics tracking for shared content
 * - Privacy controls and customization options
 * 
 * @component ShareWorkoutDrawer
 * @author Claude AI Assistant
 * @version 2.0.0
 * @created 2025-08-18
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  Share,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

// Import design system
import { SafeLinearGradient, GlassGradient } from './SafeLinearGradient';
import { useTheme } from '../contexts/ThemeContext';
import { colors, spacing, borderRadius, typography, shadows } from '../utils/designTokens';
import workoutSharing from '../utils/workoutSharing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ShareWorkoutDrawer = ({ 
  workout,
  program,
  day,
  visible, 
  onClose,
  shareType = 'workout' // 'workout', 'program', 'day'
}) => {
  const { isDarkMode, theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareStats, setShareStats] = useState(null);
  const [selectedPrivacy, setSelectedPrivacy] = useState('public');
  const [customMessage, setCustomMessage] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const sharePreviewRef = useRef(null);

  // Get current content based on share type
  const getShareContent = () => {
    switch (shareType) {
      case 'program':
        return {
          title: program?.title || 'My Workout Program',
          description: program?.description || 'Check out this awesome workout program!',
          duration: `${program?.totalWeeks} weeks`,
          type: 'Complete Program',
          data: program
        };
      case 'day':
        return {
          title: day?.title || 'My Workout Day',
          description: day?.description || 'Check out this workout day!',
          duration: `${day?.estimatedDuration || 45} minutes`,
          type: 'Workout Day',
          data: day
        };
      default:
        return {
          title: workout?.title || 'My Workout',
          description: workout?.summary || 'Check out this workout!',
          duration: workout?.duration || '45 minutes',
          type: 'Single Workout',
          data: workout
        };
    }
  };

  const shareContent = getShareContent();

  // Animation effects
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Handle different sharing methods
  const handleShare = async (method) => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await workoutSharing.shareContent(shareContent.data, {
        method,
        privacy: selectedPrivacy,
        customMessage,
        shareType
      });
      
      if (result.success) {
        if (result.shareUrl) {
          setShareUrl(result.shareUrl);
          generateQRCode(result.shareUrl);
        }
        
        if (method === 'native') {
          await Share.share({
            message: `${customMessage}\n\n${shareContent.title}\n${result.shareUrl}`,
            title: shareContent.title,
            url: result.shareUrl,
          });
        }
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Update share stats
        if (result.analytics) {
          setShareStats(result.analytics);
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Share Failed', 'Unable to share content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code for easy sharing
  const generateQRCode = async (url) => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('QR code generation failed:', error);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (shareUrl) {
      await Clipboard.setStringAsync(shareUrl);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Copied!', 'Share link copied to clipboard');
    } else {
      await handleShare('link');
    }
  };

  // Generate custom social media image
  const generateShareImage = async () => {
    setGeneratingImage(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const imageUri = await captureRef(sharePreviewRef, {
        format: 'png',
        quality: 0.9,
        result: 'tmpfile',
      });

      const result = await Share.share({
        url: imageUri,
        message: `${customMessage}\n\n${shareContent.title}`,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Image generation failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to generate share image');
    } finally {
      setGeneratingImage(false);
    }
  };

  // Share option component with glassmorphism
  const ShareOption = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    color = colors.primary.DEFAULT,
    disabled = false,
    premium = false
  }) => (
    <TouchableOpacity
      style={[
        styles.shareOption,
        {
          backgroundColor: isDarkMode 
            ? colors.dark.background.glass.medium 
            : colors.light.background.glass.medium,
          borderColor: isDarkMode 
            ? colors.dark.border.light 
            : colors.light.border.light,
        },
        disabled && styles.shareOptionDisabled
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <GlassGradient intensity="medium" style={styles.iconContainer}>
        <View style={[styles.iconBackground, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
          {premium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
            </View>
          )}
        </View>
      </GlassGradient>
      
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionTitle,
          { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[
            styles.optionSubtitle,
            { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
          ]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary} 
      />
    </TouchableOpacity>
  );

  // Privacy selector component
  const PrivacySelector = () => (
    <View style={styles.privacySection}>
      <Text style={[
        styles.sectionTitle,
        { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
      ]}>
        Privacy Settings
      </Text>
      <View style={styles.privacyOptions}>
        {[
          { key: 'public', label: 'Public', subtitle: 'Anyone can view', icon: 'globe-outline' },
          { key: 'unlisted', label: 'Unlisted', subtitle: 'Only with link', icon: 'link-outline' },
          { key: 'private', label: 'Private', subtitle: 'Invite only', icon: 'lock-closed-outline' }
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.privacyOption,
              selectedPrivacy === option.key && styles.privacyOptionSelected,
              {
                backgroundColor: selectedPrivacy === option.key
                  ? `${colors.primary.DEFAULT}20`
                  : (isDarkMode ? colors.dark.background.glass.subtle : colors.light.background.glass.subtle),
                borderColor: selectedPrivacy === option.key
                  ? colors.primary.DEFAULT
                  : (isDarkMode ? colors.dark.border.light : colors.light.border.light)
              }
            ]}
            onPress={() => {
              setSelectedPrivacy(option.key);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons 
              name={option.icon} 
              size={20} 
              color={selectedPrivacy === option.key ? colors.primary.DEFAULT : (isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary)} 
            />
            <View style={styles.privacyOptionText}>
              <Text style={[
                styles.privacyOptionLabel,
                { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.privacyOptionSubtitle,
                { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
              ]}>
                {option.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: opacityAnim }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Drawer Content */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <BlurView
          intensity={isDarkMode ? 20 : 30}
          style={styles.blurContainer}
          tint={isDarkMode ? 'dark' : 'light'}
        >
          {/* Header */}
          <SafeLinearGradient
            type="accent"
            variant={isDarkMode ? "aurora" : "sunset"}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="share-social" size={24} color="white" />
                <Text style={styles.headerTitle}>Share {shareContent.type}</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeLinearGradient>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Content Preview */}
            <View 
              ref={sharePreviewRef}
              style={[
                styles.contentPreview,
                {
                  backgroundColor: isDarkMode 
                    ? colors.dark.background.glass.medium 
                    : colors.light.background.glass.medium,
                  borderColor: isDarkMode 
                    ? colors.dark.border.medium 
                    : colors.light.border.light
                }
              ]}
            >
              <SafeLinearGradient
                type="accent"
                variant={isDarkMode ? "glow" : "golden"}
                style={styles.previewGradient}
              >
                <Text style={styles.previewTitle}>{shareContent.title}</Text>
                <Text style={styles.previewSubtitle}>{shareContent.type}</Text>
              </SafeLinearGradient>
              
              <View style={styles.previewContent}>
                <Text style={[
                  styles.previewDescription,
                  { color: isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary }
                ]}>
                  {shareContent.description}
                </Text>
                
                <View style={styles.previewMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name="time-outline" 
                      size={16} 
                      color={isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary} 
                    />
                    <Text style={[
                      styles.metaText,
                      { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
                    ]}>
                      {shareContent.duration}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name="fitness-outline" 
                      size={16} 
                      color={isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary} 
                    />
                    <Text style={[
                      styles.metaText,
                      { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
                    ]}>
                      Strength.Design
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Privacy Settings */}
            <PrivacySelector />

            {/* Share Options */}
            <View style={styles.shareOptions}>
              <Text style={[
                styles.sectionTitle,
                { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
              ]}>
                Share Methods
              </Text>
              
              <ShareOption
                icon="share-social-outline"
                title="Native Share"
                subtitle="Share via system share sheet"
                onPress={() => handleShare('native')}
                color={colors.primary.DEFAULT}
              />
              
              <ShareOption
                icon="copy-outline"
                title="Copy Link"
                subtitle="Copy shareable link to clipboard"
                onPress={handleCopyLink}
                color="#9C27B0"
              />
              
              <ShareOption
                icon="camera-outline"
                title="Share as Image"
                subtitle="Generate and share custom image"
                onPress={generateShareImage}
                color="#4CAF50"
                disabled={generatingImage}
              />
              
              <ShareOption
                icon="document-text-outline"
                title="Export as File"
                subtitle="Save as JSON or PDF file"
                onPress={() => handleShare('file')}
                color="#2196F3"
              />
              
              <ShareOption
                icon="logo-instagram"
                title="Social Media"
                subtitle="Optimized for Instagram & TikTok"
                onPress={() => handleShare('social')}
                color="#E4405F"
                premium={true}
              />
            </View>

            {/* QR Code */}
            {qrCodeUrl && (
              <View style={[
                styles.qrSection,
                {
                  backgroundColor: isDarkMode 
                    ? colors.dark.background.glass.medium 
                    : colors.light.background.glass.medium,
                  borderColor: isDarkMode 
                    ? colors.dark.border.light 
                    : colors.light.border.light
                }
              ]}>
                <Text style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
                ]}>
                  QR Code
                </Text>
                <View style={styles.qrCodeContainer}>
                  <Text style={[
                    styles.qrCodeUrl,
                    { color: isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary }
                  ]}>
                    Scan to access workout
                  </Text>
                </View>
              </View>
            )}

            {/* Share Stats */}
            {shareStats && (
              <View style={[
                styles.statsSection,
                {
                  backgroundColor: isDarkMode 
                    ? colors.dark.background.glass.medium 
                    : colors.light.background.glass.medium,
                  borderColor: isDarkMode 
                    ? colors.dark.border.light 
                    : colors.light.border.light
                }
              ]}>
                <Text style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
                ]}>
                  Share Analytics
                </Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary.DEFAULT }]}>
                      {shareStats.views || 0}
                    </Text>
                    <Text style={[
                      styles.statLabel,
                      { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
                    ]}>
                      Views
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary.DEFAULT }]}>
                      {shareStats.copies || 0}
                    </Text>
                    <Text style={[
                      styles.statLabel,
                      { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
                    ]}>
                      Copies
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary.DEFAULT }]}>
                      {shareStats.likes || 0}
                    </Text>
                    <Text style={[
                      styles.statLabel,
                      { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
                    ]}>
                      Likes
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Bottom spacing */}
            <View style={{ height: 50 }} />
          </ScrollView>

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <GlassGradient intensity="strong" style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                <Text style={[
                  styles.loadingText,
                  { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
                ]}>
                  {generatingImage ? 'Generating image...' : 'Sharing...'}
                </Text>
              </GlassGradient>
            </View>
          )}
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.85,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
  },
  header: {
    paddingTop: spacing[8],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[5],
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: 'white',
  },
  closeButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    padding: spacing[5],
  },
  contentPreview: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing[6],
    overflow: 'hidden',
  },
  previewGradient: {
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[5],
  },
  previewTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: 'white',
    marginBottom: spacing[1],
  },
  previewSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  previewContent: {
    padding: spacing[4],
  },
  previewDescription: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * 1.4,
    marginBottom: spacing[3],
  },
  previewMeta: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.fontSize.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[4],
  },
  privacySection: {
    marginBottom: spacing[6],
  },
  privacyOptions: {
    gap: spacing[3],
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing[3],
  },
  privacyOptionSelected: {
    borderWidth: 2,
  },
  privacyOptionText: {
    flex: 1,
  },
  privacyOptionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[0.5],
  },
  privacyOptionSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  shareOptions: {
    marginBottom: spacing[6],
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  shareOptionDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    borderRadius: borderRadius.md,
    padding: spacing[1],
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: borderRadius.full,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[0.5],
  },
  optionSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  qrSection: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing[6],
    alignItems: 'center',
  },
  qrCodeContainer: {
    padding: spacing[4],
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
  },
  qrCodeUrl: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  statsSection: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing[6],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});

export default ShareWorkoutDrawer;