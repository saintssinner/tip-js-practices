export function getVisibleTasks(tasks, filter = "all") {
  switch (filter) {
    case "pending":
      return tasks.filter((task) => !task.completed);
    case "completed":
      return tasks.filter((task) => task.completed);
    case "all":
    default:
      return [...tasks];
  }
}