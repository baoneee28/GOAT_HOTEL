# fix_room.py
import os

path = r"d:\webProject\GOAT_HOTEL\backend\src\main\java\com\hotel\controller\RoomController.java"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace('.append("<div class=\\"room-box \\").append', '.append("<div class=\\"room-box \\"").append')
text = text.replace('.append("\\" \\").append(onclick)', '.append("\\" \\"").append(onclick)')

with open(path, "w", encoding="utf-8") as f:
    f.write(text)
print("Fixed RoomController.java syntax error")
