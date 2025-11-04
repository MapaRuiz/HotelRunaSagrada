package com.runasagrada.hotelapi.e2e;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.Point;
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

import io.github.bonigarcia.wdm.WebDriverManager;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class UserOperatorTest {

    private final String BASE_URL = "http://localhost:4200";

    private WebDriver driver;
    private WebDriverWait wait;
    String room;
    String checkInDate;
    String checkOutDate;

    @BeforeEach
    void setUp() {
        WebDriverManager.chromedriver().setup();

        Map<String, Object> prefs = new HashMap<>();
        prefs.put("credentials_enable_service", false);
        prefs.put("profile.password_manager_enabled", false);
        prefs.put("autofill.profile_enabled", false);
        // Deshabilitar la verificación de contraseñas comprometidas
        prefs.put("profile.password_manager_leak_detection", false);
        prefs.put("safebrowsing.enabled", false);

        ChromeOptions chromeOptions = new ChromeOptions()
                .addArguments("--disable-notifications")
                .addArguments("--disable-extensions")
                .addArguments("--disable-save-password-bubble")
                .addArguments("--disable-password-manager-reauthentication")
                // Deshabilitar la detección de contraseñas comprometidas
                .addArguments("--disable-features=PasswordLeakDetection")
                .setExperimentalOption("prefs", prefs)
                .setExperimentalOption("excludeSwitches", new String[] { "enable-automation" });

        this.driver = new ChromeDriver(chromeOptions);
        this.driver.manage().window().setSize(new org.openqa.selenium.Dimension(1280, 900));
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(5));
    }

    @Test
    void serviceReservationUseCase() {
        // Un usuario ya registrado realiza login con su perfil
        driver.get(BASE_URL + "/login");
        login(driver, wait, "client01@demo.com", "client123", false);

        // Revisa sus próximas reservas
        checkReservation(driver, wait);

        // En otra Ventana ingresa un operador con su usuario y contraseña.
        login(driver, wait, "op1@hotel.com", "op123", true);

        // Va al perfil de reservas y activa (realiza checkin) la reserva del usuario.
        checkInReservation(driver, wait);

        // Agrega 2 servicios a esta reserva

        // el usuario va donde el operador y decide pagar todos los servicios pendientes

    }

    private void login(WebDriver drv, WebDriverWait wait, String email, String pass, boolean asOperator) {
        if (asOperator) {
            drv.switchTo().newWindow(WindowType.TAB);
            drv.get(BASE_URL + "/login");
        }

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email"))).sendKeys(email);
        drv.findElement(By.id("password")).sendKeys(pass);
        drv.findElement(By.id("btnLogin")).click();

        String expectedPath = asOperator ? "/operator" : "/client";
        wait.until(ExpectedConditions.urlContains(expectedPath));
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

        room = confirmedRow.findElement(By.cssSelector(".room-row")).getText().trim();
        checkInDate = confirmedRow.findElement(By.cssSelector(".check-in-row")).getText().trim();
        checkOutDate = confirmedRow.findElement(By.cssSelector(".check-out-row")).getText().trim();

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

    private void checkInReservation(WebDriver drv, WebDriverWait wait) {
        drv.get(BASE_URL + "/operator/reservation-table");

        wait.withTimeout(Duration.ofSeconds(15))
                .until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".ag-root")));

        WebElement row = wait.until(d -> locateReservationRow(d, room, checkInDate, checkOutDate, "confirmada"));
        if (row == null)
            throw new IllegalStateException("No se encontró la fila confirmada para check-in");

        ((org.openqa.selenium.JavascriptExecutor) drv)
                .executeScript("arguments[0].scrollIntoView({block:'center'});", row);

        By btnBy = By.cssSelector("app-action-buttons-cell .btn-ack");
        WebElement button = wait.until(driver -> {
            WebElement refreshed = locateReservationRow(driver, room, checkInDate, checkOutDate, "confirmada");
            if (refreshed == null)
                return null;
            List<WebElement> buttons = refreshed.findElements(btnBy);
            return buttons.isEmpty() ? null : buttons.get(0);
        });

        System.out.println("Click en: " + button.getText());
        try {
            wait.until(ExpectedConditions.elementToBeClickable(button)).click();
        } catch (Exception e) {
            ((org.openqa.selenium.JavascriptExecutor) drv).executeScript("arguments[0].click();", button);
        }

        wait.withTimeout(Duration.ofSeconds(15)).until(d -> {
            WebElement updated = locateReservationRow(d, room, checkInDate, checkOutDate, "check-in");
            if (updated == null)
                return false;
            String status = getCellText(updated, ".ag-cell[col-id='status']", ".row-reserv-status");
            return status.toLowerCase().contains("check-in");
        });
    }

    private WebElement locateReservationRow(WebDriver driver, String room, String checkInDate, String checkOutDate,
            String expectedStatus) {
        List<WebElement> rows = driver.findElements(By.cssSelector(".ag-center-cols-container .ag-row"));

        for (WebElement row : rows) {
            String roomText = getCellText(row, ".row-room", ".room-row");
            String checkInText = getCellText(row, ".row-check-in", ".check-in-row");
            String checkOutText = getCellText(row, ".row-check-out", ".check-out-row");
            String statusText = getCellText(row, ".ag-cell[col-id='status']", ".row-reserv-status");

            System.out.printf(
                    "Fila encontrada - Habitación: %s, Check-in: %s, Check-out: %s, Estado: %s%n",
                    roomText, checkInText, checkOutText, statusText);

            boolean matchesStatus = expectedStatus == null
                    || statusText.toLowerCase().contains(expectedStatus.toLowerCase());

            if (room.equals(roomText) &&
                    checkInDate.equals(checkInText) &&
                    checkOutDate.equals(checkOutText) &&
                    matchesStatus) {
                return row;
            }
        }
        return null;

    }

    private void addTwoReservationServices() {

    }

    private String getCellText(WebElement row, String... selectors) {
        for (String selector : selectors) {
            List<WebElement> cells = row.findElements(By.cssSelector(selector));
            if (!cells.isEmpty()) {
                return cells.get(0).getText().trim();
            }
        }
        return "";
    }

}
