/**
 * Code Merge Service
 *
 * Merges custom code blocks with newly generated code
 * Preserves custom modifications during regeneration
 */

import { BlockMarkerParser, type ParsedFile, type CodeBlock } from './block-marker-parser';
import { calculateChecksum } from '../utils/string.util';
import { Logger } from '../utils/logger.util';

export interface MergeResult {
  success: boolean;
  mergedContent: string;
  conflicts: MergeConflict[];
  customBlocksPreserved: number;
  generatedBlocksUpdated: number;
}

export interface MergeConflict {
  blockName: string;
  type: 'missing_marker' | 'checksum_mismatch' | 'duplicate_marker';
  message: string;
  oldContent?: string;
  newContent?: string;
}

export interface ChecksumRecord {
  blockName: string;
  checksum: string;
  lastModified: Date;
}

export class CodeMergeService {
  private parser: BlockMarkerParser;
  private checksums: Map<string, Map<string, ChecksumRecord>>;

  constructor() {
    this.parser = new BlockMarkerParser();
    this.checksums = new Map(); // filePath -> (blockName -> ChecksumRecord)
  }

  /**
   * Merge existing file with new generated content
   */
  async merge(existingContent: string, newContent: string, filePath: string): Promise<MergeResult> {
    const result: MergeResult = {
      success: true,
      mergedContent: '',
      conflicts: [],
      customBlocksPreserved: 0,
      generatedBlocksUpdated: 0,
    };

    try {
      // Parse both files
      const existing = this.parser.parseFile(filePath, existingContent);
      const newFile = this.parser.parseFile(filePath, newContent);

      // Validate markers
      const validation = this.parser.validateMarkers(newContent);
      if (!validation.valid) {
        Logger.warn(`Invalid markers in new content for ${filePath}:`);
        validation.errors.forEach((error) => Logger.warn(`  ${error}`));
      }

      // Extract custom blocks from existing file
      const customCode = existing.customBlocks;

      // Build merged content
      const mergedLines: string[] = [];
      const newLines = newContent.split('\n');
      let inGeneratedBlock = false;
      let currentBlockMarker: string | null = null;

      for (let i = 0; i < newLines.length; i++) {
        const line = newLines[i];

        // Check if we're entering a custom block
        const customStartMatch = line.match(/\/\/\s*CUSTOM(?:_CODE)?_START:\s*(\S+)/);
        if (customStartMatch) {
          const marker = customStartMatch[1];
          mergedLines.push(line); // Add start marker

          // Check if we have custom code for this marker
          const customBlock = customCode.get(marker);
          if (customBlock) {
            // Preserve custom code
            mergedLines.push(customBlock.content);
            result.customBlocksPreserved++;
            Logger.debug(`Preserved custom block: ${marker}`);
          } else {
            // No existing custom code, use template
            Logger.debug(`New custom block (empty): ${marker}`);
          }

          // Skip to end marker in new content
          i = this.findBlockEnd(newLines, i, /\/\/\s*CUSTOM(?:_CODE)?_END/);
          mergedLines.push(newLines[i]); // Add end marker
          continue;
        }

        // Check if we're entering a generated block
        const generatedStartMatch = line.match(
          /\/\/\s*GENERATED(?:_(?:CODE|METHOD|FILE))?(?:_START)?:\s*(\S+)/,
        );
        if (generatedStartMatch) {
          inGeneratedBlock = true;
          currentBlockMarker = generatedStartMatch[1];
          result.generatedBlocksUpdated++;
        }

        // Check if we're leaving a generated block
        const generatedEndMatch = line.match(/\/\/\s*GENERATED(?:_(?:CODE|METHOD|FILE))?(?:_END)?/);
        if (generatedEndMatch) {
          inGeneratedBlock = false;
          currentBlockMarker = null;
        }

        mergedLines.push(line);
      }

      result.mergedContent = mergedLines.join('\n');

      // Check for conflicts (custom blocks in old file but not in new)
      customCode.forEach((block, marker) => {
        if (!newFile.customBlocks.has(marker)) {
          result.conflicts.push({
            blockName: marker,
            type: 'missing_marker',
            message: `Custom block '${marker}' exists in old file but not in new template`,
            oldContent: block.content,
          });
          result.success = false;
        }
      });

      if (result.conflicts.length > 0) {
        Logger.warn(`Merge completed with ${result.conflicts.length} conflicts`);
      } else {
        Logger.success(`Merge successful: ${result.customBlocksPreserved} custom blocks preserved`);
      }

      return result;
    } catch (error) {
      Logger.error('Merge failed', error as Error);
      result.success = false;
      result.conflicts.push({
        blockName: 'merge',
        type: 'missing_marker',
        message: (error as Error).message,
      });
      return result;
    }
  }

