package com.runasagrada.hotelapi.service;

public interface ReceiptService {
    /**
     * Generate and send a receipt for the reservation with the given id.
     * If attachPdf is true the email will include a generated PDF attachment.
     * If confirmationCode is provided, it will be included in the email and PDF.
     * This method should throw an exception if reservation not found or send fails.
     */
    void sendReservationReceipt(Integer reservationId, boolean attachPdf, String confirmationCode) throws Exception;
}
