import { useEffect } from 'react';

export default function useFavicon() {
  useEffect(() => {
    document.getElementById('iconLink')?.remove();
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.id = 'iconLink';
    favicon.href = 'https://www.unstoppable840.cn/assets/favicon.ico';
    document.head.appendChild(favicon);
    return () => {
      document.getElementById('iconLink')?.remove();
    };
  }, []);
}
