import { NextRequest, NextResponse } from "next/server";
import { getTasksCollection, getWorkspacesCollection, getUsersCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Get workspace analytics for member contribution comparison
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const firebaseUid = request.headers.get("x-firebase-uid");

        if (!firebaseUid) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const workspacesCollection = await getWorkspacesCollection();
        const tasksCollection = await getTasksCollection();
        const usersCollection = await getUsersCollection();

        // Verify user has access
        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        const isMember = workspace.members.some(
            (member: any) => member.userId === firebaseUid
        );

        if (!isMember) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Get all tasks in workspace
        const allTasks = await tasksCollection
            .find({ workspaceId: new ObjectId(params.id) })
            .toArray();

        // Get member UIDs
        const memberUids = workspace.members.map((m: any) => m.userId);

        // Fetch user details
        const memberUsers = await usersCollection
            .find({ firebaseUid: { $in: memberUids } })
            .toArray();

        const userMap = new Map();
        memberUsers.forEach((user) => {
            userMap.set(user.firebaseUid, user);
        });

        // Calculate statistics for each member
        const memberStats = workspace.members.map((member: any) => {
            const user = userMap.get(member.userId);
            // Include tasks that are either assigned to OR claimed by the member
            const memberTasks = allTasks.filter((t: any) =>
                t.assignedTo === member.userId || t.claimedBy === member.userId
            );
            const completedTasks = memberTasks.filter((t: any) => t.status === "completed");
            const inProgressTasks = memberTasks.filter((t: any) => t.status === "in-progress");
            const todoTasks = memberTasks.filter((t: any) => t.status === "todo");

            return {
                userId: member.userId,
                name: user?.displayName || user?.email || "Unknown",
                email: user?.email || "",
                photoURL: user?.photoURL || null,
                role: member.role,
                tasksTotal: memberTasks.length,
                tasksCompleted: completedTasks.length,
                tasksInProgress: inProgressTasks.length,
                tasksTodo: todoTasks.length,
                completionRate: memberTasks.length > 0
                    ? Math.round((completedTasks.length / memberTasks.length) * 100)
                    : 0,
            };
        });

        // Sort by completed tasks
        memberStats.sort((a: any, b: any) => b.tasksCompleted - a.tasksCompleted);

        // Calculate timeline data (tasks completed per week for last 4 weeks)
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const completedTasksWithDates = allTasks.filter(
            (t: any) => t.status === "completed" && t.completedAt
        );

        // Group by week
        const weeklyData = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - (i * 7));

            const weekLabel = `Week ${4 - i}`;
            const weekTasks = completedTasksWithDates.filter((t: any) => {
                const completedDate = new Date(t.completedAt);
                return completedDate >= weekStart && completedDate < weekEnd;
            });

            weeklyData.push({
                week: weekLabel,
                tasks: weekTasks.length,
            });
        }

        return NextResponse.json({
            memberStats,
            weeklyData,
            totalTasks: allTasks.length,
            completedTasks: allTasks.filter((t: any) => t.status === "completed").length,
            inProgressTasks: allTasks.filter((t: any) => t.status === "in-progress").length,
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
