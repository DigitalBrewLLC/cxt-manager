import * as fs from 'fs-extra';
import * as path from 'path';
import { HealthStatus, HealthIssue, ContentQualityThresholds, ContentStatus } from './types';

export class ValidationEngine {
  private cxtPath: string;
  private contentThresholds: ContentQualityThresholds;

  constructor(cxtPath: string, contentThresholds?: ContentQualityThresholds) {
    this.cxtPath = cxtPath;
    // Default thresholds if not provided
    this.contentThresholds = contentThresholds || {
      min_content_length: 100,
      min_content_lines: 3,
      empty_section_warning: true,
      short_content_warning: 200
    };
  }

  async checkHealth(quick: boolean = false): Promise<HealthStatus> {
    const issues: HealthIssue[] = [];
    const suggestions: string[] = [];

    // Load all context files
    const contextFiles = await this.loadContextFiles();

    // Check for basic issues
    const basicIssues = await this.checkCommonIssues(contextFiles);
    issues.push(...basicIssues);

    // In quick mode, skip outdated info check (faster)
    if (!quick) {
      // Check for outdated information
      const outdatedIssues = await this.checkOutdatedInfo(contextFiles);
      issues.push(...outdatedIssues);
    }

    // Generate suggestions
    const healthSuggestions = this.generateSuggestions(issues);
    suggestions.push(...healthSuggestions);

    // Determine overall health
    let overall: 'healthy' | 'warning' | 'error' = 'healthy';
    if (issues.some(i => i.type === 'error')) {
      overall = 'error';
    } else if (issues.length > 0) {
      overall = 'warning';
    }

    return {
      overall,
      lastChecked: new Date(),
      issues,
      suggestions
      // alignments: Reserved for future MCP/agent integration with semantic understanding
    };
  }

  private async loadContextFiles(): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    const fileNames = ['context.md', 'plan.md', 'guardrail.md'];

