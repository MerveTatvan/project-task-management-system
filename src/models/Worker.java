package models;

public class Worker {
    private String name;

    public Worker(String name) {
        this.name = name;
    }

    // Çalışanın görevin durumunu güncellemesi [cite: 600]
    public void updateTaskStatus(Task task, String status) {
        task.updateStatus(status);
    }

    // Çalışanın göreve yorum eklemesi [cite: 601]
    public void addCommentToTask(Task task, String commentText) {
        task.addComment(new Comment(commentText));
    }
}
