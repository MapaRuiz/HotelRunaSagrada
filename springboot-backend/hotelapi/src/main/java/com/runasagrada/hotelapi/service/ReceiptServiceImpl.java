package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Payment;
import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.model.ReservationServiceEntity;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.repository.PaymentRepository;
import com.runasagrada.hotelapi.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReceiptServiceImpl implements ReceiptService {

    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final JavaMailSender mailSender;

    @Override
    public void sendReservationReceipt(Integer reservationId, boolean attachPdf, String confirmationCode)
            throws Exception {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found: " + reservationId));

        // Force lazy load of user relation
        User user = reservation.getUser();
        if (user == null) {
            throw new IllegalArgumentException("Reservation " + reservationId + " has no associated user");
        }

        String to = user.getEmail();
        if (to == null || to.isBlank()) {
            throw new IllegalArgumentException("User for reservation " + reservationId + " has no email address");
        }

        String subject = "Recibo de reserva - " + reservation.getReservationId();
        StringBuilder body = new StringBuilder();
        body.append("Estimado/a\n\n");
        body.append("Gracias por su reserva. A continuación encontrará los detalles:\n\n");
        body.append("Reserva: ").append(reservation.getReservationId()).append("\n");
        if (confirmationCode != null && !confirmationCode.isBlank()) {
            body.append("Código de confirmación: ").append(confirmationCode).append("\n");
        }
        body.append("Hotel: ").append(reservation.getHotel() != null ? reservation.getHotel().getName() : "")
                .append("\n");
        body.append("Habitación: ").append(reservation.getRoom() != null ? reservation.getRoom().getNumber() : "")
                .append("\n");
        DateTimeFormatter df = DateTimeFormatter.ISO_LOCAL_DATE;
        body.append("Check-in: ").append(reservation.getCheckIn() != null ? reservation.getCheckIn().format(df) : "")
                .append("\n");
        body.append("Check-out: ").append(reservation.getCheckOut() != null ? reservation.getCheckOut().format(df) : "")
                .append("\n\n");

        List<Payment> payments = paymentRepository.findByReservationId_ReservationId(reservationId);
        double total = payments.stream().mapToDouble(p -> p.getAmount()).sum();
        body.append("Pagos: ").append(payments.size()).append(" - Total: ").append(total).append("\n\n");
        body.append("Saludos,\n");
        body.append("Equipo Runa Sagrada");

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, attachPdf);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(body.toString());

        if (attachPdf) {
            // generate PDF into byte[]
            byte[] pdfBytes = generatePdf(reservation, payments, confirmationCode);
            helper.addAttachment("recibo-" + reservation.getReservationId() + ".pdf", new ByteArrayResource(pdfBytes));
        }

        mailSender.send(message);
    }

    @Override
    public void sendReservationReceipt(List<ReservationServiceEntity> services) throws Exception {
        if (services == null || services.isEmpty()) {
            throw new IllegalArgumentException("La lista de servicios de la reserva está vacía");
        }

        Reservation reservation = services.get(0).getReservation();
        if (reservation == null || reservation.getUser() == null) {
            throw new IllegalArgumentException("No se encontró un usuario asociado a la reserva");
        }

        // Validamos que todos los servicios pertenezcan a la misma reserva
        Integer reservationId = reservation.getReservationId();
        for (ReservationServiceEntity item : services) {
            Reservation itemReservation = item.getReservation();
            Integer itemId = itemReservation != null ? itemReservation.getReservationId() : null;
            if (itemReservation == null
                    || (reservationId != null && itemId != null && !reservationId.equals(itemId))
                    || (reservationId == null && itemReservation != reservation)) {
                throw new IllegalArgumentException("Todos los servicios deben pertenecer a la misma reserva");
            }
        }

        User user = reservation.getUser();
        String to = user.getEmail();
        if (to == null || to.isBlank()) {
            throw new IllegalArgumentException("El usuario no tiene un correo registrado");
        }

        String subject = "Factura de servicios - Reserva " + reservation.getReservationId();
        StringBuilder body = new StringBuilder();
        body.append("Estimado/a ").append(user.getFullName() == null ? "" : user.getFullName()).append("\n\n");
        body.append("Adjuntamos la factura en PDF con el detalle de los servicios solicitados.\n");
        body.append("Gracias por su compra.");

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(body.toString());

        byte[] pdfBytes = generateServicesPdf(reservation, services);
        helper.addAttachment("factura-servicios-" + reservation.getReservationId() + ".pdf",
                new ByteArrayResource(pdfBytes));

        mailSender.send(message);
    }

    private byte[] generatePdf(Reservation reservation, List<Payment> payments, String confirmationCode)
            throws Exception {
        try (PDDocument doc = new PDDocument();
                ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PDPage page = new PDPage();
            doc.addPage(page);

            // Write content - this must be closed before saving
            try (PDPageContentStream contents = new PDPageContentStream(doc, page)) {
                contents.beginText();
                contents.setFont(PDType1Font.HELVETICA_BOLD, 16);
                contents.newLineAtOffset(50, 700);
                contents.showText("Recibo de Reserva");
                contents.endText();

                contents.beginText();
                contents.setFont(PDType1Font.HELVETICA, 12);
                contents.newLineAtOffset(50, 670);
                contents.showText("Reserva: " + reservation.getReservationId());
                contents.newLineAtOffset(0, -15);
                if (confirmationCode != null && !confirmationCode.isBlank()) {
                    contents.showText("Codigo de confirmacion: " + confirmationCode);
                    contents.newLineAtOffset(0, -15);
                }
                contents.showText(
                        "Usuario: " + (reservation.getUser() != null ? reservation.getUser().getFullName() : ""));
                contents.newLineAtOffset(0, -15);
                contents.showText("Hotel: " + (reservation.getHotel() != null ? reservation.getHotel().getName() : ""));
                contents.newLineAtOffset(0, -15);
                contents.showText(
                        "Habitación: " + (reservation.getRoom() != null ? reservation.getRoom().getNumber() : ""));
                contents.newLineAtOffset(0, -15);
                contents.showText(
                        "Check-in: " + (reservation.getCheckIn() != null ? reservation.getCheckIn().toString() : ""));
                contents.newLineAtOffset(0, -15);
                contents.showText("Check-out: "
                        + (reservation.getCheckOut() != null ? reservation.getCheckOut().toString() : ""));
                contents.newLineAtOffset(0, -30);
                contents.showText("Pagos:");
                for (Payment p : payments) {
                    contents.newLineAtOffset(0, -15);
                    String methodName = (p.getPaymentMethodId() != null ? p.getPaymentMethodId().getType() : "N/A");
                    contents.showText("- " + methodName + " : " + p.getAmount() + " (" + p.getStatus() + ")");
                }
                contents.endText();
            } // PDPageContentStream is closed here

            // Now safe to save the document
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] generateServicesPdf(Reservation reservation, List<ReservationServiceEntity> services)
            throws Exception {
        DecimalFormat money = new DecimalFormat("#,##0.00");

        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);

            try (PDPageContentStream contents = new PDPageContentStream(doc, page)) {
                contents.beginText();
                contents.setFont(PDType1Font.COURIER_BOLD, 18);
                contents.newLineAtOffset(50, 740);
                contents.showText("Factura de Servicios - Reserva " + reservation.getReservationId());
                contents.endText();

                // Separator
                contents.moveTo(50, 730);
                contents.lineTo(550, 730);
                contents.stroke();

                contents.beginText();
                contents.setFont(PDType1Font.COURIER, 13);
                contents.newLineAtOffset(50, 710);
                contents.showText("Cliente: "
                        + (reservation.getUser() != null ? reservation.getUser().getFullName() : "N/A"));
                contents.newLineAtOffset(0, -15);
                contents.showText("Reserva: " + reservation.getReservationId());
                contents.endText();

                // Separator before line items
                contents.moveTo(50, 690);
                contents.lineTo(550, 690);
                contents.stroke();

                float y = 670;
                double subtotal = 0;
                for (ReservationServiceEntity item : services) {
                    String serviceName = item.getService() != null ? item.getService().getName() : "Servicio";
                    int qty = item.getQty();
                    double unitPrice = item.getUnitPrice() != null ? item.getUnitPrice()
                            : (item.getService() != null ? item.getService().getBasePrice() : 0d);
                    double lineTotal = unitPrice * qty;
                    subtotal += lineTotal;

                    contents.beginText();
                    contents.setFont(PDType1Font.COURIER, 12);
                    contents.newLineAtOffset(50, y);
                    contents.showText(serviceName + "  x" + qty + " @ " + money.format(unitPrice) + " = "
                            + money.format(lineTotal));
                    contents.endText();
                    y -= 18;
                }

                double tax = subtotal * 0.19;
                double total = subtotal + tax;

                // Separator before totals
                contents.moveTo(50, y - 5);
                contents.lineTo(550, y - 5);
                contents.stroke();

                contents.beginText();
                contents.setFont(PDType1Font.COURIER_BOLD, 14);
                contents.newLineAtOffset(50, y - 20);
                contents.showText("Subtotal: " + money.format(subtotal));
                contents.newLineAtOffset(0, -15);
                contents.showText("Impuestos (19%): " + money.format(tax));
                contents.newLineAtOffset(0, -15);
                contents.showText("Total: " + money.format(total));
                contents.endText();
            }

            doc.save(baos);
            return baos.toByteArray();
        }
    }
}
