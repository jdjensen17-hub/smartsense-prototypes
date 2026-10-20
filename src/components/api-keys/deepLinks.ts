// Shared query-param entry points for the API Keys prototype. The reference mock reached these
// states from a dev-only Screens picker; this repo has no such pattern, so the URL is the way in.
//   ?as=csm | support | admin   switch the support read-only view (sticks while you navigate)
//   ?reset=1                    restore the sample data

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiKeys } from '@/data/apiKeys';

export function useApiKeyDeepLinks() {
  const [params, setParams] = useSearchParams();
  const resetApplied = useRef(false);

  const as = params.get('as');
  const reset = params.get('reset');

  useEffect(() => {
    if (as) apiKeys.setViewAs(as === 'csm' || as === 'support' ? 'support' : 'admin');
  }, [as]);

  useEffect(() => {
    if (!reset || resetApplied.current) return;
    resetApplied.current = true;
    apiKeys.reset();
    const next = new URLSearchParams(params);
    next.delete('reset');
    setParams(next, { replace: true });
  }, [reset, params, setParams]);
}
