import { promises as fs } from 'fs';
import path from 'path';

import nodeResolve from 'rollup-plugin-node-resolve';
import includePaths from 'rollup-plugin-includepaths'
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import posthtmlTemplate from './build/rollup-posthtml-template';
import babel from 'rollup-plugin-babel';

const INPUT_ROOT = 'src';
const INPUT_PATHS_ROOT = path.join(INPUT_ROOT, 'paths');
const INPUT_SHARED_ROOT = path.join(INPUT_ROOT, 'shared');
const INPUT_STATIC_ROOT = path.join(INPUT_ROOT, 'static');

const ENTRY_FILE_NAME = 'entry.js';
const TEMPLATE_FILE_NAME = 'template.html';
const GLOBAL_FILE_NAME = 'global.js';

const OUTPUT_ROOT = 'out';
const OUTPUT_STYLES = path.join(OUTPUT_ROOT, 'styles');
const OUTPUT_STYLES_SHARED = path.join(OUTPUT_STYLES, 'shared');
const OUTPUT_SCRIPTS = path.join(OUTPUT_ROOT, 'scripts');
const OUTPUT_SCRIPTS_SHARED = path.join(OUTPUT_SCRIPTS, 'shared');

const generateConfig = async () => {
  let configs = [];

  getGlobalConfig(configs);
  await getPathsConfigs(configs);

  return configs;
};
const getGlobalConfig = (configs) => {
  const globalScriptPath = path.join(INPUT_SHARED_ROOT, 'scripts', GLOBAL_FILE_NAME);
  const outputPath = path.join(OUTPUT_SCRIPTS_SHARED, GLOBAL_FILE_NAME);

  const sharedStylesGlob = path.join(INPUT_SHARED_ROOT, 'styles/**/*.css').replace(/\\/g, '/'); // Windows path not supported by copy plugin
  const staticGlob = path.join(INPUT_STATIC_ROOT, '/**/*.*').replace(/\\/g, '/'); // Windows path not supported by copy plugin

  configs.push({
    input: globalScriptPath,
    output: {
      name: 'global',
      file: outputPath,
      format: 'iife'
    },
    plugins: [
      nodeResolve(),
      copy({
        targets: [
          { src: sharedStylesGlob, dest: OUTPUT_STYLES_SHARED },
          { src: staticGlob, dest: OUTPUT_ROOT },
        ],
        verbose: true
      })
    ]
  })

};
const getPathsConfigs = async (configs) => {
  try {
    // Collect paths to process
    const paths = await fs.readdir(INPUT_PATHS_ROOT);

    for (const itemPath of paths) {
      const itemRoot = path.join(INPUT_PATHS_ROOT, itemPath);
      const itemFiles = await fs.readdir(itemRoot);

      if (itemFiles.indexOf(ENTRY_FILE_NAME) < 0) {
        throw Error(`Missing entry script for "${itemPath}" path`);
      }
      if (itemFiles.indexOf(TEMPLATE_FILE_NAME) < 0) {
        throw Error(`Missing HTML template for "${itemPath}" path`);
      }

      const entryPath = path.join(itemRoot, ENTRY_FILE_NAME);
      const templatePath = path.join(itemRoot, TEMPLATE_FILE_NAME).replace(/\\/g, '/'); // Windows path not supported by copy plugin
      const bundlePath = path.join(OUTPUT_ROOT, 'scripts', `${itemPath}.js`);
      const htmlPath = path.join(OUTPUT_ROOT, `${itemPath}.html`);

      configs.push({
        input: entryPath,
        output: {
          name: itemPath,
          file: bundlePath,
          format: 'iife'
        },
        plugins: [
          babel({
            exclude: 'node_modules/**',
            plugins: [
              [ '@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true } ],
              '@babel/plugin-proposal-class-properties'
            ]
          }),
          includePaths({
            paths: [ './' ]
          }),
          nodeResolve(),
          commonjs({
            sourceMap: false
          }),
          posthtmlTemplate({
            src: templatePath,
            dest: htmlPath
          })
        ]
      })
    }
  } catch (exc) {
    console.error(exc);
  }
};

export default generateConfig();