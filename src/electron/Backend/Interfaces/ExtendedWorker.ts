interface ExtendedWorker extends Worker {
  callback?: (error: Error | null, result?: any) => void;
}

export default ExtendedWorker;
