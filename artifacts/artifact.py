"""Artifact Primitive

Constitutional artifact primitive for Hermes.

Architecture:
Git Commit
  ↓
Artifact
Newsletter
  ↓
Artifact
Landing Page
  ↓
Artifact
Conversation
  ↓
Artifact
Architecture Report
  ↓
Artifact
Marketing Report
  ↓
Artifact
Morning Report
  ↓
Artifact

Hermes should never manipulate "emails."
It manipulates artifacts.

Everything becomes an Artifact.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, List, Dict, Optional
from enum import Enum
from uuid import UUID, uuid4


class ArtifactType(Enum):
    """Types of artifacts"""
    GIT_COMMIT = "git_commit"
    NEWSLETTER = "newsletter"
    LANDING_PAGE = "landing_page"
    CONVERSATION = "conversation"
    ARCHITECTURE_REPORT = "architecture_report"
    MARKETING_REPORT = "marketing_report"
    MORNING_REPORT = "morning_report"
    BLOG_POST = "blog_post"
    SEO_AUDIT = "seo_audit"
    DOCUMENTATION = "documentation"
    CODE_REVIEW = "code_review"
    PR_SUMMARY = "pr_summary"
    CRM_LEAD = "crm_lead"
    GITHUB_ISSUE = "github_issue"
    DISCORD_MESSAGE = "discord_message"
    EMAIL_DRAFT = "email_draft"


class ArtifactState(Enum):
    """States of an artifact"""
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"


@dataclass(frozen=True)
class ArtifactId:
    """
    Constitutional artifact identifier.
    
    Frozen value object for artifact identification.
    """
    value: UUID
    
    def __str__(self) -> str:
        return str(self.value)
    
    @classmethod
    def generate(cls) -> "ArtifactId":
        """Generate a new artifact ID"""
        return cls(value=uuid4())
    
    @classmethod
    def from_string(cls, value: str) -> "ArtifactId":
        """Create artifact ID from string"""
        return cls(value=UUID(value))


@dataclass(frozen=True)
class ArtifactContent:
    """
    Artifact content.
    
    Contains the actual content of the artifact.
    """
    data: Dict[str, Any]
    content_type: str = "application/json"
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get content value by key"""
        return self.data.get(key, default)
    
    def has(self, key: str) -> bool:
        """Check if content has key"""
        return key in self.data


@dataclass(frozen=True)
class ArtifactMetadata:
    """
    Artifact metadata.
    
    Contains metadata about the artifact.
    """
    title: str
    description: str | None
    author: str | None
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    
    def with_title(self, title: str) -> "ArtifactMetadata":
        """Update title"""
        return ArtifactMetadata(
            title=title,
            description=self.description,
            author=self.author,
            tags=self.tags,
            created_at=self.created_at,
            updated_at=datetime.utcnow(),
        )
    
    def with_tags(self, tags: List[str]) -> "ArtifactMetadata":
        """Update tags"""
        return ArtifactMetadata(
            title=self.title,
            description=self.description,
            author=self.author,
            tags=tags,
            created_at=self.created_at,
            updated_at=datetime.utcnow(),
        )


@dataclass(frozen=True)
class ArtifactRelationship:
    """
    Relationship between artifacts.
    
    Contains:
    - source_artifact_id (source artifact)
    - target_artifact_id (target artifact)
    - relationship_type (type of relationship)
    - metadata (relationship metadata)
    """
    source_artifact_id: ArtifactId
    target_artifact_id: ArtifactId
    relationship_type: str
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "source_artifact_id": str(self.source_artifact_id),
            "target_artifact_id": str(self.target_artifact_id),
            "relationship_type": self.relationship_type,
            "metadata": self.metadata,
        }


