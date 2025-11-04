package com.runasagrada.hotelapi.e2e;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.WindowType;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
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
            this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @Test
    public void newUserRegisterUseCase() throws InterruptedException {
        
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
        By.xpath("/html/body/app-root/app-register/div/div/form/button")
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
    

        // Ahora el usuario se loguea con su nueva cuenta
        driver.get(BASE_URL + "/login");
        login(driver, wait, uniqueEmail, "clave123", false);




        //Fechas de la primera reserva
        LocalDate hoy = LocalDate.now();
        LocalDate checkIn = hoy.plusWeeks(1);
        LocalDate checkOut = checkIn.plusDays(2);

        // Primera reserva
        driver.get(BASE_URL + "/hotel/1");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//*[contains(text(),'Elige tu estilo')]")));

        WebElement primerTipoHabitacion = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("/html/body/app-root/app-hotel-detail/div/app-hotel-rooms/section/div/div/div/a[1]/div/div/span[2]")
                )
        );
        ((JavascriptExecutor) driver)
                .executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", primerTipoHabitacion);

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("section.reserve-card form")));

        WebElement checkInInput = driver.findElement(By.id("checkIn"));
        WebElement checkOutInput = driver.findElement(By.id("checkOut"));
        WebElement btnReservar = driver.findElement(By.cssSelector("button.primary[type='submit']"));

        // Asignar fechas 
        JavascriptExecutor jes = (JavascriptExecutor) driver;
        jes.executeScript("arguments[0].value='" + checkIn + "'; arguments[0].dispatchEvent(new Event('input'));", checkInInput);
        jes.executeScript("arguments[0].value='" + checkOut + "'; arguments[0].dispatchEvent(new Event('input'));", checkOutInput);

       
        wait.until(ExpectedConditions.elementToBeClickable(btnReservar));
        jes.executeScript("arguments[0].click();", btnReservar);

        
        
        WebElement summaryContainer = wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.cssSelector("div.reservation-summary-container")
        ));

        
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector("div.loading-overlay")));

        
        WebElement continuePaymentBtn = wait.until(driver -> {
            WebElement btn = driver.findElement(By.xpath("/html/body/app-root/app-reservation-summary/div/div/div[3]/div[1]/button"));
            return (btn.isDisplayed() && btn.isEnabled()) ? btn : null;
        });



        
        ((JavascriptExecutor) driver).executeScript(
            "arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", 
            continuePaymentBtn
        );

 // --- Click en "Add Payment" ---
WebElement addPaymentBtn = wait.until(
    ExpectedConditions.presenceOfElementLocated(By.xpath("/html/body/app-root/app-payment/div/div/div[3]/div[1]/div[1]/div/button"))
);
((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true); arguments[0].click();", addPaymentBtn);

wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector("div.loading-overlay")));

int attempts = 0;
while(attempts < 3){
    try{
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true); arguments[0].click();", addPaymentBtn);
        break;
    }catch(Exception e){
        Thread.sleep(500);
        attempts++;
    }
}



// ---Esperar que aparezca el input del número de tarjeta ---
WebElement cardNumber = wait.until(
    ExpectedConditions.visibilityOfElementLocated(
        By.cssSelector("input[placeholder='1234 5678 9012 3456']")
    )
);
cardNumber.sendKeys("4111111111111111");

// Completar los demás campos ---
WebElement cardExpiry = driver.findElement(By.cssSelector("input[placeholder='MM/YY']"));
cardExpiry.sendKeys("12/30");

WebElement cardCVV = driver.findElement(By.cssSelector("input[placeholder='123']"));
cardCVV.sendKeys("123");

WebElement cardHolder = driver.findElement(By.cssSelector("input[placeholder='Como aparece en la tarjeta']"));
cardHolder.sendKeys("Laura Test");

WebElement billingAddress = driver.findElement(By.cssSelector("textarea.form-input"));
billingAddress.sendKeys("Calle Falsa 123, Bogotá");


WebElement payButton = wait.until(
    ExpectedConditions.presenceOfElementLocated(
        By.xpath("/html/body/app-root/app-payment/div/div/div[3]/div[1]/button")
    )
);

// Scroll 
JavascriptExecutor jas = (JavascriptExecutor) driver;
jas.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", payButton);

// Esperar que desaparezca overlay/animación de carga
WebDriverWait waitOverlay = new WebDriverWait(driver, Duration.ofSeconds(20));
waitOverlay.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector("div.loading-overlay, div.spinner")));

// Reintentar click un par de veces si algo falla
int attemptas = 0;
while(attemptas < 3){
    try{
        jas.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", payButton);
        break;
    }catch(Exception e){
        Thread.sleep(500);
        attemptas++;
    }
}

// --- Esperar que desaparezca spinner ---

wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector("div.loading-state, div.spinner")));

// Esperar que aparezca la sección de la reserva
WebElement reservationSection = wait.until(
    ExpectedConditions.visibilityOfElementLocated(By.cssSelector("div.confirmation-content"))
);


