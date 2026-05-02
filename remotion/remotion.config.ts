import { Config } from '@remotion/cli/config';

Config.setEntryPoint('./src/index.tsx');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(80);
Config.setOverwriteOutput(true);
