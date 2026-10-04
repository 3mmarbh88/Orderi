#!/usr/bin/env python3
import os
import subprocess
import shutil

SOURCE_IMAGE = "public/logo.jpg"
if not os.path.exists(SOURCE_IMAGE):
    SOURCE_IMAGE = "src/assets/images/bahrain_delivery_radar_1789403259602.jpg"

print(f"Using source logo image: {SOURCE_IMAGE}")

def run_cmd(cmd):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error running: {cmd}\n{res.stderr}")
    return res.returncode == 0

# 1. Generate Web and PWA icons
print("\n--- Generating Web & PWA Icons ---")
# public/logo.png (1024x1024)
run_cmd(f"convert {SOURCE_IMAGE} -resize 1024x1024 public/logo.png")
# public/pwa-192x192.png
run_cmd(f"convert {SOURCE_IMAGE} -resize 192x192 public/pwa-192x192.png")
# public/pwa-512x512.png
run_cmd(f"convert {SOURCE_IMAGE} -resize 512x512 public/pwa-512x512.png")
# public/pwa-maskable-512x512.png (inner 410px on white background)
run_cmd(f"convert {SOURCE_IMAGE} -resize 410x410 -background white -gravity center -extent 512x512 public/pwa-maskable-512x512.png")
# public/apple-touch-icon.png (180x180)
run_cmd(f"convert {SOURCE_IMAGE} -resize 180x180 public/apple-touch-icon.png")
# public/favicon.ico
run_cmd(f"convert {SOURCE_IMAGE} -resize 48x48 public/favicon.ico")

print("Web icons generated in /public.")

# 2. Generate Android Mipmap Icons
print("\n--- Generating Android APK Mipmap Icons ---")
MIPMAP_CONFIG = [
    # (dir_name, launcher_size, foreground_total, foreground_inner)
    ("mipmap-mdpi", 48, 108, 72),
    ("mipmap-hdpi", 72, 162, 108),
    ("mipmap-xhdpi", 96, 216, 144),
    ("mipmap-xxhdpi", 144, 324, 216),
    ("mipmap-xxxhdpi", 192, 432, 288),
]

RES_DIR = "android/app/src/main/res"

for folder, l_size, fg_total, fg_inner in MIPMAP_CONFIG:
    target_dir = os.path.join(RES_DIR, folder)
    os.makedirs(target_dir, exist_ok=True)
    
    # 1. ic_launcher.png
    l_path = os.path.join(target_dir, "ic_launcher.png")
    run_cmd(f"convert {SOURCE_IMAGE} -resize {l_size}x{l_size} {l_path}")
    
    # 2. ic_launcher_round.png (Circular masked)
    radius = l_size // 2
    r_path = os.path.join(target_dir, "ic_launcher_round.png")
    run_cmd(f"convert {SOURCE_IMAGE} -resize {l_size}x{l_size}\\! \\( -size {l_size}x{l_size} xc:none -fill white -draw \"circle {radius},{radius} {radius},0\" \\) -alpha set -compose DstIn -composite {r_path}")
    
    # 3. ic_launcher_foreground.png (Adaptive icon foreground with safe margins)
    fg_path = os.path.join(target_dir, "ic_launcher_foreground.png")
    run_cmd(f"convert {SOURCE_IMAGE} -resize {fg_inner}x{fg_inner} -background none -gravity center -extent {fg_total}x{fg_total} {fg_path}")
    
    print(f"✔ Generated icons for {folder}: {l_size}x{l_size}, round, and {fg_total}x{fg_total} adaptive foreground")

# 3. Generate Android Splash Screens
print("\n--- Generating Android Splash Screens ---")
SPLASH_CONFIG = [
    ("drawable", 480, 320, 200),
    ("drawable-port-mdpi", 320, 480, 200),
    ("drawable-port-hdpi", 480, 800, 280),
    ("drawable-port-xhdpi", 720, 1280, 420),
    ("drawable-port-xxhdpi", 960, 1600, 560),
    ("drawable-port-xxxhdpi", 1280, 1920, 720),
    ("drawable-land-mdpi", 480, 320, 200),
    ("drawable-land-hdpi", 800, 480, 280),
    ("drawable-land-xhdpi", 1280, 720, 420),
    ("drawable-land-xxhdpi", 1600, 960, 560),
    ("drawable-land-xxxhdpi", 1920, 1280, 720),
]

for folder, width, height, logo_size in SPLASH_CONFIG:
    target_dir = os.path.join(RES_DIR, folder)
    os.makedirs(target_dir, exist_ok=True)
    splash_path = os.path.join(target_dir, "splash.png")
    run_cmd(f"convert {SOURCE_IMAGE} -resize {logo_size}x{logo_size} -background white -gravity center -extent {width}x{height} {splash_path}")
    print(f"✔ Generated splash for {folder} ({width}x{height})")

# 4. Sync to dist/ if dist exists
if os.path.exists("dist"):
    print("\n--- Updating dist/ assets ---")
    for f in ["logo.png", "apple-touch-icon.png", "pwa-192x192.png", "pwa-512x512.png", "pwa-maskable-512x512.png"]:
        src_f = os.path.join("public", f)
        dst_f = os.path.join("dist", f)
        if os.path.exists(src_f):
            shutil.copy2(src_f, dst_f)
            print(f"Synced {f} to dist/")

# 5. Remove unused vector ic_launcher_foreground.xml in drawable-v24 if present
old_vector = os.path.join(RES_DIR, "drawable-v24", "ic_launcher_foreground.xml")
if os.path.exists(old_vector):
    os.remove(old_vector)
    print("✔ Removed legacy drawable-v24/ic_launcher_foreground.xml to prevent conflicts with mipmap adaptive foreground")

print("\nAll APK and installation icons successfully updated!")
