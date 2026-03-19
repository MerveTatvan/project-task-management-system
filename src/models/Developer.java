package models;

// Developer, Worker'dan miras alır 
public class Developer extends Worker {
    
    public Developer(String name) {
        super(name);
    }

    // Geliştiricinin kodu yükleyip hatayı çözmesi [cite: 609]
    public void submitCode(Bug bug) {
        // ... kodun sisteme yüklenme işlemleri ...
        bug.fixBug(); // Hatanın statüsü Çözüldü olarak işaretlenir [cite: 639]
    }
}
