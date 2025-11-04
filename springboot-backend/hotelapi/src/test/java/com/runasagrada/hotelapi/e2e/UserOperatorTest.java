package com.runasagrada.hotelapi.e2e;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.WindowType;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import io.github.bonigarcia.wdm.WebDriverManager;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class UserOperatorTest {

    private final String BASE_URL = "http://localhost:4200";

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeEach
    void setUp() {
        WebDriverManager.chromedriver().setup();
        ChromeOptions chromeOptions = new ChromeOptions()
                .addArguments("--disable-notifications", "--disable-extensions");

        this.driver = new ChromeDriver(chromeOptions);
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(5));
    }

    @Test
    void serviceReservationUseCase() {
        // Un usuario ya registrado realiza login con su perfil
        driver.get(BASE_URL + "/login");
        login(driver, wait, "client01@demo.com", "client123");

        // Revisa sus próximas reservas
        checkReservation(driver, wait);

        // En otra Ventana ingresa un operador con su usuario y contraseña.
        loginOperator(driver, wait, "op1@hotel.com", "op123");

        // Va al perfil de reservas y activa(realiza checkin) la reserva del usuario.

        // Agrega 2 servicios a esta reserva

        // el usuario va donde el operador y decide pagar todos los servicios pendientes

    }

    private void login(WebDriver drv, WebDriverWait wait, String email, String pass) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email"))).sendKeys(email);
        drv.findElement(By.id("password")).sendKeys(pass);
        drv.findElement(By.id("btnLogin")).click();
        wait.until(ExpectedConditions.urlContains("/client"));
    }

    private void checkReservation(WebDriver drv, WebDriverWait wait) {
        wait.until(ExpectedConditions.urlContains("/client"));

        List<WebElement> reservationRows = new WebDriverWait(drv, Duration.ofSeconds(10))
                .until(driver -> {
                    List<WebElement> rows = driver.findElements(By.cssSelector(".modern-table-wrapper tbody tr"));
                    List<WebElement> dataRows = rows.stream()
                            .filter(row -> !row.findElements(By.cssSelector(".reservation-id")).isEmpty())
                            .collect(Collectors.toList());
                    return dataRows.isEmpty() ? null : dataRows;
                });

        WebElement confirmedRow = reservationRows.stream()
                .filter(row -> row
                        .findElements(By.cssSelector(".reservation-status-row .reservation-status-bg")).stream()
                        .map(WebElement::getText)
                        .map(String::trim)
                        .anyMatch(text -> "Confirmada".equalsIgnoreCase(text)))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No se encontró ninguna reserva confirmada en la tabla"));

        String room = confirmedRow.findElement(By.cssSelector(".room-row")).getText().trim();
        String checkInDate = confirmedRow.findElement(By.cssSelector(".check-in-row")).getText().trim();
        String checkOutDate = confirmedRow.findElement(By.cssSelector(".check-out-row")).getText().trim();

        assertFalse(room.isBlank(), "El nombre de la habitación no debería estar vacío");
        assertFalse(checkInDate.isBlank(), "La fecha de check-in no debería estar vacía");
        assertFalse(checkOutDate.isBlank(), "La fecha de check-out no debería estar vacía");

        assertEquals("1-101", room,
                "La reserva confirmada debería estar asignada a la habitación 1-101");

        String todayFormatted = formatDate(LocalDate.now());
        String tomorrowFormatted = formatDate(LocalDate.now().plusDays(1));

        assertEquals(todayFormatted, checkInDate, "La reserva confirmada debería tener check-in hoy");
        assertEquals(tomorrowFormatted, checkOutDate, "La reserva confirmada debería tener check-out mañana");
    }

    private static final DateTimeFormatter UI_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private String formatDate(LocalDate date) {
        return date.format(UI_DATE);
    }

    private void loginOperator(WebDriver drv, WebDriverWait wait, String email, String pass) {
        drv.switchTo().newWindow(WindowType.TAB);
        drv.get(BASE_URL + "/login");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email"))).sendKeys(email);
        drv.findElement(By.id("password")).sendKeys(pass);
        drv.findElement(By.id("btnLogin")).click();
        wait.until(ExpectedConditions.urlContains("/operator"));
    }

}
