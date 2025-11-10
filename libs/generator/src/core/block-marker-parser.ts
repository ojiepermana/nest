/**
 * Block Marker Parser
 *
 * Parses generated files to extract custom code blocks and generated code blocks
 * Uses marker comments to identify sections
 */

export interface CodeBlock {
  type: 'custom' | 'generated';
  marker: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface ParsedFile {
  filePath: string;
  blocks: CodeBlock[];
  customBlocks: Map<string, CodeBlock>;
  generatedBlocks: Map<string, CodeBlock>;
  rawContent: string;
}

export class BlockMarkerParser {
  // Default markers
  private readonly customStartPattern =
    /\/\/\s*CUSTOM(?:_CODE)?_START:\s*(\S+)/;
  private readonly customEndPattern =
    /\/\/\s*CUSTOM(?:_CODE)?_END(?::\s*(\S+))?/;
  private readonly generatedStartPattern =
    /\/\/\s*GENERATED(?:_(?:CODE|METHOD|FILE))?(?:_START)?:\s*(\S+)/;
  private readonly generatedEndPattern =
    /\/\/\s*GENERATED(?:_(?:CODE|METHOD|FILE))?(?:_END)?(?::\s*(\S+))?/;

  /**
   * Parse file content and extract code blocks
   */
  parseFile(filePath: string, content: string): ParsedFile {
    const lines = content.split('\n');
    const blocks: CodeBlock[] = [];
    const customBlocks = new Map<string, CodeBlock>();
    const generatedBlocks = new Map<string, CodeBlock>();

    let currentBlock: Partial<CodeBlock> | null = null;
    let blockLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for custom block start
      const customStartMatch = line.match(this.customStartPattern);
      if (customStartMatch) {
        if (currentBlock) {
          // Close previous block if not properly closed
          this.finalizeBlock(
            currentBlock,
            blockLines,
            i,
            blocks,
            customBlocks,
            generatedBlocks,
          );
        }

        currentBlock = {
          type: 'custom',
          marker: customStartMatch[1],
          startLine: lineNumber,
        };
        blockLines = [];
        continue;
      }

      // Check for custom block end
      const customEndMatch = line.match(this.customEndPattern);
      if (customEndMatch && currentBlock?.type === 'custom') {
        currentBlock.endLine = lineNumber;
        currentBlock.content = blockLines.join('\n');

        const block = currentBlock as CodeBlock;
        blocks.push(block);
        customBlocks.set(block.marker, block);

        currentBlock = null;
        blockLines = [];
        continue;
      }

      // Check for generated block start
      const generatedStartMatch = line.match(this.generatedStartPattern);
      if (generatedStartMatch) {
        if (currentBlock) {
          this.finalizeBlock(
            currentBlock,
            blockLines,
            i,
            blocks,
            customBlocks,
            generatedBlocks,
          );
        }

        currentBlock = {
          type: 'generated',
          marker: generatedStartMatch[1],
          startLine: lineNumber,
        };
        blockLines = [];
        continue;
      }

      // Check for generated block end
      const generatedEndMatch = line.match(this.generatedEndPattern);
      if (generatedEndMatch && currentBlock?.type === 'generated') {
        currentBlock.endLine = lineNumber;
        currentBlock.content = blockLines.join('\n');

        const block = currentBlock as CodeBlock;
        blocks.push(block);
        generatedBlocks.set(block.marker, block);

        currentBlock = null;
        blockLines = [];
        continue;
      }

      // Accumulate lines for current block
      if (currentBlock) {
        blockLines.push(line);
      }
    }

    // Handle unclosed block
    if (currentBlock) {
      this.finalizeBlock(
        currentBlock,
        blockLines,
        lines.length,
        blocks,
        customBlocks,
        generatedBlocks,
      );
    }

    return {
      filePath,
      blocks,
      customBlocks,
      generatedBlocks,
      rawContent: content,
    };
  }

  /**
   * Finalize block that wasn't properly closed
   */
  private finalizeBlock(
    block: Partial<CodeBlock>,
    lines: string[],
    endIndex: number,
    blocks: CodeBlock[],
    customBlocks: Map<string, CodeBlock>,
    generatedBlocks: Map<string, CodeBlock>,
  ): void {
    if (!block.marker) return;

    block.endLine = endIndex;
    block.content = lines.join('\n');

    const finalBlock = block as CodeBlock;
    blocks.push(finalBlock);

    if (finalBlock.type === 'custom') {
      customBlocks.set(finalBlock.marker, finalBlock);
    } else if (finalBlock.type === 'generated') {
      generatedBlocks.set(finalBlock.marker, finalBlock);
    }
  }

  /**
   * Check if file has any custom code blocks
   */
  hasCustomCode(content: string): boolean {
    return this.customStartPattern.test(content);
  }

  /**
   * Extract only custom blocks from content
   */
  extractCustomBlocks(content: string): Map<string, string> {
    const parsed = this.parseFile('', content);
    const customCode = new Map<string, string>();

    parsed.customBlocks.forEach((block, marker) => {
      customCode.set(marker, block.content);
    });

    return customCode;
  }

  /**
   * Generate marker lines for a custom block
   */
  generateCustomBlockMarkers(blockName: string): {
    start: string;
    end: string;
  } {
    return {
      start: `// CUSTOM_CODE_START: ${blockName}`,
      end: `// CUSTOM_CODE_END: ${blockName}`,
    };
  }

  /**
   * Generate marker lines for a generated block
   */
  generateGeneratedBlockMarkers(blockName: string): {
    start: string;
    end: string;
  } {
    return {
      start: `// GENERATED_START: ${blockName}`,
      end: `// GENERATED_END: ${blockName}`,
    };
  }

  /**
   * Validate markers in content
   */
  validateMarkers(content: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const lines = content.split('\n');
    const openBlocks: { type: string; marker: string; line: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for start markers
      const customStart = line.match(this.customStartPattern);
      const generatedStart = line.match(this.generatedStartPattern);

      if (customStart) {
        openBlocks.push({
          type: 'custom',
          marker: customStart[1],
          line: lineNumber,
        });
      } else if (generatedStart) {
        openBlocks.push({
          type: 'generated',
          marker: generatedStart[1],
          line: lineNumber,
        });
      }

      // Check for end markers
      const customEnd = line.match(this.customEndPattern);
      const generatedEnd = line.match(this.generatedEndPattern);

      if (customEnd || generatedEnd) {
        const endType = customEnd ? 'custom' : 'generated';
        const endMarker = (customEnd || generatedEnd)![1];

        const lastOpen = openBlocks[openBlocks.length - 1];

        if (!lastOpen) {
          errors.push(`Line ${lineNumber}: End marker without start`);
        } else if (lastOpen.type !== endType) {
          errors.push(
            `Line ${lineNumber}: Mismatched block type (expected ${lastOpen.type}, got ${endType})`,
          );
        } else if (endMarker && endMarker !== lastOpen.marker) {
          errors.push(
            `Line ${lineNumber}: Mismatched marker name (expected ${lastOpen.marker}, got ${endMarker})`,
          );
        } else {
          openBlocks.pop();
        }
      }
    }

    // Check for unclosed blocks
    openBlocks.forEach((block) => {
      errors.push(
        `Line ${block.line}: Unclosed ${block.type} block '${block.marker}'`,
      );
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
