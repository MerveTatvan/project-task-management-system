export default function TasksPage() {
  const tasks = [
    { id: 1, title: "Design UI", status: "To Do" },
    { id: 2, title: "Build API", status: "In Progress" },
    { id: 3, title: "Test App", status: "Done" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white p-4 rounded-xl shadow"
          >
            <h2 className="font-semibold">
              {task.title}
            </h2>

            <p className="text-gray-500 mt-1">
              Status: {task.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}