  /**
   * Find end marker for a block
   */
  private findBlockEnd(lines: string[], startIndex: number, endPattern: RegExp): number {
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (endPattern.test(lines[i])) {
        return i;
      }
    }
    return lines.length - 1;
  }

  /**
   * Calculate and store checksum for a file's blocks
   */
  storeChecksums(filePath: string, content: string): void {
    const parsed = this.parser.parseFile(filePath, content);
    const fileChecksums = new Map<string, ChecksumRecord>();

    // Calculate checksums for all generated blocks
    parsed.generatedBlocks.forEach((block, marker) => {
      const checksum = calculateChecksum(block.content);
      fileChecksums.set(marker, {
        blockName: marker,
        checksum,
        lastModified: new Date(),
      });
    });

    this.checksums.set(filePath, fileChecksums);
    Logger.debug(`Stored ${fileChecksums.size} checksums for ${filePath}`);
  }

  /**
   * Check if generated blocks have been modified
   */
  detectModifications(
    filePath: string,
    content: string,
  ): {
    modified: boolean;
    modifiedBlocks: string[];
  } {
    const parsed = this.parser.parseFile(filePath, content);
    const storedChecksums = this.checksums.get(filePath);
    const modifiedBlocks: string[] = [];

    if (!storedChecksums) {
      return { modified: false, modifiedBlocks: [] };
    }

    parsed.generatedBlocks.forEach((block, marker) => {
      const stored = storedChecksums.get(marker);
      if (stored) {
        const currentChecksum = calculateChecksum(block.content);
        if (currentChecksum !== stored.checksum) {
          modifiedBlocks.push(marker);
        }
      }
    });

    return {
      modified: modifiedBlocks.length > 0,
      modifiedBlocks,
    };
  }

  /**
   * Extract custom code from file
   */
  extractCustomCode(content: string): Map<string, string> {
    return this.parser.extractCustomBlocks(content);
  }

  /**
   * Check if file has custom code
   */
  hasCustomCode(content: string): boolean {
    return this.parser.hasCustomCode(content);
  }

  /**
   * Get merge statistics
   */
  getMergeStatistics(
    filePath: string,
    existingContent: string,
    newContent: string,
  ): {
    totalBlocks: number;
    customBlocks: number;
    generatedBlocks: number;
    conflictingBlocks: number;
  } {
    const existing = this.parser.parseFile(filePath, existingContent);
    const newFile = this.parser.parseFile(filePath, newContent);

    const conflictingBlocks = Array.from(existing.customBlocks.keys()).filter(
      (marker) => !newFile.customBlocks.has(marker),
    ).length;

    return {
      totalBlocks: newFile.blocks.length,
      customBlocks: newFile.customBlocks.size,
      generatedBlocks: newFile.generatedBlocks.size,
      conflictingBlocks,
    };
  }

  /**
   * Clear stored checksums for file
   */
  clearChecksums(filePath?: string): void {
    if (filePath) {
      this.checksums.delete(filePath);
      Logger.debug(`Cleared checksums for ${filePath}`);
    } else {
      this.checksums.clear();
      Logger.debug('Cleared all checksums');
    }
  }

  /**
   * Get all stored checksums
   */
  getStoredChecksums(): Map<string, Map<string, ChecksumRecord>> {
    return this.checksums;
  }
}
