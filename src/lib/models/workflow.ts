export interface Workflow {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    trigger: WorkflowTrigger;
    action: WorkflowAction;
    isActive: boolean;
    runs: number;
    lastRun?: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface WorkflowTrigger {
    type: 'schedule' | 'task-event' | 'team-event' | 'comment-added';
    config: {
        // For schedule triggers
        schedule?: string; // cron expression or readable format

        // For task event triggers
        taskStatus?: 'created' | 'completed' | 'overdue' | 'status-changed';

        // For team event triggers
        teamEvent?: 'member-joined' | 'member-left';
    };
}

export interface WorkflowAction {
    type: 'send-email' | 'send-slack' | 'assign-task' | 'create-task' | 'webhook';
    config: {
        // For email actions
        emailTemplate?: string;
        emailRecipients?: 'assigned' | 'all-members' | 'specific';

        // For task assignment
        assignmentStrategy?: 'least-busy' | 'round-robin' | 'specific-member';

        // For webhook
        webhookUrl?: string;
        webhookMethod?: 'GET' | 'POST';
    };
}

export interface AITask {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    type: 'auto-assign' | 'summarize' | 'create-tasks' | 'analyze-metrics' | 'chat';
    status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
    progress?: number; // 0-100
    result?: string;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
    startedBy: string;
    cancellable: boolean;
}

export interface CreateWorkflowInput {
    workspaceId: string;
    name: string;
    description?: string;
    trigger: WorkflowTrigger;
    action: WorkflowAction;
    createdBy: string;
}

export interface UpdateWorkflowInput {
    id: string;
    name?: string;
    description?: string;
    trigger?: WorkflowTrigger;
    action?: WorkflowAction;
    isActive?: boolean;
}

export interface CreateAITaskInput {
    workspaceId: string;
    name: string;
    description: string;
    type: AITask['type'];
    startedBy: string;
    cancellable?: boolean;
}

export interface UpdateAITaskInput {
    id: string;
    status?: AITask['status'];
    progress?: number;
    result?: string;
    error?: string;
}
