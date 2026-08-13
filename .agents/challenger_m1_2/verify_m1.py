import re
import sys

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def relative_luminance(rgb):
    r, g, b = [x / 255.0 for x in rgb]
    def cal_c(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r_lin = cal_c(r)
    g_lin = cal_c(g)
    b_lin = cal_c(b)
    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin

def contrast_ratio(hex1, hex2):
    l1 = relative_luminance(hex_to_rgb(hex1))
    l2 = relative_luminance(hex_to_rgb(hex2))
    max_l = max(l1, l2)
    min_l = min(l1, l2)
    return (max_l + 0.05) / (min_l + 0.05)

print("=== 1. TEST WCAG CONTRAST FOR --sv-brand-fg ===")
# Light mode: --sv-brand-fg = #795200
light_brand_fg = "#795200"
light_surfaces = {
    "White": "#FFFFFF",
    "Light Canvas (#f8fafc)": "#F8FAFC",
    "Light Surface (#ffffff)": "#FFFFFF",
    "Light Sunken (#f1f5f9)": "#F1F5F9"
}

for name, bg in light_surfaces.items():
    cr = contrast_ratio(light_brand_fg, bg)
    aa_pass = cr >= 4.5
    aaa_pass = cr >= 7.0
    print(f"Light --sv-brand-fg ({light_brand_fg}) on {name} ({bg}): CR = {cr:.3f}:1 | AA (>4.5): {aa_pass} | AAA (>7.0): {aaa_pass}")

# Dark mode: --sv-brand-fg = #E5C158
dark_brand_fg = "#E5C158"
dark_surfaces = {
    "Dark Canvas (#0f172a)": "#0F172A",
    "Dark Surface (#1e293b)": "#1E293B",
    "Dark Raised (#273549)": "#273549",
    "Dark Sunken (#0b1120)": "#0B1120"
}

for name, bg in dark_surfaces.items():
    cr = contrast_ratio(dark_brand_fg, bg)
    aa_pass = cr >= 4.5
    aaa_pass = cr >= 7.0
    print(f"Dark --sv-brand-fg ({dark_brand_fg}) on {name} ({bg}): CR = {cr:.3f}:1 | AA (>4.5): {aa_pass} | AAA (>7.0): {aaa_pass}")

print("\n=== 2. TEST WCAG CONTRAST FOR --sv-brand-solid-fg ON BRAND ACCENTS ===")
brand_solid_fg = "#0F172A"
brand_accents = {
    "--sv-brand-500 (#c5a059)": "#C5A059",
    "--sv-brand-400 (#d4af37)": "#D4AF37",
    "--sv-brand-600 (#b38e47)": "#B38E47"
}

for name, bg in brand_accents.items():
    cr = contrast_ratio(brand_solid_fg, bg)
    aa_pass = cr >= 4.5
    aaa_pass = cr >= 7.0
    print(f"--sv-brand-solid-fg ({brand_solid_fg}) on {name}: CR = {cr:.3f}:1 | AA (>4.5): {aa_pass} | AAA (>7.0): {aaa_pass}")

print("\n=== 3. CHECK LEGACY INDIGO HEX CODES IN src/index.css ===")
legacy_indigos = ["6366f1", "818cf8", "4f46e5", "4338ca"]
index_css_path = r"c:\Users\Adrian\Documents\GitHub\skillvault\src\index.css"

with open(index_css_path, "r", encoding="utf-8") as f:
    content = f.read()

legacy_found = []
for code in legacy_indigos:
    matches = re.findall(rf"#{code}", content, re.IGNORECASE)
    if matches:
        legacy_found.append((code, len(matches)))

if legacy_found:
    print(f"FAIL: Found legacy indigo codes in src/index.css: {legacy_found}")
else:
    print("PASS: Zero legacy indigo codes found in src/index.css!")

