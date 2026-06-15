package m.MDSUI; 

import com.google.gson.JsonObject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ApiService {
    private static final String BASE_URL = "http://localhost:3000/api";
    private final HttpClient client = HttpClient.newHttpClient();
    
    public String createAccount(String nume, String email, String parola, int nivelCunostinte, int oreDisponibileZi) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("nume", nume);
        body.addProperty("email", email);
        body.addProperty("parola", parola);
        body.addProperty("nivel_cunostinte", nivelCunostinte);
        body.addProperty("ore_disponibile_zi", oreDisponibileZi);
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/utilizatori"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
            .build();
        
        HttpResponse<String> response = client.send(
            request, HttpResponse.BodyHandlers.ofString()
        );
        
        if (response.statusCode() == 201) {
            return response.body();
        } else {
            throw new RuntimeException(
                "Eroare " + response.statusCode() + ": " + response.body()
            );
        }
    }
    
    public String deleteAccount(String email, String parola) throws Exception {
    JsonObject body = new JsonObject();
    body.addProperty("email", email);
    body.addProperty("parola", parola);
    
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/utilizatori"))
        .header("Content-Type", "application/json")
        .method("DELETE", HttpRequest.BodyPublishers.ofString(body.toString()))
        .build();
    
    HttpResponse<String> response = client.send(
        request, HttpResponse.BodyHandlers.ofString()
    );
    
    if (response.statusCode() == 200) {
        return response.body();
    } else {
        throw new RuntimeException(
            "Eroare " + response.statusCode() + ": " + response.body()
        );
    }
}
    public String estimeazaCompetenta(String denumire, String nivel) throws Exception {
    JsonObject body = new JsonObject();
    body.addProperty("denumire_competenta", denumire);
    body.addProperty("nivel_cunostinte", nivel);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/agent/estimare-competenta"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
        .build();

    HttpResponse<String> response = client.send(
        request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() == 200) {
        return response.body();   // JSON: { "estimare": "..." }
    } else {
        throw new RuntimeException("Eroare " + response.statusCode() + ": " + response.body());
    }
} 
    public String genereazaProgram(int userId) throws Exception {
    JsonObject body = new JsonObject();
    body.addProperty("user_id", userId);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/agent/program"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
        .build();

    HttpResponse<String> response = client.send(
        request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() == 200) {
        return response.body();
    } else {
        throw new RuntimeException("Eroare " + response.statusCode() + ": " + response.body());
    }
}
    public String login(String email, String parola) throws Exception {
    JsonObject body = new JsonObject();
    body.addProperty("email", email);
    body.addProperty("parola", parola);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/login"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
        .build();

    HttpResponse<String> response = client.send(
        request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() == 200) {
        return response.body();
    } else {
        throw new RuntimeException("Eroare " + response.statusCode() + ": " + response.body());
    }
}
    public String adaugaCompetenta(int userId, String denumire, int oreEstimate) throws Exception {
    JsonObject body = new JsonObject();
    body.addProperty("user_id", userId);
    body.addProperty("denumire", denumire);
    body.addProperty("ore_estimate", oreEstimate);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/competente"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
        .build();

    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() == 201) {
        return response.body();
    } else {
        throw new RuntimeException("Eroare " + response.statusCode() + ": " + response.body());
    }
}

public String getCompetente(int userId) throws Exception {
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/competente/" + userId))
        .GET()
        .build();

    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() == 200) {
        return response.body();
    } else {
        throw new RuntimeException("Eroare " + response.statusCode() + ": " + response.body());
    }
}
public String updateAccount(int userId, String nume, String email, int nivel, int ore) throws Exception {
    JsonObject body = new JsonObject();
    body.addProperty("nume", nume);
    body.addProperty("email", email);
    body.addProperty("nivel_cunostinte", nivel);
    body.addProperty("ore_disponibile_zi", ore);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/utilizatori/" + userId))
        .header("Content-Type", "application/json")
        .PUT(HttpRequest.BodyPublishers.ofString(body.toString()))
        .build();

    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() == 200) {
        return response.body();
    } else {
        throw new RuntimeException("Eroare " + response.statusCode() + ": " + response.body());
    }
}
public String changePassword(int userId, String parolaVeche, String parolaNoua) throws Exception {
    JsonObject body = new JsonObject();
    body.addProperty("parola_veche", parolaVeche);
    body.addProperty("parola_noua", parolaNoua);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/utilizatori/" + userId + "/parola"))
        .header("Content-Type", "application/json")
        .PUT(HttpRequest.BodyPublishers.ofString(body.toString()))
        .build();

    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() == 200) {
        return response.body();
    } else {
        throw new RuntimeException("Eroare " + response.statusCode() + ": " + response.body());
    }
}
public String adaugaStudiu(int competentaId, int ore) throws Exception {
    JsonObject body = new JsonObject();
    body.addProperty("ore", ore);
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/competente/" + competentaId + "/studiu"))
        .header("Content-Type", "application/json")
        .PUT(HttpRequest.BodyPublishers.ofString(body.toString()))
        .build();
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() == 200) return response.body();
    else throw new RuntimeException("Eroare " + response.statusCode() + ": " + response.body());
}
}

