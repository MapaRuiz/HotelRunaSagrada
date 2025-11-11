package com.runasagrada.hotelapi.security;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.runasagrada.hotelapi.model.Role;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.repository.UserRepository;

@Service
public class CustomUserDetailService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User userDB = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(userDB.getEmail(),
                userDB.getPassword(), mapToGrantedAuthorities(userDB.getRoles()));

        return userDetails;
    }

    // Usuario -> UserDetails

    // Rol que tenemos en la BD
    private Collection<GrantedAuthority> mapToGrantedAuthorities(Collection<Role> roles) {
        return roles.stream().map(role -> new SimpleGrantedAuthority(role.getName())).collect(Collectors.toList());
    }

    public User clientDataToUser(User user, String roleName) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return user;
    }

}
