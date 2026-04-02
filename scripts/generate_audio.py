#!/usr/bin/env python3
"""
Generate ElevenLabs audio + word-level timing for all DavenAlong prayers.
Voice: 7898AMdRTtesf0Y9zS54, Model: eleven_v3
"""

import json
import os
import sys
import time
import base64
import urllib.request
import urllib.error

API_KEY = "sk_2b9db740c6f6c8db529d8ef8fb6e2c8c1b1bc05740fe42f1"
VOICE_ID = "7898AMdRTtesf0Y9zS54"
MODEL_ID = "eleven_v3"
OUTPUT_FORMAT = "mp3_44100_128"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLED_DIR = os.path.join(BASE_DIR, "src", "data", "bundled")
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")

# All prayers grouped by service
PRAYERS = {
    "shacharit": [
        "modeh_ani", "netilat_yadayim", "asher_yatzar", "elokai_neshama",
        "birchot_hatorah", "birchot_hashachar", "akedah", "korbanot",
        "pesukei_dezimrah", "shema", "amidah", "tachanun",
        "ashrei_uva_letziyon", "aleinu", "shir_shel_yom"
    ],
    "mincha": [
        "mincha_ashrei", "mincha_amidah", "mincha_tachanun", "mincha_aleinu"
    ],
    "maariv": [
        "maariv_vehu_rachum", "maariv_shema", "maariv_amidah", "maariv_aleinu"
    ],
    "birkatHamazon": [
        "bh_zimmun", "bh_hazan", "bh_haaretz", "bh_yerushalayim", "bh_hatov"
    ],
}


def load_hebrew_text(service, prayer_id):
    """Load Hebrew text from bundled JSON, return joined text."""
    json_path = os.path.join(BUNDLED_DIR, service, f"{prayer_id}.json")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["he"]


