package m.MDSUI;

public class Session {
    public static Integer currentUserId = null;
    public static String currentUserNume = null;
    public static String currentUserEmail = null;

    public static boolean isLoggedIn() {
        return currentUserId != null;
    }

    public static void logout() {
        currentUserId = null;
        currentUserNume = null;
        currentUserEmail = null;
    }
}