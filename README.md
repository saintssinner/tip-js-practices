# Технологии индустриального программирования

Учебный репозиторий практических работ по JavaScript.

## Автор

Имя: Михайлова София
Группа: ЭФБО-13-25
## 4. Переключение статуса в браузере

### Листинг 4. Обработчик переключения статуса

```javascript
function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  if (!button || !elements.list.contains(button)) return;

  const action = button.dataset.action;
  if (action !== "toggle" && action !== "delete") return;

  const card = button.closest("[data-task-id]");
  if (!card || !elements.list.contains(card)) return;

  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) return;

  if (action === "toggle") {
    const task = findTaskById(currentTasks, id);
    const result = setTaskCompleted(currentTasks, id, !task.completed);
    if (result.ok) {
      currentTasks = result.tasks;
      renderApp();
    }
  }
}

elements.list.addEventListener("click", handleTaskListClick);

## Практические работы

- [Практическая работа № 1](./practice-01/README.md)
- [Практическая работа № 2](./practice-02/README.md)
- [Практическая работа № 3](./practice-03/README.md)