package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Payment;
import com.runasagrada.hotelapi.model.Reservation;
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
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReceiptServiceImpl implements ReceiptService {

    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final JavaMailSender mailSender;

    @Override
    public void sendReservationReceipt(Integer reservationId, boolean attachPdf, String confirmationCode) throws Exception {
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
        body.append("Hotel: ").append(reservation.getHotel() != null ? reservation.getHotel().getName() : "").append("\n");
        body.append("Habitación: ").append(reservation.getRoom() != null ? reservation.getRoom().getNumber() : "").append("\n");
        DateTimeFormatter df = DateTimeFormatter.ISO_LOCAL_DATE;
        body.append("Check-in: ").append(reservation.getCheckIn() != null ? reservation.getCheckIn().format(df) : "").append("\n");
        body.append("Check-out: ").append(reservation.getCheckOut() != null ? reservation.getCheckOut().format(df) : "").append("\n\n");

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

    private byte[] generatePdf(Reservation reservation, List<Payment> payments, String confirmationCode) throws Exception {
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
                contents.showText("Usuario: " + (reservation.getUser() != null ? reservation.getUser().getFullName() : ""));
                contents.newLineAtOffset(0, -15);
                contents.showText("Hotel: " + (reservation.getHotel() != null ? reservation.getHotel().getName() : ""));
                contents.newLineAtOffset(0, -15);
                contents.showText("Habitación: " + (reservation.getRoom() != null ? reservation.getRoom().getNumber() : ""));
                contents.newLineAtOffset(0, -15);
                contents.showText("Check-in: " + (reservation.getCheckIn() != null ? reservation.getCheckIn().toString() : ""));
                contents.newLineAtOffset(0, -15);
                contents.showText("Check-out: " + (reservation.getCheckOut() != null ? reservation.getCheckOut().toString() : ""));
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
}
