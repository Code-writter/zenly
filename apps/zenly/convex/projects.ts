import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const getProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity()
    const user = await ctx.db.query("users").filter(q => q.eq(q.field("clerkId"), userId?.subject)).first()
    if (userId) {
      const userProjects = await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("userId"), user?._id))
        .collect();

      const systemProjects = await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("type"), "system"))
        .collect();

      return [...systemProjects, ...userProjects];
    }
    return [];
  },
});

export const getProjectByProjectId = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const userId = await ctx.auth.getUserIdentity()
    const user = await ctx.db.query("users").filter(q => q.eq(q.field("clerkId"), userId?.subject)).first()
    if (userId) {
      const project = await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("_id"), projectId))
        .collect();
      return project?.[0] || null;
    }
    return null;
  },
});

export const createAProject = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    try {
      const userId = await ctx.auth.getUserIdentity()
      const user = await ctx.db.query("users").filter(q => q.eq(q.field("clerkId"), userId?.subject)).first()
      if (user?._id) {
        const newTaskId = await ctx.db.insert("projects", {
          userId: user?._id,
          name,
          type: "user",
        });
        return newTaskId;
      }

      return null;
    } catch (err) {
      console.log("Error occurred during createAProject mutation", err);

      return null;
    }
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    try {
      const userId = await ctx.auth.getUserIdentity()
      const user = await ctx.db.query("users").filter(q => q.eq(q.field("clerkId"), userId?.subject)).first()
      if (user?._id) {
        const taskId = await ctx.db.delete(projectId);
        //query todos and map through them and delete

        return taskId;
      }

      return null;
    } catch (err) {
      console.log("Error occurred during deleteProject mutation", err);

      return null;
    }
  },
});

export const deleteProjectAndItsTasks = action({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    try {
      const allTasks = await ctx.runQuery(api.todo.getTodosByProjectId, {
        projectId,
      });

      const promises = Promise.allSettled(
        allTasks.map(async (task: Doc<"todos">) =>
          ctx.runMutation(api.todo.deleteATodo, {
            taskId: task._id,
          })
        )
      );
      const statuses = await promises;

      await ctx.runMutation(api.projects.deleteProject, {
        projectId,
      });
    } catch (err) {
      console.error("Error deleting tasks and projects", err);
    }
  },
});
