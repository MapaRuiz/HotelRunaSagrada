package com.runasagrada.hotelapi.infrastructure.telegram;

import com.runasagrada.hotelapi.model.User;

import static com.runasagrada.hotelapi.infrastructure.telegram.TelegramBotConstants.*;

/**
 * Utility class for user role management and validation.
 */
public final class UserRoleHelper {

    private UserRoleHelper() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    /**
     * Checks if user has the specified role.
     */
    public static boolean hasRole(User user, String roleName) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().equals(roleName));
    }

    /**
     * Gets the display name for the user's primary role.
     */
    public static String getRoleDisplayName(User user) {
        if (hasRole(user, ROLE_ADMIN))
            return ROLE_DISPLAY_ADMIN;
        if (hasRole(user, ROLE_OPERATOR))
            return ROLE_DISPLAY_OPERATOR;
        if (hasRole(user, ROLE_CLIENT))
            return ROLE_DISPLAY_CLIENT;
        return ROLE_DISPLAY_USER;
    }

    /**
     * Checks if user has admin privileges.
     */
    public static boolean isAdmin(User user) {
        return hasRole(user, ROLE_ADMIN);
    }

    /**
     * Checks if user has operator privileges.
     */
    public static boolean isOperator(User user) {
        return hasRole(user, ROLE_OPERATOR);
    }

    /**
     * Checks if user has client privileges.
     */
    public static boolean isClient(User user) {
        return hasRole(user, ROLE_CLIENT);
    }

    /**
     * Checks if user can view all reservations (admin or operator).
     */
    public static boolean canViewReservations(User user) {
        return isAdmin(user) || isOperator(user);
    }
}
