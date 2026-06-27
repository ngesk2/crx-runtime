/**
 * Constitutional Registry Loader
 * 
 * Parses Markdown constitutional rules and produces normalized constitutional rules.
 * 
 * Every rule contains:
 * - Document
 * - Section
 * - Paragraph
 * - Exact Quote
 * - Hash
 * - Version
 * 
 * This enables rule provenance and reproducible audits.
 */

import { SymbolID } from '../ir/node-types';

/**
 * Constitutional Rule
 */
export interface ConstitutionalRule {
  id: SymbolID;
  document: string;
  section: string;
  paragraph: string;
  exactQuote: string;
  hash: string;
  version: string;
  ruleType: RuleType;
  authority: SymbolID;
  capability?: SymbolID;
  obligation: string;
  prohibition?: string;
  permission?: string;
  evidence: SymbolID[];
}

/**
 * Rule Type
 */
export enum RuleType {
  Ownership = 'Ownership',
  Capability = 'Capability',
  Persistence = 'Persistence',
  Trust = 'Trust',
  Identity = 'Identity',
  Event = 'Event',
  Mutation = 'Mutation',
  Construction = 'Construction',
  Boundary = 'Boundary',
  Lifecycle = 'Lifecycle',
}

/**
 * Constitutional Document
 */
export interface ConstitutionalDocument {
  id: SymbolID;
  name: string;
  version: string;
  hash: string;
  rules: ConstitutionalRule[];
  sections: Map<string, ConstitutionalSection>;
}

/**
 * Constitutional Section
 */
export interface ConstitutionalSection {
  id: SymbolID;
  name: string;
  document: SymbolID;
  paragraphs: Map<string, ConstitutionalParagraph>;
}

/**
 * Constitutional Paragraph
 */
export interface ConstitutionalParagraph {
  id: SymbolID;
  section: SymbolID;
  text: string;
  rules: ConstitutionalRule[];
}

/**
 * Constitutional Registry Loader
 */
export class ConstitutionalRegistryLoader {
  private documents: Map<SymbolID, ConstitutionalDocument> = new Map();
  private rules: Map<SymbolID, ConstitutionalRule> = new Map();
  private ruleIndex: Map<string, SymbolID> = new Map();

  /**
   * Load constitutional rules from Markdown
   */
  async loadFromMarkdown(markdown: string): Promise<ConstitutionalDocument> {
    const document = this.parseMarkdown(markdown);
    this.documents.set(document.id, document);
    
    for (const rule of document.rules) {
      this.rules.set(rule.id, rule);
      this.ruleIndex.set(rule.hash, rule.id);
    }
    
    return document;
  }

  /**
   * Load constitutional rules from file
   */
  async loadFromFile(filePath: string): Promise<ConstitutionalDocument> {
    // TODO: Implement file reading
    throw new Error('File loading not yet implemented');
  }

  /**
   * Load constitutional rules from directory
   */
  async loadFromDirectory(directoryPath: string): Promise<ConstitutionalDocument[]> {
    // TODO: Implement directory loading
    throw new Error('Directory loading not yet implemented');
  }

  /**
   * Parse Markdown into constitutional document
   */
  private parseMarkdown(markdown: string): ConstitutionalDocument {
    const lines = markdown.split('\n');
    const documentId = this.generateDocumentId(markdown);
    const documentVersion = this.extractVersion(lines);
    const documentHash = this.hashContent(markdown);
    
    const sections = this.parseSections(lines, documentId);
    const rules = this.extractRules(sections, documentId, documentVersion);
    
    const document: ConstitutionalDocument = {
      id: documentId,
      name: this.extractDocumentName(lines),
      version: documentVersion,
      hash: documentHash,
      rules,
      sections,
    };
    
    return document;
  }

  /**
   * Generate document ID
   */
  private generateDocumentId(content: string): SymbolID {
    return this.hashContent(content);
  }

  /**
   * Extract version from Markdown
   */
  private extractVersion(lines: string[]): string {
    for (const line of lines) {
      if (line.startsWith('Version:')) {
        return line.replace('Version:', '').trim();
      }
    }
    return '1.0.0';
  }

