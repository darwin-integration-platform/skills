import { describe, it, expect } from 'vitest';
import { parseSource } from './source-parser.js';

describe('source-parser', () => {
  describe('GitLab Custom Domains & Subgroups', () => {
    it('parses custom gitlab domain with deep subgroup paths', () => {
      const result = parseSource('https://git.corp.com/group/subgroup/project/-/tree/main/src');
      expect(result).toEqual({
        type: 'gitlab',
        url: 'https://git.corp.com/group/subgroup/project.git',
        ref: 'main',
        subpath: 'src',
      });
    });

    it('parses gitlab tree with branch but no path', () => {
      const result = parseSource('https://gitlab.example.com/org/repo/-/tree/v1.0');
      expect(result).toEqual({
        type: 'gitlab',
        url: 'https://gitlab.example.com/org/repo.git',
        ref: 'v1.0',
      });
    });

    it('parses custom gitlab domain with port number', () => {
      const result = parseSource('https://git.corp.com:8443/group/repo/-/tree/main');
      expect(result).toMatchObject({
        type: 'gitlab',
        url: 'https://git.corp.com:8443/group/repo.git',
        ref: 'main',
      });
    });

    it('parses http protocol (non-ssl)', () => {
      const result = parseSource('http://git.local/group/repo/-/tree/dev');
      expect(result).toMatchObject({
        type: 'gitlab',
        url: 'http://git.local/group/repo.git',
      });
    });

    it('parses personal project path (~user)', () => {
      const result = parseSource('https://gitlab.com/~user/project/-/tree/main');
      expect(result).toMatchObject({
        type: 'gitlab',
        url: 'https://gitlab.com/~user/project.git',
      });
    });
  });

  describe('Simplified Git Strategy', () => {
    it('treats custom domains with .git as generic git', () => {
      const result = parseSource('https://git.mycompany.com/my-group/my-repo.git');
      expect(result).toEqual({
        type: 'git',
        url: 'https://git.mycompany.com/my-group/my-repo.git',
      });
    });

    it('prevents false positives for generic URLs (falls through to well-known)', () => {
      const result = parseSource('https://google.com/search/result');
      expect(result.type).toBe('well-known');
      expect(result.url).toBe('https://google.com/search/result');
    });

    it('retains official gitlab.com parsing for convenience', () => {
      const result = parseSource('https://gitlab.com/owner/repo');
      expect(result).toEqual({
        type: 'gitlab',
        url: 'https://gitlab.com/owner/repo.git',
      });
    });
  });

  describe('Azure DevOps Support', () => {
    it('parses modern dev.azure.com URL', () => {
      const result = parseSource('https://dev.azure.com/myorg/myproject/_git/myrepo');
      expect(result).toEqual({
        type: 'azure-devops',
        url: 'https://dev.azure.com/myorg/myproject/_git/myrepo',
        ref: undefined,
        subpath: undefined,
      });
    });

    it('parses dev.azure.com URL with branch (GB prefix)', () => {
      const result = parseSource(
        'https://dev.azure.com/myorg/myproject/_git/myrepo?version=GBmain'
      );
      expect(result).toMatchObject({
        type: 'azure-devops',
        url: 'https://dev.azure.com/myorg/myproject/_git/myrepo',
        ref: 'main',
      });
    });

    it('parses dev.azure.com URL with path and branch', () => {
      const result = parseSource(
        'https://dev.azure.com/myorg/myproject/_git/myrepo?path=/skills&version=GBmain'
      );
      expect(result).toMatchObject({
        type: 'azure-devops',
        url: 'https://dev.azure.com/myorg/myproject/_git/myrepo',
        ref: 'main',
        subpath: 'skills',
      });
    });

    it('parses legacy visualstudio.com URL', () => {
      const result = parseSource('https://myorg.visualstudio.com/myproject/_git/myrepo');
      expect(result).toMatchObject({
        type: 'azure-devops',
        url: 'https://myorg.visualstudio.com/myproject/_git/myrepo',
      });
    });

    it('parses azdo: shorthand', () => {
      const result = parseSource('azdo:myorg/myproject/myrepo');
      expect(result).toEqual({
        type: 'azure-devops',
        url: 'https://dev.azure.com/myorg/myproject/_git/myrepo',
      });
    });
  });

  describe('Existing GitHub Support', () => {
    it('parses github shorthand', () => {
      const result = parseSource('vercel-labs/agent-skills');
      expect(result).toEqual({
        type: 'github',
        url: 'https://github.com/vercel-labs/agent-skills.git',
        subpath: undefined,
      });
    });

    it('parses github full URL', () => {
      const result = parseSource('https://github.com/owner/repo/tree/main/path');
      expect(result).toEqual({
        type: 'github',
        url: 'https://github.com/owner/repo.git',
        ref: 'main',
        subpath: 'path',
      });
    });
  });
});
