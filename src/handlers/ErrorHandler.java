package handlers;

public class ErrorHandler {
    // Hatayı sebep olan alanıyla loglar [cite: 562]
    public void logError(String errorType, String invalidField) {
        System.out.println("LOG [" + errorType + "]: Hatalı alan - " + invalidField);
    }

    // Kullanıcının ekranında uyarı mesajı (showErrorMessage) gösterir [cite: 563]
    public void showErrorMessage(String message) {
        System.out.println("HATA UYARISI: " + message);
    }
}