  /**
   * Extract document name
   */
  private extractDocumentName(lines: string[]): string {
    for (const line of lines) {
      if (line.startsWith('# ')) {
        return line.replace('# ', '').trim();
      }
    }
    return 'Unnamed Document';
  }

  /**
   * Parse sections from Markdown
   */
  private parseSections(lines: string[], documentId: SymbolID): Map<string, ConstitutionalSection> {
    const sections = new Map<string, ConstitutionalSection>();
    let currentSection: ConstitutionalSection | null = null;
    let sectionId = 0;
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        const sectionName = line.replace('## ', '').trim();
        const id = `${documentId}-section-${sectionId++}`;
        
        currentSection = {
          id,
          name: sectionName,
          document: documentId,
          paragraphs: new Map<string, ConstitutionalParagraph>(),
        };
        
        sections.set(id, currentSection);
      }
    }
    
    return sections;
  }

  /**
   * Extract rules from sections
   */
  private extractRules(
    sections: Map<string, ConstitutionalSection>,
    documentId: SymbolID,
    documentVersion: string
  ): ConstitutionalRule[] {
    const rules: ConstitutionalRule[] = [];
    let ruleId = 0;
    
    for (const section of sections.values()) {
      // TODO: Parse rules from section content
      // For now, create placeholder rules
      const rule: ConstitutionalRule = {
        id: `${documentId}-rule-${ruleId++}`,
        document: documentId,
        section: section.id,
        paragraph: section.id,
        exactQuote: section.name,
        hash: this.hashContent(section.name),
        version: documentVersion,
        ruleType: RuleType.Ownership,
        authority: documentId,
        obligation: section.name,
        evidence: [],
      };
      
      rules.push(rule);
    }
    
    return rules;
  }

  /**
   * Hash content
   */
  private hashContent(content: string): string {
    let hash = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Get rule by ID
   */
  getRule(id: SymbolID): ConstitutionalRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Get rule by hash
   */
  getRuleByHash(hash: string): ConstitutionalRule | undefined {
    const id = this.ruleIndex.get(hash);
    if (!id) return undefined;
    return this.rules.get(id);
  }

  /**
   * Get rules by document
   */
  getRulesByDocument(documentId: SymbolID): ConstitutionalRule[] {
    const results: ConstitutionalRule[] = [];
    
    for (const rule of this.rules.values()) {
      if (rule.document === documentId) {
        results.push(rule);
      }
    }
    
    return results;
  }

  /**
   * Get rules by type
   */
  getRulesByType(type: RuleType): ConstitutionalRule[] {
    const results: ConstitutionalRule[] = [];
    
    for (const rule of this.rules.values()) {
      if (rule.ruleType === type) {
        results.push(rule);
      }
    }
    
    return results;
  }

  /**
   * Get rules by authority
   */
  getRulesByAuthority(authority: SymbolID): ConstitutionalRule[] {
    const results: ConstitutionalRule[] = [];
    
    for (const rule of this.rules.values()) {
      if (rule.authority === authority) {
        results.push(rule);
      }
    }
    
    return results;
  }

  /**
   * Get document by ID
   */
  getDocument(id: SymbolID): ConstitutionalDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Get all documents
   */
  getAllDocuments(): ConstitutionalDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Get all rules
   */
  getAllRules(): ConstitutionalRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Merge rules from another loader
   */
  merge(other: ConstitutionalRegistryLoader): void {
    for (const document of other.getAllDocuments()) {
      this.documents.set(document.id, document);
    }
    
    for (const rule of other.getAllRules()) {
      this.rules.set(rule.id, rule);
      this.ruleIndex.set(rule.hash, rule.id);
    }
  }

  /**
   * Clear all rules
   */
  clear(): void {
    this.documents.clear();
    this.rules.clear();
    this.ruleIndex.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalDocuments: number;
    totalRules: number;
    byType: Record<RuleType, number>;
  } {
    const byType: Record<RuleType, number> = {} as any;

    for (const rule of this.rules.values()) {
      byType[rule.ruleType] = (byType[rule.ruleType] || 0) + 1;
    }

    return {
      totalDocuments: this.documents.size,
      totalRules: this.rules.size,
      byType,
    };
  }
}