    for (const fileName of fileNames) {
      const filePath = path.join(this.cxtPath, fileName);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf-8');
        files.set(fileName, content);
      }
    }

    return files;
  }

  private async checkCommonIssues(contextFiles: Map<string, string>): Promise<HealthIssue[]> {
    const issues: HealthIssue[] = [];

    // Check content quality with configurable thresholds
    const MIN_LENGTH = this.contentThresholds.min_content_length;
    const MIN_LINES = this.contentThresholds.min_content_lines;
    const SHORT_WARNING = this.contentThresholds.short_content_warning;
    const WARN_EMPTY_SECTIONS = this.contentThresholds.empty_section_warning;
    
    for (const [fileName, content] of contextFiles) {
      const quality = this.analyzeContentQuality(content, fileName);
      const filePurpose = this.getFilePurpose(fileName);
      
      // Check if file is empty
      if (quality.status === 'empty') {
        issues.push({
          type: 'error',
          file: fileName,
          message: 'File is empty or contains only structure',
          suggestion: `Add content to ${fileName} to document ${filePurpose}.`,
          autoFixable: false
        });
      }
      // Check if content is too short
      else if (quality.status === 'short' || quality.contentLength < MIN_LENGTH) {
        const severity = quality.contentLength < MIN_LENGTH ? 'error' : 'warning';
        issues.push({
          type: severity,
          file: fileName,
          message: `File has very little content (${quality.contentLength} characters, ${quality.contentLines} lines)`,
          suggestion: `Consider adding more content to ${fileName}. Minimum recommended: ${MIN_LENGTH} characters, ${MIN_LINES} lines.`,
          autoFixable: false
        });
      }
      // Check for empty sections in template mode
      else if (WARN_EMPTY_SECTIONS && quality.emptySections && quality.emptySections > 0) {
        issues.push({
          type: 'warning',
          file: fileName,
          message: `File has ${quality.emptySections} empty section(s)`,
          suggestion: `Consider filling in the empty sections in ${fileName} to make it more complete.`,
          autoFixable: false
        });
      }
      // Warn if content is below short_content_warning threshold
      else if (quality.contentLength < SHORT_WARNING && quality.status === 'populated') {
        issues.push({
          type: 'warning',
          file: fileName,
          message: `File content is relatively short (${quality.contentLength} characters)`,
          suggestion: `Consider expanding ${fileName} with more details about ${filePurpose}.`,
          autoFixable: false
        });
      }
    }

    return issues;
  }

  /**
   * Analyze content quality - detect empty, short, or populated content
   */
  private analyzeContentQuality(content: string, fileName: string): {
    status: ContentStatus;
    contentLength: number;
    contentLines: number;
    emptySections?: number;
  } {
    if (!content || content.trim().length === 0) {
      return { status: 'empty', contentLength: 0, contentLines: 0 };
    }

    const lines = content.split('\n');
    let contentLength = 0;
    let contentLines: string[] = [];
    let emptySections = 0;
    let inSection = false;
    let sectionHasContent = false;
    
    // Analyze each line
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if this is a section header
      if (trimmed.startsWith('##')) {
        // If we were in a section and it had no content, count it as empty
        if (inSection && !sectionHasContent) {
          emptySections++;
        }
        inSection = true;
        sectionHasContent = false;
        continue; // Don't count headers as content
      }
      
      // Skip empty lines
      if (trimmed.length === 0) {
        continue;
      }
      
      // Skip structural elements (metadata, horizontal rules, etc.)
      const isStructural = 
        trimmed.startsWith('#') || // Other headers
        (trimmed.startsWith('*') && (trimmed.includes('Last Updated') || trimmed.includes('References') || trimmed.includes('This file') || trimmed.includes('contains stable') || trimmed.includes('branch-specific') || trimmed.includes('Branch:') || trimmed.includes('Created:'))) ||
        trimmed.startsWith('---') ||
        trimmed.match(/^[-*+]\s*$/) !== null;
      
      // Skip guidance comments (they're intentional in template mode)
      const isGuidance = 
        trimmed.startsWith('<!--') ||
        trimmed.includes('GUIDANCE:') ||
        trimmed.includes('TIP:') ||
        trimmed.includes('Example:') ||
        trimmed === '-->';
      
      // Count actual user content
      if (!isStructural && !isGuidance) {
        contentLength += trimmed.length;
        contentLines.push(trimmed);
        if (inSection) {
          sectionHasContent = true;
        }
      }
    }
    
    // Check final section
    if (inSection && !sectionHasContent) {
      emptySections++;
    }
    
    // Determine status
    const MIN_LENGTH = this.contentThresholds.min_content_length;
    const MIN_LINES = this.contentThresholds.min_content_lines;
    
    let status: ContentStatus;
    if (contentLength === 0 || contentLines.length === 0) {
      status = 'empty';
    } else if (contentLength < MIN_LENGTH || contentLines.length < MIN_LINES) {
      status = 'short';
    } else {
      status = 'populated';
    }
    
    return { 
      status, 
      contentLength, 
      contentLines: contentLines.length,
      emptySections: emptySections > 0 ? emptySections : undefined
    };
  }

  /**
   * Get human-readable purpose of each file
   */
  private getFilePurpose(fileName: string): string {
    const purposes: Record<string, string> = {
      'context.md': 'your project\'s purpose, goals, and background',
      'plan.md': 'implementation details and architecture decisions',
      'guardrail.md': 'project constraints and development rules'
    };
    return purposes[fileName] || 'project-specific information';
  }

  private async checkOutdatedInfo(contextFiles: Map<string, string>): Promise<HealthIssue[]> {
    const issues: HealthIssue[] = [];

    // Check for old "Last Updated" dates
    for (const [fileName, content] of contextFiles) {
      const lastUpdatedMatch = content.match(/\*Last Updated: ([\d-]+)\*/);
      if (lastUpdatedMatch) {
        const lastUpdated = new Date(lastUpdatedMatch[1]);
        const daysSince = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSince > 30) {
          issues.push({
            type: 'warning',
            file: fileName,
            message: `Last updated ${Math.round(daysSince)} days ago`,
            suggestion: 'Consider updating this file with recent changes',
            autoFixable: true
          });
        }
      }
    }

    return issues;
  }

  private generateSuggestions(issues: HealthIssue[]): string[] {
    const suggestions: string[] = [];

    // Only show template suggestions for files above well-populated threshold
    const templateIssues = issues.filter(i => {
      if (i.message.includes('% template')) {
        const match = i.message.match(/(\d+)%/);
        const percentage = match ? parseInt(match[1]) : 0;
        // Legacy template percentage check - no longer used with content quality detection
        return false;
      }
      return false;
    });
    
    if (templateIssues.length > 0) {
      // Separate critical vs warning issues
      const criticalIssues = templateIssues.filter(i => i.type === 'error');
      const warningIssues = templateIssues.filter(i => i.type === 'warning');
      
      if (criticalIssues.length > 0) {
        const percentages = criticalIssues.map(i => {
          const match = i.message.match(/(\d+)%/);
          return match ? parseInt(match[1]) : 0;
        });
        const avgPercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
        suggestions.push(`🔴 ${criticalIssues.length} file(s) are ${avgPercentage}%+ template content and need significant work.`);
      }
      
      if (warningIssues.length > 0) {
        const percentages = warningIssues.map(i => {
          const match = i.message.match(/(\d+)%/);
          return match ? parseInt(match[1]) : 0;
        });
        const avgPercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
        suggestions.push(`⚠️  ${warningIssues.length} file(s) contain ${avgPercentage}% template content. Consider adding more project-specific information.`);
      }
      
      suggestions.push('💡 TIP: The files contain helpful guidance comments (<!-- GUIDANCE: ... -->) explaining what to fill in.');
      suggestions.push('💡 TIP: AI tools can read these files to better understand your project when providing assistance.');
    }

    const warningCount = issues.filter(i => i.type === 'warning').length;
    if (warningCount > 3) {
      suggestions.push('Consider reviewing and updating context files regularly');
    }

    return suggestions;
  }

} 