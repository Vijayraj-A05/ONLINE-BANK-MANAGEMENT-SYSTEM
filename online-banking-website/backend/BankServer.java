package backend;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Scanner;

public class BankServer {

    public static void main(String[] args) throws IOException {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // Define API Routes
        server.createContext("/api/login", new LoginHandler());
        server.createContext("/api/balance", new BalanceHandler());
        server.createContext("/api/deposit", new DepositHandler());
        server.createContext("/api/withdraw", new WithdrawHandler());
        server.createContext("/api/transactions", new TransactionsHandler());

        server.setExecutor(null); // Default executor
        System.out.println("Bank Server started on port " + port);
        server.start();
    }

    // --- Helper for CORS and Sending Responses ---
    private static void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        // Add CORS Headers to allow frontend communication
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

        exchange.sendResponseHeaders(statusCode, response.length());
        OutputStream os = exchange.getResponseBody();
        os.write(response.getBytes(StandardCharsets.UTF_8));
        os.close();
    }

    // --- Base Handler to handle OPTIONS pre-flight requests ---
    static abstract class BaseHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 204, ""); // No content for OPTIONS
                return;
            }
            handleRequest(exchange);
        }
        abstract void handleRequest(HttpExchange exchange) throws IOException;
    }

    // --- Handlers ---

    static class LoginHandler extends BaseHandler {
        @Override
        void handleRequest(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String body = readBody(exchange);
                String username = extractJsonValue(body, "username");
                String password = extractJsonValue(body, "password");

                if (BankService.authenticate(username, password)) {
                    String jsonResponse = "{\"success\": true, \"message\": \"Login successful\", \"username\": \"" + username + "\"}";
                    sendResponse(exchange, 200, jsonResponse);
                } else {
                    String jsonResponse = "{\"success\": false, \"message\": \"Invalid credentials\"}";
                    sendResponse(exchange, 401, jsonResponse);
                }
            } else {
                sendResponse(exchange, 405, "Method Not Allowed");
            }
        }
    }

    static class BalanceHandler extends BaseHandler {
        @Override
        void handleRequest(HttpExchange exchange) throws IOException {
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                // Parse username from query: /api/balance?username=user1
                String query = exchange.getRequestURI().getQuery();
                String username = getQueryParam(query, "username");

                if (username != null) {
                    double balance = BankService.getBalance(username);
                    String jsonResponse = "{\"success\": true, \"balance\": " + balance + "}";
                    sendResponse(exchange, 200, jsonResponse);
                } else {
                    sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Missing username\"}");
                }
            } else {
                sendResponse(exchange, 405, "Method Not Allowed");
            }
        }
    }

    static class DepositHandler extends BaseHandler {
        @Override
        void handleRequest(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String body = readBody(exchange);
                String username = extractJsonValue(body, "username");
                String amountStr = extractJsonValue(body, "amount");

                try {
                    double amount = Double.parseDouble(amountStr);
                    if (BankService.deposit(username, amount)) {
                        double newBalance = BankService.getBalance(username);
                        String jsonResponse = "{\"success\": true, \"message\": \"Deposit successful\", \"newBalance\": " + newBalance + "}";
                        sendResponse(exchange, 200, jsonResponse);
                    } else {
                        sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Deposit failed\"}");
                    }
                } catch (Exception e) {
                    sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Invalid amount\"}");
                }
            } else {
                sendResponse(exchange, 405, "Method Not Allowed");
            }
        }
    }

    static class WithdrawHandler extends BaseHandler {
        @Override
        void handleRequest(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String body = readBody(exchange);
                String username = extractJsonValue(body, "username");
                String amountStr = extractJsonValue(body, "amount");

                try {
                    double amount = Double.parseDouble(amountStr);
                    if (BankService.withdraw(username, amount)) {
                        double newBalance = BankService.getBalance(username);
                        String jsonResponse = "{\"success\": true, \"message\": \"Withdrawal successful\", \"newBalance\": " + newBalance + "}";
                        sendResponse(exchange, 200, jsonResponse);
                    } else {
                        sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Insufficient funds\"}");
                    }
                } catch (Exception e) {
                    sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Invalid amount\"}");
                }
            } else {
                sendResponse(exchange, 405, "Method Not Allowed");
            }
        }
    }

    static class TransactionsHandler extends BaseHandler {
        @Override
        void handleRequest(HttpExchange exchange) throws IOException {
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                String query = exchange.getRequestURI().getQuery();
                String username = getQueryParam(query, "username");

                if (username != null) {
                    List<BankService.Transaction> transactions = BankService.getTransactions(username);
                    // Build JSON array manually
                    StringBuilder jsonBuilder = new StringBuilder();
                    jsonBuilder.append("{\"success\": true, \"transactions\": [");
                    for (int i = 0; i < transactions.size(); i++) {
                        BankService.Transaction t = transactions.get(i);
                        jsonBuilder.append("{");
                        jsonBuilder.append("\"type\": \"").append(t.type).append("\",");
                        jsonBuilder.append("\"amount\": ").append(t.amount).append(",");
                        jsonBuilder.append("\"date\": \"").append(t.date).append("\"");
                        jsonBuilder.append("}");
                        if (i < transactions.size() - 1) jsonBuilder.append(",");
                    }
                    jsonBuilder.append("]}");
                    
                    sendResponse(exchange, 200, jsonBuilder.toString());
                } else {
                    sendResponse(exchange, 400, "{\"success\": false, \"message\": \"Missing username\"}");
                }
            } else {
                sendResponse(exchange, 405, "Method Not Allowed");
            }
        }
    }

    // --- Utilities ---

    private static String readBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        Scanner scanner = new Scanner(is, StandardCharsets.UTF_8.name());
        return scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
    }

    // Very basic JSON parser for "key": "value" or "key": value
    // Assumes simple flat JSON object
    private static String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\":";
        int startIndex = json.indexOf(searchKey);
        if (startIndex == -1) return null;

        startIndex += searchKey.length();
        
        // Skip whitespace
        while (startIndex < json.length() && Character.isWhitespace(json.charAt(startIndex))) {
            startIndex++;
        }

        char firstChar = json.charAt(startIndex);
        int endIndex;
        
        if (firstChar == '"') {
            // String value
            startIndex++; // skip opening quote
            endIndex = json.indexOf("\"", startIndex);
            if (endIndex == -1) return null;
            return json.substring(startIndex, endIndex);
        } else {
            // Number or boolean value
            endIndex = startIndex;
            while (endIndex < json.length() && (Character.isDigit(json.charAt(endIndex)) || json.charAt(endIndex) == '.' || Character.isLetter(json.charAt(endIndex)))) {
                endIndex++;
            }
            return json.substring(startIndex, endIndex);
        }
    }

    private static String getQueryParam(String query, String param) {
        if (query == null) return null;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=");
            if (keyValue.length == 2 && keyValue[0].equals(param)) {
                return keyValue[1];
            }
        }
        return null;
    }
}
