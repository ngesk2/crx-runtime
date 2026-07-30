/**
 * Classifier Service
 *
 * Consumes artifacts and produces classifier results.
 * Classifiers are deterministic and pluggable.
 *
 * Classifier Types:
 * - Sentiment
 * - Review Quality
 * - Urgency
 * - Fraud
 * - Maintenance Risk
 */

import { ArtifactService, Artifact } from "./artifact-service";

/**
 * Classifier Types
 */
export type ClassifierType =
  | "Sentiment"
  | "ReviewQuality"
  | "Urgency"
  | "Fraud"
  | "MaintenanceRisk";

/**
 * Classifier Result
 */
export interface ClassifierResult {
  id: string;
  artifactId: string;
  classifierType: ClassifierType;
  result: unknown;
  confidence: number;
  classifiedAt: string;
}

/**
 * Classifier Interface
 */
export interface Classifier {
  type: ClassifierType;
  classify(artifact: Artifact): Promise<unknown>;
  confidence(artifact: Artifact): Promise<number>;
}

/**
 * Classifier Service Interface
 */
export interface ClassifierService {
  classify(
    artifactId: string,
    classifierType: ClassifierType
  ): Promise<ClassifierResult>;

  registerClassifier(classifier: Classifier): Promise<void>;

  getClassifierResults(artifactId: string): Promise<ClassifierResult[]>;

  getResultsByClassifier(
    classifierType: ClassifierType
  ): Promise<ClassifierResult[]>;
}

/**
 * In-Memory Classifier Service
 *
 * WARNING: NOT SUITABLE FOR PRODUCTION
 * Results are lost on restart.
 * Use only for development/testing.
 */
export class InMemoryClassifierService implements ClassifierService {
  private classifiers: Map<ClassifierType, Classifier> = new Map();
  private results: Map<string, ClassifierResult[]> = new Map();

  constructor(private artifactService: ArtifactService) {}

  async classify(
    artifactId: string,
    classifierType: ClassifierType
  ): Promise<ClassifierResult> {
    const classifier = this.classifiers.get(classifierType);
    if (!classifier) {
      throw new Error(`Classifier not found: ${classifierType}`);
    }

    const artifact = await this.artifactService.getArtifact(artifactId);
    if (!artifact) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    const result = await classifier.classify(artifact);
    const confidence = await classifier.confidence(artifact);

    const classifierResult: ClassifierResult = {
      id: this.generateId(),
      artifactId,
      classifierType,
      result,
      confidence,
      classifiedAt: new Date().toISOString(),
    };

    const artifactResults = this.results.get(artifactId) || [];
    artifactResults.push(classifierResult);
    this.results.set(artifactId, artifactResults);

    return classifierResult;
  }

  async registerClassifier(classifier: Classifier): Promise<void> {
    this.classifiers.set(classifier.type, classifier);
  }

  async getClassifierResults(
    artifactId: string
  ): Promise<ClassifierResult[]> {
    return this.results.get(artifactId) || [];
  }

  async getResultsByClassifier(
    classifierType: ClassifierType
  ): Promise<ClassifierResult[]> {
    const allResults = Array.from(this.results.values()).flat();
    return allResults.filter(
      (result) => result.classifierType === classifierType
    );
  }

  private generateId(): string {
    return crypto.randomUUID();
  }
}

/**
 * Example Classifiers
 */

/**
 * Sentiment Classifier
 */
export class SentimentClassifier implements Classifier {
  type: ClassifierType = "Sentiment";

  async classify(artifact: Artifact): Promise<unknown> {
    // Simple sentiment analysis - in production, use NLP library
    const text = JSON.stringify(artifact.data);
    const positiveWords = ["good", "great", "excellent", "happy", "satisfied"];
    const negativeWords = ["bad", "terrible", "awful", "unhappy", "dissatisfied"];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (text.toLowerCase().includes(word)) {
        positiveCount++;
      }
    }

    for (const word of negativeWords) {
      if (text.toLowerCase().includes(word)) {
        negativeCount++;
      }
    }

    if (positiveCount > negativeCount) {
      return "positive";
    } else if (negativeCount > positiveCount) {
      return "negative";
    } else {
      return "neutral";
    }
  }

  async confidence(artifact: Artifact): Promise<number> {
    // Simple confidence calculation - in production, use ML model
    return 0.7;
  }
}

/**
 * Review Quality Classifier
 */
export class ReviewQualityClassifier implements Classifier {
  type: ClassifierType = "ReviewQuality";

  async classify(artifact: Artifact): Promise<unknown> {
    // Simple quality analysis - in production, use ML模型
    const data = artifact.data as { rating?: number; text?: string };

    if (data.rating && data.rating >= 4) {
      return "high";
    } else if (data.rating && data.rating >= 3) {
      return "medium";
    } else {
      return "low";
    }
  }

  async confidence(artifact: Artifact): Promise<number> {
    return 0.8;
  }
}

/**
 * Urgency Classifier
 */
export class UrgencyClassifier implements Classifier {
  type: ClassifierType = "Urgency";

  async classify(artifact: Artifact): Promise<unknown> {
    // Simple urgency analysis - in production, use business rules
    const data = artifact.data as { type?: string };

    if (data.type === "Permit" || data.type === "Warranty") {
      return "high";
    } else if (data.type === "Estimate" || data.type === "Inspection") {
      return "medium";
    } else {
      return "low";
    }
  }

  async confidence(artifact: Artifact): Promise<number> {
    return 0.9;
  }
}
