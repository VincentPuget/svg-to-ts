#!/usr/bin/env node
import { convertToSingleFile } from '../lib/converters/single-file.converter';
import { convertToMultipleFiles } from '../lib/converters/multiple-files.converter';
import { getOptions, MultiFileConvertionOptions, SingleFileConvertionOptions } from '../lib/options/convertion-options';
import { printLogo } from '../lib/helpers/log-helper';
import { setupCommander } from '../lib/options/args-collector';

(async () => {
  setupCommander();
  printLogo();
  const convertionOptions = await getOptions();

  for (const options of convertionOptions) {
    if (options.optimizeForLazyLoading) {
      await convertToMultipleFiles(options as MultiFileConvertionOptions);
    } else {
      await convertToSingleFile(options as SingleFileConvertionOptions);
    }
  }
})();
