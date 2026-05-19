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
}