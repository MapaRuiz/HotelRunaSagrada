package com.runasagrada.hotelapi.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthEntryPoint jwtAuthEntryPoint;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .authorizeHttpRequests(
                        requests -> requests
                                .requestMatchers("/h2-console/**").permitAll()
                                .requestMatchers("/api/auth/login").permitAll()
                                .requestMatchers("/api/auth/register").permitAll()
                                .requestMatchers("/api/users/me").authenticated()
                                .requestMatchers("/api/task/**").hasAuthority("OPERATOR")
                                .requestMatchers("/api/departments/**").hasAuthority("OPERATOR")
                                .requestMatchers("/api/staff-members/**").hasAnyAuthority("OPERATOR")
                                .requestMatchers("/api/reservservice/delete/**").hasAuthority("OPERATOR")
                                .requestMatchers("/api/reservservice/add").hasAnyAuthority("OPERATOR")
                                .requestMatchers("/api/reservservice/update/**").hasAuthority("OPERATOR")
                                .requestMatchers(HttpMethod.POST, "/api/hotels").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.PUT, "/api/hotels/**").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/api/hotels/**").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/servoffering/add").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.PUT, "/api/servoffering/update/**").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/api/servoffering/delete/**").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/rooms").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.PUT, "/api/rooms/**").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/api/rooms/**").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/room-types").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.PUT, "/api/room-types/**").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/api/room-types/**").hasAuthority("ADMIN")
                                .anyRequest().permitAll())
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthEntryPoint));

        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public JWTAuthenticationFilter jwtAuthenticationFilter() {
        return new JWTAuthenticationFilter();
    }
}
