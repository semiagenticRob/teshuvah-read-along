#!/bin/bash
# Concatenates multi-part audio files into single prayer files using ffmpeg.
# Requires: ffmpeg

DIR="$(dirname "$0")/../assets/audio/shacharit"
cd "$DIR" || exit 1

concat_files() {
  local output="$1"
  shift
  local inputs=("$@")

  if [ -f "$output" ]; then
    echo "SKIP $output (already exists)"
    return
  fi

  # Create a file list for ffmpeg concat demuxer
  local listfile=$(mktemp)
  for f in "${inputs[@]}"; do
    if [ ! -f "$f" ]; then
      echo "MISSING: $f (skipping $output)"
      rm "$listfile"
      return
    fi
    echo "file '$(pwd)/$f'" >> "$listfile"
  done

  echo "Concatenating ${#inputs[@]} files -> $output"
  ffmpeg -f concat -safe 0 -i "$listfile" -c copy "$output" -y 2>/dev/null
  rm "$listfile"

  if [ -f "$output" ]; then
    echo "  OK ($(du -h "$output" | cut -f1))"
  else
    echo "  FAILED"
  fi
}

echo "=== Birchot HaTorah ==="
concat_files "birchot_hatorah.mp3" \
  "_birchot_hatorah_1.mp3" \
  "_birchot_hatorah_2.mp3" \
  "_birchot_hatorah_3.mp3"

echo ""
echo "=== Pesukei Dezimrah ==="
concat_files "pesukei_dezimrah.mp3" \
  "_pesukei_1_baruch_sheamar.mp3" \
  "_pesukei_2_hodu.mp3" \
  "_pesukei_3_yehi_kavod.mp3" \
  "_pesukei_4_ashrei.mp3" \
  "_pesukei_5_psalm146.mp3" \
  "_pesukei_6_psalm147.mp3" \
  "_pesukei_7_psalm148.mp3" \
  "_pesukei_8_psalm149.mp3" \
  "_pesukei_9_psalm150.mp3" \
  "_pesukei_10_vayevarech.mp3" \
  "_pesukei_11_az_yashir.mp3" \
  "_pesukei_12_yishtabach.mp3"

echo ""
echo "=== Shema and Blessings ==="
concat_files "shema.mp3" \
  "_shema_1_yotzer_or.mp3" \
  "_shema_2_ahava_rabah.mp3" \
  "_shema_3_shema.mp3" \
  "_shema_4_veahavta.mp3" \
  "_shema_5_vehaya.mp3" \
  "_shema_6_vayomer.mp3" \
  "_shema_7_veyatziv.mp3"

echo ""
echo "=== Amidah ==="
concat_files "amidah.mp3" \
  "_amidah_01_avos.mp3" \
  "_amidah_02_gevuros.mp3" \
  "_amidah_03_kedusha.mp3" \
  "_amidah_16_retzei.mp3" \
  "_amidah_17_modim.mp3" \
  "_amidah_18_sim_shalom.mp3" \
  "_amidah_19_elokai_netzor.mp3"

echo ""
echo "=== Summary ==="
echo "Final prayer audio files:"
ls -lh *.mp3 | grep -v '^.*_'
