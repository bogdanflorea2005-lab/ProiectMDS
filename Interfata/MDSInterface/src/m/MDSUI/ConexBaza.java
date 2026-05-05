package m.MDSUI;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class ConexBaza {
    
    private static final String URL = "jdbc:oracle:thin:@localhost:1521:xe";
    private static final String USER = "user_test"; 
    private static final String PASS = "12345"; 

    public static Connection getConexiune() {
        try {
  
            Class.forName("oracle.jdbc.driver.OracleDriver");
           
            Connection conn = DriverManager.getConnection(URL, USER, PASS);
            return conn;
            
        } catch (ClassNotFoundException e) {
            return null;
        } catch (SQLException e) {
            System.out.println("Eroare la conectare: " + e.getMessage());
            return null;
        }
    }
}