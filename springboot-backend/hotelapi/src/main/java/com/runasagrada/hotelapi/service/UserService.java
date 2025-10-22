package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.User;
import java.util.List;

public interface UserService {
    User register(User u, String roleName);

    User login(String email, String password);

    User me(Integer id);

    User updateMe(Integer id, User partial, boolean allowEmailChange);

    List<User> findAll();

    void delete(Integer id);

    User updateByAdmin(Integer id, User partial, List<String> roleNames);

    void deleteCascade(Integer id);

    boolean existsByEmail(String email);

    boolean existsByNationalId(String nationalId);

    double[] usersSummary();
}
