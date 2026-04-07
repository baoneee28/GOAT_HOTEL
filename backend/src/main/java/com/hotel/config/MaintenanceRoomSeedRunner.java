package com.hotel.config;

import com.hotel.entity.Room;
import com.hotel.entity.RoomType;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.RoomTypeRepository;
import jakarta.transaction.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
@ConditionalOnProperty(name = "app.seed-maintenance-rooms", havingValue = "true")
public class MaintenanceRoomSeedRunner implements CommandLineRunner {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;

    public MaintenanceRoomSeedRunner(RoomRepository roomRepository, RoomTypeRepository roomTypeRepository) {
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<RoomType> roomTypes = roomTypeRepository.findAll().stream()
                .filter(roomType -> roomType != null && roomType.getId() != null)
                .sorted(Comparator.comparing(RoomType::getId))
                .limit(4)
                .toList();

        List<Room> roomsToCreate = new ArrayList<>();

        for (RoomType roomType : roomTypes) {
            if (roomRepository.existsByRoomType_IdAndStatusIgnoreCase(roomType.getId(), "maintenance")) {
                continue;
            }

            Room room = new Room();
            room.setRoomType(roomType);
            room.setStatus("maintenance");
            room.setRoomNumber(nextMaintenanceRoomNumber(roomType.getId()));
            roomsToCreate.add(room);
        }

        if (!roomsToCreate.isEmpty()) {
            roomRepository.saveAll(roomsToCreate);
        }
    }

    private String nextMaintenanceRoomNumber(Integer roomTypeId) {
        for (int index = 1; index <= 99; index++) {
            String candidate = String.format("BT%d%02d", roomTypeId, index);
            if (candidate.length() > 10) {
                candidate = candidate.substring(0, 10);
            }
            if (roomRepository.findByRoomNumber(candidate).isEmpty()) {
                return candidate;
            }
        }

        throw new IllegalStateException("Không thể tạo thêm phòng maintenance demo cho loại phòng " + roomTypeId);
    }
}
