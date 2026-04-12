"use client";

import { createContext, useContext, useState } from "react";

const TaskContext = createContext<any>(null);

export const TaskProvider = ({ children }: any) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Design UI", status: "todo", priority: "high", deadline: "" },
    { id: 2, title: "Build API", status: "inprogress", priority: "medium", deadline: "" },
    { id: 3, title: "Test App", status: "done", priority: "low", deadline: "" },
  ]);

  return (
    <TaskContext.Provider value={{ tasks, setTasks }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);