import { useState, useEffect, useCallback } from 'react';
import { TerminalJobLifecycleManager, SubmitJobOptions, ExecutionResult } from '../services/TerminalJobLifecycleManager';
import { JobLifecycleRecord, isJobTerminalState } from '../types';

export function useTerminalJobLifecycle(jobIdOrKey?: string) {
  const [jobs, setJobs] = useState<JobLifecycleRecord[]>(() => TerminalJobLifecycleManager.getAllJobs());
  const [selectedJob, setSelectedJob] = useState<JobLifecycleRecord | undefined>(() =>
    jobIdOrKey ? TerminalJobLifecycleManager.getJobOrByKey(jobIdOrKey) : undefined
  );

  useEffect(() => {
    const unsubscribe = TerminalJobLifecycleManager.subscribe((allJobs) => {
      setJobs(allJobs);
      if (jobIdOrKey) {
        setSelectedJob(TerminalJobLifecycleManager.getJobOrByKey(jobIdOrKey));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [jobIdOrKey]);

  const executeJob = useCallback(
    async <T = any>(
      opts: SubmitJobOptions,
      executor: (job: JobLifecycleRecord) => Promise<T>
    ): Promise<ExecutionResult<T>> => {
      return TerminalJobLifecycleManager.executeJob<T>(opts, executor);
    },
    []
  );

  const isTerminal = useCallback((idOrKey: string): boolean => {
    return TerminalJobLifecycleManager.isTerminal(idOrKey);
  }, []);

  const isLocked = useCallback((idOrKey: string): boolean => {
    return TerminalJobLifecycleManager.isLocked(idOrKey);
  }, []);

  const getJob = useCallback((idOrKey: string): JobLifecycleRecord | undefined => {
    return TerminalJobLifecycleManager.getJobOrByKey(idOrKey);
  }, []);

  return {
    jobs,
    selectedJob,
    executeJob,
    isTerminal,
    isLocked,
    getJob,
    isJobTerminalState,
  };
}
