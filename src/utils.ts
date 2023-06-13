import { AxiosInstance } from 'axios';
import stream from 'stream';
import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

export const hasValue = <T>(x: T | null | undefined): x is T => {
  return x !== null && x !== undefined;
};

export const isValidUrl = (urlString: string): boolean => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

export const deleteFieldsWithNoValue = <T extends object>(obj: T) => {
  for (const key in obj) {
    if (!hasValue(obj[key])) {
      delete obj[key];
    }
  }
};

export const download = async (
  client: AxiosInstance,
  sourceUrl: string,
  targetFilePath: string,
  progressCallback: (bytesDownloaded: number) => void,
): Promise<void> => {
  await ensureDirectory(path.dirname(targetFilePath));
  const writer = fs.createWriteStream(targetFilePath);

  let totalBytes = 0;
  const progressReporter = new stream.Transform({
    transform(chunk, encoding, callback) {
      totalBytes += chunk.length;
      progressCallback(totalBytes);
      this.push(chunk);
      callback();
    },
  });

  const response = await client({
    url: sourceUrl,
    method: 'GET',
    responseType: 'stream',
  });
  return stream.promises.pipeline(response.data, progressReporter, writer);
};

export const ensureDirectory = async (dirPath: string) =>
  fs.promises.mkdir(dirPath, { recursive: true });

export const runShellCommand = (command: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cp = childProcess.exec(command);

    cp.stdout?.pipe(process.stdout);
    cp.stderr?.pipe(process.stderr);

    cp.on('close', function (code) {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    cp.on('error', function (err) {
      reject(err);
    });
  });
};
