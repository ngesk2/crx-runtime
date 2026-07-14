from typing import Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from constitution.models.artifact import Artifact
from constitution.hashing import CanonicalHasher
from storage.artifact_adapter import StorageAdapter, FilesystemAdapter


class ArtifactStore:
    """
    Immutable content-addressed artifact storage.
    
    Artifacts are stored by their SHA256 hash, ensuring deduplication
    and reproducibility. Storage backend is pluggable via adapter pattern.
    """
    
    def __init__(self, session: AsyncSession, storage_adapter: Optional[StorageAdapter] = None):
        self.session = session
        self.storage_adapter = storage_adapter or FilesystemAdapter("./artifacts")
    
    async def store_artifact(
        self,
        content: bytes,
        content_type: str,
        metadata: dict[str, Any] | None = None,
    ) -> Artifact:
        """
        Store an artifact.
        
        The artifact ID is the SHA256 hash of the content, ensuring
        content-addressed storage. Storage backend is handled by adapter.
        """
        # Compute hash using CanonicalHasher
        content_hash = CanonicalHasher.hash_bytes(content)
        
        # Check if artifact already exists
        existing = await self.get_artifact(content_hash)
        if existing:
            return existing
        
        # Store content via adapter (infrastructure detail)
        await self.storage_adapter.store(content_hash, content)
        
        # Create artifact record (no storage_location in constitutional state)
        artifact = Artifact.create(
            content=content,
            content_type=content_type,
            storage_location="",  # Empty - adapter handles location
            metadata=metadata or {},
        )
        
        # Store in database
        from storage.postgres.models import Artifact as ArtifactModel
        artifact_record = ArtifactModel(
            artifact_id=artifact.artifact_id,
            content_type=artifact.content_type,
            content_hash=artifact.content_hash,
            size=artifact.size,
            metadata=artifact.metadata,
            created_at=artifact.created_at,
        )
        
        self.session.add(artifact_record)
        await self.session.commit()
        
        return artifact
    
    async def get_artifact(self, artifact_id: str) -> Optional[Artifact]:
        """
        Get an artifact by ID.
        
        Returns None if artifact not found.
        """
        from storage.postgres.models import Artifact as ArtifactModel
        
        query = select(ArtifactModel).where(
            ArtifactModel.artifact_id == artifact_id,
        )
        result = await self.session.execute(query)
        record = result.scalar_one_or_none()
        
        if not record:
            return None
        
        return Artifact(
            artifact_id=record.artifact_id,
            content_type=record.content_type,
            content_hash=record.content_hash,
            size=record.size,
            metadata=record.metadata,
            storage_location="",  # Empty - adapter handles location
            created_at=record.created_at,
        )
    
    async def get_artifact_content(self, artifact_id: str) -> Optional[bytes]:
        """
        Get the content of an artifact.
        
        Returns None if artifact not found.
        """
        artifact = await self.get_artifact(artifact_id)
        if not artifact:
            return None
        
        # Read content via adapter (infrastructure detail)
        return await self.storage_adapter.retrieve(artifact_id)
    
    async def verify_artifact(self, artifact_id: str) -> bool:
        """
        Verify that an artifact's content matches its hash.
        
        Returns True if valid, False otherwise.
        """
        artifact = await self.get_artifact(artifact_id)
        if not artifact:
            return False
        
        # Read content via adapter
        content = await self.get_artifact_content(artifact_id)
        if not content:
            return False
        
        # Verify hash
        computed_hash = CanonicalHasher.hash_bytes(content)
        return computed_hash == artifact.artifact_id
    
    async def delete_artifact(self, artifact_id: str) -> bool:
        """
        Delete an artifact.
        
        Returns True if deleted, False if not found.
        
        Note: This is a dangerous operation as artifacts are immutable.
        Consider using soft deletion or retention policies instead.
        """
        from storage.postgres.models import Artifact as ArtifactModel
        from sqlalchemy import delete
        
        # Get artifact
        artifact = await self.get_artifact(artifact_id)
        if not artifact:
            return False
        
        # Delete via adapter (infrastructure detail)
        await self.storage_adapter.delete(artifact_id)
        
        # Delete from database
        stmt = delete(ArtifactModel).where(
            ArtifactModel.artifact_id == artifact_id,
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    async def list_artifacts(
        self,
        content_type: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Artifact]:
        """
        List artifacts.
        
        Can filter by content type and paginate.
        """
        from storage.postgres.models import Artifact as ArtifactModel
        
        query = select(ArtifactModel)
        
        if content_type:
            query = query.where(ArtifactModel.content_type == content_type)
        
        query = query.order_by(ArtifactModel.created_at.desc()).limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        records = result.scalars().all()
        
        return [
            Artifact(
                artifact_id=record.artifact_id,
                content_type=record.content_type,
                content_hash=record.content_hash,
                size=record.size,
                metadata=record.metadata,
                storage_location="",  # Empty - adapter handles location
                created_at=record.created_at,
            )
            for record in records
        ]
    
    async def get_artifact_lineage(self, artifact_id: str) -> dict[str, Any]:
        """
        Get the lineage of an artifact.
        
        Returns information about artifacts that reference this artifact.
        Uses immutable ArtifactReference table instead of mutable metadata.
        """
        from storage.postgres.models import ArtifactReference as ArtifactReferenceModel
        from sqlalchemy import select
        
        # Find artifacts that reference this artifact (from_artifact_id -> to_artifact_id)
        query = select(ArtifactReferenceModel.to_artifact_id).where(
            ArtifactReferenceModel.from_artifact_id == artifact_id,
        )
        result = await self.session.execute(query)
        references = [row[0] for row in result.all()]
        
        # Find artifacts that are referenced by this artifact (to_artifact_id <- from_artifact_id)
        query = select(ArtifactReferenceModel.from_artifact_id).where(
            ArtifactReferenceModel.to_artifact_id == artifact_id,
        )
        result = await self.session.execute(query)
        referenced_by = [row[0] for row in result.all()]
        
        return {
            "artifact_id": artifact_id,
            "references": references,
            "referenced_by": referenced_by,
        }
    
    async def add_artifact_reference(
        self,
        from_artifact_id: str,
        to_artifact_id: str,
        reference_type: str,
        event_id: str,
    ) -> None:
        """
        Add an immutable artifact reference.
        
        This should be called when an event creates a reference between artifacts.
        """
        from storage.postgres.models import ArtifactReference as ArtifactReferenceModel
        
        reference = ArtifactReferenceModel(
            from_artifact_id=from_artifact_id,
            to_artifact_id=to_artifact_id,
            reference_type=reference_type,
            event_id=event_id,
        )
        
        self.session.add(reference)
        await self.session.commit()
    
    async def deduplicate_artifacts(self) -> dict[str, int]:
        """
        Deduplicate artifacts.
        
        Finds artifacts with the same content hash but different IDs
        and consolidates them by removing duplicates.
        """
        from storage.postgres.models import Artifact as ArtifactModel
        from sqlalchemy import select, delete, func
        from collections import defaultdict
        
        # Find duplicates by content_hash
        query = select(
            ArtifactModel.content_hash,
            func.count(ArtifactModel.artifact_id).label("count")
        ).group_by(
            ArtifactModel.content_hash
        ).having(func.count(ArtifactModel.artifact_id) > 1)
        
        result = await self.session.execute(query)
        duplicates = result.all()
        
        duplicates_found = len(duplicates)
        duplicates_removed = 0
        
        # For each duplicate group, keep the oldest and delete the rest
        for content_hash, count in duplicates:
            # Get all artifacts with this content_hash
            query = select(ArtifactModel).where(
                ArtifactModel.content_hash == content_hash
            ).order_by(ArtifactModel.created_at)
            
            result = await self.session.execute(query)
            artifacts = result.scalars().all()
            
            # Keep the first (oldest), delete the rest
            for artifact in artifacts[1:]:
                # Delete from storage adapter
                await self.storage_adapter.delete(artifact.artifact_id)
                
                # Delete from database
                stmt = delete(ArtifactModel).where(
                    ArtifactModel.artifact_id == artifact.artifact_id
                )
                await self.session.execute(stmt)
                duplicates_removed += 1
        
        await self.session.commit()
        
        return {
            "duplicates_found": duplicates_found,
            "duplicates_removed": duplicates_removed,
        }
    
    async def get_storage_stats(self) -> dict[str, Any]:
        """
        Get storage statistics.
        
        Returns information about artifact storage usage.
        """
        from storage.postgres.models import Artifact as ArtifactModel
        from sqlalchemy import func
        
        # Count artifacts
        count_query = select(func.count()).select_from(ArtifactModel)
        count_result = await self.session.execute(count_query)
        total_count = count_result.scalar()
        
        # Sum sizes
        size_query = select(func.sum(ArtifactModel.size)).select_from(ArtifactModel)
        size_result = await self.session.execute(size_query)
        total_size = size_result.scalar() or 0
        
        return {
            "total_artifacts": total_count,
            "total_size_bytes": total_size,
            "total_size_mb": total_size / (1024 * 1024),
        }
