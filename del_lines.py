with open(r"d:\GOAT_HOTEL\GOAT_HOTEL\frontend\src\pages\Coupons.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
# Delete lines 258 to 294 (index 257 to 294)
del lines[257:294]
with open(r"d:\GOAT_HOTEL\GOAT_HOTEL\frontend\src\pages\Coupons.jsx", "w", encoding="utf-8", newline="") as f:
    for line in lines:
        f.write(line)
print("Deleted lines successfully.")
