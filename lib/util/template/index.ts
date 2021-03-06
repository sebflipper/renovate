import is from '@sindresorhus/is';
import * as handlebars from 'handlebars';
import { logger } from '../../logger';
import { clone } from '../clone';

handlebars.registerHelper('encodeURIComponent', encodeURIComponent);

// istanbul ignore next
handlebars.registerHelper('replace', (find, replace, context) => {
  return context.replace(new RegExp(find, 'g'), replace);
});

export const exposedConfigOptions = [
  'branchName',
  'branchPrefix',
  'branchTopic',
  'commitMessage',
  'commitMessageAction',
  'commitMessageExtra',
  'commitMessagePrefix',
  'commitMessageSuffix',
  'commitMessageTopic',
  'group',
  'groupSlug',
  'groupName',
  'managerBranchPrefix',
  'prBodyColumns',
  'prBodyDefinitions',
  'prBodyNotes',
  'prTitle',
];

export const allowedFields = {
  baseDir: 'The full directory with path that the dependency has been found in',
  body: 'The body of the release notes',
  currentValue: 'The extracted current value of the dependency being updated',
  currentVersion: 'The current version that is being updated',
  datasource: 'The datasource used to look up the upgrade',
  depName: 'The name of the dependency being updated',
  depNameLinked:
    'The dependency name already linked to its home page using markdown',
  depNameSanitized:
    'The depName field sanitized for use in branches after removing spaces and special characters',
  depNameShort: 'Shortened depName',
  depType: 'The dependency type (if extracted - manager-dependent)',
  displayFrom: 'The current value, formatted for display',
  displayTo: 'The to value, formatted for display',
  fromVersion:
    'The version that would be currently installed. For example, if currentValue is ^3.0.0 then currentVersion might be 3.1.0.',
  hasReleaseNotes: 'true if the upgrade has release notes',
  isLockfileUpdate: 'true if the branch is a lock file update',
  isMajor: 'true if the upgrade is major',
  isPatch: 'true if the upgrade is a patch upgrade',
  isRange: 'true if the new value is a range',
  isSingleVersion:
    'true if the upgrade is to a single version rather than a range',
  logJSON: 'ChangeLogResult object for the upgrade',
  lookupName: 'The full name that was used to look up the dependency.',
  newDigest: 'The new digest value',
  newDigestShort:
    'A shorted version of newDigest, for use when the full digest is too long to be conveniently displayed',
  newMajor:
    'The major version of the new version. e.g. "3" if the new version if "3.1.0"',
  newMinor:
    'The minor version of the new version. e.g. "1" if the new version if "3.1.0"',
  newValue:
    'The new value in the upgrade. Can be a range or version e.g. "^3.0.0" or "3.1.0"',
  newVersion: 'The new version in the upgrade.',
  packageFile: 'The filename that the dependency was found in',
  parentDir:
    'The name of the directory that the dependency was found in, without full path',
  platform: 'VCS platform in use, e.g. "github", "gitlab", etc.',
  project: 'ChangeLogProject object',
  recreateClosed: 'If true, this PR will be recreated if closed',
  references: 'A list of references for the upgrade',
  releases: 'An array of releases for an upgrade',
  releaseNotes: 'A ChangeLogNotes object for the release',
  repository: 'The current repository',
  toVersion: 'The new version in the upgrade, e.g. "3.1.0"',
  updateType: 'One of digest, pin, rollback, patch, minor, major',
  upgrades: 'An array of upgrade objects in the branch',
  url: 'The url of the release notes',
  version: 'The version number of the changelog',
  versions: 'An array of ChangeLogRelease objects in the upgrade',
};

function getFilteredObject(input: any): any {
  const obj = clone(input);
  const res = {};
  const allAllowed = [
    ...Object.keys(allowedFields),
    ...exposedConfigOptions,
  ].sort();
  for (const field of allAllowed) {
    const value = obj[field];
    if (is.array(value)) {
      res[field] = value.map((element) => getFilteredObject(element));
    } else if (is.object(value)) {
      res[field] = getFilteredObject(value);
    } else if (!is.undefined(value)) {
      res[field] = value;
    }
  }
  return res;
}

export function compile(
  template: string,
  input: any,
  filterFields = true
): string {
  const filteredInput = filterFields ? getFilteredObject(input) : input;
  logger.trace({ template, filteredInput }, 'Compiling template');
  return handlebars.compile(template)(input);
}
