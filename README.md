# Teamcity Unity CCD Uploader

A tool for uploading Unity addressables bundles to CCD from Teamcity artifacts.

## Requirements

- Node.js version `8.0.0` or higher.
- [UCD is installed](https://docs.unity.com/ccd/en/manual/UnityCCDCLI) and it is accessible via PATH.

## Installation

```sh
npm i -g teamcity-unity-ccd-uploader
```

## Usage

Create a config file in JSON format. It should look like this:

```json
{
 "teamcityHost": "<Teamcity Base URL>",
 "ucdBucket": "<CCD Bucket ID>",
 "ucdEnvironment": "<CCD environment ID>",
 "ucdApiKey": "<CCD API Key>",
 "ucdCreateRelease": true,
 "teamcityAccessToken": "<Teamcity Access Token>",
 "platforms": [
  {
   "name": "Android",
   "teamcityArtifactsSubfolder": "unityAssetBundles",
   "uploadSubfolder": "Android"
  },
  {
   "name": "iOS",
   "teamcityArtifactsSubfolder": "unityAssetBundles",
   "uploadSubfolder": "iOS"
  }
 ]
}
```

Then, in a terminal, run:

```sh
teamcity-unity-ccd-uploader --configPath "<Path to Config File>" --ucdReleaseNotes "<CCD Release Notes>" --ucdVerbose --Android <Android Teamcity Build ID> --iOS <iOS Teamcity Build ID>
```

Notes:

- You can also use `tucu` instead of `teamcity-unity-ccd-uploader`. They both point to this tool.

- The tool works in a OS-provided temporary directory and deletes it after it is done. You don't need to do any cleanup.

## Parameters
  
| Name                  | Location     | Description                                                            | Type      | Example                                  |
|---                    | ---          |---                                                                     |---        |---                                       |
| `platforms`           | Both (!)     | Defines platform settings. See below for explanation of members.       | See below | See below                                |
| `configPath`          | CLI (!)      | The path to the config file.                                           | `string`  | `PATH/TO/YOUR/CONFIG/FILE`               |
| `ucdReleaseNotes`     | CLI          | Release notes for creating a release in the target CCD bucket.         | `string`  | `Hello World!`                           |
| `ucdVerbose`          | CLI          | Whether to pass `--verbose` flag to UCD.                               | `flag`    | Config: `true` CLI: `--ucdVerbose`       |
| `teamcityHost`        | Config File  | Base URL of your Teamcity host.                                        | `string`  | `https://teamcity.mycompany.com/`        |
| `ucdBucket`           | Config File  | ID of the target bucket on CCD.                                        | `string`  | `b2c5ab23-ab23-578a-38cd-364839ad5c23`   |
| `ucdEnvironment`      | Config File  | ID of the target environment on CCD.                                   | `string`  | `dbc234ab-cd12-56ab-1234-a2345c342cdb`   |
| `ucdApiKey`           | Config File  | CCD API key.                                                           | `string`  | `af2937bc4367982def1209c34ba23df1`       |
| `teamcityAccessToken` | Config File  | Teamcity access token.                                                 | `string`  | `ayJ0eXAiOiAiCE2ENiJ4.AnZoS2hDVFlPUklbYzI5NWFE70ctSFYtXzNc.BTZkNm24ZGItZjEyZi00ZDA2LWEzAmYtZgE0OGY1NDI4N2Fm` |
| `ucdCreateRelease`    | Config File  | Whether to create a release in the target CCD bucket.                  | `flag`    | Config: `true` CLI: `--ucdCreateRelease` |

Notes:

- Examples values are randomly generated.

- The `(!)` symbol in the Location column indicates that the parametes MUST be defined in the specified location. Other parameters can be defined either in the config file, or as CLI arguments, as you desire. For example: You have to provide `configPath` as a CLI argument, it can't be in the config file. However, you can define `ucdApiKey` in either the config file, or as a CLI argument.

- Flag parameters should be defined with their values as `booleans` in the config file. In the CLI, their absence means `false`, and their presence means `true`.

- The CLI arguments have priority over the config file. This means that if a parameter is defined in both the config file and as a CLI argument, the value from the CLI argument will be used.

### `platforms` Parameter

Members:

| Name                         | Location        | Description                                                           | Type     | Example                       |
|---                           | ---             |---                                                                    |---       |---                            |
| `teamcityBuildId`            | CLI (!)         | Teamcity build ID for platforms to operate on.                        | `string` | `--Android 27845 --iOS 25432` |
| `name`                       | Config File (!) | The name of the platform.                                             | `string` | `Android`                     |
| `teamcityArtifactsSubfolder` | Config File (!) | Subfolder in Teamcity artifacts that contain the addressable bundles. | `string` | `unityAssetBundles`           |
| `uploadSubfolder`            | Config File (!) | Local subfolder to put the bundles in after download.                 | `string` | `Android`                     |

Example `platforms` config file entry:

```json
"platforms": [
    {
        "name": "Android",
        "teamcityArtifactsSubfolder": "unityAssetBundles",
        "uploadSubfolder": "Android"
    },
    {
        "name": "iOS",
        "teamcityArtifactsSubfolder": "unityAssetBundles",
        "uploadSubfolder": "iOS"
    }
]
```

Example of passing `teamcityBuildId`s as CLI arguments. In this example, Android platform's bundles will be downloaded from Teamcity build with the ID `27845`, and iOS from `25432`:

```shell
teamcity-unity-ccd-uploader <other cli args> --Android 27845 --iOS 25432
```

Notes:

- There will only be a single CCD upload and release creation. Therefore, if you pass multiple platform `teamcityBuildId`s in the CLI, they will all be part of the same upload and release.

- Platforms to process is determined by the `teamcityBuildId`s passed via CLI. Even if a platform exists in the config file, it won't be processed unless you pass a `teamcityBuildId` via CLI.

## License

MIT License. Refer to the [LICENSE.md](LICENSE.md) file.

Copyright (c) 2023 [S. Tarık Çetin](https://github.com/starikcetin)
