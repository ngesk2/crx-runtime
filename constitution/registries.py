from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from constitution.hashing import CanonicalHasher
import json


class TypeRegistry:
    """
    Registry for type definitions.
    
    Stores type schemas and their compatibility information.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def register_type(
        self,
        type_name: str,
        type_definition: Dict[str, Any],
        version: str = "1.0.0",
        compatibility_type: str = "backward",
    ) -> str:
        """Register a type definition"""
        from storage.postgres.models import TypeRegistry as TypeRegistryModel
        
        # Compute hash including registry type, name, version for domain separation
        hash_input = {
            "registry_type": "type",
            "name": type_name,
            "version": version,
            "definition": type_definition,
        }
        type_hash = CanonicalHasher.hash_dict(hash_input)
        
        # Check if type already exists
        existing = await self.get_type(type_name)
        if existing:
            raise ValueError(f"Type {type_name} already exists")
        
        # Create type entry
        entry = TypeRegistryModel(
            type_name=type_name,
            type_version=version,
            type_definition=type_definition,
            compatibility_type=compatibility_type,
            type_hash=type_hash,
        )
        
        self.session.add(entry)
        await self.session.commit()
        
        return type_hash
    
    async def get_type(self, type_name: str) -> Optional[Dict[str, Any]]:
        """Get a type definition"""
        from storage.postgres.models import TypeRegistry as TypeRegistryModel
        
        query = select(TypeRegistryModel).where(
            TypeRegistryModel.type_name == type_name,
        )
        result = await self.session.execute(query)
        entry = result.scalar_one_or_none()
        
        if entry:
            return {
                "name": entry.type_name,
                "definition": entry.type_definition,
                "version": entry.type_version,
                "hash": entry.type_hash,
                "compatibility_type": entry.compatibility_type,
            }
        return None
    
    async def update_type(
        self,
        type_name: str,
        type_definition: Dict[str, Any],
        version: str,
        compatibility_type: str = "backward",
    ) -> str:
        """Update a type definition"""
        from storage.postgres.models import TypeRegistry as TypeRegistryModel
        
        # Compute hash including registry type, name, version for domain separation
        hash_input = {
            "registry_type": "type",
            "name": type_name,
            "version": version,
            "definition": type_definition,
        }
        type_hash = CanonicalHasher.hash_dict(hash_input)
        
        # Update entry
        stmt = (
            update(TypeRegistryModel)
            .where(TypeRegistryModel.type_name == type_name)
            .values(
                type_version=version,
                type_definition=type_definition,
                compatibility_type=compatibility_type,
                type_hash=type_hash,
            )
        )
        
        await self.session.execute(stmt)
        await self.session.commit()
        
        return type_hash
    
    async def delete_type(self, type_name: str) -> bool:
        """Delete a type definition"""
        from storage.postgres.models import TypeRegistry as TypeRegistryModel
        
        stmt = delete(TypeRegistryModel).where(
            TypeRegistryModel.type_name == type_name,
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    async def list_types(self) -> list[str]:
        """List all type names"""
        from storage.postgres.models import TypeRegistry as TypeRegistryModel
        
        query = select(TypeRegistryModel.type_name)
        result = await self.session.execute(query)
        names = [row[0] for row in result.all()]
        
        return names


class WorkflowRegistry:
    """
    Registry for workflow definitions.
    
    Stores workflow schemas and their execution patterns.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def register_workflow(
        self,
        workflow_name: str,
        workflow_definition: Dict[str, Any],
        version: str = "1.0.0",
        compatibility_type: str = "backward",
    ) -> str:
        """Register a workflow definition"""
        from storage.postgres.models import WorkflowRegistry as WorkflowRegistryModel
        
        # Compute hash including registry type, name, version for domain separation
        hash_input = {
            "registry_type": "workflow",
            "name": workflow_name,
            "version": version,
            "definition": workflow_definition,
        }
        workflow_hash = CanonicalHasher.hash_dict(hash_input)
        
        # Check if workflow already exists
        existing = await self.get_workflow(workflow_name)
        if existing:
            raise ValueError(f"Workflow {workflow_name} already exists")
        
        # Create workflow entry
        entry = WorkflowRegistryModel(
            workflow_name=workflow_name,
            workflow_version=version,
            workflow_definition=workflow_definition,
            compatibility_type=compatibility_type,
            workflow_hash=workflow_hash,
        )
        
        self.session.add(entry)
        await self.session.commit()
        
        return workflow_hash
    
    async def get_workflow(self, workflow_name: str) -> Optional[Dict[str, Any]]:
        """Get a workflow definition"""
        from storage.postgres.models import WorkflowRegistry as WorkflowRegistryModel
        
        query = select(WorkflowRegistryModel).where(
            WorkflowRegistryModel.workflow_name == workflow_name,
        )
        result = await self.session.execute(query)
        entry = result.scalar_one_or_none()
        
        if entry:
            return {
                "name": entry.workflow_name,
                "definition": entry.workflow_definition,
                "version": entry.workflow_version,
                "hash": entry.workflow_hash,
                "compatibility_type": entry.compatibility_type,
            }
        return None
    
    async def update_workflow(
        self,
        workflow_name: str,
        workflow_definition: Dict[str, Any],
        version: str,
        compatibility_type: str = "backward",
    ) -> str:
        """Update a workflow definition"""
        from storage.postgres.models import WorkflowRegistry as WorkflowRegistryModel
        
        # Compute hash including registry type, name, version for domain separation
        hash_input = {
            "registry_type": "workflow",
            "name": workflow_name,
            "version": version,
            "definition": workflow_definition,
        }
        workflow_hash = CanonicalHasher.hash_dict(hash_input)
        
        # Update entry
        stmt = (
            update(WorkflowRegistryModel)
            .where(WorkflowRegistryModel.workflow_name == workflow_name)
            .values(
                workflow_version=version,
                workflow_definition=workflow_definition,
                compatibility_type=compatibility_type,
                workflow_hash=workflow_hash,
            )
        )
        
        await self.session.execute(stmt)
        await self.session.commit()
        
        return workflow_hash
    
    async def delete_workflow(self, workflow_name: str) -> bool:
        """Delete a workflow definition"""
        from storage.postgres.models import WorkflowRegistry as WorkflowRegistryModel
        
        stmt = delete(WorkflowRegistryModel).where(
            WorkflowRegistryModel.workflow_name == workflow_name,
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    async def list_workflows(self) -> list[str]:
        """List all workflow names"""
        from storage.postgres.models import WorkflowRegistry as WorkflowRegistryModel
        
        query = select(WorkflowRegistryModel.workflow_name)
        result = await self.session.execute(query)
        names = [row[0] for row in result.all()]
        
        return names


class PromptRegistry:
    """
    Registry for prompt templates.
    
    Stores prompt templates and their versioning.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def register_prompt(
        self,
        prompt_name: str,
        prompt_definition: Dict[str, Any],
        version: str = "1.0.0",
        compatibility_type: str = "backward",
    ) -> str:
        """Register a prompt template"""
        from storage.postgres.models import PromptRegistry as PromptRegistryModel
        
        # Compute hash including registry type, name, version for domain separation
        hash_input = {
            "registry_type": "prompt",
            "name": prompt_name,
            "version": version,
            "definition": prompt_definition,
        }
        prompt_hash = CanonicalHasher.hash_dict(hash_input)
        
        # Check if prompt already exists
        existing = await self.get_prompt(prompt_name)
        if existing:
            raise ValueError(f"Prompt {prompt_name} already exists")
        
        # Create prompt entry
        entry = PromptRegistryModel(
            prompt_name=prompt_name,
            prompt_version=version,
            prompt_definition=prompt_definition,
            compatibility_type=compatibility_type,
            prompt_hash=prompt_hash,
        )
        
        self.session.add(entry)
        await self.session.commit()
        
        return prompt_hash
    
    async def get_prompt(self, prompt_name: str) -> Optional[Dict[str, Any]]:
        """Get a prompt template"""
        from storage.postgres.models import PromptRegistry as PromptRegistryModel
        
        query = select(PromptRegistryModel).where(
            PromptRegistryModel.prompt_name == prompt_name,
        )
        result = await self.session.execute(query)
        entry = result.scalar_one_or_none()
        
        if entry:
            return {
                "name": entry.prompt_name,
                "definition": entry.prompt_definition,
                "version": entry.prompt_version,
                "hash": entry.prompt_hash,
                "compatibility_type": entry.compatibility_type,
            }
        return None
    
    async def update_prompt(
        self,
        prompt_name: str,
        prompt_definition: Dict[str, Any],
        version: str,
        compatibility_type: str = "backward",
    ) -> str:
        """Update a prompt template"""
        from storage.postgres.models import PromptRegistry as PromptRegistryModel
        
        # Compute hash including registry type, name, version for domain separation
        hash_input = {
            "registry_type": "prompt",
            "name": prompt_name,
            "version": version,
            "definition": prompt_definition,
        }
        prompt_hash = CanonicalHasher.hash_dict(hash_input)
        
        # Update entry
        stmt = (
            update(PromptRegistryModel)
            .where(PromptRegistryModel.prompt_name == prompt_name)
            .values(
                prompt_version=version,
                prompt_definition=prompt_definition,
                compatibility_type=compatibility_type,
                prompt_hash=prompt_hash,
            )
        )
        
        await self.session.execute(stmt)
        await self.session.commit()
        
        return prompt_hash
    
    async def delete_prompt(self, prompt_name: str) -> bool:
        """Delete a prompt template"""
        from storage.postgres.models import PromptRegistry as PromptRegistryModel
        
        stmt = delete(PromptRegistryModel).where(
            PromptRegistryModel.prompt_name == prompt_name,
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    async def list_prompts(self) -> list[str]:
        """List all prompt names"""
        from storage.postgres.models import PromptRegistry as PromptRegistryModel
        
        query = select(PromptRegistryModel.prompt_name)
        result = await self.session.execute(query)
        names = [row[0] for row in result.all()]
        
        return names


class ToolRegistry:
    """
    Registry for tool definitions.
    
    Stores tool schemas and their capabilities.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def register_tool(
        self,
        tool_name: str,
        tool_definition: Dict[str, Any],
        version: str = "1.0.0",
        compatibility_type: str = "backward",
    ) -> str:
        """Register a tool definition"""
        from storage.postgres.models import ToolRegistry as ToolRegistryModel
        
        # Compute hash including registry type, name, version for domain separation
        hash_input = {
            "registry_type": "tool",
            "name": tool_name,
            "version": version,
            "definition": tool_definition,
        }
        tool_hash = CanonicalHasher.hash_dict(hash_input)
        
        # Check if tool already exists
        existing = await self.get_tool(tool_name)
        if existing:
            raise ValueError(f"Tool {tool_name} already exists")
        
        # Create tool entry
        entry = ToolRegistryModel(
            tool_name=tool_name,
            tool_version=version,
            tool_definition=tool_definition,
            compatibility_type=compatibility_type,
            tool_hash=tool_hash,
        )
        
        self.session.add(entry)
        await self.session.commit()
        
        return tool_hash
    
    async def get_tool(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """Get a tool definition"""
        from storage.postgres.models import ToolRegistry as ToolRegistryModel
        
        query = select(ToolRegistryModel).where(
            ToolRegistryModel.tool_name == tool_name,
        )
        result = await self.session.execute(query)
        entry = result.scalar_one_or_none()
        
        if entry:
            return {
                "name": entry.tool_name,
                "definition": entry.tool_definition,
                "version": entry.tool_version,
                "hash": entry.tool_hash,
                "compatibility_type": entry.compatibility_type,
            }
        return None
    
    async def update_tool(
        self,
        tool_name: str,
        tool_definition: Dict[str, Any],
        version: str,
        compatibility_type: str = "backward",
    ) -> str:
        """Update a tool definition"""
        from storage.postgres.models import ToolRegistry as ToolRegistryModel
        
        # Compute hash including registry type, name, version for domain separation
        hash_input = {
            "registry_type": "tool",
            "name": tool_name,
            "version": version,
            "definition": tool_definition,
        }
        tool_hash = CanonicalHasher.hash_dict(hash_input)
        
        # Update entry
        stmt = (
            update(ToolRegistryModel)
            .where(ToolRegistryModel.tool_name == tool_name)
            .values(
                tool_version=version,
                tool_definition=tool_definition,
                compatibility_type=compatibility_type,
                tool_hash=tool_hash,
            )
        )
        
        await self.session.execute(stmt)
        await self.session.commit()
        
        return tool_hash
    
    async def delete_tool(self, tool_name: str) -> bool:
        """Delete a tool definition"""
        from storage.postgres.models import ToolRegistry as ToolRegistryModel
        
        stmt = delete(ToolRegistryModel).where(
            ToolRegistryModel.tool_name == tool_name,
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    async def list_tools(self) -> list[str]:
        """List all tool names"""
        from storage.postgres.models import ToolRegistry as ToolRegistryModel
        
        query = select(ToolRegistryModel.tool_name)
        result = await self.session.execute(query)
        names = [row[0] for row in result.all()]
        
        return names


class AgentRegistry:
    """
    Registry for agent definitions.
    
    Stores agent schemas and their configurations.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def register_agent(
        self,
        agent_name: str,
        agent_definition: Dict[str, Any],
        version: str = "1.0.0",
        compatibility_type: str = "backward",
    ) -> str:
        """Register an agent definition"""
        from storage.postgres.models import AgentRegistry as AgentRegistryModel
        
        # Compute hash including registry type, name, version for domain separation
        hash_input = {
            "registry_type": "agent",
            "name": agent_name,
            "version": version,
            "definition": agent_definition,
        }
        agent_hash = CanonicalHasher.hash_dict(hash_input)
        
        # Check if agent already exists
        existing = await self.get_agent(agent_name)
        if existing:
            raise ValueError(f"Agent {agent_name} already exists")
        
        # Create agent entry
        entry = AgentRegistryModel(
            agent_name=agent_name,
            agent_version=version,
            agent_definition=agent_definition,
            compatibility_type=compatibility_type,
            agent_hash=agent_hash,
        )
        
        self.session.add(entry)
        await self.session.commit()
        
        return agent_hash
    
    async def get_agent(self, agent_name: str) -> Optional[Dict[str, Any]]:
        """Get an agent definition"""
        from storage.postgres.models import AgentRegistry as AgentRegistryModel
        
        query = select(AgentRegistryModel).where(
            AgentRegistryModel.agent_name == agent_name,
        )
        result = await self.session.execute(query)
        entry = result.scalar_one_or_none()
        
        if entry:
            return {
                "name": entry.agent_name,
                "definition": entry.agent_definition,
                "version": entry.agent_version,
                "hash": entry.agent_hash,
                "compatibility_type": entry.compatibility_type,
            }
        return None
    
    async def update_agent(
        self,
        agent_name: str,
        agent_definition: Dict[str, Any],
        version: str,
        compatibility_type: str = "backward",
    ) -> str:
        """Update an agent definition"""
        from storage.postgres.models import AgentRegistry as AgentRegistryModel
        
        # Compute hash including registry type, name, version for domain separation
        hash_input = {
            "registry_type": "agent",
            "name": agent_name,
            "version": version,
            "definition": agent_definition,
        }
        agent_hash = CanonicalHasher.hash_dict(hash_input)
        
        # Update entry
        stmt = (
            update(AgentRegistryModel)
            .where(AgentRegistryModel.agent_name == agent_name)
            .values(
                agent_version=version,
                agent_definition=agent_definition,
                compatibility_type=compatibility_type,
                agent_hash=agent_hash,
            )
        )
        
        await self.session.execute(stmt)
        await self.session.commit()
        
        return agent_hash
    
    async def delete_agent(self, agent_name: str) -> bool:
        """Delete an agent definition"""
        from storage.postgres.models import AgentRegistry as AgentRegistryModel
        
        stmt = delete(AgentRegistryModel).where(
            AgentRegistryModel.agent_name == agent_name,
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    async def list_agents(self) -> list[str]:
        """List all agent names"""
        from storage.postgres.models import AgentRegistry as AgentRegistryModel
        
        query = select(AgentRegistryModel.agent_name)
        result = await self.session.execute(query)
        names = [row[0] for row in result.all()]
        
        return names


class RegistryManager:
    """
    Manager for all constitutional registries.
    
    Provides a unified interface for accessing all registries.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        from constitution.schema_registry import SchemaRegistry
        from kernel.projection import ProjectionRegistry
        self.schema_registry = SchemaRegistry(session)
        self.type_registry = TypeRegistry(session)
        self.projection_registry = ProjectionRegistry(session)
        self.workflow_registry = WorkflowRegistry(session)
        self.prompt_registry = PromptRegistry(session)
        self.tool_registry = ToolRegistry(session)
        self.agent_registry = AgentRegistry(session)
    
    async def discover_all(self) -> Dict[str, list[str]]:
        """Discover all registered items across all registries"""
        return {
            "schemas": [],  # SchemaRegistry doesn't have list method
            "types": await self.type_registry.list_types(),
            "projections": [],  # ProjectionRegistry doesn't have list method
            "workflows": await self.workflow_registry.list_workflows(),
            "prompts": await self.prompt_registry.list_prompts(),
            "tools": await self.tool_registry.list_tools(),
            "agents": await self.agent_registry.list_agents(),
        }
    
    async def verify_integrity(self) -> Dict[str, bool]:
        """Verify the integrity of all registries"""
        integrity = {}
        
        # Verify schema registry
        try:
            integrity["schema_registry"] = await self._verify_schema_integrity()
        except Exception:
            integrity["schema_registry"] = False
        
        # Verify type registry
        try:
            integrity["type_registry"] = await self._verify_type_integrity()
        except Exception:
            integrity["type_registry"] = False
        
        # Verify projection registry
        try:
            integrity["projection_registry"] = await self._verify_projection_integrity()
        except Exception:
            integrity["projection_registry"] = False
        
        # Verify workflow registry
        try:
            integrity["workflow_registry"] = await self._verify_workflow_integrity()
        except Exception:
            integrity["workflow_registry"] = False
        
        # Verify prompt registry
        try:
            integrity["prompt_registry"] = await self._verify_prompt_integrity()
        except Exception:
            integrity["prompt_registry"] = False
        
        # Verify tool registry
        try:
            integrity["tool_registry"] = await self._verify_tool_integrity()
        except Exception:
            integrity["tool_registry"] = False
        
        # Verify agent registry
        try:
            integrity["agent_registry"] = await self._verify_agent_integrity()
        except Exception:
            integrity["agent_registry"] = False
        
        return integrity
    
    async def _verify_schema_integrity(self) -> bool:
        """Verify schema registry integrity"""
        # TODO: Implement schema integrity verification
        # Check that all schema hashes match their definitions
        return True
    
    async def _verify_type_integrity(self) -> bool:
        """Verify type registry integrity"""
        from storage.postgres.models import TypeRegistry as TypeRegistryModel
        from sqlalchemy import select
        from constitution.hashing import CanonicalHasher
        
        # Check that all type hashes match their definitions
        query = select(TypeRegistryModel)
        result = await self.session.execute(query)
        types = result.scalars().all()
        
        for type_entry in types:
            hash_input = {
                "registry_type": "type",
                "name": type_entry.type_name,
                "version": type_entry.type_version,
                "definition": type_entry.type_definition,
            }
            computed_hash = CanonicalHasher.hash_dict(hash_input)
            if computed_hash != type_entry.type_hash:
                return False
        
        return True
    
    async def _verify_projection_integrity(self) -> bool:
        """Verify projection registry integrity"""
        # TODO: Implement projection integrity verification
        return True
    
    async def _verify_workflow_integrity(self) -> bool:
        """Verify workflow registry integrity"""
        from storage.postgres.models import WorkflowRegistry as WorkflowRegistryModel
        from sqlalchemy import select
        from constitution.hashing import CanonicalHasher
        
        # Check that all workflow hashes match their definitions
        query = select(WorkflowRegistryModel)
        result = await self.session.execute(query)
        workflows = result.scalars().all()
        
        for workflow_entry in workflows:
            hash_input = {
                "registry_type": "workflow",
                "name": workflow_entry.workflow_name,
                "version": workflow_entry.workflow_version,
                "definition": workflow_entry.workflow_definition,
            }
            computed_hash = CanonicalHasher.hash_dict(hash_input)
            if computed_hash != workflow_entry.workflow_hash:
                return False
        
        return True
    
    async def _verify_prompt_integrity(self) -> bool:
        """Verify prompt registry integrity"""
        from storage.postgres.models import PromptRegistry as PromptRegistryModel
        from sqlalchemy import select
        from constitution.hashing import CanonicalHasher
        
        # Check that all prompt hashes match their definitions
        query = select(PromptRegistryModel)
        result = await self.session.execute(query)
        prompts = result.scalars().all()
        
        for prompt_entry in prompts:
            hash_input = {
                "registry_type": "prompt",
                "name": prompt_entry.prompt_name,
                "version": prompt_entry.prompt_version,
                "definition": prompt_entry.prompt_definition,
            }
            computed_hash = CanonicalHasher.hash_dict(hash_input)
            if computed_hash != prompt_entry.prompt_hash:
                return False
        
        return True
    
    async def _verify_tool_integrity(self) -> bool:
        """Verify tool registry integrity"""
        from storage.postgres.models import ToolRegistry as ToolRegistryModel
        from sqlalchemy import select
        from constitution.hashing import CanonicalHasher
        
        # Check that all tool hashes match their definitions
        query = select(ToolRegistryModel)
        result = await self.session.execute(query)
        tools = result.scalars().all()
        
        for tool_entry in tools:
            hash_input = {
                "registry_type": "tool",
                "name": tool_entry.tool_name,
                "version": tool_entry.tool_version,
                "definition": tool_entry.tool_definition,
            }
            computed_hash = CanonicalHasher.hash_dict(hash_input)
            if computed_hash != tool_entry.tool_hash:
                return False
        
        return True
    
    async def _verify_agent_integrity(self) -> bool:
        """Verify agent registry integrity"""
        from storage.postgres.models import AgentRegistry as AgentRegistryModel
        from sqlalchemy import select
        from constitution.hashing import CanonicalHasher
        
        # Check that all agent hashes match their definitions
        query = select(AgentRegistryModel)
        result = await self.session.execute(query)
        agents = result.scalars().all()
        
        for agent_entry in agents:
            hash_input = {
                "registry_type": "agent",
                "name": agent_entry.agent_name,
                "version": agent_entry.agent_version,
                "definition": agent_entry.agent_definition,
            }
            computed_hash = CanonicalHasher.hash_dict(hash_input)
            if computed_hash != agent_entry.agent_hash:
                return False
        
        return True
