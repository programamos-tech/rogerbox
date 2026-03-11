'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { className as styles } from './styles';

const SESSION_KEY = 'rogerbox_news_modal_seen';

function NewsModal() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen === '1') {
      setShouldShow(false);
      return;
    }
    setShouldShow(true);
    setIsMounted(true);
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, '1');
    }
    setIsVisible(false);
    setTimeout(() => {
      setIsMounted(false);
    }, 300);
  };

  if (!shouldShow || !isMounted) return null;

  return (
    <div className={styles.overlay}>
      <div
        onClick={handleClose}
        className={`${styles.backdrop} ${
          isVisible ? styles.backdropShow : styles.backdropHide
        }`}
      />
      <div
        className={`${styles.modalBase} ${
          isVisible ? styles.modalShow : styles.modalHide
        }`}
      >
        <div className={styles.header}>
          <div className={styles.profileInfo}>
            <div className={styles.avatar} />
            <span className={styles.username}>Tu Marca • Novedades</span>
          </div>
          <button onClick={handleClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className={styles.contentWrapper}>
          <div
            className={`absolute inset-0 bg-zinc-800 animate-pulse transition-opacity duration-500 ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          />

          <Image
            src="/videos/roger-hero-preview.webp"
            alt="Noticia"
            fill
            className={`object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoadingComplete={() => setImageLoaded(true)}
            priority
          />

          <div className={styles.footer}>
            <button className={styles.ctaButton}>DESCUBRIR MÁS</button>
            <div className={styles.indicator} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsModal;
