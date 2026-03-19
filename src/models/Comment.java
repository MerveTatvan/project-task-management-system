package models;
import java.util.Date;

public class Comment {
    private String text;
    private Date date;

    public Comment(String text) {
        this.text = text;
        this.date = new Date();
    }
    
    public String getText() {
        return text;
    }
}