@dataclass(frozen=True)
class Artifact:
    """
    Constitutional artifact primitive.
    
    Everything Hermes manipulates becomes an Artifact.
    
    Contains:
    - artifact_id (unique identifier)
    - artifact_type (type of artifact)
    - state (current state of artifact)
    - content (artifact content)
    - metadata (artifact metadata)
    - relationships (relationships to other artifacts)
    - mission_id (mission that created this artifact)
    - created_at (creation timestamp)
    - updated_at (last update timestamp)
    """
    artifact_id: ArtifactId
    artifact_type: ArtifactType
    state: ArtifactState
    content: ArtifactContent
    metadata: ArtifactMetadata
    relationships: List[ArtifactRelationship]
    mission_id: str | None
    created_at: datetime
    updated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "artifact_id": str(self.artifact_id),
            "artifact_type": self.artifact_type.value,
            "state": self.state.value,
            "content": self.content.data,
            "content_type": self.content.content_type,
            "metadata": {
                "title": self.metadata.title,
                "description": self.metadata.description,
                "author": self.metadata.author,
                "tags": self.metadata.tags,
                "created_at": self.metadata.created_at.isoformat(),
                "updated_at": self.metadata.updated_at.isoformat(),
            },
            "relationships": [rel.to_dict() for rel in self.relationships],
            "mission_id": self.mission_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
    
    def with_state(self, new_state: ArtifactState) -> "Artifact":
        """Create a new artifact with updated state"""
        return Artifact(
            artifact_id=self.artifact_id,
            artifact_type=self.artifact_type,
            state=new_state,
            content=self.content,
            metadata=self.metadata,
            relationships=self.relationships,
            mission_id=self.mission_id,
            created_at=self.created_at,
            updated_at=datetime.utcnow(),
        )
    
    def with_content(self, content: ArtifactContent) -> "Artifact":
        """Create a new artifact with updated content"""
        return Artifact(
            artifact_id=self.artifact_id,
            artifact_type=self.artifact_type,
            state=self.state,
            content=content,
            metadata=self.metadata,
            relationships=self.relationships,
            mission_id=self.mission_id,
            created_at=self.created_at,
            updated_at=datetime.utcnow(),
        )
    
    def with_metadata(self, metadata: ArtifactMetadata) -> "Artifact":
        """Create a new artifact with updated metadata"""
        return Artifact(
            artifact_id=self.artifact_id,
            artifact_type=self.artifact_type,
            state=self.state,
            content=self.content,
            metadata=metadata,
            relationships=self.relationships,
            mission_id=self.mission_id,
            created_at=self.created_at,
            updated_at=datetime.utcnow(),
        )
    
    def with_relationship(self, relationship: ArtifactRelationship) -> "Artifact":
        """Create a new artifact with added relationship"""
        return Artifact(
            artifact_id=self.artifact_id,
            artifact_type=self.artifact_type,
            state=self.state,
            content=self.content,
            metadata=self.metadata,
            relationships=self.relationships + [relationship],
            mission_id=self.mission_id,
            created_at=self.created_at,
            updated_at=datetime.utcnow(),
        )


class ArtifactBuilder:
    """
    Builder for creating artifacts.
    
    Provides a fluent interface for building artifacts.
    """
    
    def __init__(self):
        self._artifact_id: ArtifactId | None = None
        self._artifact_type: ArtifactType = ArtifactType.GIT_COMMIT
        self._state: ArtifactState = ArtifactState.DRAFT
        self._content: Dict[str, Any] = {}
        self._title: str = ""
        self._description: str | None = None
        self._author: str | None = None
        self._tags: List[str] = []
        self._mission_id: str | None = None
    
    def with_id(self, artifact_id: ArtifactId) -> "ArtifactBuilder":
        """Set artifact ID"""
        self._artifact_id = artifact_id
        return self
    
    def with_type(self, artifact_type: ArtifactType) -> "ArtifactBuilder":
        """Set artifact type"""
        self._artifact_type = artifact_type
        return self
    
    def with_state(self, state: ArtifactState) -> "ArtifactBuilder":
        """Set artifact state"""
        self._state = state
        return self
    
    def with_content(self, content: Dict[str, Any]) -> "ArtifactBuilder":
        """Set artifact content"""
        self._content = content
        return self
    
    def with_title(self, title: str) -> "ArtifactBuilder":
        """Set artifact title"""
        self._title = title
        return self
    
    def with_description(self, description: str) -> "ArtifactBuilder":
        """Set artifact description"""
        self._description = description
        return self
    
    def with_author(self, author: str) -> "ArtifactBuilder":
        """Set artifact author"""
        self._author = author
        return self
    
    def with_tags(self, tags: List[str]) -> "ArtifactBuilder":
        """Set artifact tags"""
        self._tags = tags
        return self
    
    def with_tag(self, tag: str) -> "ArtifactBuilder":
        """Add a tag"""
        self._tags.append(tag)
        return self
    
    def with_mission_id(self, mission_id: str) -> "ArtifactBuilder":
        """Set mission ID"""
        self._mission_id = mission_id
        return self
    
    def build(self) -> Artifact:
        """Build the artifact"""
        now = datetime.utcnow()
        artifact_id = self._artifact_id or ArtifactId.generate()
        
        return Artifact(
            artifact_id=artifact_id,
            artifact_type=self._artifact_type,
            state=self._state,
            content=ArtifactContent(data=self._content),
            metadata=ArtifactMetadata(
                title=self._title,
                description=self._description,
                author=self._author,
                tags=self._tags,
                created_at=now,
                updated_at=now,
            ),
            relationships=[],
            mission_id=self._mission_id,
            created_at=now,
            updated_at=now,
        )
