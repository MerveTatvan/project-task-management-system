export default function ProjectsPage() {
  const projects = [
    { id: 1, name: "Website Redesign", status: "Active" },
    { id: 2, name: "Mobile App", status: "In Progress" },
    { id: 3, name: "Backend API", status: "Completed" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Projects</h1>

      <div className="grid gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">
              {project.name}
            </h2>

            <p className="text-gray-500 mt-1">
              Status: {project.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}