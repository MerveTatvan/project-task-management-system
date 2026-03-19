package models;
import java.util.ArrayList;
import java.util.List;

public class Task {
    private String title;
    private String status;
    // Composition ilişkisi: Bir görevin içinde yorumlar listesi bulunur [cite: 571]
    private List<Comment> comments; 

    public Task(String title) {
        this.title = title;
        this.status = "Bekliyor";
        this.comments = new ArrayList<>();
    }

    public void updateStatus(String newStatus) {
        this.status = newStatus;
    }

    public void addComment(Comment comment) {
        this.comments.add(comment);
    }
    
    public String getTitle() { return title; }
}
