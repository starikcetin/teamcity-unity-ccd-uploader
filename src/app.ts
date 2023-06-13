import commandExists from 'command-exists';
import { urlJoin } from 'url-join-ts';
import axios, { AxiosInstance } from 'axios';
import path from 'path';
import fs from 'fs';
import os from 'os';
import extract from 'extract-zip';
import { filesize } from 'filesize';
import logUpdate from 'log-update';

import { resolveParams, Params } from './params';
import { download, ensureDirectory, runShellCommand } from './utils';

const app = async () => {
  const parameters = await resolveParams();

  if (!commandExists.sync('ucd')) {
    throw 'UCD not found. Make sure you have UCD installed and added to your PATH before using this tool.';
  }

  const teamcityAxiosInstance = axios.create({
    headers: {
      Authorization: `Bearer ${parameters.teamcityAccessToken}`,
    },
  });

  const tempDirectoryPath = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'teamcity-unity-ccd-uploader-'),
  );

  try {
    await perform(parameters, teamcityAxiosInstance, tempDirectoryPath);
  } finally {
    await fs.promises.rm(tempDirectoryPath, { recursive: true, force: true });
  }
};

const perform = async (
  parameters: Params,
  teamcityAxiosInstance: AxiosInstance,
  rootDirectoryPath: string,
) => {
  const bundlesDirectoryPath = path.join(rootDirectoryPath, 'AssetBundles');

  await downloadBundles(
    parameters,
    rootDirectoryPath,
    bundlesDirectoryPath,
    teamcityAxiosInstance,
  );

  await uploadBundles(parameters, bundlesDirectoryPath);

  if (parameters.ucdCreateRelease) {
    await createRelease(parameters);
  } else {
    console.log('Skip creating a release with UCD in accordance with params');
  }
};

export const downloadBundles = async (
  parameters: Params,
  rootFolderPath: string,
  bundlesDirectoryPath: string,
  teamcityAxiosInstance: AxiosInstance,
) => {
  console.log('Downloading bundles from Teamcity');

  for (const platform of parameters.platforms) {
    console.log('Platform:', platform.name);

    const archiveDownloadUrl = urlJoin(
      parameters.teamcityHost,
      `app/rest/builds/id:${platform.teamcityBuildId}/artifacts/archived`,
      platform.teamcityArtifactsSubfolder,
    );

    const archiveFilePath = path.join(
      rootFolderPath,
      `archive-${platform.name}.zip`,
    );

    console.log('Downloading');
    await download(
      teamcityAxiosInstance,
      archiveDownloadUrl,
      archiveFilePath,
      (bytesDownloaded) => {
        logUpdate('Downloaded:', filesize(bytesDownloaded).toString());
      },
    );
    logUpdate.done();

    const platformDirectoryPath = path.join(
      bundlesDirectoryPath,
      platform.uploadSubfolder,
    );
    await ensureDirectory(platformDirectoryPath);

    console.log('Extracting');
    await extract(archiveFilePath, { dir: platformDirectoryPath });
  }
};

export const uploadBundles = async (
  params: Params,
  assetBundlesFolderPath: string,
) => {
  console.log('Uploading with UCD');
  await runShellCommand(
    `ucd entries sync "${assetBundlesFolderPath}" --bucket "${
      params.ucdBucket
    }" --environment "${params.ucdEnvironment}" --apikey "${
      params.ucdApiKey
    }" ${params.ucdVerbose ? '--verbose' : ''}`,
  );
};

export const createRelease = async (params: Params) => {
  console.log('Creating a release with UCD');
  await runShellCommand(
    `ucd releases create --notes "${params.ucdReleaseNotes}" --bucket "${
      params.ucdBucket
    }" --environment "${params.ucdEnvironment}" --apikey "${
      params.ucdApiKey
    }" ${params.ucdVerbose ? '--verbose' : ''}`,
  );
};

export default app;
