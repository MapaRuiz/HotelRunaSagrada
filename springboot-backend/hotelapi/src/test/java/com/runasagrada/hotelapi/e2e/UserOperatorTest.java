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

    private WebDriver drv;
    private WebDriverWait wait;
    String room;
    String checkInDate;
    String checkOutDate;

    @BeforeEach
    void setUp() {
        WebDriverManager.chromedriver().setup();
        ChromeOptions chromeOptions = new ChromeOptions()
                .addArguments("--disable-notifications", "--disable-extensions");

        this.drv = new ChromeDriver(chromeOptions);
        this.drv.manage().window().setSize(new org.openqa.selenium.Dimension(1280, 900));
        this.wait = new WebDriverWait(drv, Duration.ofSeconds(5));
    }

    @Test
    void serviceReservationUseCase() {
        // Un usuario ya registrado realiza login con su perfil
        drv.get(BASE_URL + "/login");
        login(drv, wait, "client01@demo.com", "client123", false);

        // Revisa sus próximas reservas
        checkReservation(drv, wait);

        // En otra Ventana ingresa un operador con su usuario y contraseña.
        login(drv, wait, "op1@hotel.com", "op123", true);

        // Va al perfil de reservas y activa (realiza checkin) la reserva del usuario.
        checkInReservation(drv, wait);

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
        // 1) Ir a la tabla del operador
        drv.get(BASE_URL + "/operator/reservation-table");

        // 2) Esperar a que el grid esté listo (ajusta el selector si hace falta)
        wait.withTimeout(Duration.ofSeconds(15))
                .until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".ag-root")));

        // 3) Re-localizar la fila objetivo con el estado "confirmada"
        WebElement row = wait.until(d -> locateReservationRow(d, room, checkInDate, checkOutDate, "confirmada"));
        if (row == null)
            throw new IllegalStateException("No se encontró la fila confirmada para check-in");

        // 4) Asegurar que la fila esté visible en el contenedor de AG Grid (scroll)
        WebElement viewport = drv.findElement(By.cssSelector(".ag-center-cols-viewport"));
        ((org.openqa.selenium.JavascriptExecutor) drv)
                .executeScript("arguments[0].scrollTop = arguments[1];", viewport, row.getRect().y);

        // 5) Re-localizar el botón *después* del scroll (evita stale)
        By btnBy = By.cssSelector("app-action-buttons-cell .btn-ack");

        // Esperar a que el botón esté presente y usable
        WebElement btn = wait.until(d -> {
            WebElement freshRow = locateReservationRow(d, room, checkInDate, checkOutDate, "confirmada");
            if (freshRow == null)
                return null;
            List<WebElement> buttons = freshRow.findElements(btnBy);
            if (buttons.isEmpty())
                return null;
            WebElement candidate = buttons.get(0);
            if (!candidate.isDisplayed()) {
                ((org.openqa.selenium.JavascriptExecutor) d)
                        .executeScript("arguments[0].scrollIntoView({block:'center'});", candidate);
            }
            return candidate.isEnabled() ? candidate : null;
        });
        System.out.println("Texto del botón Activar: " + btn.getText());

        // Asegurar visibilidad y clickeabilidad
        ((org.openqa.selenium.JavascriptExecutor) drv)
                .executeScript("arguments[0].scrollIntoView({block:'center'});", btn);
        try {
            new Actions(drv).moveToElement(btn).pause(Duration.ofMillis(150)).click().perform();
        } catch (Exception clickEx) {
            // Fallback si hay overlay/intercepción o stale
            WebElement fallback = locateReservationRow(drv, room, checkInDate, checkOutDate, "confirmada");
            if (fallback != null) {
                List<WebElement> buttons = fallback.findElements(btnBy);
                if (!buttons.isEmpty()) {
                    btn = buttons.get(0);
                }
            }
            ((org.openqa.selenium.JavascriptExecutor) drv).executeScript("arguments[0].click();", btn);
        }

        // 7) Verificar cambio de estado a "check-in"
        new WebDriverWait(drv, Duration.ofSeconds(20)).until(d -> {
            WebElement updated = locateReservationRow(d, room, checkInDate, checkOutDate, "check-in");
            if (updated == null)
                return false;
            String statusText = getCellText(updated, ".ag-cell[col-id='status']", ".row-reserv-status");
            return statusText.toLowerCase().contains("check-in");
        });
    }

    private WebElement findReservation(WebDriver drv, WebDriverWait wait, String room, String checkInDate,
            String checkOutDate, String expectedStatus) {
        return wait.until(driver -> locateReservationRow(driver, room, checkInDate, checkOutDate, expectedStatus));

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
