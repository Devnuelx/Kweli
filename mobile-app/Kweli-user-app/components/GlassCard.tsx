import { BlurView } from 'expo-blur';
import React from 'react';
import { ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  className?: string;
}

export function GlassCard({ 
  children, 
  intensity = 80, 
  tint = 'dark',
  className = '',
  ...props 
}: GlassCardProps) {
  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      className={`rounded-3xl p-6 border border-white/20 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </BlurView>
  );
}

export function GlassButton({ 
  children, 
  intensity = 60, 
  tint = 'dark',
  className = '',
  ...props 
}: GlassCardProps) {
  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      className={`rounded-xl px-6 py-3 border border-white/20 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </BlurView>
  );
}

