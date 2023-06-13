import fs from 'fs';
import minimist from 'minimist';

import { hasValue, isValidUrl, deleteFieldsWithNoValue } from './utils';

type AllRequired<T> = {
  [P in keyof T]-?: T[P];
};

type PlatformConfig = {
  name: string;
  teamcityArtifactsSubfolder: string;
  uploadSubfolder: string;
};

type PlatformArg = {
  name: string;
  teamcityBuildId: string;
};

type PlatformParam = PlatformConfig & PlatformArg;

type ConfigOrArgs = {
  teamcityHost?: string;
  ucdBucket?: string;
  ucdEnvironment?: string;
  ucdApiKey?: string;
  ucdVerbose?: boolean;
  ucdCreateRelease?: boolean;
  ucdReleaseNotes?: string;
  teamcityAccessToken?: string;
};

type Config = ConfigOrArgs & {
  platforms?: PlatformConfig[];
};

type Args = ConfigOrArgs & {
  platforms?: PlatformArg[];
  configPath?: string;
};

export type Params = (AllRequired<Config> | AllRequired<Args>) & {
  platforms: PlatformParam[];
};

const validateArgPlatform = (obj: any): obj is PlatformArg => {
  if (!hasValue(obj.name)) {
    console.error("An argument platform is missing 'name'");
    return false;
  }

  if (!hasValue(obj.teamcityBuildId)) {
    console.error(`Argument platform ${obj.name} is missing 'teamcityBuildId'`);
    return false;
  }

  return true;
};

const validateConfigPlatform = (obj: any): obj is PlatformConfig => {
  if (!hasValue(obj.name)) {
    console.error("A config platform is missing 'name'");
    return false;
  }

  if (!hasValue(obj.teamcityArtifactsSubfolder)) {
    console.error(
      `Config platform ${obj.name} is missing 'teamcityArtifactsSubfolder'`,
    );
    return false;
  }

  if (!hasValue(obj.uploadSubfolder)) {
    console.error(`Config platform ${obj.name} is missing 'uploadSubfolder'`);
    return false;
  }

  return true;
};

const validatePlatformParam = (obj: any): obj is PlatformParam => {
  if (!hasValue(obj.name)) {
    console.error("A platform is missing 'name'");
    return false;
  }

  if (!hasValue(obj.teamcityArtifactsSubfolder)) {
    console.error(
      `Platform ${obj.name} is missing 'teamcityArtifactsSubfolder'`,
    );
    return false;
  }

  if (!hasValue(obj.uploadSubfolder)) {
    console.error(`Platform ${obj.name} is missing 'uploadSubfolder'`);
    return false;
  }

  if (!hasValue(obj.teamcityBuildId)) {
    console.error(`Platform ${obj.name} is missing 'teamcityBuildId'`);
    return false;
  }

  return true;
};

const validateParams = (obj: any): obj is Params => {
  if (!hasValue(obj.teamcityHost)) {
    console.error("Param 'teamCityHost' is required");
    return false;
  }

  if (!isValidUrl(obj.teamcityHost)) {
    console.error("Param 'teamCityHost' must be a valid URL");
    return false;
  }

  if (!hasValue(obj.platforms)) {
    console.error("Param 'platforms' is required");
    return false;
  }

  if (obj.platforms.length <= 0) {
    console.error("Param 'platforms' must have at least one entry");
    return false;
  }

  if (!obj.platforms.every(validatePlatformParam)) {
    console.error("Param 'platforms' has invalid entries");
    return false;
  }

  if (!hasValue(obj.ucdBucket)) {
    console.error("Param 'ucdBucket' is required");
    return false;
  }

  if (!hasValue(obj.ucdEnvironment)) {
    console.error("Param 'ucdEnvironment' is required");
    return false;
  }

  if (!hasValue(obj.ucdApiKey)) {
    console.error("Param 'ucdApiKey' is required");
    return false;
  }

  if (!hasValue(obj.ucdVerbose)) {
    console.error("Param 'ucdVerbose' is required");
    return false;
  }

  if (!hasValue(obj.ucdCreateRelease)) {
    console.error("Param 'ucdCreateRelease' is required");
    return false;
  }

  if (!hasValue(obj.teamcityAccessToken)) {
    console.error("Param 'teamcityAccessToken' is required");
    return false;
  }

  if (obj.ucdCreateRelease) {
    if (!hasValue(obj.ucdReleaseNotes)) {
      console.error(
        "Param 'ucdReleaseNotes' is required when 'ucdCreateRelease' is true",
      );
      return false;
    }
  }

  return true;
};

const resolveConfig = async (configPath: string): Promise<Config> => {
  if (!fs.existsSync(configPath)) {
    throw `Config file not found at ${configPath}`;
  }

  const rawConfigFile = await fs.promises.readFile(configPath, 'utf-8');
  const parsed = JSON.parse(rawConfigFile);
  deleteFieldsWithNoValue(parsed);
  return parsed;
};

const resolveArgs = (): Args => {
  const parsed = minimist(process.argv.slice(2));

  const {
    ['--']: doubleDash,
    _,
    teamcityHost,
    ucdBucket,
    ucdEnvironment,
    ucdApiKey,
    ucdReleaseNotes,
    configPath,
    ucdUpload,
    ucdVerbose,
    ucdCreateRelease,
    ...platformBuildIds
  } = parsed;

  const platforms: PlatformArg[] = Object.keys(platformBuildIds).map((x) => ({
    name: x,
    teamcityBuildId: platformBuildIds[x],
  }));

  const args: Args = {
    teamcityHost,
    ucdBucket,
    ucdEnvironment,
    ucdApiKey,
    ucdReleaseNotes,
    configPath,
    ucdVerbose,
    ucdCreateRelease,
    platforms,
  };
  deleteFieldsWithNoValue(args);
  return args;
};

const mergePlatformData = (config: Config, args: Args): PlatformParam[] => {
  const argsPlatforms = args.platforms;
  const configPlatforms = config.platforms;

  if (!hasValue(configPlatforms)) {
    throw 'No platform data in config file';
  }

  if (!configPlatforms.every(validateConfigPlatform)) {
    throw 'Invalid platform data in config file';
  }

  if (!hasValue(argsPlatforms)) {
    throw 'No platform data in arguments';
  }

  if (!argsPlatforms.every(validateArgPlatform)) {
    throw 'Invalid platform data in arguments';
  }

  return argsPlatforms.map((argPlatform) => {
    const configPlatform = configPlatforms.find(
      (configPlatform) => configPlatform.name === argPlatform.name,
    );

    if (!hasValue(configPlatform)) {
      throw `Platform ${argPlatform.name} is in arguments, but not in config`;
    }

    return { ...configPlatform, ...argPlatform };
  });
};

export const resolveParams = async (): Promise<Params> => {
  const args = resolveArgs();

  if (!hasValue(args.configPath)) {
    throw "Argument 'configPath' is required";
  }

  const config = await resolveConfig(args.configPath);

  const params: Partial<Params> = {
    ...config,
    ...args,
    platforms: mergePlatformData(config, args),
  };

  deleteFieldsWithNoValue(params);

  if (validateParams(params)) {
    return params;
  } else {
    throw 'Params could not be satisfied.';
  }
};
