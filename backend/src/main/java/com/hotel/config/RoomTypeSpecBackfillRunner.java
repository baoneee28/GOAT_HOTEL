package com.hotel.config;

import com.hotel.entity.RoomType;
import com.hotel.repository.RoomTypeRepository;
import jakarta.transaction.Transactional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class RoomTypeSpecBackfillRunner implements CommandLineRunner {

    private final RoomTypeRepository roomTypeRepository;

    public RoomTypeSpecBackfillRunner(RoomTypeRepository roomTypeRepository) {
        this.roomTypeRepository = roomTypeRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Map<String, RoomTypeSeed> seeds = Map.of(
                "standard", new RoomTypeSeed("20m²", "1 giường đôi", "Hướng vườn / nội khu"),
                "superior", new RoomTypeSeed("24m²", "2 giường đơn / 1 giường đôi", "Hướng thành phố"),
                "deluxe", new RoomTypeSeed("28m²", "2 giường đơn / 1 giường đôi", "Hướng biển"),
                "family", new RoomTypeSeed("35m²", "2 giường đôi", "Hướng hồ bơi / thành phố")
        );

        List<RoomType> changedTypes = new ArrayList<>();

        for (RoomType roomType : roomTypeRepository.findAll()) {
            RoomTypeSeed seed = resolveSeed(roomType.getTypeName(), seeds);
            if (seed == null) {
                continue;
            }

            boolean changed = false;

            if (shouldReplace(roomType.getSize())) {
                roomType.setSize(seed.size());
                changed = true;
            }
            if (shouldReplace(roomType.getBeds()) || shouldReplaceBeds(roomType, seed)) {
                roomType.setBeds(seed.beds());
                changed = true;
            }
            if (shouldReplace(roomType.getView())) {
                roomType.setView(seed.view());
                changed = true;
            }

            if (changed) {
                changedTypes.add(roomType);
            }
        }

        if (!changedTypes.isEmpty()) {
            roomTypeRepository.saveAll(changedTypes);
        }
    }

    private RoomTypeSeed resolveSeed(String typeName, Map<String, RoomTypeSeed> seeds) {
        if (isBlank(typeName)) {
            return null;
        }

        String normalized = typeName.trim().toLowerCase(Locale.ROOT);
        for (Map.Entry<String, RoomTypeSeed> entry : seeds.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private boolean shouldReplace(String value) {
        if (isBlank(value)) {
            return true;
        }

        String normalized = value.trim();
        return normalized.contains("?") || normalized.contains("�");
    }

    private boolean shouldReplaceBeds(RoomType roomType, RoomTypeSeed seed) {
        if (roomType.getBeds() == null) {
            return false;
        }

        String typeName = roomType.getTypeName() == null ? "" : roomType.getTypeName().toLowerCase(Locale.ROOT);
        String beds = roomType.getBeds().toLowerCase(Locale.ROOT);
        return typeName.contains("deluxe") && beds.contains("queen") && !beds.equals(seed.beds().toLowerCase(Locale.ROOT));
    }

    private record RoomTypeSeed(String size, String beds, String view) {}
}