// --- Obtener el número de habitación asignada ---
WebElement firstRoomAssigned = reservationSection.findElement(
    By.xpath(".//div[@class='section-card']//div[@class='detail-row'][span[text()='Habitación:']]/span[@class='detail-value']")
);

String firstRoomNumber = firstRoomAssigned.getText();
System.out.println("Primera habitación asignada: " + firstRoomNumber);


/////////////segunda reserva /////////////



// --- Fechas de la segunda reserva (intersectan con la primera) ---
LocalDate secondCheckIn = checkIn;
LocalDate secondCheckOut = checkOut;

// Ir nuevamente a la misma página del hotel
driver.get(BASE_URL + "/hotel/1");
wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//*[contains(text(),'Elige tu estilo')]")));

// Esperar que carguen los tipos de habitación
List<WebElement> availableRooms = wait.until(
    d -> d.findElements(By.xpath("/html/body/app-root/app-hotel-detail/div/app-hotel-rooms/section/div/div/div/a"))
);

// Buscar una habitación cuyo número sea diferente a la primera
WebElement selectedRoom = null;
for (WebElement room : availableRooms) {
    String roomNumber = room.findElement(By.xpath(".//div/div/span[2]")).getText();
    if (!roomNumber.equals(firstRoomNumber)) {
        selectedRoom = room;
        break;
    }
}

if (selectedRoom == null) {
    throw new RuntimeException("No hay habitaciones disponibles distintas a la primera.");
}

((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", selectedRoom);


WebElement checkInInput2 = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("section.reserve-card form #checkIn")));
WebElement checkOutInput2 = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("section.reserve-card form #checkOut")));


jes.executeScript("arguments[0].value='" + secondCheckIn + "'; arguments[0].dispatchEvent(new Event('input'));", checkInInput2);
jes.executeScript("arguments[0].value='" + secondCheckOut + "'; arguments[0].dispatchEvent(new Event('input'));", checkOutInput2);

// Reservar
WebElement btnReservar2 = driver.findElement(By.cssSelector("button.primary[type='submit']"));
wait.until(ExpectedConditions.elementToBeClickable(btnReservar2));
jes.executeScript("arguments[0].click();", btnReservar2);

// Esperar reservation-summary y botón continuar con el pago
WebElement summaryContainer2 = wait.until(ExpectedConditions.visibilityOfElementLocated(
    By.cssSelector("div.reservation-summary-container")
));
wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector("div.loading-overlay")));

WebElement continuePaymentBtn2 = wait.until(d -> {
    WebElement btn = d.findElement(By.xpath("/html/body/app-root/app-reservation-summary/div/div/div[3]/div[1]/button"));
    return (btn.isDisplayed() && btn.isEnabled()) ? btn : null;
});
((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", continuePaymentBtn2);


WebElement payButton2 = wait.until(
    ExpectedConditions.presenceOfElementLocated(By.xpath("/html/body/app-root/app-payment/div/div/div[3]/div[1]/button"))
);
jes.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", payButton2);

// Esperarspinner
wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector("div.loading-state, div.spinner")));

// Esperar que aparezca la reserva
WebElement reservationSection2 = wait.until(
    ExpectedConditions.visibilityOfElementLocated(By.cssSelector("div.confirmation-content"))
);

// Obtener el número de la segunda habitación
WebElement secondRoomAssigned = reservationSection2.findElement(
    By.xpath(".//div[@class='section-card']//div[@class='detail-row'][span[text()='Habitación:']]/span[@class='detail-value']")
);

String secondRoomNumber = secondRoomAssigned.getText();
System.out.println("Segunda habitación asignada: " + secondRoomNumber);

// Asegurarnos que es diferente a la primera
assertTrue(!secondRoomNumber.equals(firstRoomNumber), "La segunda habitación no debe ser la misma que la primera.");



WebElement myReservationsBtn = reservationSection2.findElement(
    By.xpath(".//button[contains(@class,'btn-primary') and .//span[text()='Ver mis reservas']]")
);

JavascriptExecutor js2 = (JavascriptExecutor) driver;
js2.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", myReservationsBtn);


wait.until(ExpectedConditions.urlContains("/client"));
    }



private void login(WebDriver drv, WebDriverWait wt, String email, String pass, boolean asOperator) {
    if (asOperator) {
        drv.switchTo().newWindow(WindowType.TAB);
        drv.get(BASE_URL + "/login");
    }

    // Esperar a que aparezcan los campos
    wt.until(ExpectedConditions.visibilityOfElementLocated(By.id("email"))).sendKeys(email);
    drv.findElement(By.id("password")).sendKeys(pass);
    drv.findElement(By.id("btnLogin")).click();

    // Esperar a que cargue la vista 
    String expectedPath = asOperator ? "/operator" : "/client";
    wt.until(ExpectedConditions.urlContains(expectedPath));
}





}