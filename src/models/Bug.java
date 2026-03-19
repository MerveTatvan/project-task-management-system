package models;

// Bug sınıfı, standart görev sınıfından kalıtım (inheritance) alır [cite: 570]
public class Bug extends Task {
    private String severity; // Ciddiyet seviyesi [cite: 523]
    private String reproductionSteps; // Hatayı tekrarlama adımları [cite: 523]

    public Bug(String title, String severity, String reproductionSteps) {
        super(title);
        this.severity = severity;
        this.reproductionSteps = reproductionSteps;
    }

    // Sadece Developer rolünün yapabileceği hata çözme işlemi [cite: 524]
    public void fixBug() { 
        this.updateStatus("Çözüldü");
    }
}
