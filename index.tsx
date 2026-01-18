import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress benign ResizeObserver error
const resizeObserverLoopErr = /ResizeObserver loop completed with undelivered notifications|ResizeObserver loop limit exceeded/;

// Override console.error to catch it before it logs
const originalError = console.error;
console.error = function(...args) {
  if (args.some(arg => {
    const msg = arg instanceof Error ? arg.message : arg;
    return typeof msg === 'string' && resizeObserverLoopErr.test(msg);
  })) {
    return;
  }
  originalError.apply(console, args);
};

// Override window.onerror to prevent it from propagating
window.onerror = function(message, source, lineno, colno, error) {
  const msg = typeof message === 'string' ? message : (error ? error.message : '');
  if (resizeObserverLoopErr.test(msg)) {
    return true; // prevent default
  }
  return false;
};

window.addEventListener('error', (e) => {
  if (resizeObserverLoopErr.test(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason;
  const msg = reason instanceof Error ? reason.message : reason;
  if (typeof msg === 'string' && resizeObserverLoopErr.test(msg)) {
    e.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);