package com.runasagrada.hotelapi.e2e;

import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import io.github.bonigarcia.wdm.WebDriverManager;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class NewUserTest {

    private WebDriver driver; //hace clicks
    private WebDriverWait wait; //esperar a que ocurra algo en la pagina

    @BeforeEach
    public void init(){
            WebDriverManager.chromedriver().setup();

            ChromeOptions options = new ChromeOptions();

            options.addArguments("--disable-notifications"); 
            options.addArguments("--disable-extensions");

            this.driver = new ChromeDriver(options);
            this.wait = new WebDriverWait(driver, Duration.ofSeconds(5));
    }

    
    
}