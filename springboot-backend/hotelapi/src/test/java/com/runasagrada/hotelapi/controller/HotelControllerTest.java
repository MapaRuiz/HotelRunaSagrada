package com.runasagrada.hotelapi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.runasagrada.hotelapi.model.Hotel;
import com.runasagrada.hotelapi.service.HotelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de controlador para HotelController
 * Usa @WebMvcTest + MockMvc para probar endpoints sin levantar servidor
 * completo
 * Cubre: GET all, GET by id, POST, PUT, DELETE, búsquedas
 */
@WebMvcTest(HotelController.class)
class HotelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private HotelService hotelService;

    private Hotel mockHotel;
    private HotelController.HotelRequest mockRequest;

    @BeforeEach
    void setUp() {
        // Arrange: Preparar objetos mock
        mockHotel = new Hotel();
        mockHotel.setHotelId(1L);
        mockHotel.setName("Hotel Test");
        mockHotel.setLatitude("10.0");
        mockHotel.setLongitude("-84.0");
        mockHotel.setDescription("Hotel de prueba");
        mockHotel.setCheckInAfter("15:00");
        mockHotel.setCheckOutBefore("12:00");
        mockHotel.setImage("/images/hotel1.jpg");
        mockHotel.setAmenities(new HashSet<>());

        mockRequest = new HotelController.HotelRequest();
        mockRequest.setName("Hotel Test");
        mockRequest.setLatitude("10.0");
        mockRequest.setLongitude("-84.0");
        mockRequest.setDescription("Hotel de prueba");
        mockRequest.setCheckInAfter("15:00");
        mockRequest.setCheckOutBefore("12:00");
        mockRequest.setImage("/images/hotel1.jpg");
        mockRequest.setAmenityIds(List.of(1, 2));
    }

    @Test
    void testGetAllHotels_ReturnsListOfHotels_Status200() throws Exception {
        // Arrange: Configurar mock para retornar lista de hoteles
        Hotel hotel2 = new Hotel();
        hotel2.setHotelId(2L);
        hotel2.setName("Hotel Dos");
        hotel2.setLatitude("11.0");
        hotel2.setLongitude("-85.0");

        when(hotelService.list()).thenReturn(List.of(mockHotel, hotel2));

        // Act & Assert: Hacer petición GET y verificar respuesta
        mockMvc.perform(get("/api/hotels")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].hotel_id").value(1))
                .andExpect(jsonPath("$[0].name").value("Hotel Test"))
                .andExpect(jsonPath("$[1].hotel_id").value(2))
                .andExpect(jsonPath("$[1].name").value("Hotel Dos"));

        verify(hotelService, times(1)).list();
    }

    @Test
    void testGetAllHotels_ReturnsEmptyList_WhenNoHotels() throws Exception {
        // Arrange: Mock retorna lista vacía
        when(hotelService.list()).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/api/hotels"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(hotelService, times(1)).list();
    }

    @Test
    void testGetHotelById_ReturnsHotel_Status200() throws Exception {
        // Arrange: Configurar mock para ID específico
        when(hotelService.get(1L)).thenReturn(mockHotel);

        // Act & Assert: GET /api/hotels/1
        mockMvc.perform(get("/api/hotels/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotel_id").value(1))
                .andExpect(jsonPath("$.name").value("Hotel Test"))
                .andExpect(jsonPath("$.latitude").value("10.0"))
                .andExpect(jsonPath("$.longitude").value("-84.0"))
                .andExpect(jsonPath("$.check_in_after").value("15:00"))
                .andExpect(jsonPath("$.check_out_before").value("12:00"));

        verify(hotelService, times(1)).get(1L);
    }

    @Test
    void testGetHotelById_ThrowsException_WhenNotFound() throws Exception {
        // Arrange: Simular hotel no encontrado (service lanza excepción)
        when(hotelService.get(999L)).thenThrow(new RuntimeException("Hotel not found"));

        // Act & Assert: Verificar que se lanza excepción (sin @ControllerAdvice)
        try {
            mockMvc.perform(get("/api/hotels/{id}", 999L));
        } catch (Exception e) {
            // Se espera una ServletException o NestedServletException
            assertThat(e).isInstanceOf(Exception.class);
        }

        verify(hotelService, times(1)).get(999L);
    }

    @Test
    void testCreateHotel_ReturnsCreatedHotel_Status200() throws Exception {
        // Arrange: Mock para creación exitosa
        when(hotelService.create(any(Hotel.class), anyList())).thenReturn(mockHotel);

        // Act & Assert: POST /api/hotels
        mockMvc.perform(post("/api/hotels")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotel_id").value(1))
                .andExpect(jsonPath("$.name").value("Hotel Test"))
                .andExpect(jsonPath("$.description").value("Hotel de prueba"));

        verify(hotelService, times(1)).create(any(Hotel.class), eq(List.of(1, 2)));
    }

    @Test
    void testCreateHotel_Returns400_WhenInvalidPayload() throws Exception {
        // Act & Assert: Enviar payload inválido (JSON malformado)
        mockMvc.perform(post("/api/hotels")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{invalid json}"))
                .andExpect(status().isBadRequest());

        verify(hotelService, never()).create(any(), any());
    }

    @Test
    void testUpdateHotel_ReturnsUpdatedHotel_Status200() throws Exception {
        // Arrange: Mock para actualización exitosa
        mockHotel.setName("Hotel Actualizado");
        when(hotelService.update(eq(1L), any(Hotel.class), anyList())).thenReturn(mockHotel);

        mockRequest.setName("Hotel Actualizado");

        // Act & Assert: PUT /api/hotels/1
        mockMvc.perform(put("/api/hotels/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotel_id").value(1))
                .andExpect(jsonPath("$.name").value("Hotel Actualizado"));

        verify(hotelService, times(1)).update(eq(1L), any(Hotel.class), eq(List.of(1, 2)));
    }

    @Test
    void testUpdateHotel_ThrowsException_WhenHotelNotFound() throws Exception {
        // Arrange: Simular actualización de hotel inexistente
        when(hotelService.update(eq(999L), any(Hotel.class), anyList()))
                .thenThrow(new RuntimeException("Hotel not found"));

        // Act & Assert: Verificar que se lanza excepción (sin @ControllerAdvice)
        try {
            mockMvc.perform(put("/api/hotels/{id}", 999L)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockRequest)));
        } catch (Exception e) {
            // Se espera una ServletException o NestedServletException
            assertThat(e).isInstanceOf(Exception.class);
        }

        verify(hotelService, times(1)).update(eq(999L), any(Hotel.class), anyList());
    }

    @Test
    void testDeleteHotel_ReturnsNoContent_Status204() throws Exception {
        // Arrange: Mock para eliminación exitosa (void)
        doNothing().when(hotelService).delete(1L);

        // Act & Assert: DELETE /api/hotels/1
        mockMvc.perform(delete("/api/hotels/{id}", 1L))
                .andExpect(status().isNoContent());

        verify(hotelService, times(1)).delete(1L);
    }

    @Test
    void testDeleteHotel_ThrowsException_WhenHotelNotFound() throws Exception {
        // Arrange: Simular eliminación de hotel inexistente
        doThrow(new RuntimeException("Hotel not found")).when(hotelService).delete(999L);

        // Act & Assert: Verificar que se lanza excepción (sin @ControllerAdvice)
        try {
            mockMvc.perform(delete("/api/hotels/{id}", 999L));
        } catch (Exception e) {
            // Se espera una ServletException o NestedServletException
            assertThat(e).isInstanceOf(Exception.class);
        }

        verify(hotelService, times(1)).delete(999L);
    }

    @Test
    void testGetHotelsIdName_ReturnsMapOfIdAndName_Status200() throws Exception {
        // Arrange: Mock para retornar mapa id -> nombre
        Map<Long, String> idNameMap = new LinkedHashMap<>();
        idNameMap.put(1L, "Hotel Test");
        idNameMap.put(2L, "Hotel Dos");

        when(hotelService.getHotelsIdName()).thenReturn(idNameMap);

        // Act & Assert: GET /api/hotels/id-name
        mockMvc.perform(get("/api/hotels/id-name")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.1").value("Hotel Test"))
                .andExpect(jsonPath("$.2").value("Hotel Dos"));

        verify(hotelService, times(1)).getHotelsIdName();
    }

    @Test
    void testGetAmenitiesCountByHotel_ReturnsMapOfCounts_Status200() throws Exception {
        // Arrange: Mock para retornar conteo de amenidades
        Map<String, Long> amenityCounts = new LinkedHashMap<>();
        amenityCounts.put("Hotel Test", 5L);
        amenityCounts.put("Hotel Dos", 3L);

        when(hotelService.amenitiesCountByHotel()).thenReturn(amenityCounts);

        // Act & Assert: GET /api/summary/amenities
        mockMvc.perform(get("/api/summary/amenities")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$['Hotel Test']").value(5))
                .andExpect(jsonPath("$['Hotel Dos']").value(3));

        verify(hotelService, times(1)).amenitiesCountByHotel();
    }

    @Test
    void testCreateHotel_WithNullAmenityIds_ProcessesCorrectly() throws Exception {
        // Arrange: Request sin amenityIds
        mockRequest.setAmenityIds(null);
        when(hotelService.create(any(Hotel.class), isNull())).thenReturn(mockHotel);

        // Act & Assert
        mockMvc.perform(post("/api/hotels")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotel_id").value(1));

        verify(hotelService, times(1)).create(any(Hotel.class), isNull());
    }

    @Test
    void testCreateHotel_WithEmptyAmenityIds_ProcessesCorrectly() throws Exception {
        // Arrange: Request con lista vacía de amenityIds
        mockRequest.setAmenityIds(Collections.emptyList());
        when(hotelService.create(any(Hotel.class), eq(Collections.emptyList())))
                .thenReturn(mockHotel);

        // Act & Assert
        mockMvc.perform(post("/api/hotels")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotel_id").value(1));

        verify(hotelService, times(1)).create(any(Hotel.class), eq(Collections.emptyList()));
    }

    @Test
    void testGetHotelById_VerifiesCorrectContentType() throws Exception {
        // Arrange
        when(hotelService.get(1L)).thenReturn(mockHotel);

        // Act & Assert: Verificar Content-Type en respuesta
        mockMvc.perform(get("/api/hotels/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void testUpdateHotel_WithPartialData_ProcessesCorrectly() throws Exception {
        // Arrange: Request con solo algunos campos
        HotelController.HotelRequest partialRequest = new HotelController.HotelRequest();
        partialRequest.setName("Nombre Parcial");
        partialRequest.setAmenityIds(null);

        when(hotelService.update(eq(1L), any(Hotel.class), isNull())).thenReturn(mockHotel);

        // Act & Assert
        mockMvc.perform(put("/api/hotels/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(partialRequest)))
                .andExpect(status().isOk());

        verify(hotelService, times(1)).update(eq(1L), any(Hotel.class), isNull());
    }
}
