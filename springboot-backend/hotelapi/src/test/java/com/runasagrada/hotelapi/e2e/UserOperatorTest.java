package com.runasagrada.hotelapi.e2e;

import java.time.Duration;

import org.aspectj.lang.annotation.Before;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Profile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import io.github.bonigarcia.wdm.WebDriverManager;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class UserOperatorTest {

    private final String BASE_URL = "http://localhost:4200";

    private WebDriver driverUser;
    private WebDriverWait waitUser;

    private WebDriver driverOp;
    private WebDriverWait waitOp;

    @BeforeEach
    void setUp() {
        WebDriverManager.chromedriver().setup();
        ChromeOptions chromeOptions = new ChromeOptions()
                .addArguments("--disable-notifications", "--disable-extensions");

        this.driverUser = new ChromeDriver(chromeOptions);
        this.waitUser = new WebDriverWait(driverUser, Duration.ofSeconds(5));

        this.driverOp = new ChromeDriver(chromeOptions);
        this.waitOp = new WebDriverWait(driverOp, Duration.ofSeconds(5));
    }

    @Test
    void serviceReservationUseCase() {
        // Un usuario ya registrado realiza login con su perfil
        driverUser.get(BASE_URL + "/login");
        login(driverUser, waitUser, "client01@demo.com", "client123");
    }

    private void login(WebDriver drv, WebDriverWait wait, String email, String pass) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email"))).sendKeys(email);
        drv.findElement(By.id("password")).sendKeys(pass);
        drv.findElement(By.id("btnLogin")).click();
        wait.until(ExpectedConditions.urlContains("/client"));
    }
}
