const ROOM_TYPE_SPEC_SEEDS = {
  standard: {
    size: '20m²',
    beds: '1 giường đôi',
    view: 'Hướng vườn / nội khu',
  },
  superior: {
    size: '24m²',
    beds: '2 giường đơn / 1 giường đôi',
    view: 'Hướng thành phố',
  },
  deluxe: {
    size: '28m²',
    beds: '2 giường đơn / 1 giường đôi',
    view: 'Hướng biển',
  },
  family: {
    size: '35m²',
    beds: '2 giường đôi',
    view: 'Hướng hồ bơi / thành phố',
  },
};

function isBrokenUnicode(value) {
  if (!value) return false;
  return value.includes('?') || value.includes('�');
}

function resolveRoomTypeKey(typeName) {
  if (!typeName) return null;
  const normalized = typeName.trim().toLowerCase();
  return Object.keys(ROOM_TYPE_SPEC_SEEDS).find((key) => normalized.includes(key)) || null;
}

export function resolveRoomTypeSpec(typeName, field, value, fallback = 'Chưa cập nhật') {
  const roomTypeKey = resolveRoomTypeKey(typeName);

  if (roomTypeKey === 'deluxe' && field === 'beds' && value && value.toLowerCase().includes('queen')) {
    return ROOM_TYPE_SPEC_SEEDS.deluxe.beds;
  }

  if (value && !isBrokenUnicode(value)) {
    return value;
  }

  if (roomTypeKey && ROOM_TYPE_SPEC_SEEDS[roomTypeKey]?.[field]) {
    return ROOM_TYPE_SPEC_SEEDS[roomTypeKey][field];
  }

  return value || fallback;
}
