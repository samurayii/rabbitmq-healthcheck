import { program } from "commander";
//import * as chalk from "chalk";
//import * as fs from "fs";
//import * as path from "path";
import * as finder from "find-package-json";
//import * as Ajv from "ajv";
//import jtomler from "jtomler";
//import json_from_schema from "json-from-default-schema";
//import * as config_schema from "./schemes/config.json";
 
const pkg = finder(__dirname).next().value;

const config = {};

program.version(`version: ${pkg.version}`, "-v, --version", "output the current version.");
program.name(pkg.name);
program.option("-c, --config <type>", "Path to config file. If not set, searching configuration in package.json file.");

program.parse(process.argv);


/*
const ajv = new Ajv();
const validate = ajv.compile(config_schema);

if (!validate(config)) {
    console.error(chalk.red(`[ERROR] Schema errors:\n${JSON.stringify(validate.errors, null, 2)}`));
    process.exit(1);
}
*/

export default config;
