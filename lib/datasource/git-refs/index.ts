import simpleGit from 'simple-git/promise';
import { logger } from '../../logger';
import * as semver from '../../versioning/semver';
import { GetReleasesConfig, ReleaseResult } from '../common';

export const id = 'git-refs';

const cacheMinutes = 10;

// git will prompt for known hosts or passwords, unless we activate BatchMode
process.env.GIT_SSH_COMMAND = 'ssh -o BatchMode=yes';

export interface RawRefs {
  type: string;
  value: string;
  hash: string;
}

export async function getRawRefs({
  lookupName,
}: GetReleasesConfig): Promise<RawRefs[] | null> {
  const git = simpleGit();
  try {
    const cacheNamespace = 'git-raw-refs';

    const cachedResult = await renovateCache.get<RawRefs[]>(
      cacheNamespace,
      lookupName
    );
    /* istanbul ignore next line */
    if (cachedResult) {
      return cachedResult;
    }

    // fetch remote tags
    const lsRemote = await git.listRemote([
      '--tags',
      '--heads',
      '--refs',
      lookupName,
    ]);

    if (!lsRemote) {
      return null;
    }

    const refMatch = /(?<hash>.*?)\s+refs\/(?<type>.*?)\/(?<value>.*)/;

    const refs = lsRemote
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .map((line) => {
        const match = refMatch.exec(line);
        if (!match) {
          return null;
        }
        return {
          type: match.groups.type,
          value: match.groups.value,
          hash: match.groups.hash,
        };
      })
      .filter(Boolean);

    await renovateCache.set(cacheNamespace, lookupName, refs, cacheMinutes);
    return refs;
  } catch (err) {
    logger.error({ err }, `Git-Raw-Refs lookup error in ${lookupName}`);
  }
  return null;
}

export async function getReleases({
  lookupName,
}: GetReleasesConfig): Promise<ReleaseResult | null> {
  try {
    const rawRefs: RawRefs[] = await getRawRefs({ lookupName });

    const refs = rawRefs
      .filter((ref) => ref.type === 'tags' || ref.type === 'heads')
      .map((ref) => ref.value)
      .filter((ref) => semver.isVersion(ref));

    const uniqueRefs = [...new Set(refs)];

    const sourceUrl = lookupName.replace(/\.git$/, '').replace(/\/$/, '');

    const result: ReleaseResult = {
      sourceUrl,
      releases: uniqueRefs.map((ref) => ({
        version: ref,
        gitRef: ref,
        newDigest: rawRefs.find((rawRef) => rawRef.value === ref).hash,
      })),
    };

    return result;
  } catch (err) {
    logger.error({ err }, `Git-Refs lookup error in ${lookupName}`);
  }
  return null;
}
