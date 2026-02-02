package backend;

import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class BankService {

    // --- Data Models ---
    public static class Transaction {
        public String type;
        public double amount;
        public String date;

        public Transaction(String type, double amount) {
            this.type = type;
            this.amount = amount;
            this.date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        }
    }

    public static class User {
        public String username;
        public String password;
        public double balance;
        public List<Transaction> transactions;

        public User(String username, String password, double balance) {
            this.username = username;
            this.password = password;
            this.balance = balance;
            this.transactions = new ArrayList<>();
        }
    }

    // --- In-Memory Database ---
    private static final Map<String, User> users = new HashMap<>();

    static {
        // Pre-populate with a dummy user
        // Username: user1, Password: password123, Initial Balance: 1000.0
        users.put("user1", new User("user1", "password123", 1000.0));
        System.out.println("DEBUG: User 'user1' (password123) created with balance 1000.0");
    }

    // --- Business Logic ---

    public static boolean authenticate(String username, String password) {
        return username.equals("user1") && password.equals("password123");
    }

    public static double getBalance(String username) {
        User user = users.get(username);
        return user != null ? user.balance : 0.0;
    }

    public static boolean deposit(String username, double amount) {
        User user = users.get(username);
        if (user != null && amount > 0) {
            user.balance += amount;
            user.transactions.add(0, new Transaction("DEPOSIT", amount)); // Add to top
            return true;
        }
        return false;
    }

    public static boolean withdraw(String username, double amount) {
        User user = users.get(username);
        if (user != null && amount > 0 && user.balance >= amount) {
            user.balance -= amount;
            user.transactions.add(0, new Transaction("WITHDRAW", amount)); // Add to top
            return true;
        }
        return false;
    }

    public static List<Transaction> getTransactions(String username) {
        User user = users.get(username);
        return user != null ? user.transactions : new ArrayList<>();
    }
}
