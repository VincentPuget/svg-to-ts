import { compile } from '../compiler/typescript-compiler';
import {
  generateExportStatement,
  generateInterfaceDefinition,
  generateSvgConstant,
  generateTypeDefinition,
  generateTypeHelperWithImport
} from '../generators/code-snippet-generators';
import { generateCompleteIconSetContent } from '../helpers/complete-icon-set.helper';
import { deleteFiles, deleteFolder, writeFile } from '../helpers/file-helpers';
import { error, info, separatorEnd, separatorStart, success } from '../helpers/log-helper';
import { getFilePathsFromRegex } from '../helpers/regex-helpers';
import { FileConversionOptions } from '../options/conversion-options';

import { filesProcessor } from './shared.converter';

export const convertToFiles = async (conversionOptions: FileConversionOptions): Promise<void> => {
  const {
    outputDirectory,
    modelFileName,
    additionalModelOutputPath,
    iconsFolderName,
    interfaceName,
    compileSources,
    exportCompleteIconSet,
    barrelFileName
  } = conversionOptions;

  try {
    await deleteFolder(`${outputDirectory}/${iconsFolderName}`);
    info(`deleting output directory: ${outputDirectory}/${iconsFolderName}`);

    separatorStart('File optimization');
    const svgDefinitions = await filesProcessor(conversionOptions);
    const generatedFileNames: string[] = [];

    await Promise.all(
      svgDefinitions.map(async svgDefinition => {
        const svgConstant = generateSvgConstant(svgDefinition.variableName, svgDefinition.typeName, svgDefinition.data);
        const generatedFileName = `${svgDefinition.prefix}-${svgDefinition.filenameWithoutEnding}.icon`;
        generatedFileNames.push(generatedFileName);
        await writeFile(`${outputDirectory}/${iconsFolderName}`, generatedFileName, svgConstant);
        info(`write file svg: ${outputDirectory}/${iconsFolderName}/${generatedFileName}.ts`);
      })
    );

    if (exportCompleteIconSet) {
      const completeIconSetContent = generateCompleteIconSetContent(svgDefinitions);
      const completeIconSetFileName = 'completeIconSet';
      await writeFile(`${outputDirectory}/${iconsFolderName}`, completeIconSetFileName, completeIconSetContent);
      generatedFileNames.push(completeIconSetFileName);
    }

    let indexFileContent = generateTypeHelperWithImport(interfaceName, iconsFolderName, modelFileName);
    indexFileContent += generatedFileNames
      .map((generatedFileName: string) => generateExportStatement(generatedFileName, iconsFolderName))
      .join('');
    separatorEnd();

    indexFileContent += generateExportStatement(modelFileName, iconsFolderName);
    await writeFile(outputDirectory, barrelFileName, indexFileContent);
    info(`write ${barrelFileName}.ts`);

    if (modelFileName) {
      const typeDefinition = generateTypeDefinition(conversionOptions, svgDefinitions);
      const interfaceDefinition = generateInterfaceDefinition(conversionOptions);
      const modelFile = `${typeDefinition}${interfaceDefinition}`;
      await writeFile(`${outputDirectory}/${iconsFolderName}`, modelFileName, modelFile);
      info(`model-file successfully generated under ${outputDirectory}/${iconsFolderName}/${modelFileName}.ts`);

      if (additionalModelOutputPath) {
        await writeFile(`${additionalModelOutputPath}`, modelFileName, modelFile);
        info(`additional model-file successfully generated under ${additionalModelOutputPath}/${modelFileName}.ts`);
      }
    }

    if (compileSources) {
      const generatedTypeScriptFilePaths = await getFilePathsFromRegex([
        `${outputDirectory}/${iconsFolderName}/*.ts`,
        `${outputDirectory}/${barrelFileName}.ts`
      ]);
      compile(generatedTypeScriptFilePaths);
      info(`compile Typescript - generate JS and d.ts`);
      deleteFiles(generatedTypeScriptFilePaths);
      info(`delete Typescript files`);
    }

    success('========================================================');
    success(`your files were successfully created under: ${outputDirectory}`);
    success(
      `don't forget to copy this folder to your dist in a post build script - enjoy your tree-shakable icon library 😎`
    );
    success('========================================================');
  } catch (exception) {
    error(`Something went wrong: ${exception}`);
    process.exit(1);
  }
};
