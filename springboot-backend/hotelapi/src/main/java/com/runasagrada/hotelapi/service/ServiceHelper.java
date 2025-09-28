package com.runasagrada.hotelapi.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ServiceHelper {

    private final JdbcTemplate jdbc;

    public ServiceHelper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void resyncIdentity(String table, String idCol) {
        try {
            Integer max = jdbc.queryForObject(
                    "SELECT COALESCE(MAX(" + idCol + "),0) FROM " + table, Integer.class);
            int next = (max == null ? 0 : max) + 1;
            jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + idCol + " RESTART WITH " + next);
        } catch (Exception ignored) {
            // Si no es H2 u otra BD no soporta el ALTER, se ignora silenciosamente.
        }
    }
}
