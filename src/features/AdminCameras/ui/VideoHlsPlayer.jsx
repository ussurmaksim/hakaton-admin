import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

/**
 * HLS-плеер с watchdog:
 * - Safari/iOS — нативно;
 * - Остальные — hls.js;
 * - авто-рестарт, если поток замер или случилась фатальная ошибка.
 */
export default function VideoHlsPlayer({ src, autoPlay = true, muted = true }) {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const lastMoveAtRef = useRef(Date.now());
    const lastTRef = useRef(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        detach(); // на случай смены src

        const bust = (u) => {
            try {
                const url = new URL(u, window.location.origin);
                url.searchParams.set('_', Date.now().toString());
                return url.toString();
            } catch { return u; }
        };

        const attachNative = () => {
            video.src = bust(src);
            if (autoPlay) video.play().catch(() => {});
        };

        const attachHls = () => {
            const hls = new Hls({ lowLatencyMode: true, enableWorker: true, backBufferLength: 30 });
            hlsRef.current = hls;
            hls.loadSource(bust(src));
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (!data.fatal) return;
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
                else restart();
            });
        };

        if (video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')) {
            attachNative();
        } else if (Hls.isSupported()) {
            attachHls();
        }

        // движения таймкода — для watchdog
        const onTime = () => {
            const t = video.currentTime;
            if (Math.abs(t - lastTRef.current) > 0.25) {
                lastTRef.current = t;
                lastMoveAtRef.current = Date.now();
            }
        };
        video.addEventListener('timeupdate', onTime);

        const softRestart = () => setTimeout(restart, 500);
        ['stalled', 'suspend', 'waiting', 'error', 'emptied'].forEach(ev =>
            video.addEventListener(ev, softRestart)
        );

        const int = setInterval(() => {
            if (video.paused || video.readyState < 2) return;
            if (Date.now() - lastMoveAtRef.current > 10000) restart(); // 10s
        }, 1000);

        function restart() {
            detach();
            // небольшая задержка, чтобы браузер точно распустил коннекты
            setTimeout(() => {
                if (video.canPlayType('application/vnd.apple.mpegurl')) attachNative();
                else if (Hls.isSupported()) attachHls();
            }, 200);
        }

        function detach() {
            try { video.pause(); } catch {}
            try { video.removeAttribute('src'); video.load(); } catch {}
            if (hlsRef.current) { try { hlsRef.current.destroy(); } catch {} hlsRef.current = null; }
        }

        return () => {
            clearInterval(int);
            ['stalled','suspend','waiting','error','emptied'].forEach(ev =>
                video.removeEventListener(ev, softRestart)
            );
            video.removeEventListener('timeupdate', onTime);
            detach();
        };
    }, [src, autoPlay]);

    return (
        <video
            ref={videoRef}
            controls
            muted={muted}
            playsInline
            style={{ width: '100%', borderRadius: 12, background: '#000' }}
        />
    );
}
