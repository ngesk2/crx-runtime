/**
 * Markdown Parser
 * 
 * Phase 3 Refactor — Markdown Parsing
 * 
 * Replace handwritten markdown parsing with markdown-it.
 * 
 * Extract:
 * - headings
 * - hierarchy
 * - fenced code blocks
 * - lists
 * - tables
 */

const MarkdownIt = require('markdown-it');

class MarkdownParser {
  constructor(config = {}) {
    this._md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });
  }

  /**
   * Parse markdown content
   */
  parse(content) {
    const tokens = this._md.parse(content, {});
    
    return {
      headings: this._extractHeadings(tokens),
      codeBlocks: this._extractCodeBlocks(tokens),
      lists: this._extractLists(tokens),
      tables: this._extractTables(tokens),
      links: this._extractLinks(tokens),
      plainText: this._extractPlainText(tokens)
    };
  }

  /**
   * Extract headings with hierarchy
   */
  _extractHeadings(tokens) {
    const headings = [];
    const stack = [];

    for (const token of tokens) {
      if (token.type === 'heading_open') {
        const level = parseInt(token.tag.replace('h', ''));
        const heading = {
          level: level,
          text: '',
          children: []
        };

        // Find parent
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length > 0) {
          stack[stack.length - 1].children.push(heading);
        } else {
          headings.push(heading);
        }

        stack.push(heading);
      } else if (token.type === 'inline' && stack.length > 0) {
        const currentHeading = stack[stack.length - 1];
        currentHeading.text += this._renderInline(token);
      } else if (token.type === 'heading_close') {
        stack.pop();
      }
    }

    return headings;
  }

  /**
   * Extract fenced code blocks
   */
  _extractCodeBlocks(tokens) {
    const codeBlocks = [];
    let inCodeBlock = false;
    let currentBlock = null;

    for (const token of tokens) {
      if (token.type === 'fence') {
        codeBlocks.push({
          language: token.info || '',
          code: token.content
        });
      } else if (token.type === 'code_block') {
        codeBlocks.push({
          language: '',
          code: token.content
        });
      }
    }

    return codeBlocks;
  }

  /**
   * Extract lists
   */
  _extractLists(tokens) {
    const lists = [];
    let currentList = null;
    let currentItem = null;

    for (const token of tokens) {
      if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
        currentList = {
          type: token.type.replace('_open', ''),
          items: []
        };
        lists.push(currentList);
      } else if (token.type === 'list_item_open') {
        currentItem = {
          text: ''
        };
        currentList.items.push(currentItem);
      } else if (token.type === 'inline' && currentItem) {
        currentItem.text += this._renderInline(token);
      } else if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
        currentList = null;
        currentItem = null;
      }
    }

    return lists;
  }

  /**
   * Extract tables
   */
  _extractTables(tokens) {
    const tables = [];
    let currentTable = null;
    let currentRow = null;
    let inHeader = false;

    for (const token of tokens) {
      if (token.type === 'table_open') {
        currentTable = {
          headers: [],
          rows: []
        };
        inHeader = true;
      } else if (token.type === 'thead_open') {
        inHeader = true;
      } else if (token.type === 'thead_close') {
        inHeader = false;
      } else if (token.type === 'tr_open') {
        currentRow = [];
        if (inHeader) {
          currentTable.headers = currentRow;
        } else {
          currentTable.rows.push(currentRow);
        }
      } else if (token.type === 'inline') {
        currentRow.push(this._renderInline(token));
      } else if (token.type === 'table_close') {
        tables.push(currentTable);
        currentTable = null;
        currentRow = null;
      }
    }

    return tables;
  }

  /**
   * Extract links
   */
  _extractLinks(tokens) {
    const links = [];

    for (const token of tokens) {
      if (token.type === 'inline') {
        for (const child of token.children) {
          if (child.type === 'link_open') {
            links.push({
              href: child.attrGet('href'),
              title: child.attrGet('title') || ''
            });
          }
        }
      }
    }

    return links;
  }

  /**
   * Extract plain text
   */
  _extractPlainText(tokens) {
    let text = '';

    for (const token of tokens) {
      if (token.type === 'inline') {
        text += this._renderInline(token) + '\n';
      } else if (token.type === 'paragraph_open') {
        text += '\n';
      } else if (token.type === 'heading_open') {
        text += '\n';
      }
    }

    return text.trim();
  }

  /**
   * Render inline tokens
   */
  _renderInline(token) {
    let text = '';

    for (const child of token.children) {
      if (child.type === 'text') {
        text += child.content;
      } else if (child.type === 'code_inline') {
        text += child.content;
      } else if (child.type === 'softbreak') {
        text += ' ';
      } else if (child.type === 'hardbreak') {
        text += '\n';
      }
    }

    return text;
  }

  /**
   * Chunk markdown by headings
   */
  chunkByHeadings(content) {
    const parsed = this.parse(content);
    const chunks = [];

    const processHeading = (heading, parentText = '') => {
      const text = parentText + heading.text;
      
      if (text.length >= 50) {
        chunks.push({
          text: text,
          type: 'markdown',
          heading: heading.text,
          level: heading.level
        });
      }

      // Process children
      for (const child of heading.children) {
        processHeading(child, text + '\n\n');
      }
    };

    for (const heading of parsed.headings) {
      processHeading(heading);
    }

    // If no headings, return entire content as one chunk
    if (chunks.length === 0) {
      chunks.push({
        text: parsed.plainText,
        type: 'markdown'
      });
    }

    return chunks;
  }
}

module.exports = { MarkdownParser };
