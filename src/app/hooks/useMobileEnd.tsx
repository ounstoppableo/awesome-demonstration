import { useEffect } from 'react';

export default function useMobileEnd() {
  useEffect(() => {
    document.getElementById('iconLink')?.remove();
    document.getElementById('viewportMeta')?.remove();
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.id = 'iconLink';
    favicon.href = 'https://www.unstoppable840.cn/assets/favicon.ico';
    document.head.appendChild(favicon);
    const meta = document.createElement('meta');
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    meta.name = 'viewport';
    meta.id = 'viewportMeta';
    document.head.append(meta);
    return () => {
      document.getElementById('iconLink')?.remove();
      document.getElementById('viewportMeta')?.remove();
    };
  }, []);
}
