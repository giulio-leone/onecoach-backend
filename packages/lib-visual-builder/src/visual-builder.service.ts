/**
 * Visual Builder Service
 *
 * Manages user-created skills and workflows for the visual builder system.
 * Handles CRUD operations, code generation, and deployment.
 */

import { prisma } from '@giulio-leone/lib-core';
import { Prisma } from '@prisma/client';
import type { user_skills, user_workflows, workflow_nodes, workflow_edges } from '@prisma/client';

/**
 * Skill input data for creation/update
 */
export interface SkillInput {
  name: string;
  description?: string;
  version?: string;
  category?: string;
  tags?: string[];
  inputSchema: unknown; // Zod schema as JSON
  outputSchema?: unknown;
  implementation: unknown; // Visual blocks or code
  isPublic?: boolean;
}

/**
 * Workflow input data for creation/update
 */
export interface WorkflowInput {
  name: string;
  description?: string;
  version?: string;
  domain?: string;
  entryNodeId?: string;
  isPublic?: boolean;
}

/**
 * Workflow node input
 */
export interface WorkflowNodeInput {
  type: string; // agent, skill, decision, loop, condition
  label: string;
  position: { x: number; y: number };
  config: unknown; // Node-specific config
  order?: number;
}

/**
 * Workflow edge input
 */
export interface WorkflowEdgeInput {
  sourceId: string;
  targetId: string;
  label?: string;
  condition?: unknown;
  order?: number;
}

/**
 * Visual Builder Service
 */
export class VisualBuilderService {
  // ================================
  // SKILLS MANAGEMENT
  // ================================

