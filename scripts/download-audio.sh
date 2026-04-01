#!/bin/bash
# Downloads Shacharit audio files from readalongsiddur.com
# Used with permission from Adam Moskowitz (creator).
#
# Mapping: readalongsiddur.com filename -> our prayer ID
# Some of our prayers correspond to multiple audio files on the source site.
# Those are downloaded individually and will need to be concatenated.

BASE_URL="https://readalongsiddur.com/audio"
OUT_DIR="$(dirname "$0")/../assets/audio/shacharit"
mkdir -p "$OUT_DIR"

download() {
  local filename="$1"
  local output="$2"
  local url="${BASE_URL}/$(python3 -c "import urllib.parse; print(urllib.parse.quote('${filename}'))")"

  if [ -f "$OUT_DIR/$output" ]; then
    echo "  SKIP $output (already exists)"
    return
  fi

  echo "  Downloading: $filename -> $output"
  curl -s -o "$OUT_DIR/$output" "$url"
  if [ $? -ne 0 ]; then
    echo "  FAILED: $filename"
    rm -f "$OUT_DIR/$output"
  fi
}

echo "=== Direct matches (single file per prayer) ==="
download "modeh ani.mp3" "modeh_ani.mp3"
download "netilas yadayim.mp3" "netilat_yadayim.mp3"
download "asher yatzar.mp3" "asher_yatzar.mp3"
download "elokai neshama.mp3" "elokai_neshama.mp3"
download "ashrei.mp3" "ashrei_uva_letziyon.mp3"

echo ""
echo "=== Birchot HaTorah (multiple parts) ==="
download "1st and second birchos hatorah.mp3" "_birchot_hatorah_1.mp3"
download "yevarechecha.mp3" "_birchot_hatorah_2.mp3"
download "1st and 2nd eilu devarim.mp3" "_birchot_hatorah_3.mp3"

echo ""
echo "=== Birchot HaShachar ==="
download "brachos.mp3" "birchot_hashachar.mp3"

echo ""
echo "=== Pesukei Dezimrah (multiple parts) ==="
download "baruch sheamar.mp3" "_pesukei_1_baruch_sheamar.mp3"
download "Hodu.mp3" "_pesukei_2_hodu.mp3"
download "yehi kavod.mp3" "_pesukei_3_yehi_kavod.mp3"
download "ashrei.mp3" "_pesukei_4_ashrei.mp3"
download "psalm 146 Hallelukah.mp3" "_pesukei_5_psalm146.mp3"
download "psalm 147 Hallelukah.mp3" "_pesukei_6_psalm147.mp3"
download "psalm 148 Hallelukah.mp3" "_pesukei_7_psalm148.mp3"
download "psalm 149 hallelukah.mp3" "_pesukei_8_psalm149.mp3"
download "psalm 150 hallelukah.mp3" "_pesukei_9_psalm150.mp3"
download "vayevarech david.mp3" "_pesukei_10_vayevarech.mp3"
download "vayosha az yashir.mp3" "_pesukei_11_az_yashir.mp3"
download "yishtabach.mp3" "_pesukei_12_yishtabach.mp3"

echo ""
echo "=== Shema and Blessings ==="
download "yotzer or.mp3" "_shema_1_yotzer_or.mp3"
download "ahava rabah.mp3" "_shema_2_ahava_rabah.mp3"
download "shema and baruch shem.mp3" "_shema_3_shema.mp3"
download "veahavta.mp3" "_shema_4_veahavta.mp3"
download "vehaya im shamoa.mp3" "_shema_5_vehaya.mp3"
download "vayomer.mp3" "_shema_6_vayomer.mp3"
download "veyatziv.mp3" "_shema_7_veyatziv.mp3"

echo ""
echo "=== Amidah ==="
download "avos - shacharis.mp3" "_amidah_01_avos.mp3"
download "atah gibor.mp3" "_amidah_02_gevuros.mp3"
download "atah kadosh.mp3" "_amidah_03_kedusha.mp3"
download "elokai netzor.mp3" "_amidah_19_elokai_netzor.mp3"
download "sim shalom.mp3" "_amidah_18_sim_shalom.mp3"
download "modim.mp3" "_amidah_17_modim.mp3"
download "reztai and v'sechezena.mp3" "_amidah_16_retzei.mp3"

echo ""
echo "=== Aleinu ==="
download "al harishonim.mp3" "aleinu.mp3"

echo ""
echo "Done! Files saved to $OUT_DIR"
echo ""
echo "Files prefixed with _ are parts that need concatenation."
echo "Use ffmpeg to combine them, e.g.:"
echo "  ffmpeg -i 'concat:part1.mp3|part2.mp3' -c copy output.mp3"
ls -la "$OUT_DIR"
