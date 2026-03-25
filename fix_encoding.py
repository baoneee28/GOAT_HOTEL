import subprocess, sys

def sqlcmd(query):
    r = subprocess.run(
        ["sqlcmd", "-S", r"MRHOANG\SQLEXPRESS", "-d", "goat_hotel", "-E", "-Q", query],
        capture_output=True, text=True, encoding='utf-8'
    )
    return r.stdout + r.stderr

def fix(s):
    """Double-encoded UTF-8: decode as latin-1 then re-encode as utf-8"""
    try:
        return s.encode('latin-1').decode('utf-8')
    except:
        return s

# Fix room_types
print("=== room_types ===")
rows = sqlcmd("SET NOCOUNT ON; SELECT id, type_name, description FROM room_types")
for line in rows.strip().split('\n'):
    parts = [p.strip() for p in line.split('\t')]
    if len(parts) >= 2:
        try:
            rid = int(parts[0])
            old_name = parts[1]
            new_name = fix(old_name)
            old_desc = parts[2] if len(parts) > 2 else ''
            new_desc = fix(old_desc) if old_desc else old_desc
            if old_name != new_name or old_desc != new_desc:
                q = f"UPDATE room_types SET type_name = N'{new_name}', description = N'{new_desc}' WHERE id = {rid}"
                sqlcmd(q)
                print(f"  Fixed id={rid}: {old_name!r} -> {new_name!r}")
        except (ValueError, IndexError):
            pass

# Fix rooms (if roomNumber has encoding issues)
print("=== rooms: room_number ===")
rows = sqlcmd("SET NOCOUNT ON; SELECT id, room_number FROM rooms")
for line in rows.strip().split('\n'):
    parts = [p.strip() for p in line.split('\t')]
    if len(parts) >= 2:
        try:
            rid = int(parts[0])
            old_v = parts[1]
            new_v = fix(old_v)
            if old_v != new_v:
                q = f"UPDATE rooms SET room_number = N'{new_v}' WHERE id = {rid}"
                sqlcmd(q)
                print(f"  Fixed id={rid}: {old_v!r} -> {new_v!r}")
        except (ValueError, IndexError):
            pass

# Fix items
print("=== items: name ===")
rows = sqlcmd("SET NOCOUNT ON; SELECT id, name FROM items")
for line in rows.strip().split('\n'):
    parts = [p.strip() for p in line.split('\t')]
    if len(parts) >= 2:
        try:
            rid = int(parts[0])
            old_v = parts[1]
            new_v = fix(old_v)
            if old_v != new_v:
                q = f"UPDATE items SET name = N'{new_v}' WHERE id = {rid}"
                sqlcmd(q)
                print(f"  Fixed id={rid}: {old_v!r} -> {new_v!r}")
        except (ValueError, IndexError):
            pass

# Fix services
print("=== services: name, description ===")
rows = sqlcmd("SET NOCOUNT ON; SELECT id, name, description FROM services")
for line in rows.strip().split('\n'):
    parts = [p.strip() for p in line.split('\t')]
    if len(parts) >= 2:
        try:
            rid = int(parts[0])
            old_name = parts[1]
            new_name = fix(old_name)
            old_desc = parts[2] if len(parts) > 2 else ''
            new_desc = fix(old_desc)
            if old_name != new_name or old_desc != new_desc:
                q = f"UPDATE services SET name = N'{new_name}', description = N'{new_desc}' WHERE id = {rid}"
                sqlcmd(q)
                print(f"  Fixed id={rid}: {old_name!r} -> {new_name!r}")
        except (ValueError, IndexError):
            pass

# Fix news
print("=== news: title, summary ===")
rows = sqlcmd("SET NOCOUNT ON; SELECT id, title, summary FROM news")
for line in rows.strip().split('\n'):
    parts = [p.strip() for p in line.split('\t')]
    if len(parts) >= 2:
        try:
            rid = int(parts[0])
            old_title = parts[1]
            new_title = fix(old_title)
            old_sum = parts[2] if len(parts) > 2 else ''
            new_sum = fix(old_sum)
            if old_title != new_title or old_sum != new_sum:
                q = f"UPDATE news SET title = N'{new_title}', summary = N'{new_sum}' WHERE id = {rid}"
                sqlcmd(q)
                print(f"  Fixed id={rid}: {old_title!r} -> {new_title!r}")
        except (ValueError, IndexError):
            pass

# Fix users fullname
print("=== users: full_name ===")
rows = sqlcmd("SET NOCOUNT ON; SELECT id, full_name FROM users")
for line in rows.strip().split('\n'):
    parts = [p.strip() for p in line.split('\t')]
    if len(parts) >= 2:
        try:
            rid = int(parts[0])
            old_v = parts[1]
            new_v = fix(old_v)
            if old_v != new_v:
                q = f"UPDATE users SET full_name = N'{new_v}' WHERE id = {rid}"
                sqlcmd(q)
                print(f"  Fixed id={rid}: {old_v!r} -> {new_v!r}")
        except (ValueError, IndexError):
            pass

print("\nDone! Verifying room_types...")
print(sqlcmd("SET NOCOUNT ON; SELECT id, type_name FROM room_types"))
