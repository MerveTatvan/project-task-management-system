package validators;

public class Validator {
    // Görev başlığının boş bırakılamayacağını denetler [cite: 561]
    public boolean validateTaskTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            return false; // Geçersiz yanıtını döner [cite: 672]
        }
        return true;
    }
}
