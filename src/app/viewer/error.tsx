'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
  soleId,
}: {
  error: Error | null;
  reset: () => void;
  soleId: React.MutableRefObject<string>;
}) {
  useEffect(() => {
    if (!error) return;
    window.parent.postMessage(
      { type: 'handleCompileError', data: error.message, id: soleId.current },
      location.origin,
    );
  }, [error]);

  return <></>;
}