  /**
   * Create a new user skill
   */
  static async createSkill(userId: string, data: SkillInput): Promise<user_skills> {
    return await prisma.user_skills.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        version: data.version || '1.0.0',
        category: data.category,
        tags: data.tags || [],
        inputSchema: data.inputSchema as Prisma.InputJsonValue,
        outputSchema: data.outputSchema
          ? (data.outputSchema as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        implementation: data.implementation as Prisma.InputJsonValue,
        isPublic: data.isPublic ?? false,
      },
    });
  }

  /**
   * Update an existing user skill
   */
  static async updateSkill(
    skillId: string,
    userId: string,
    data: Partial<SkillInput>
  ): Promise<user_skills> {
    // Ensure user owns the skill
    const skill = await prisma.user_skills.findFirst({
      where: { id: skillId, userId },
    });

    if (!skill) {
      throw new Error('Skill not found or unauthorized');
    }

    return await prisma.user_skills.update({
      where: { id: skillId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.version && { version: data.version }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.tags && { tags: data.tags }),
        ...(data.inputSchema !== undefined && {
          inputSchema: data.inputSchema as Prisma.InputJsonValue,
        }),
        ...(data.outputSchema !== undefined && {
          outputSchema: data.outputSchema
            ? (data.outputSchema as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
        ...(data.implementation !== undefined && {
          implementation: data.implementation as Prisma.InputJsonValue,
        }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
    });
  }

  /**
   * Delete a user skill
   */
  static async deleteSkill(skillId: string, userId: string): Promise<void> {
    const skill = await prisma.user_skills.findFirst({
      where: { id: skillId, userId },
    });

    if (!skill) {
      throw new Error('Skill not found or unauthorized');
    }

    await prisma.user_skills.delete({
      where: { id: skillId },
    });
  }

  /**
   * Get skill by ID
   */
  static async getSkill(skillId: string, userId: string): Promise<user_skills | null> {
    return await prisma.user_skills.findFirst({
      where: {
        id: skillId,
        OR: [{ userId }, { isPublic: true }],
      },
    });
  }

  /**
   * List user's skills
   */
  static async listSkills(userId: string, includePublic = false): Promise<user_skills[]> {
    return await prisma.user_skills.findMany({
      where: includePublic
        ? {
            OR: [{ userId }, { isPublic: true }],
          }
        : { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deploy a skill (mark as active and generate code)
   */
  static async deploySkill(skillId: string, userId: string): Promise<user_skills> {
    const skill = await prisma.user_skills.findFirst({
      where: { id: skillId, userId },
    });

    if (!skill) {
      throw new Error('Skill not found or unauthorized');
    }

    // Code generation will be handled by CodeGeneratorService
    return await prisma.user_skills.update({
      where: { id: skillId },
      data: {
        isActive: true,
        deployedAt: new Date(),
      },
    });
  }

  // ================================
  // WORKFLOWS MANAGEMENT
  // ================================

  /**
   * Create a new workflow
   */
  static async createWorkflow(userId: string, data: WorkflowInput): Promise<user_workflows> {
    return await prisma.user_workflows.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        version: data.version || '1.0.0',
        domain: data.domain,
        entryNodeId: data.entryNodeId,
        isPublic: data.isPublic ?? false,
      },
    });
  }

  /**
   * Update an existing workflow
   */
  static async updateWorkflow(
    workflowId: string,
    userId: string,
    data: Partial<WorkflowInput>
  ): Promise<user_workflows> {
    const workflow = await prisma.user_workflows.findFirst({
      where: { id: workflowId, userId },
    });

    if (!workflow) {
      throw new Error('Workflow not found or unauthorized');
    }

    return await prisma.user_workflows.update({
      where: { id: workflowId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.version && { version: data.version }),
        ...(data.domain !== undefined && { domain: data.domain }),
        ...(data.entryNodeId !== undefined && { entryNodeId: data.entryNodeId }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
    });
  }

  /**
   * Delete a workflow
   */
  static async deleteWorkflow(workflowId: string, userId: string): Promise<void> {
    const workflow = await prisma.user_workflows.findFirst({
      where: { id: workflowId, userId },
    });

    if (!workflow) {
      throw new Error('Workflow not found or unauthorized');
    }

    await prisma.user_workflows.delete({
      where: { id: workflowId },
    });
  }

  /**
   * Get workflow by ID with nodes and edges
   */
  static async getWorkflow(
    workflowId: string,
    userId: string
  ): Promise<
    | (user_workflows & {
        nodes: workflow_nodes[];
        edges: workflow_edges[];
      })
    | null
  > {
    return await prisma.user_workflows.findFirst({
      where: {
        id: workflowId,
        OR: [{ userId }, { isPublic: true }],
      },
      include: {
        nodes: {
          orderBy: { order: 'asc' },
        },
        edges: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * List user's workflows
   */
  static async listWorkflows(userId: string, includePublic = false): Promise<user_workflows[]> {
    return await prisma.user_workflows.findMany({
      where: includePublic
        ? {
            OR: [{ userId }, { isPublic: true }],
          }
        : { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ================================
  // WORKFLOW NODES
  // ================================

  /**
   * Add node to workflow
   */
  static async addNode(
    workflowId: string,
    userId: string,
    data: WorkflowNodeInput
  ): Promise<workflow_nodes> {
    // Verify ownership
    const workflow = await prisma.user_workflows.findFirst({
      where: { id: workflowId, userId },
    });

    if (!workflow) {
      throw new Error('Workflow not found or unauthorized');
    }

    return await prisma.workflow_nodes.create({
      data: {
        workflowId,
        type: data.type,
        label: data.label,
        position: data.position,
        config: data.config as Prisma.InputJsonValue,
        order: data.order ?? 0,
      },
    });
  }

  /**
   * Update workflow node
   */
  static async updateNode(
    nodeId: string,
    userId: string,
    data: Partial<WorkflowNodeInput>
  ): Promise<workflow_nodes> {
    // Verify ownership through workflow
    const node = await prisma.workflow_nodes.findFirst({
      where: {
        id: nodeId,
        workflow: { userId },
      },
    });

    if (!node) {
      throw new Error('Node not found or unauthorized');
    }

    const updateData: Prisma.workflow_nodesUpdateInput = {};

    if (data.type) {
      updateData.type = data.type;
    }
    if (data.label) {
      updateData.label = data.label;
    }
    if (data.position) {
      updateData.position = data.position;
    }
    if (data.config !== undefined) {
      updateData.config = data.config ? (data.config as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
    if (data.order !== undefined) {
      updateData.order = data.order;
    }

    return await prisma.workflow_nodes.update({
      where: { id: nodeId },
      data: updateData,
    });
  }

  /**
   * Delete workflow node
   */
  static async deleteNode(nodeId: string, userId: string): Promise<void> {
    const node = await prisma.workflow_nodes.findFirst({
      where: {
        id: nodeId,
        workflow: { userId },
      },
    });

    if (!node) {
      throw new Error('Node not found or unauthorized');
    }

    await prisma.workflow_nodes.delete({
      where: { id: nodeId },
    });
  }

  // ================================
  // WORKFLOW EDGES
  // ================================

  /**
   * Add edge to workflow
   */
  static async addEdge(
    workflowId: string,
    userId: string,
    data: WorkflowEdgeInput
  ): Promise<workflow_edges> {
    // Verify ownership
    const workflow = await prisma.user_workflows.findFirst({
      where: { id: workflowId, userId },
    });

    if (!workflow) {
      throw new Error('Workflow not found or unauthorized');
    }

    // Verify nodes exist in this workflow
    const [sourceNode, targetNode] = await Promise.all([
      prisma.workflow_nodes.findFirst({
        where: { id: data.sourceId, workflowId },
      }),
      prisma.workflow_nodes.findFirst({
        where: { id: data.targetId, workflowId },
      }),
    ]);

    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found in workflow');
    }

    return await prisma.workflow_edges.create({
      data: {
        workflowId,
        sourceId: data.sourceId,
        targetId: data.targetId,
        label: data.label,
        condition: data.condition ? (data.condition as Prisma.InputJsonValue) : Prisma.JsonNull,
        order: data.order ?? 0,
      },
    });
  }

  /**
   * Update workflow edge
   */
  static async updateEdge(
    edgeId: string,
    userId: string,
    data: Partial<Omit<WorkflowEdgeInput, 'sourceId' | 'targetId'>>
  ): Promise<workflow_edges> {
    const edge = await prisma.workflow_edges.findFirst({
      where: {
        id: edgeId,
        workflow: { userId },
      },
    });

    if (!edge) {
      throw new Error('Edge not found or unauthorized');
    }

    const updateData: Prisma.workflow_edgesUpdateInput = {};

    if (data.label !== undefined) {
      updateData.label = data.label;
    }
    if (data.condition !== undefined) {
      updateData.condition = data.condition
        ? (data.condition as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (data.order !== undefined) {
      updateData.order = data.order;
    }

    return await prisma.workflow_edges.update({
      where: { id: edgeId },
      data: updateData,
    });
  }

  /**
   * Delete workflow edge
   */
  static async deleteEdge(edgeId: string, userId: string): Promise<void> {
    const edge = await prisma.workflow_edges.findFirst({
      where: {
        id: edgeId,
        workflow: { userId },
      },
    });

    if (!edge) {
      throw new Error('Edge not found or unauthorized');
    }

    await prisma.workflow_edges.delete({
      where: { id: edgeId },
    });
  }

  /**
   * Deploy a workflow (mark as active)
   */
  static async deployWorkflow(workflowId: string, userId: string): Promise<user_workflows> {
    const workflow = await this.getWorkflow(workflowId, userId);

    if (!workflow) {
      throw new Error('Workflow not found or unauthorized');
    }

    // Validate workflow has nodes and edges
    if (workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    if (!workflow.entryNodeId) {
      throw new Error('Workflow must have an entry node');
    }

    // Code generation will be handled by CodeGeneratorService
    return await prisma.user_workflows.update({
      where: { id: workflowId },
      data: {
        isActive: true,
        deployedAt: new Date(),
      },
    });
  }
}
