import { useCallback } from 'react';

export function useErrorHandler(context = 'App') {
  const handleError = useCallback((err, customMessage) => {
    const message = err?.response?.data?.message 
      || err?.response?.data?.error 
      || err?.message 
      || customMessage 
      || 'An unexpected error occurred';
    
    console.error(`[${context}] Error:`, message, err);
    
    return message;
  }, [context]);

  return { handleError };
}

export function logError(context, err) {
  const message = err?.response?.data?.message 
    || err?.response?.data?.error 
    || err?.message 
    || String(err);
  
  console.error(`[${context}]`, message);
  
  return message;
}

export default useErrorHandler;
