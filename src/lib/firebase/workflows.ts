import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp,
    DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import {
    Workflow,
    AITask,
    CreateWorkflowInput,
    UpdateWorkflowInput,
    CreateAITaskInput,
    UpdateAITaskInput,
} from '../models/workflow';

// Collection names
const WORKFLOWS_COLLECTION = 'workflows';
const AI_TASKS_COLLECTION = 'aiTasks';

// Helper to convert Firestore timestamp to Date
const convertTimestamps = (data: DocumentData): any => {
    const converted = { ...data };
    Object.keys(converted).forEach((key) => {
        if (converted[key] instanceof Timestamp) {
            converted[key] = converted[key].toDate();
        }
    });
    return converted;
};

// ============ WORKFLOWS ============

export async function getWorkflows(workspaceId: string): Promise<Workflow[]> {
    try {
        const q = query(
            collection(db, WORKFLOWS_COLLECTION),
            where('workspaceId', '==', workspaceId)
            // Removed orderBy to avoid Firestore composite index requirement
        );

        const querySnapshot = await getDocs(q);
        const workflows = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertTimestamps(doc.data()),
        })) as Workflow[];

        // Sort client-side by createdAt descending
        return workflows.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
            return dateB - dateA;
        });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        throw error;
    }
}

export async function getWorkflow(id: string): Promise<Workflow | null> {
    try {
        const docRef = doc(db, WORKFLOWS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...convertTimestamps(docSnap.data()),
            } as Workflow;
        }
        return null;
    } catch (error) {
        console.error('Error fetching workflow:', error);
        throw error;
    }
}

export async function createWorkflow(input: CreateWorkflowInput): Promise<string> {
    try {
        const now = new Date();
        const workflowData = {
            ...input,
            isActive: true,
            runs: 0,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
        };

        const docRef = await addDoc(collection(db, WORKFLOWS_COLLECTION), workflowData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating workflow:', error);
        throw error;
    }
}

export async function updateWorkflow(input: UpdateWorkflowInput): Promise<void> {
    try {
        const { id, ...updateData } = input;
        const docRef = doc(db, WORKFLOWS_COLLECTION, id);

        await updateDoc(docRef, {
            ...updateData,
            updatedAt: Timestamp.fromDate(new Date()),
        });
    } catch (error) {
        console.error('Error updating workflow:', error);
        throw error;
    }
}

export async function deleteWorkflow(id: string): Promise<void> {
    try {
        const docRef = doc(db, WORKFLOWS_COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting workflow:', error);
        throw error;
    }
}

export async function incrementWorkflowRuns(id: string): Promise<void> {
    try {
        const docRef = doc(db, WORKFLOWS_COLLECTION, id);
        const workflow = await getWorkflow(id);

        if (workflow) {
            await updateDoc(docRef, {
                runs: workflow.runs + 1,
                lastRun: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date()),
            });
        }
    } catch (error) {
        console.error('Error incrementing workflow runs:', error);
        throw error;
    }
}

// ============ AI TASKS ============

export async function getAITasks(
    workspaceId: string,
    statusFilter?: AITask['status']
): Promise<AITask[]> {
    try {
        let q = query(
            collection(db, AI_TASKS_COLLECTION),
            where('workspaceId', '==', workspaceId)
            // Removed orderBy to avoid Firestore composite index requirement
            // Tasks will be sorted client-side if needed
        );

        if (statusFilter) {
            q = query(q, where('status', '==', statusFilter));
        }

        const querySnapshot = await getDocs(q);
        const tasks = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertTimestamps(doc.data()),
        })) as AITask[];

        // Sort client-side by startedAt descending
        return tasks.sort((a, b) => {
            const dateA = a.startedAt instanceof Date ? a.startedAt.getTime() : 0;
            const dateB = b.startedAt instanceof Date ? b.startedAt.getTime() : 0;
            return dateB - dateA;
        });
    } catch (error) {
        console.error('Error fetching AI tasks:', error);
        throw error;
    }
}

export async function getAITask(id: string): Promise<AITask | null> {
    try {
        const docRef = doc(db, AI_TASKS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...convertTimestamps(docSnap.data()),
            } as AITask;
        }
        return null;
    } catch (error) {
        console.error('Error fetching AI task:', error);
        throw error;
    }
}

export async function createAITask(input: CreateAITaskInput): Promise<string> {
    try {
        const now = new Date();
        const aiTaskData = {
            ...input,
            status: 'in-progress' as const,
            progress: 0,
            startedAt: Timestamp.fromDate(now),
            cancellable: input.cancellable ?? true,
        };

        const docRef = await addDoc(collection(db, AI_TASKS_COLLECTION), aiTaskData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating AI task:', error);
        throw error;
    }
}

export async function updateAITask(input: UpdateAITaskInput): Promise<void> {
    try {
        const { id, ...updateData } = input;
        const docRef = doc(db, AI_TASKS_COLLECTION, id);

        const updates: any = { ...updateData };

        // Set completedAt if status is terminal
        if (updateData.status && ['completed', 'failed', 'cancelled'].includes(updateData.status)) {
            updates.completedAt = Timestamp.fromDate(new Date());
        }

        await updateDoc(docRef, updates);
    } catch (error) {
        console.error('Error updating AI task:', error);
        throw error;
    }
}

export async function cancelAITask(id: string): Promise<void> {
    try {
        await updateAITask({
            id,
            status: 'cancelled',
        });
    } catch (error) {
        console.error('Error cancelling AI task:', error);
        throw error;
    }
}
