package com.runasagrada.hotelapi.e2e;

import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import static org.junit.jupiter.api.Assertions.assertTrue;


import io.github.bonigarcia.wdm.WebDriverManager;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class NewUserTest {

    private final String BASE_URL = "http://localhost:4200";

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

    @Test
    public void newUserRegisterUseCase() {
        
        //Un nuevo usuario llega al landing page
        driver.get(BASE_URL);

        //Dado que aún no cuenta con un usuario se registra en el sistema
        //pero nuestro registro solo se puede desde el login
        
        WebElement loginLink = wait.until(
            ExpectedConditions.elementToBeClickable(By.xpath("/html/body/app-root/app-landing/app-primera/section/div/div/div[2]/button"))
        );
        loginLink.click();

        // le hace click al boton del xpath al registro
        WebElement registerLink = wait.until(
            ExpectedConditions.elementToBeClickable(By.xpath("/html/body/app-root/app-login/div/div/p[2]/a"))
        );
        registerLink.click();

        // aca toca verificar q se cargo el registro
        wait.until(ExpectedConditions.urlContains("/register"));

        // La primera vez el registro sale mal debido a que no pone un correo valido
      
            WebElement nameField = wait.until(
        ExpectedConditions.visibilityOfElementLocated(By.xpath("//input[@formcontrolname='full_name']"))
    );
    nameField.sendKeys("Laura Test");

    WebElement emailField = driver.findElement(By.xpath("//input[@formcontrolname='email']"));
    emailField.sendKeys("correoinvalidoxd"); 

    WebElement phoneField = driver.findElement(By.xpath("//input[@formcontrolname='phone']"));
    phoneField.sendKeys("3001234567");

    WebElement docField = driver.findElement(By.xpath("//input[@formcontrolname='national_id']"));
    docField.sendKeys("1234567890");

    WebElement passwordField = driver.findElement(By.xpath("//input[@formcontrolname='password']"));
    passwordField.sendKeys("clave123");

    WebElement submitButton = driver.findElement(
        By.xpath("//button[contains(., 'Crear cuenta')]")
    );
    //submitButton.click(); 
    //el boton de crear cuenta esta desabilitado hasta que el formulario sea valido


    // elerror
    WebElement errorMsg = wait.until(
        ExpectedConditions.visibilityOfElementLocated(
            By.xpath("//span[contains(text(), 'Formato de email inválido.')]")
        )
    );
    assertTrue(errorMsg.isDisplayed(), "El mensaje de error de email inválido no se mostró.");


    //ahora que se registra bien

        emailField.clear();
        String uniqueEmail = "laura.prueba" + System.currentTimeMillis() + "@gmail.com";
        emailField.sendKeys(uniqueEmail);

        submitButton.click();

        wait.until(ExpectedConditions.urlContains("/login"));
        login(driver, wait, uniqueEmail, "clave123");

        
        driver.get(BASE_URL + "/hotel/1");
        wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.xpath("//*[contains(text(),'Elige tu estilo')]")));

    }




        

    


    private void login(WebDriver drv, WebDriverWait wait, String email, String pass) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email"))).sendKeys(email);
        drv.findElement(By.id("password")).sendKeys(pass);
        drv.findElement(By.id("btnLogin")).click();
        wait.until(ExpectedConditions.urlContains("/client"));
    }


}