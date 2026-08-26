import os
import json
from pathlib import Path
from PIL import Image

RAW_DIR = Path('assets/stickers-raw')
OUT_DIR = Path('public/stickers')
MANIFEST_PATH = OUT_DIR / 'manifest.json'

def process_stickers():
    if not RAW_DIR.exists():
        print(f"Directory {RAW_DIR} does not exist. Creating it...")
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        print("Please drop some images into the newly created folder and run the script again.")
        return

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest = {"packs": []}
    if MANIFEST_PATH.exists():
        try:
            with open(MANIFEST_PATH, 'r') as f:
                manifest = json.load(f)
        except json.JSONDecodeError:
            pass

    processed_count = 0

    # Process each pack folder inside RAW_DIR
    for pack_dir in RAW_DIR.iterdir():
        if not pack_dir.is_dir():
            continue
            
        pack_id = pack_dir.name
        pack_out_dir = OUT_DIR / pack_id
        pack_out_dir.mkdir(parents=True, exist_ok=True)
        
        # Find or create pack entry in manifest
        pack_entry = next((p for p in manifest['packs'] if p['id'] == pack_id), None)
        if not pack_entry:
            pack_entry = {
                "id": pack_id,
                # Make the pack name nice (e.g. pack-01-celestial -> Celestial)
                "name": ' '.join(pack_id.split('-')[2:]).title() if pack_id.startswith('pack-') else pack_id.replace('-', ' ').title(),
                "stickers": []
            }
            manifest['packs'].append(pack_entry)

        for img_path in pack_dir.iterdir():
            if img_path.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.webp']:
                continue
                
            out_filename = img_path.stem + '.png'
            out_path = pack_out_dir / out_filename
            
            # Skip if already exists
            if out_path.exists():
                if out_filename not in pack_entry['stickers']:
                    pack_entry['stickers'].append(out_filename)
                continue
                
            print(f"Processing {img_path.name}...")
            
            try:
                # Remove white background using Pillow
                input_img = Image.open(img_path).convert("RGBA")
                datas = input_img.getdata()
                newData = []
                # Threshold for 'white' (e.g. RGB values > 200)
                for item in datas:
                    if item[0] > 200 and item[1] > 200 and item[2] > 200:
                        # Replace white with transparent
                        newData.append((255, 255, 255, 0))
                    else:
                        newData.append(item)
                
                input_img.putdata(newData)
                input_img.save(out_path, format="PNG")
                
                if out_filename not in pack_entry['stickers']:
                    pack_entry['stickers'].append(out_filename)
                processed_count += 1
            except Exception as e:
                print(f"Error processing {img_path.name}: {e}")

    # Save updated manifest
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)
        
    print(f"Sticker processing complete! Processed {processed_count} new images. Manifest updated.")

if __name__ == "__main__":
    process_stickers()
