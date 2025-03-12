'use client';

import React, { useRef } from 'react';
import Error from './error'; // 确保导入你的 Error 组件

interface ErrorBoundaryProps {
  children: React.ReactNode;
  soleId: React.MutableRefObject<string>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {}

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Error
          error={this.state.error}
          reset={this.resetError}
          soleId={this.props.soleId}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
