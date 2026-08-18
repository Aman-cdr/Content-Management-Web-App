// Pure helpers for deriving Creator Dashboard widgets from Content/PublishJob data.
// Kept isolated from the page component (no hooks, no fetching) so the categorization
// rules live in exactly one place instead of being re-implemented per widget.

const INACTIVE_STATUSES = new Set(["published", "archived", "scheduled"]);

function isBacklogItem(content) {
  if (content.isDeleted) return false;
  return !INACTIVE_STATUSES.has((content.status || "").toLowerCase());
}

function hasScript(content) {
  return !!content.script?.trim();
}

function hasThumbnail(content) {
  return !!(
    content.thumbnail ||
    content.thumbnails?.youtube ||
    content.thumbnails?.instagram ||
    content.thumbnails?.shorts
  );
}

function hasStarted(content) {
  return !!(content.description?.trim() || hasThumbnail(content));
}

/** Backlog content overdue or due today. */
export function getTodaysTasks(contents) {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return contents
    .filter((c) => isBacklogItem(c) && c.dueDate && new Date(c.dueDate) <= endOfToday)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

/** Backlog content with nothing started yet — pure ideas. */
export function getIdeasWaiting(contents) {
  return contents.filter((c) => isBacklogItem(c) && !hasScript(c) && !hasStarted(c));
}

/** Backlog content that's been started but still needs a script. */
export function getScriptsPending(contents) {
  return contents.filter((c) => isBacklogItem(c) && !hasScript(c) && hasStarted(c));
}

/** Backlog content with a script written but no thumbnail yet. */
export function getThumbnailsPending(contents) {
  return contents.filter((c) => isBacklogItem(c) && hasScript(c) && !hasThumbnail(c));
}

/** Content published in the current calendar month (for goal tracking). */
export function getPublishedThisMonth(contents) {
  const now = new Date();
  return contents.filter((c) => {
    if ((c.status || "").toLowerCase() !== "published") return false;
    const d = c.publishedDate ? new Date(c.publishedDate) : c.updatedAt ? new Date(c.updatedAt) : null;
    return !!d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}

/** Scheduled publish jobs still in the future, soonest first. */
export function getUpcomingJobs(jobs, limit = 5) {
  const now = Date.now();
  return jobs
    .filter((j) => j.status === "scheduled" && new Date(j.scheduledAt).getTime() > now)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, limit);
}