def generate_audio(text, prayer_id, service):
    """Call ElevenLabs API and return (audio_bytes, alignment_data)."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps"
    payload = json.dumps({
        "text": text,
        "model_id": MODEL_ID,
        "output_format": OUTPUT_FORMAT,
        "voice_settings": {
            "stability": 0.6,
            "similarity_boost": 0.75,
            "style": 0.3,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print(f"  ERROR {e.code}: {body[:300]}")
        return None, None

    if "audio_base64" not in data:
        print(f"  ERROR: no audio_base64 in response: {json.dumps(data)[:300]}")
        return None, None

    audio = base64.b64decode(data["audio_base64"])
    alignment = data.get("alignment") or data.get("normalized_alignment") or {}
    return audio, alignment


def chars_to_word_timing(alignment, he_sections):
    """
    Convert ElevenLabs character-level timestamps to the app's word-level
    timing format, split by section.

    Returns: [{ "words": [{ "startTime": ms, "endTime": ms }, ...] }, ...]
    """
    characters = alignment.get("characters", [])
    starts = alignment.get("character_start_times_seconds", [])
    ends = alignment.get("character_end_times_seconds", [])

    if not characters or not starts or not ends:
        return []

    # Reconstruct the full text from characters and build word boundaries
    full_text = "".join(characters)

    # Build word-level timing from character data
    words_timing = []
    current_word_start = None
    current_word_end = None
    in_word = False

    for i, char in enumerate(characters):
        if char == " ":
            if in_word and current_word_start is not None:
                words_timing.append({
                    "startTime": round(current_word_start * 1000),
                    "endTime": round(current_word_end * 1000),
                })
                in_word = False
                current_word_start = None
                current_word_end = None
        else:
            if not in_word:
                current_word_start = starts[i]
                in_word = True
            current_word_end = ends[i]

    # Don't forget the last word
    if in_word and current_word_start is not None:
        words_timing.append({
            "startTime": round(current_word_start * 1000),
            "endTime": round(current_word_end * 1000),
        })

    # Now split words_timing into sections matching he_sections
    # Count words per section
    section_word_counts = []
    for section in he_sections:
        # Split on whitespace to count words
        words = section.split()
        section_word_counts.append(len(words))

    result = []
    word_idx = 0
    for count in section_word_counts:
        section_words = words_timing[word_idx : word_idx + count]
        result.append({"words": section_words})
        word_idx += count

    # If there are leftover words (shouldn't happen, but safety), add to last section
    if word_idx < len(words_timing):
        result[-1]["words"].extend(words_timing[word_idx:])

    return result


MAX_CHARS = 4500  # Stay under 5000 limit with margin


def chunk_sections(he_sections):
    """
    Group he_sections into chunks that each stay under MAX_CHARS when joined.
    Returns list of (chunk_text, chunk_sections) tuples.
    """
    chunks = []
    current_sections = []
    current_len = 0

    for section in he_sections:
        section_len = len(section)
        # If a single section exceeds the limit, split it by sentences
        if section_len > MAX_CHARS:
            # Flush current chunk first
            if current_sections:
                chunks.append((" ".join(current_sections), current_sections))
                current_sections = []
                current_len = 0
            # Split long section into sub-sections by sentence endings
            # Hebrew uses : and . as sentence delimiters
            parts = []
            remaining = section
            while len(remaining) > MAX_CHARS:
                # Find a good split point
                split_at = -1
                for delim in [":", ".", ",", " "]:
                    idx = remaining.rfind(delim, 0, MAX_CHARS)
                    if idx > 0:
                        split_at = idx + 1
                        break
                if split_at <= 0:
                    split_at = MAX_CHARS
                parts.append(remaining[:split_at].strip())
                remaining = remaining[split_at:].strip()
            if remaining:
                parts.append(remaining)
            for part in parts:
                chunks.append((part, [part]))
        else:
            # Adding this section would exceed limit?
            added_len = section_len + (1 if current_len > 0 else 0)
            if current_len + added_len > MAX_CHARS:
                # Flush current chunk
                if current_sections:
                    chunks.append((" ".join(current_sections), current_sections))
                current_sections = [section]
                current_len = section_len
            else:
                current_sections.append(section)
                current_len += added_len

    if current_sections:
        chunks.append((" ".join(current_sections), current_sections))

    return chunks


def concat_mp3_bytes(audio_chunks):
    """Concatenate MP3 byte chunks. Simple concatenation works for CBR MP3."""
    return b"".join(audio_chunks)


def process_prayer(service, prayer_id):
    """Generate audio and timing for a single prayer."""
    print(f"Processing {service}/{prayer_id}...")

    # Load Hebrew text sections
    he_sections = load_hebrew_text(service, prayer_id)

    # Join all sections to check total size
    full_text = " ".join(he_sections)
    char_count = len(full_text)
    word_count = len(full_text.split())
    print(f"  {word_count} words, {char_count} characters")

    if char_count <= MAX_CHARS:
        # Single request
        audio, alignment = generate_audio(full_text, prayer_id, service)
        if audio is None:
            print(f"  FAILED - skipping")
            return False
        timing = chars_to_word_timing(alignment, he_sections)
    else:
        # Chunk the prayer
        chunks = chunk_sections(he_sections)
        print(f"  Splitting into {len(chunks)} chunks")

        all_audio = []
        all_timing = []
        time_offset_ms = 0

        for i, (chunk_text, chunk_sections_list) in enumerate(chunks):
            print(f"  Chunk {i+1}/{len(chunks)}: {len(chunk_text)} chars, {len(chunk_text.split())} words")
            audio, alignment = generate_audio(chunk_text, prayer_id, service)
            if audio is None:
                print(f"  Chunk {i+1} FAILED - skipping entire prayer")
                return False

            all_audio.append(audio)

            # Convert chunk timing
            chunk_timing = chars_to_word_timing(alignment, chunk_sections_list)

            # Offset all timestamps by accumulated duration
            for section in chunk_timing:
                for word in section["words"]:
                    word["startTime"] += time_offset_ms
                    word["endTime"] += time_offset_ms

            all_timing.extend(chunk_timing)

            # Calculate duration of this chunk from last word's endTime
            if chunk_timing and chunk_timing[-1]["words"]:
                last_end = chunk_timing[-1]["words"][-1]["endTime"] - time_offset_ms
                time_offset_ms += last_end

            time.sleep(1)

        audio = concat_mp3_bytes(all_audio)
        timing = all_timing

    # Save MP3
    audio_dir = os.path.join(AUDIO_DIR, service)
    os.makedirs(audio_dir, exist_ok=True)
    audio_path = os.path.join(audio_dir, f"{prayer_id}.mp3")
    with open(audio_path, "wb") as f:
        f.write(audio)
    print(f"  Audio: {len(audio):,} bytes -> {audio_path}")

    # Save timing
    timing_dir = os.path.join(TIMING_DIR, service)
    os.makedirs(timing_dir, exist_ok=True)
    timing_path = os.path.join(timing_dir, f"{prayer_id}.json")
    with open(timing_path, "w", encoding="utf-8") as f:
        json.dump(timing, f, indent=2, ensure_ascii=False)

    total_words = sum(len(s["words"]) for s in timing)
    print(f"  Timing: {total_words} words across {len(timing)} sections -> {timing_path}")

    # Rate limit
    time.sleep(1)
    return True


def main():
    # Allow filtering by service or prayer
    filter_service = sys.argv[1] if len(sys.argv) > 1 else None
    filter_prayer = sys.argv[2] if len(sys.argv) > 2 else None

    total = 0
    success = 0
    failed = []

    for service, prayers in PRAYERS.items():
        if filter_service and service != filter_service:
            continue
        for prayer_id in prayers:
            if filter_prayer and prayer_id != filter_prayer:
                continue
            total += 1
            if process_prayer(service, prayer_id):
                success += 1
            else:
                failed.append(f"{service}/{prayer_id}")

    print(f"\n{'='*50}")
    print(f"Done: {success}/{total} prayers generated successfully")
    if failed:
        print(f"Failed: {', '.join(failed)}")


if __name__ == "__main__":
    main()
