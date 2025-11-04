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
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.WindowType;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
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

        addTwoReservationServices(driver, wait,
                "Bandeja Paisa Auténtica",
                "Ajiaco Santafereño");

        // el usuario va donde el operador y decide pagar todos los servicios pendientes

    }

    private void login(WebDriver drv, WebDriverWait wt, String email, String pass, boolean asOperator) {
        if (asOperator) {
            drv.switchTo().newWindow(WindowType.TAB);
            drv.get(BASE_URL + "/login");
        }

        wt.until(ExpectedConditions.visibilityOfElementLocated(By.id("email"))).sendKeys(email);
        drv.findElement(By.id("password")).sendKeys(pass);
        drv.findElement(By.id("btnLogin")).click();

        String expectedPath = asOperator ? "/operator" : "/client";
        wt.until(ExpectedConditions.urlContains(expectedPath));
    }

    private void checkReservation(WebDriver drv, WebDriverWait wt) {
        wt.until(ExpectedConditions.urlContains("/client"));

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

    private void checkInReservation(WebDriver drv, WebDriverWait wt) {
        drv.get(BASE_URL + "/operator/reservation-table");

        wt.withTimeout(Duration.ofSeconds(15))
                .until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".ag-root")));

        WebElement row = wt.until(d -> locateReservationRow(d, room, checkInDate, checkOutDate, "confirmada"));
        if (row == null)
            throw new IllegalStateException("No se encontró la fila confirmada para check-in");

        ((org.openqa.selenium.JavascriptExecutor) drv)
                .executeScript("arguments[0].scrollIntoView({block:'center'});", row);

        By btnBy = By.cssSelector("app-action-buttons-cell .btn-ack");
        WebElement button = wt.until(driver -> {
            WebElement refreshed = locateReservationRow(driver, room, checkInDate, checkOutDate, "confirmada");
            if (refreshed == null)
                return null;
            List<WebElement> buttons = refreshed.findElements(btnBy);
            return buttons.isEmpty() ? null : buttons.get(0);
        });

        System.out.println("Click en: " + button.getText());
        try {
            wt.until(ExpectedConditions.elementToBeClickable(button)).click();
        } catch (Exception e) {
            ((org.openqa.selenium.JavascriptExecutor) drv).executeScript("arguments[0].click();", button);
        }

        wt.withTimeout(Duration.ofSeconds(15)).until(d -> {
            WebElement updated = locateReservationRow(d, room, checkInDate, checkOutDate, "check-in");
            if (updated == null)
                return false;
            String status = getCellText(updated, ".ag-cell[col-id='status']", ".row-reserv-status");
            return status.toLowerCase().contains("check-in");
        });
    }

    private WebElement locateReservationRow(WebDriver drv, String room, String checkInDate, String checkOutDate,
            String expectedStatus) {
        List<WebElement> rows = drv.findElements(By.cssSelector(".ag-center-cols-container .ag-row"));

        for (WebElement row : rows) {
            try {
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
            } catch (StaleElementReferenceException stale) {
                System.out.println("Fila descartada por stale, se reintenta con DOM actualizado...");
                return locateReservationRow(drv, room, checkInDate, checkOutDate, expectedStatus);
            }
        }
        return null;

    }

    private void addTwoReservationServices(WebDriver drv, WebDriverWait wt, String service1Name, String service2Name) {
        wt.withTimeout(Duration.ofSeconds(15))
                .until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".ag-root")));

        By editBtnBy = By.cssSelector("app-action-buttons-cell .btn-edit");
        WebElement editButton = wt.until(driver -> {
            WebElement refreshed = locateReservationRow(driver, room, checkInDate, checkOutDate, "check-in");
            if (refreshed == null)
                return null;
            List<WebElement> buttons = refreshed.findElements(editBtnBy);
            if (buttons.isEmpty())
                return null;
            WebElement btn = buttons.get(0);
            ((org.openqa.selenium.JavascriptExecutor) drv)
                    .executeScript("arguments[0].scrollIntoView({block:'center'});", btn);
            return btn;
        });

        System.out.println("Ingresando al detalle: " + editButton.getText());
        try {
            wt.until(ExpectedConditions.elementToBeClickable(editButton)).click();
        } catch (Exception e) {
            ((org.openqa.selenium.JavascriptExecutor) drv).executeScript("arguments[0].click();", editButton);
        }

        // Esperar a que el detalle de la reserva esté visible
        wt.withTimeout(Duration.ofSeconds(10))
                .until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("app-reservation-detail-op")));

        // Abrir el acordeón de servicios contratados si no está abierto
        WebElement collapse = wt.until(ExpectedConditions.presenceOfElementLocated(By.id("collapseTwo")));
        if (!collapse.getAttribute("class").contains("show")) {
            WebElement accordionBtn = wt.until(ExpectedConditions
                    .elementToBeClickable(By.cssSelector("button.hired-services[data-bs-target='#collapseTwo']")));
            ((org.openqa.selenium.JavascriptExecutor) drv)
                    .executeScript("arguments[0].scrollIntoView({block:'center'});", accordionBtn);
            try {
                accordionBtn.click();
            } catch (Exception clickIntercepted) {
                ((org.openqa.selenium.JavascriptExecutor) drv).executeScript("arguments[0].click();", accordionBtn);
            }
            wt.until(ExpectedConditions.attributeContains(By.id("collapseTwo"), "class", "show"));
        }

        List<String> serviceNames = List.of(service1Name, service2Name);
        for (String name : serviceNames) {
            WebElement addButton = wt.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//button[contains(@class,'btn-olive') and contains(.,'Agregar servicios')]")));
            addButton.click();

            pickService(drv, wt, name);
        }
    }

    private void pickService(WebDriver drv, WebDriverWait wt, String serviceName) {
        WebElement form = wt
                .until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("app-services-add-form form")));

        WebElement serviceSelectEl = form.findElement(By.cssSelector("select.service-selector"));
        Select serviceSelect = new Select(serviceSelectEl);
        boolean selected = false;
        for (WebElement option : serviceSelect.getOptions()) {
            if (option.getText().toLowerCase().contains(serviceName.toLowerCase())) {
                serviceSelect.selectByVisibleText(option.getText());
                selected = true;
                break;
            }
        }
        if (!selected) {
            throw new IllegalStateException("No se encontró el servicio con nombre: " + serviceName);
        }

        WebElement scheduleSelectEl = wt.until(driver -> {
            WebElement currentForm = driver.findElement(By.cssSelector("app-services-add-form form"));
            WebElement selectEl = currentForm.findElement(By.cssSelector("select.schedule-selector"));
            Select scheduleSel = new Select(selectEl);
            return scheduleSel.getOptions().size() > 1 ? selectEl : null;
        });
        Select scheduleSelect = new Select(scheduleSelectEl);
        if (scheduleSelect.getOptions().size() > 1) {
            scheduleSelect.selectByIndex(1);
        } else {
            throw new IllegalStateException("No hay horarios disponibles para el servicio " + serviceName);
        }

        WebElement qtyInput = drv.findElement(By.cssSelector("app-services-add-form form input.qty-option"));
        qtyInput.clear();
        qtyInput.sendKeys("1");

        WebElement submitButton = drv
                .findElement(By.cssSelector("app-services-add-form form button[type='submit']"));
        submitButton.click();

        wt.until(ExpectedConditions.stalenessOf(form));
    }

    private String getCellText(WebElement row, String... selectors) {
        for (String selector : selectors) {
            try {
                List<WebElement> cells = row.findElements(By.cssSelector(selector));
                if (!cells.isEmpty()) {
                    return cells.get(0).getText().trim();
                }
            } catch (StaleElementReferenceException stale) {
                return "";
            }
        }
        return "";
    }

}
